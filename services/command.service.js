import { spawn } from 'child_process';
import { logWithDate } from '../utils/logger.js';
import { findCommand } from '../utils/commands.js';

async function getContactName(message) {
  try {
    const contact = await message.getContact();
    return contact.pushname || contact.name || contact.number || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

function formatFromInfo(fromId, fromName) {
  if (fromName && fromName !== 'Unknown') {
    return `${fromName} (${fromId})`;
  }
  return fromId || 'Unknown';
}

async function isCommandAllowed(message, command) {
  if (!command.groupOnly) return true;

  try {
    const chat = await message.getChat();

    if (!chat.isGroup) {
      logWithDate(
        `${
          command.script || command.pattern
        } command attempted from private chat - ignored`,
      );
      return false;
    }

    if (command.allowedGroups && command.allowedGroups.length > 0) {
      const chatId = chat.id?._serialized;
      if (!chatId || !command.allowedGroups.includes(chatId)) {
        logWithDate(
          `${
            command.script || command.pattern
          } command attempted from unauthorized group: ${
            chat.name || 'Unknown'
          } (${chatId || 'Unknown ID'})`,
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    logWithDate(
      `Error getting chat info for ${command.script || command.pattern}: ${
        error.message
      }`,
    );
    return false;
  }
}

function validateParameter(command, parameter, from) {
  if (command.type !== 'script_with_param') return parameter;

  if (!parameter || parameter.trim() === '') {
    logWithDate(`Missing parameter for ${command.script} from ${from}`);
    return null;
  }

  return parameter.trim();
}

function executeScript(command, parameter) {
  return new Promise((resolve) => {
    const scriptParts = command.script.split(' ');
    const executable = scriptParts[0];
    const args = [...scriptParts.slice(1)];

    if (parameter) {
      args.push(parameter);
    }

    logWithDate(
      `Executing ${command.script}${
        parameter ? ` with parameter: ${parameter}` : ''
      } in directory: ${command.cwd}`,
    );

    const child = spawn(executable, args, {
      cwd: command.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        logWithDate(`Error executing ${command.script}: Exit code ${code}`);
        if (stderr) {
          logWithDate(`${command.script} stderr: ${stderr}`);
        }
        resolve({ success: false, output: '', error: `Exit code ${code}` });
        return;
      }

      if (stderr) {
        logWithDate(`${command.script} stderr: ${stderr}`);
      }

      resolve({
        success: true,
        output: stdout.trim(),
        error: stderr.trim() || undefined,
      });
    });

    child.on('error', (error) => {
      logWithDate(`Error executing ${command.script}: ${error.message}`);
      logWithDate(
        `Command details - executable: ${executable}, args: [${args.join(
          ', ',
        )}], cwd: ${command.cwd}`,
      );
      resolve({ success: false, output: '', error: error.message });
    });
  });
}

async function handleSimpleCommand(message, from, command) {
  const isAllowed = await isCommandAllowed(message, command);
  if (!isAllowed) return;

  if (!command.reply) {
    logWithDate(`Simple command ${command.pattern} has no reply configured`);
    return;
  }

  const fromName = await getContactName(message);
  const fromInfo = formatFromInfo(from, fromName);

  await message.reply(command.reply);
  logWithDate(
    `${fromInfo}: ${command.pattern} executed - replied with: ${command.reply}`,
  );
}

async function handleScriptCommand(message, from, command, parameter) {
  const isAllowed = await isCommandAllowed(message, command);
  if (!isAllowed) return;

  const fromName = await getContactName(message);
  const fromInfo = formatFromInfo(from, fromName);

  const validatedParameter = validateParameter(command, parameter, fromInfo);
  if (command.type === 'script_with_param' && validatedParameter === null) {
    return;
  }

  const result = await executeScript(command, validatedParameter);

  if (result.success && result.output) {
    await message.reply(result.output);
    logWithDate(`${command.script} executed successfully for ${fromInfo}`);
  } else if (!result.success) {
    logWithDate(`${command.script} failed for ${fromInfo}: ${result.error}`);
  } else {
    logWithDate(
      `${command.script} executed but returned no output for ${fromInfo}`,
    );
  }
}

async function handleCommand(message, commandName, command, parameter = null) {
  const from = message.author || message.from;

  if (!command) {
    logWithDate(`Unknown command: ${commandName}`);
    return;
  }

  try {
    switch (command.type) {
      case 'simple':
        return await handleSimpleCommand(message, from, command);
      case 'script':
      case 'script_with_param':
        return await handleScriptCommand(message, from, command, parameter);
      default:
        logWithDate(`Unknown command type: ${command.type}`);
    }
  } catch (error) {
    const fromName = await getContactName(message);
    const fromInfo = formatFromInfo(from, fromName);
    logWithDate(
      `Error in ${commandName} handler from ${fromInfo}: ${error.message}`,
    );
    await message.reply(`Error processing ${commandName} request.`);
  }
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
      await handleCommand(message, commandName, config, parameter);
    }
  } catch (error) {
    logWithDate(`Error handling message: ${error.message}`);
    console.error('Error handling message:', error);
  }
}

export default handleMessage;
