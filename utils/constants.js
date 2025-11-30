export const SCRIPT_TIMEOUT_MS = 30000;
export const MAX_PARAMETER_LENGTH = 100;
export const DANGEROUS_CHARS_REGEX = /[;&`$(){}[\]<>!\\'"*?#~]/g;
export const RATE_LIMIT_MAX_COMMANDS = 3;
export const RATE_LIMIT_WINDOW_MS = 60000;
export const RATE_LIMIT_CLEANUP_INTERVAL_MS = 300000;

export const FILE_WATCH_DEBOUNCE_MS = 100;

export const LOG_DIR = './logs';
export const LOG_FILE = 'status.log';
export const LOG_TIMEZONE = 'Asia/Jakarta';
export const LOG_LEVEL =
  process.env.NODE_ENV === 'development' ? 'debug' : 'info';

export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const COMMAND_TYPES = {
  SIMPLE: 'simple',
  SCRIPT: 'script',
  COMMAND_LIST: 'command_list',
};

export const ACCESS_TYPES = {
  PERSONAL: 'personal',
  GROUP: 'group',
  BOTH: 'both',
};

export const ERROR_MESSAGES = {
  RATE_LIMITED: '⏳ Please wait before sending another command.',
  SCRIPT_TIMEOUT: '⚠️ Script timeout - process took too long.',
  SCRIPT_ERROR: '❌ An error occurred while processing your request.',
  SCRIPT_NOT_FOUND: '❌ Script not found or not executable.',
  INVALID_PARAMETER: '⚠️ Invalid parameter or contains forbidden characters.',
  PARAMETER_TOO_LONG: '⚠️ Parameter is too long.',
  ACCESS_DENIED: '🚫 You do not have access to this command.',
  UNKNOWN_COMMAND: '❓ Command not recognized.',
  NO_COMMANDS: 'No commands available.',
};

export const SUCCESS_MESSAGES = {
  COMMANDS_LOADED: 'Commands loaded successfully',
  FILE_WATCHER_SETUP: 'File watcher setup for command-list.json',
  CLEANUP_COMPLETED: 'Cleanup completed',
};
