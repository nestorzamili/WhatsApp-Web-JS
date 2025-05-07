const { logWithDate } = require('../utils/logger');

async function txtContent(client, message, id) {
  try {
    let chat = await client.getChatById(id);
    let groupName = chat.name;
    let sentMessage = await client.sendMessage(id, message);
    logWithDate(
      `Report successfully sent to ${groupName} with message ID: ${sentMessage.id._serialized}`,
    );
  } catch (error) {
    logWithDate(`Error sending message: ${error}`);
  }
}

module.exports = txtContent;
