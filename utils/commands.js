import { readFile, access } from 'node:fs/promises';
import { watch, constants } from 'node:fs';
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
const COMMANDS_PATH = path.join(__dirname, '..', 'command-list.json');

const COMMANDS = {};

let commandSystemEnabled = true;
let isWatching = false;
let watcher = null;
let reloadTimeout = null;

const VALID_TYPES = Object.values(COMMAND_TYPES);
const VALID_ACCESS = Object.values(ACCESS_TYPES);

function validateType(config) {
  if (!config.type) {
    return 'Missing required field: type';
  }
  if (!VALID_TYPES.includes(config.type)) {
    return `Invalid type "${config.type}". Must be: ${VALID_TYPES.join(', ')}`;
  }
  return null;
}

function validatePattern(config) {
  if (!config.pattern) {
    return 'Missing required field: pattern';
  }
  const patternValidation = validateCommandPattern(config.pattern);
  if (!patternValidation.valid) {
    return `Invalid pattern: ${patternValidation.error}`;
  }
  return null;
}

function validateTypeSpecificFields(config) {
  const errors = [];
  if (config.type === COMMAND_TYPES.SIMPLE && !config.reply) {
    errors.push('Simple commands require "reply" field');
  }
  if (config.type === COMMAND_TYPES.SCRIPT && !config.script) {
    errors.push('Script commands require "script" field');
  }
  return errors;
}

function getValidationErrors(commandName, config) {
  const errors = [];

  const typeError = validateType(config);
  if (typeError) errors.push(typeError);

  if (config.enabled === undefined || config.enabled === null) {
    errors.push('Missing required field: enabled');
  }

  const patternError = validatePattern(config);
  if (patternError) errors.push(patternError);

  if (config.access && !VALID_ACCESS.includes(config.access)) {
    errors.push(
      `Invalid access "${config.access}". Must be: ${VALID_ACCESS.join(', ')}`,
    );
  }

  errors.push(...validateTypeSpecificFields(config));

  if (config.allowedGroups && !Array.isArray(config.allowedGroups)) {
    errors.push('allowedGroups must be an array');
  }

  return errors;
}

function validateCommand(commandName, config) {
  const errors = getValidationErrors(commandName, config);

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
    try {
      await access(COMMANDS_PATH, constants.R_OK);
    } catch {
      logger.info(
        'command-list.json not found. Command system disabled. Copy command-list.example.json to command-list.json to enable.',
      );
      commandSystemEnabled = false;
      for (const key in COMMANDS) {
        delete COMMANDS[key];
      }
      return false;
    }

    const commandsData = await readFile(COMMANDS_PATH, 'utf8');
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

    commandSystemEnabled = true;
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
  if (isWatching || !commandSystemEnabled) return;

  try {
    watcher = watch(COMMANDS_PATH, { persistent: false }, (eventType) => {
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

await loadCommands();
setupFileWatcher();

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
