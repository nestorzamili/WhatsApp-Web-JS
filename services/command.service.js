import { spawn } from 'node:child_process';
import logger from '../utils/logger.js';
import { findCommand, getEnabledCommands } from '../utils/commands.js';
import { sanitizeParameter } from '../utils/sanitizer.js';
import {
  checkRateLimit,
  recordCommandUsage,
  cleanupRateLimiter,
} from '../utils/rate-limiter.js';
import {
  SCRIPT_TIMEOUT_MS,
  COMMAND_TYPES,
  ACCESS_TYPES,
  ERROR_MESSAGES,
} from '../utils/constants.js';

async function getContactInfo(message) {
  const userId = message.author || message.from;
  try {
    const contact = await message.getContact();
    const name = contact?.pushname || contact?.name || null;
    return { userId, name };
  } catch {
    return { userId, name: null };
  }
}

function formatFromInfo(userId, name) {
  if (name) {
    return `${name} (${userId})`;
  }
  return userId || 'Unknown';
}

function getUserId(message) {
  return message.author || message.from || 'unknown';
}

async function isCommandAllowed(message, command) {
  try {
    const chat = await message.getChat();
    const chatId = chat.id?._serialized;
    const chatName = chat.name || 'Unknown';
    const commandIdentifier = command.script || command.pattern;

    const accessControl = command.access || ACCESS_TYPES.BOTH;

    switch (accessControl) {
      case ACCESS_TYPES.PERSONAL:
        if (chat.isGroup) {
          logger.info(
            `${commandIdentifier} attempted from group - personal only`,
          );
          return { allowed: false, reason: 'personal_only' };
        }
        break;

      case ACCESS_TYPES.GROUP:
        if (!chat.isGroup) {
          logger.info(
            `${commandIdentifier} attempted from personal - group only`,
          );
          return { allowed: false, reason: 'group_only' };
        }
        break;

      case ACCESS_TYPES.BOTH:
        break;

      default:
        logger.warn(`Invalid access control: ${accessControl}`);
        return { allowed: false, reason: 'invalid_access_config' };
    }

    if (
      chat.isGroup &&
      command.allowedGroups &&
      command.allowedGroups.length > 0
    ) {
      if (!chatId || !command.allowedGroups.includes(chatId)) {
        logger.info(
          `${commandIdentifier} attempted from unauthorized group: ${chatName}`,
        );
        return { allowed: false, reason: 'unauthorized_group' };
      }
    }

    return { allowed: true };
  } catch (error) {
    logger.error('isCommandAllowed', error);
    return { allowed: false, reason: 'error' };
  }
}

function executeScript(command, parameter) {
  return new Promise((resolve) => {
    let scriptCommand = command.script;

    // Replace {params} placeholder with actual parameter
    if (parameter) {
      const sanitized = sanitizeParameter(parameter);
      if (!sanitized.valid) {
        logger.warn(`Parameter sanitization failed: ${sanitized.error}`);
        resolve({
          success: false,
          output: '',
          error: sanitized.error,
        });
        return;
      }

      if (sanitized.warnings.length > 0) {
        logger.info(
          `Parameter sanitization warnings: ${sanitized.warnings.join(', ')}`,
        );
      }

      scriptCommand = scriptCommand.replace('{params}', sanitized.sanitized);
    } else {
      // Remove {params} placeholder if no parameter provided
      scriptCommand = scriptCommand
        .replace(' {params}', '')
        .replace('{params}', '');
    }

    const scriptParts = scriptCommand.split(' ');
    const executable = scriptParts[0];
    const args = scriptParts.slice(1);

    logger.info(
      `Executing: ${executable} ${args.join(' ')} in: ${command.cwd || '.'}`,
    );

    const child = spawn(executable, args, {
      cwd: command.cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    let killed = false;
    let resolved = false;

    const timeoutId = setTimeout(() => {
      killed = true;
      resolved = true;
      child.kill('SIGTERM');

      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);

      logger.warn(
        `Script timeout after ${SCRIPT_TIMEOUT_MS}ms: ${command.script}`,
      );
      resolve({
        success: false,
        output: '',
        error: 'Script execution timeout',
      });
    }, SCRIPT_TIMEOUT_MS);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);

      if (killed || resolved) return;

      if (code !== 0) {
        logger.warn(`Script exit code ${code}: ${command.script}`);
        if (stderr) {
          logger.info(`stderr: ${stderr.substring(0, 500)}`);
        }
        resolve({
          success: false,
          output: '',
          error: `Exit code ${code}`,
        });
        return;
      }

      if (stderr) {
        logger.info(`stderr (non-fatal): ${stderr.substring(0, 200)}`);
      }

      resolve({
        success: true,
        output: stdout.trim(),
        error: stderr.trim() || undefined,
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);

      if (killed || resolved) return;
      resolved = true;

      if (error.code === 'ENOENT') {
        resolve({
          success: false,
          output: '',
          error: 'SCRIPT_NOT_FOUND',
        });
        return;
      }

      logger.error('executeScript', error);
      resolve({
        success: false,
        output: '',
        error: error.message,
      });
    });
  });
}

