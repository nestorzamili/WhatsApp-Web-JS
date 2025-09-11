import { readFileSync, watch } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logWithDate } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let COMMANDS = {};
let isWatching = false;
let watcher = null;

function loadCommands() {
  try {
    const commandsPath = path.join(__dirname, 'command-list.json');
    const commandsData = readFileSync(commandsPath, 'utf8');
    COMMANDS = JSON.parse(commandsData);
    logWithDate(
      `Commands loaded successfully. Found ${
        Object.keys(COMMANDS).length
      } commands.`,
    );
    return true;
  } catch (error) {
    logWithDate(`Error loading command-list.json: ${error.message}`);
    COMMANDS = {};
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

export function findCommand(messageBody) {
  if (!messageBody || typeof messageBody !== 'string') {
    return null;
  }

  for (const [commandName, config] of Object.entries(COMMANDS)) {
    if (!config.enabled) continue;

    if (config.type === 'simple' || config.type === 'script') {
      if (messageBody === config.pattern) {
        return { commandName, config, parameter: null };
      }
    }

    if (config.type === 'script_with_param') {
      if (messageBody.startsWith(config.pattern)) {
        const parameter = messageBody.substring(config.pattern.length).trim();
        return { commandName, config, parameter };
      }
    }
  }

  return null;
}
