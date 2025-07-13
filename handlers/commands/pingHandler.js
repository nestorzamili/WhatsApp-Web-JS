const { logWithDate } = require('../../utils/logger');

async function pingHandler(message, from) {
  try {
    await message.reply('pong');
    logWithDate(`${from}: pinged!`);
  } catch (error) {
    logWithDate(`Error in ping handler: ${error}`);
    throw error;
  }
}

module.exports = pingHandler;
