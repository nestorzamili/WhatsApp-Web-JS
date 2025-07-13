const { logWithDate } = require('../../utils/logger');

async function deleteMessageHandler(client, message, body) {
  try {
    const messageID = body.split(',')[1];

    if (!messageID) {
      await message.reply(
        'Invalid message ID format. Use: !deleteMessage,<messageID>',
      );
      return;
    }

    const msg = await client.getMessageById(messageID);

    if (msg.fromMe) {
      await msg.delete(true);
      await message.reply(`Message with ID ${messageID} has been deleted!`);
      logWithDate(`Message with ID ${messageID} has been deleted!`);
    } else {
      await message.reply('Can only delete messages sent by this bot.');
      logWithDate(`Attempted to delete non-bot message: ${messageID}`);
    }
  } catch (error) {
    logWithDate(`Error in delete message handler: ${error}`);
    await message.reply('Error deleting message. Please check the message ID.');
  }
}

module.exports = deleteMessageHandler;
