const { exec } = require('child_process');
const { logWithDate } = require('../../utils/logger');

async function desaBrillianHandler(message, from) {
  try {
    exec(
      'python3 get-village-brilliant.py',
      { cwd: 'samunu' },
      async (error, stdout, stderr) => {
        if (error) {
          logWithDate(`Error getting desa brilliant data: ${error}`);
          await message.reply(
            'Error retrieving desa brilliant data. Please try again later.',
          );
          return;
        }

        if (stderr) {
          logWithDate(`Desa brilliant script stderr: ${stderr}`);
        }

        if (stdout) {
          await message.reply(stdout);
          logWithDate(`Sending desa brilliant data to ${from}`);
        } else {
          await message.reply('No desa brilliant data available.');
          logWithDate(`No desa brilliant data for ${from}`);
        }
      },
    );
  } catch (error) {
    logWithDate(`Error in desa brilliant handler: ${error}`);
    await message.reply('Error processing desa brilliant request.');
  }
}

module.exports = desaBrillianHandler;
