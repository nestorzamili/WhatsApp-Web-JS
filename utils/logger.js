import { appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  LOG_DIR,
  LOG_FILE,
  LOG_TIMEZONE,
  LOG_LEVEL,
  LOG_LEVELS,
} from './constants.js';

const logBuffer = [];
let flushScheduled = false;
const FLUSH_INTERVAL_MS = 1000;
let logDirExists = false;

async function ensureLogDir() {
  if (logDirExists) return;

  try {
    if (!existsSync(LOG_DIR)) {
      await mkdir(LOG_DIR, { recursive: true });
    }
    logDirExists = true;
  } catch (error) {
    console.error(`Failed to create log directory: ${error.message}`);
  }
}

function getLogFilePath() {
  return path.join(LOG_DIR, LOG_FILE);
}

async function flushBuffer() {
  if (logBuffer.length === 0) {
    flushScheduled = false;
    return;
  }

  const logsToWrite = logBuffer.splice(0, logBuffer.length);
  flushScheduled = false;

  try {
    await ensureLogDir();
    const logPath = getLogFilePath();
    await appendFile(logPath, logsToWrite.join(''));
  } catch (error) {
    console.error(`Failed to write logs: ${error.message}`);
    logBuffer.unshift(...logsToWrite);
  }
}

function scheduleFlush() {
  if (flushScheduled) return;

  flushScheduled = true;
  setTimeout(flushBuffer, FLUSH_INTERVAL_MS).unref();
}

const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: LOG_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function formatDate(date) {
  return dateFormatter.format(date).replace(',', '');
}

function log(level, message) {
  const date = formatDate(new Date());
  const logMessage = `${date} - ${level} - ${message}`;

  console.log(logMessage);

  logBuffer.push(logMessage + '\n');
  scheduleFlush();

  return logMessage;
}

export async function flushLogs() {
  await flushBuffer();
}

const currentLevel = LOG_LEVELS[LOG_LEVEL.toLowerCase()] ?? LOG_LEVELS.info;

function shouldLog(level) {
  return LOG_LEVELS[level] >= currentLevel;
}

const logger = {
  info: (message) => shouldLog('info') && log('INFO', message),
  warn: (message) => shouldLog('warn') && log('WARN', message),
  error: (contextOrMessage, error) => {
    if (!shouldLog('error')) return;
    if (error === undefined) {
      log('ERROR', contextOrMessage);
    } else {
      log('ERROR', `[${contextOrMessage}]: ${error.message}`);
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(1, 4);
        stackLines.forEach((line) => {
          log('ERROR', `  ${line.trim()}`);
        });
      }
    }
  },
  debug: (message) => shouldLog('debug') && log('DEBUG', message),
};

export default logger;

process.on('beforeExit', async () => {
  await flushLogs();
});

process.on('SIGINT', async () => {
  await flushLogs();
});

process.on('SIGTERM', async () => {
  await flushLogs();
});
