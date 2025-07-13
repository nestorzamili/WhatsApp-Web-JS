import { readFileSync, existsSync } from 'fs';
import whatsappWeb from 'whatsapp-web.js';
import { logWithDate } from '../utils/logger.js';
import { getMimeType, isWhatsAppSupported } from '../utils/mimeTypes.js';

const { MessageMedia } = whatsappWeb;

async function sendMessage(client, id, options = {}) {
  const { text, files, filePaths } = options;

  try {
    const chat = await client.getChatById(id);
    const chatName = chat.name || chat.id._serialized;

    // Send files from file paths
    if (filePaths && filePaths.length > 0) {
      const results = [];
      for (const filePath of filePaths) {
        const media = createMediaFromPath(filePath);
        const sentMessage = await client.sendMessage(id, media, {
          caption: text,
        });
        logWithDate(
          `File "${filePath}" sent to ${chatName} with ID: ${sentMessage.id._serialized}`,
        );
        results.push(sentMessage);
      }
      return results;
    }

    // Send files from upload
    if (files && files.length > 0) {
      const results = [];
      for (const file of files) {
        const media = createMediaFromFile(file);
        const sentMessage = await client.sendMessage(id, media, {
          caption: text,
        });
        logWithDate(
          `File "${file.originalname}" sent to ${chatName} with ID: ${sentMessage.id._serialized}`,
        );
        results.push(sentMessage);
      }
      return results;
    }

    // Send text message only
    if (text) {
      const sentMessage = await client.sendMessage(id, text);
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

/**
 * Create MessageMedia from file object (multer)
 */
function createMediaFromFile(file) {
  if (!isWhatsAppSupported(file.originalname)) {
    throw new Error(`Unsupported file type: ${file.originalname}`);
  }

  const mimetype = getMimeType(file.originalname, file.mimetype);

  return new MessageMedia(
    mimetype,
    file.buffer.toString('base64'),
    file.originalname,
  );
}

/**
 * Create MessageMedia from file path
 */
function createMediaFromPath(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const filename = filePath.split('/').pop();

  if (!isWhatsAppSupported(filename)) {
    throw new Error(`Unsupported file type: ${filename}`);
  }

  const data = readFileSync(filePath, { encoding: 'base64' });
  const mimetype = getMimeType(filename);

  return new MessageMedia(mimetype, data, filename);
}

/**
 * Get chat name by ID
 */
async function getChatName(client, id) {
  try {
    const chat = await client.getChatById(id);
    return chat.name || chat.id._serialized;
  } catch (error) {
    logWithDate(`Error getting chat name for ${id}: ${error}`);
    return id;
  }
}

/**
 * Get group ID by group name
 */
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

export {
  sendMessage,
  getChatName,
  getGroupID,
  createMediaFromFile,
  createMediaFromPath,
};
