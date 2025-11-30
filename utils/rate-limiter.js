import {
  RATE_LIMIT_MAX_COMMANDS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_CLEANUP_INTERVAL_MS,
} from './constants.js';
import logger from './logger.js';

const userRateLimits = new Map();
let cleanupInterval = null;

export function initRateLimiter() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    cleanupExpiredEntries();
  }, RATE_LIMIT_CLEANUP_INTERVAL_MS);

  cleanupInterval.unref();
}

export function cleanupRateLimiter() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  userRateLimits.clear();
  logger.info('Rate limiter cleanup completed');
}

function cleanupExpiredEntries() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  for (const [userId, entry] of userRateLimits.entries()) {
    entry.commandTimestamps = entry.commandTimestamps.filter(
      (timestamp) => timestamp > windowStart,
    );

    if (entry.commandTimestamps.length === 0) {
      userRateLimits.delete(userId);
    }
  }
}

export function checkRateLimit(userId) {
  const now = Date.now();
  const entry = userRateLimits.get(userId);

  if (entry) {
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const recentCommands = entry.commandTimestamps.filter(
      (timestamp) => timestamp > windowStart,
    );

    if (recentCommands.length >= RATE_LIMIT_MAX_COMMANDS) {
      const oldestInWindow = Math.min(...recentCommands);
      const resetTime = oldestInWindow + RATE_LIMIT_WINDOW_MS;
      return {
        limited: true,
        reason: 'rate_limit_exceeded',
        remainingMs: resetTime - now,
      };
    }
  }

  return { limited: false };
}

export function recordCommandUsage(userId) {
  const now = Date.now();
  let entry = userRateLimits.get(userId);

  if (!entry) {
    entry = { commandTimestamps: [now] };
    userRateLimits.set(userId, entry);
  } else {
    entry.commandTimestamps.push(now);

    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    entry.commandTimestamps = entry.commandTimestamps.filter(
      (timestamp) => timestamp > windowStart,
    );
  }
}

initRateLimiter();


