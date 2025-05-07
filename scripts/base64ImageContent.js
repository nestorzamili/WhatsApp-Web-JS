const { MessageMedia } = require('whatsapp-web.js');
const { logWithDate } = require('../utils/logger');

async function base64ImageContent(client, caption, base64Images, id) {
  for (let base64Image of base64Images) {
    const media = new MessageMedia(
      base64Image.mimetype,
      base64Image.data,
      base64Image.filename,
    );

    try {
      let chat = await client.getChatById(id);
      let groupName = chat.name;
      let sentMessage = await client.sendMessage(id, media, {
        caption: caption,
      });
      logWithDate(
        `Report successfully sent to ${groupName} with message ID: ${sentMessage.id._serialized}`,
      );
    } catch (error) {
      logWithDate(`Error sending message: ${error}`);
    }
  }
}

module.exports = base64ImageContent;
