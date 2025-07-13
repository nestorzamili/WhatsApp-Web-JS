import { exec } from 'child_process';
import { logWithDate } from '../utils/logger.js';
import { COMMANDS } from '../utils/commands.js';

/**
 * Universal command handler
 */
async function handleCommand(client, message, commandName, parameter = null) {
  const { body, from } = message;
  const command = COMMANDS[commandName];

  if (!command) {
    logWithDate(`Unknown command: ${commandName}`);
    return;
  }

  try {
    // Handle simple commands (like ping)
    if (command.type === 'simple') {
      return await command.handler(message, from);
    }

    // Handle script-based commands
    if (command.type === 'script' || command.type === 'script_with_param') {
      return await handleScriptCommand(message, from, command, parameter);
    }
  } catch (error) {
    logWithDate(`Error in ${commandName} handler: ${error}`);
    await message.reply(`Error processing ${commandName} request.`);
  }
}

/**
 * Handle script execution commands
 */
async function handleScriptCommand(message, from, command, parameter) {
  // Check group restrictions for briva
  if (command.groupOnly) {
    const chat = await message.getChat();

    if (!chat.isGroup) {
      logWithDate(
        `${command.script} command attempted from private chat - ignored`,
      );
      return;
    }

    if (command.allowedGroups && command.allowedGroups.length > 0) {
      if (!command.allowedGroups.includes(chat.id._serialized)) {
        logWithDate(
          `${command.script} command attempted from unauthorized group: ${chat.name} (${chat.id._serialized})`,
        );
        return;
      }
    }
  }

  // Handle parameter validation for parameterized commands
  if (command.type === 'script_with_param') {
    if (!parameter || parameter.trim() === '') {
      await message.reply(command.paramFormat);
      return;
    }
    parameter = parameter.trim();
  }

  // Build command
  let scriptCommand = command.script;
  if (parameter) {
    scriptCommand += ` "${parameter}"`;
    logWithDate(`Executing ${command.script} with parameter: ${parameter}`);
  } else {
    logWithDate(`Executing ${command.script}`);
  }

  // Execute script
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

/**
 * Main message handler that routes commands
 */
async function handleMessage(client, message) {
  const { body, from } = message;

  try {
    // Parse command and parameters
    if (body === '!ping') {
      return await handleCommand(client, message, 'ping');
    }

    if (body === '!jadwaldeo') {
      return await handleCommand(client, message, 'jadwaldeo');
    }

    if (body.startsWith('!briva:')) {
      const parameter = body.substring(7).trim();
      return await handleCommand(client, message, 'briva', parameter);
    }

    if (body === '!desabrillian') {
      return await handleCommand(client, message, 'desabrillian');
    }
  } catch (error) {
    logWithDate(`Error handling message: ${error}`);
    console.error('Error handling message:', error);
  }
}

export default handleMessage;
