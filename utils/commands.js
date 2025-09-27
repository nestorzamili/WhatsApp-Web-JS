import { readFileSync, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logWithDate } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMANDS = {};
let isWatching = false;
let watcher = null;

function validateCommand(commandName, config) {
  const errors = [];

  if (!config.type) {
    errors.push('Missing required field: type');
  } else if (!['simple', 'script', 'command_list'].includes(config.type)) {
    errors.push('Invalid type. Must be: simple, script, or command_list');
  }

  if (config.enabled === undefined || config.enabled === null) {
    errors.push('Missing required field: enabled');
  }

  if (!config.pattern) {
    errors.push('Missing required field: pattern');
  }

  if (config.type === 'simple' && !config.reply) {
    errors.push('Simple commands require "reply" field');
  }

  if (config.type === 'script' && !config.script) {
    errors.push('Script commands require "script" field');
  }

  if (errors.length > 0) {
    logWithDate(`Command "${commandName}" validation failed: ${errors.join(', ')}`);
    return false;
  }

  return true;
}

function loadCommands() {
  try {
    const commandsPath = path.join(__dirname, 'command-list.json');
    const commandsData = readFileSync(commandsPath, 'utf8');
    const rawData = JSON.parse(commandsData);

    const newCommands = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (!key.startsWith('_') && typeof value === 'object') {
        if (validateCommand(key, value)) {
          newCommands[key] = value;
        }
      }
    }

    for (const key in COMMANDS) {
      delete COMMANDS[key];
    }

    Object.assign(COMMANDS, newCommands);

    logWithDate(
      `Commands loaded successfully. Found ${
        Object.keys(COMMANDS).length
      } valid commands.`,
    );
    return true;
  } catch (error) {
    logWithDate(`Error loading command-list.json: ${error.message}`);
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
        clearTimeout(watcher.reloadTimeout);
        watcher.reloadTimeout = setTimeout(() => {
          logWithDate('command-list.json file changed, reloading...');
          const success = loadCommands();
          if (success) {
            logWithDate('Commands reloaded automatically due to file change.');
          }
        }, 100);
      }
    });

    watcher.on('error', (error) => {
      logWithDate(`File watcher error: ${error.message}`);
      isWatching = false;
    });

    isWatching = true;
    logWithDate('File watcher setup for command-list.json');
  } catch (error) {
    logWithDate(`Error setting up file watcher: ${error.message}`);
  }
}

loadCommands();
setupFileWatcher();

export { COMMANDS };

export function cleanup() {
  if (watcher) {
    watcher.close();
    if (watcher.reloadTimeout) {
      clearTimeout(watcher.reloadTimeout);
    }
    logWithDate('File watcher cleanup completed');
  }
}

function matchExactPattern(messageBody, commandName, config) {
  if (messageBody === config.pattern) {
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
  if (!messageBody.startsWith(config.pattern)) {
    return null;
  }
  
  const parameter = messageBody.substring(config.pattern.length).trim();
  if (!parameter) {
    return null;
  }
  
  return { commandName, config, parameter };
}

function matchCommand(messageBody, commandName, config) {
  if (!config.enabled) {
    return null;
  }

  if (config.type === 'simple') {
    return matchExactPattern(messageBody, commandName, config);
  }

  if (config.type === 'command_list') {
    return matchExactPattern(messageBody, commandName, config);
  }

  if (config.type === 'script') {
    return matchScriptCommand(messageBody, commandName, config);
  }

  return null;
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
