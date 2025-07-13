const { exec } = require('child_process');
const { logWithDate } = require('../../utils/logger');

async function scheduleHandler(message, from) {
  try {
    exec(
      'python3 getSchedule.py',
      { cwd: 'samunu' },
      async (error, stdout, stderr) => {
        if (error) {
          logWithDate(`Error getting schedule: ${error}`);
          await message.reply(
            'Error retrieving schedule. Please try again later.',
          );
          return;
        }

        if (stderr) {
          logWithDate(`Schedule script stderr: ${stderr}`);
        }

        if (stdout) {
          await message.reply(stdout);
          logWithDate(`Sending schedule to ${from}`);
        } else {
          await message.reply('No schedule data available.');
          logWithDate(`No schedule data for ${from}`);
        }
      },
    );
  } catch (error) {
    logWithDate(`Error in schedule handler: ${error}`);
    await message.reply('Error processing schedule request.');
  }
}

module.exports = scheduleHandler;
