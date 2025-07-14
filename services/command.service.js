import { exec } from 'child_process';
import { logWithDate } from '../utils/logger.js';
import { findCommand } from '../utils/commands.js';

async function handleCommand(message, commandName, command, parameter = null) {
  const from = message.author || message.from;

  if (!command) {
    logWithDate(`Unknown command: ${commandName}`);
    return;
  }

  try {
    if (command.type === 'simple') {
      return await handleSimpleCommand(message, from, command);
    }

    if (command.type === 'script' || command.type === 'script_with_param') {
      return await handleScriptCommand(message, from, command, parameter);
    }
  } catch (error) {
    logWithDate(`Error in ${commandName} handler: ${error}`);
    await message.reply(`Error processing ${commandName} request.`);
  }
}

async function handleSimpleCommand(message, from, command) {
  if (command.reply) {
    await message.reply(command.reply);
    logWithDate(
      `${from}: ${command.pattern} executed - replied with: ${command.reply}`,
    );
  } else {
    logWithDate(`Simple command ${command.pattern} has no reply configured`);
  }
}

async function handleScriptCommand(message, from, command, parameter) {
  if (command.groupOnly) {
    try {
      const chat = await message.getChat();

      if (!chat.isGroup) {
        logWithDate(
          `${command.script} command attempted from private chat - ignored`,
        );
        return;
      }

      if (command.allowedGroups.length > 0) {
        const chatId = chat.id?._serialized;
        if (!chatId || !command.allowedGroups.includes(chatId)) {
          logWithDate(
            `${command.script} command attempted from unauthorized group: ${
              chat.name || 'Unknown'
            } (${chatId || 'Unknown ID'})`,
          );
          return;
        }
      }
    } catch (error) {
      logWithDate(`Error getting chat info for ${command.script}: ${error}`);
      return;
    }
  }

  if (command.type === 'script_with_param') {
    if (!parameter || parameter.trim() === '') {
      logWithDate(`Missing parameter for ${command.script} from ${from}`);
      return;
    }
    parameter = parameter.trim();
  }

  let scriptCommand = command.script;
  if (parameter) {
    scriptCommand += ` "${parameter}"`;
    logWithDate(`Executing ${command.script} with parameter: ${parameter}`);
  } else {
    logWithDate(`Executing ${command.script}`);
  }

  exec(scriptCommand, { cwd: command.cwd }, async (error, stdout, stderr) => {
    if (error) {
      logWithDate(`Error executing ${command.script}: ${error}`);
      await message.reply(command.errorMessage);
      return;
    }

    if (stderr) {
      logWithDate(`${command.script} stderr: ${stderr}`);
    }

    if (stdout && stdout.trim()) {
      await message.reply(stdout.trim());
      logWithDate(`${command.successMessage} ${from}`);
    } else {
      await message.reply(command.noDataMessage);
      logWithDate(`No data from ${command.script} for ${from}`);
    }
  });
}

async function handleMessage(client, message) {
  const { body } = message;

  if (!body || typeof body !== 'string') {
    return;
  }

  try {
    const commandMatch = findCommand(body);

    if (commandMatch) {
      const { commandName, config, parameter } = commandMatch;
      return await handleCommand(message, commandName, config, parameter);
    }
  } catch (error) {
    logWithDate(`Error handling message: ${error}`);
    console.error('Error handling message:', error);
  }
}

export default handleMessage;
