import { extname } from 'path';
import whatsappWeb from 'whatsapp-web.js';
import { logWithDate } from '../utils/logger.js';

const { MessageMedia } = whatsappWeb;

async function sendMessage(client, id, options = {}) {
  const { text, caption, files, base64Images } = options;

  try {
    const chat = await client.getChatById(id);
    const chatName = chat.name || chat.id._serialized;

    // Send text message
    if (text) {
      const sentMessage = await client.sendMessage(id, text);
      logWithDate(
        `Text message sent to ${chatName} with ID: ${sentMessage.id._serialized}`,
      );
      return sentMessage;
    }

    // Send files
    if (files && files.length > 0) {
      const results = [];
      for (const file of files) {
        const media = createMediaFromFile(file);
        const sentMessage = await client.sendMessage(id, media, { caption });
        logWithDate(
          `File "${file.originalname}" sent to ${chatName} with ID: ${sentMessage.id._serialized}`,
        );
        results.push(sentMessage);
      }
      return results;
    }

    // Send base64 images
    if (base64Images && base64Images.length > 0) {
      const results = [];
      for (const image of base64Images) {
        const media = createMediaFromBase64(image);
        const sentMessage = await client.sendMessage(id, media, { caption });
        logWithDate(
          `Base64 image sent to ${chatName} with ID: ${sentMessage.id._serialized}`,
        );
        results.push(sentMessage);
      }
      return results;
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
  const ext = extname(file.originalname).toLowerCase();

  let mimetype = file.mimetype;
  // Fix mimetype for common cases
  if (mimetype === 'application/octet-stream') {
    if (ext === '.jpg' || ext === '.jpeg') {
      mimetype = 'image/jpeg';
    } else if (ext === '.png') {
      mimetype = 'image/png';
    } else if (ext === '.gif') {
      mimetype = 'image/gif';
    } else if (ext === '.pdf') {
      mimetype = 'application/pdf';
    }
  }

  return new MessageMedia(
    mimetype,
    file.buffer.toString('base64'),
    file.originalname,
  );
}

/**
 * Create MessageMedia from base64 image object
 */
function createMediaFromBase64(image) {
  return new MessageMedia(
    image.mimetype || 'image/jpeg',
    image.data,
    image.filename || 'image',
  );
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
  createMediaFromBase64,
};
