import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import whatsappWeb from 'whatsapp-web.js';
import { logWithDate } from '../utils/logger.js';
import { getMimeType, isWhatsAppSupported } from '../utils/mimeTypes.js';

const { MessageMedia } = whatsappWeb;

async function sendMessage(client, id, options = {}) {
  const { message, files, filePaths } = options;

  try {
    const chat = await client.getChatById(id);
    const chatName = chat.name || chat.id._serialized;

    if (filePaths?.length > 0) {
      return await sendFilesByPath(client, id, filePaths, message, chatName);
    }

    if (files?.length > 0) {
      return await sendFilesByUpload(client, id, files, message, chatName);
    }

    if (message) {
      const sentMessage = await client.sendMessage(id, message);
      logWithDate(
        `Text message sent to ${chatName} with ID: ${sentMessage.id._serialized}`,
      );
      return sentMessage;
    }

    throw new Error('No content provided to send');
  } catch (error) {
    logWithDate(`Error sending message to ${id}: ${error}`);
    throw error;
  }
}

async function sendFilesByPath(client, id, filePaths, message, chatName) {
  const results = [];
  for (const filePath of filePaths) {
    const media = createMediaFromPath(filePath);
    const sentMessage = await client.sendMessage(id, media, {
      caption: message,
    });
    logWithDate(
      `File "${filePath}" sent to ${chatName} with ID: ${sentMessage.id._serialized}`,
    );
    results.push(sentMessage);
  }
  return results;
}

async function sendFilesByUpload(client, id, files, message, chatName) {
  const results = [];
  for (const file of files) {
    const media = createMediaFromFile(file);
    const sentMessage = await client.sendMessage(id, media, {
      caption: message,
    });
    logWithDate(
      `File "${file.originalname}" sent to ${chatName} with ID: ${sentMessage.id._serialized}`,
    );
    results.push(sentMessage);
  }
  return results;
}

function createMediaFromFile(file) {
  return createMedia(
    file.originalname,
    file.buffer.toString('base64'),
    file.mimetype,
  );
}

function createMediaFromPath(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const filename = basename(filePath);
  const data = readFileSync(filePath, { encoding: 'base64' });

  return createMedia(filename, data);
}

function createMedia(filename, base64Data, fallbackMimeType = null) {
  if (!isWhatsAppSupported(filename)) {
    throw new Error(`Unsupported file type: ${filename}`);
  }

  const mimetype =
    fallbackMimeType === null
      ? getMimeType(filename)
      : getMimeType(filename, fallbackMimeType);
  return new MessageMedia(mimetype, base64Data, filename);
}

async function getGroupID(client, groupName) {
  try {
    const chats = await client.getChats();
    const targetGroup = chats
      .filter((chat) => chat.isGroup && chat.name === groupName)
      .map((chat) => ({
        id: chat.id._serialized,
        name: chat.name,
      }))[0];

    if (targetGroup) {
      logWithDate(`Group ID found for "${groupName}": ${targetGroup.id}`);
      return targetGroup.id;
    } else {
      logWithDate(`Group "${groupName}" not found`);
      return null;
    }
  } catch (error) {
    logWithDate(`Error finding group "${groupName}": ${error}`);
    return null;
  }
}

export { sendMessage, getGroupID };