async function handleSimpleCommand(message, from, command) {
  const accessCheck = await isCommandAllowed(message, command);
  if (!accessCheck.allowed) {
    if (accessCheck.reason !== 'unauthorized_group') {
      await message.reply(ERROR_MESSAGES.ACCESS_DENIED);
    }
    return;
  }

  if (!command.reply) {
    logger.warn(`Simple command ${command.pattern} has no reply configured`);
    return;
  }

  const { userId, name } = await getContactInfo(message);
  const fromInfo = formatFromInfo(userId, name);

  await message.reply(command.reply);
  logger.info(`${fromInfo}: ${command.pattern} executed`);
}

async function handleScriptCommand(message, from, command, parameter) {
  const accessCheck = await isCommandAllowed(message, command);
  if (!accessCheck.allowed) {
    if (accessCheck.reason !== 'unauthorized_group') {
      await message.reply(ERROR_MESSAGES.ACCESS_DENIED);
    }
    return;
  }

  const { userId, name } = await getContactInfo(message);
  const fromInfo = formatFromInfo(userId, name);

  const result = await executeScript(command, parameter);

  if (!result.success) {
    let userMessage = ERROR_MESSAGES.SCRIPT_ERROR;
    if (result.error === 'SCRIPT_NOT_FOUND') {
      userMessage = ERROR_MESSAGES.SCRIPT_NOT_FOUND;
      logger.warn(`Script not found: ${command.script.split(' ')[0]}`);
    } else if (result.error?.includes('timeout')) {
      userMessage = ERROR_MESSAGES.SCRIPT_TIMEOUT;
    } else if (result.error?.includes('Parameter')) {
      userMessage = ERROR_MESSAGES.INVALID_PARAMETER;
    } else {
      logger.warn(`${command.script} failed: ${result.error}`);
    }
    await message.reply(userMessage);
  } else if (result.output) {
    await message.reply(result.output);
    logger.info(`${command.script} executed for ${fromInfo}`);
  } else {
    logger.info(`${command.script} returned no output for ${fromInfo}`);
  }
}

async function handleCommand(message, commandName, command, parameter = null) {
  const from = message.author || message.from;

  if (!command) {
    logger.warn(`Unknown command: ${commandName}`);
    return;
  }

  try {
    switch (command.type) {
      case COMMAND_TYPES.SIMPLE:
        return await handleSimpleCommand(message, from, command);

      case COMMAND_TYPES.SCRIPT:
        return await handleScriptCommand(message, from, command, parameter);

      case COMMAND_TYPES.COMMAND_LIST:
        const commandList = generateCommandList();
        await message.reply(commandList);
        const contactInfo = await getContactInfo(message);
        logger.info(
          `Command list requested by ${formatFromInfo(
            contactInfo.userId,
            contactInfo.name,
          )}`,
        );
        return;

      default:
        logger.warn(`Unknown command type: ${command.type}`);
    }
  } catch (error) {
    logger.error(`handleCommand:${commandName}`, error);
    await message.reply(ERROR_MESSAGES.SCRIPT_ERROR);
  }
}

async function handleMessage(message) {
  const { body } = message;

  if (!body || typeof body !== 'string') {
    return;
  }

  try {
    const commandMatch = findCommand(body);

    if (!commandMatch) {
      return;
    }

    const { commandName, config, parameter } = commandMatch;
    const userId = getUserId(message);

    const rateLimitResult = checkRateLimit(userId);
    if (rateLimitResult.limited) {
      const { name } = await getContactInfo(message);
      const fromInfo = formatFromInfo(userId, name);
      logger.info(
        `Rate limited: ${fromInfo} - reason: ${rateLimitResult.reason}`,
      );
      await message.reply(ERROR_MESSAGES.RATE_LIMITED);
      return;
    }

    recordCommandUsage(userId);

    await handleCommand(message, commandName, config, parameter);
  } catch (error) {
    logger.error('handleMessage', error);
  }
}

function generateCommandList() {
  const commands = getEnabledCommands();

  if (commands.length === 0) {
    return ERROR_MESSAGES.NO_COMMANDS;
  }

  const lines = commands.map((cmd) => {
    let line = `• ${cmd.pattern}`;

    if (cmd.param_placeholder) {
      line += ` ${cmd.param_placeholder}`;
    }

    if (cmd.description) {
      line += ` - ${cmd.description}`;
    }

    return line;
  });

  return `📋 *Available Commands:*\n\n${lines.join('\n')}`;
}

export function cleanup() {
  cleanupRateLimiter();
  logger.info('Command service cleanup completed');
}

export default handleMessage;
