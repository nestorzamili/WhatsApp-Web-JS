import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from './logger.js';
import { validateCommandPattern } from './sanitizer.js';
import {
  FILE_WATCH_DEBOUNCE_MS,
  COMMAND_TYPES,
  ACCESS_TYPES,
} from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMANDS = {};

let isWatching = false;
let watcher = null;
let reloadTimeout = null;

function validateCommand(commandName, config) {
  const errors = [];

  if (!config.type) {
    errors.push('Missing required field: type');
  } else if (!Object.values(COMMAND_TYPES).includes(config.type)) {
    errors.push(
      `Invalid type "${config.type}". Must be: ${Object.values(
        COMMAND_TYPES,
      ).join(', ')}`,
    );
  }

  if (config.enabled === undefined || config.enabled === null) {
    errors.push('Missing required field: enabled');
  }

  if (!config.pattern) {
    errors.push('Missing required field: pattern');
  } else {
    const patternValidation = validateCommandPattern(config.pattern);
    if (!patternValidation.valid) {
      errors.push(`Invalid pattern: ${patternValidation.error}`);
    }
  }

  if (config.access && !Object.values(ACCESS_TYPES).includes(config.access)) {
    errors.push(
      `Invalid access "${config.access}". Must be: ${Object.values(
        ACCESS_TYPES,
      ).join(', ')}`,
    );
  }

  if (config.type === COMMAND_TYPES.SIMPLE && !config.reply) {
    errors.push('Simple commands require "reply" field');
  }

  if (config.type === COMMAND_TYPES.SCRIPT && !config.script) {
    errors.push('Script commands require "script" field');
  }

  if (config.allowedGroups && !Array.isArray(config.allowedGroups)) {
    errors.push('allowedGroups must be an array');
  }

  if (errors.length > 0) {
    logger.warn(
      `Command "${commandName}" validation failed: ${errors.join(', ')}`,
    );
    return false;
  }

  return true;
}

async function loadCommands() {
  try {
    const commandsPath = path.join(__dirname, 'command-list.json');
    const commandsData = await readFile(commandsPath, 'utf8');
    const rawData = JSON.parse(commandsData);

    const newCommands = {};

    for (const [key, value] of Object.entries(rawData)) {
      if (key.startsWith('_') || typeof value !== 'object') {
        continue;
      }

      if (validateCommand(key, value)) {
        value.caseSensitive = value.caseSensitive ?? true;
        value.access = value.access || ACCESS_TYPES.BOTH;

        newCommands[key] = value;
      }
    }

    for (const key in COMMANDS) {
      delete COMMANDS[key];
    }
    Object.assign(COMMANDS, newCommands);

    logger.info(`Commands loaded: ${Object.keys(COMMANDS).length} commands`);
    return true;
  } catch (error) {
    logger.error(`Error loading command-list.json: ${error.message}`);
    for (const key in COMMANDS) {
      delete COMMANDS[key];
    }
    return false;
  }
}

function setupFileWatcher() {
  if (isWatching) return;

  try {
    const commandsPath = path.join(__dirname, 'command-list.json');

    watcher = watch(commandsPath, { persistent: false }, (eventType) => {
      if (eventType === 'change') {
        if (reloadTimeout) {
          clearTimeout(reloadTimeout);
        }
        reloadTimeout = setTimeout(async () => {
          logger.info('command-list.json changed, reloading...');
          const success = await loadCommands();
          if (success) {
            logger.info('Commands reloaded automatically');
          }
        }, FILE_WATCH_DEBOUNCE_MS);
      }
    });

    watcher.on('error', (error) => {
      logger.warn(`File watcher error: ${error.message}`);
      isWatching = false;
    });

    isWatching = true;
    logger.info('File watcher setup for command-list.json');
  } catch (error) {
    logger.error(`Error setting up file watcher: ${error.message}`);
  }
}

(async () => {
  await loadCommands();
  setupFileWatcher();
})();

export { COMMANDS };

export function cleanup() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
    reloadTimeout = null;
  }
  isWatching = false;
  logger.info('Command file watcher cleanup completed');
}

function normalizeForMatch(message, caseSensitive) {
  return caseSensitive ? message : message.toLowerCase();
}

function matchExactPattern(messageBody, commandName, config) {
  const caseSensitive = config.caseSensitive !== false;
  const normalizedMessage = normalizeForMatch(messageBody, caseSensitive);
  const normalizedPattern = normalizeForMatch(config.pattern, caseSensitive);

  if (normalizedMessage === normalizedPattern) {
    return { commandName, config, parameter: null };
  }

  return null;
}

function matchScriptCommand(messageBody, commandName, config) {
  const requiresParameter = config.pattern.endsWith(':');

  if (requiresParameter) {
    return matchScriptWithParameter(messageBody, commandName, config);
  }

  return matchExactPattern(messageBody, commandName, config);
}

function matchScriptWithParameter(messageBody, commandName, config) {
  const caseSensitive = config.caseSensitive !== false;
  const normalizedMessage = normalizeForMatch(messageBody, caseSensitive);
  const normalizedPattern = normalizeForMatch(config.pattern, caseSensitive);

  if (normalizedMessage.startsWith(normalizedPattern)) {
    const parameter = messageBody.substring(config.pattern.length).trim();
    if (parameter) {
      return { commandName, config, parameter };
    }
  }

  return null;
}

function matchCommand(messageBody, commandName, config) {
  if (!config.enabled) {
    return null;
  }

  switch (config.type) {
    case COMMAND_TYPES.SIMPLE:
    case COMMAND_TYPES.COMMAND_LIST:
      return matchExactPattern(messageBody, commandName, config);

    case COMMAND_TYPES.SCRIPT:
      return matchScriptCommand(messageBody, commandName, config);

    default:
      return null;
  }
}

export function findCommand(messageBody) {
  if (!messageBody || typeof messageBody !== 'string') {
    return null;
  }

  const trimmedMessage = messageBody.trim();
  if (!trimmedMessage) {
    return null;
  }

  for (const [commandName, config] of Object.entries(COMMANDS)) {
    const match = matchCommand(trimmedMessage, commandName, config);
    if (match) {
      return match;
    }
  }

  return null;
}

export function getEnabledCommands() {
  return Object.entries(COMMANDS)
    .filter(([, config]) => config.enabled)
    .map(([name, config]) => ({ name, ...config }));
}
