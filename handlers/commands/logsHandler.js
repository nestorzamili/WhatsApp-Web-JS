const fs = require('fs');
const { logWithDate } = require('../../utils/logger');

async function logsHandler(message, from) {
  try {
    fs.readFile('logs/status.log', 'utf8', async (err, data) => {
      if (err) {
        logWithDate(`Error reading logs: ${err}`);
        return;
      }

      const recentLines = data.trim().split('\n').slice(-10).join('\n');
      await message.reply(recentLines);
      logWithDate(`${from}: !logs`);
    });
  } catch (error) {
    logWithDate(`Error in logs handler: ${error}`);
    throw error;
  }
}

module.exports = logsHandler;
