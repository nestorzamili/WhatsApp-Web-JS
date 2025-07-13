const { exec } = require('child_process');
const { logWithDate } = require('../../utils/logger');

// Group IDs yang diizinkan menggunakan command briva
const ALLOWED_GROUP_IDS = [
  '120363185522082107@g.us', // Test Node.js 1
];

async function brivaHandler(message, from, parameter) {
  try {
    const chat = await message.getChat();

    // Cek apakah pesan dari grup
    if (!chat.isGroup) {
      logWithDate('Briva command attempted from private chat - ignored');
      return;
    }

    // Cek apakah array group ID sudah dikonfigurasi
    if (ALLOWED_GROUP_IDS.length === 0) {
      logWithDate('Briva command blocked - no allowed groups configured');
      return;
    }

    // Cek apakah grup diizinkan
    if (!ALLOWED_GROUP_IDS.includes(chat.id._serialized)) {
      logWithDate(
        `Briva command attempted from unauthorized group: ${chat.name} (${chat.id._serialized})`,
      );
      return;
    }

    // Validasi parameter
    if (!parameter || parameter.trim() === '') {
      await message.reply('Format: !briva: <parameter>');
      return;
    }

    const scriptParameter = parameter.trim();
    logWithDate(
      `Executing briva script with parameter: ${scriptParameter} from group: ${chat.name}`,
    );

    exec(
      `node briva-script.js "${scriptParameter}"`,
      { cwd: 'samunu' },
      async (error, stdout, stderr) => {
        if (error) {
          logWithDate(`Error executing briva script: ${error}`);
          await message.reply(
            'Error executing briva script. Please try again later.',
          );
          return;
        }

        if (stderr) {
          logWithDate(`Briva script stderr: ${stderr}`);
        }

        if (stdout) {
          await message.reply(stdout.trim());
          logWithDate(`Sending briva data to ${from}`);
        } else {
          await message.reply('No briva data available.');
          logWithDate(`No briva data for ${from}`);
        }
      },
    );
  } catch (error) {
    logWithDate(`Error in briva handler: ${error}`);
    await message.reply('Error processing briva request.');
  }
}

module.exports = brivaHandler;
