/**
 * Command definitions with their configurations
 */
export const COMMANDS = {
  ping: {
    type: 'simple',
    handler: async (message, from) => {
      await message.reply('pong');
      const { logWithDate } = await import('./logger.js');
      logWithDate(`${from}: pinged!`);
    },
  },

  jadwaldeo: {
    type: 'script',
    script: 'python3 getSchedule.py',
    cwd: 'samunu',
    successMessage: 'Sending schedule to',
    errorMessage: 'Error retrieving schedule. Please try again later.',
    noDataMessage: 'No schedule data available.',
  },

  desabrillian: {
    type: 'script',
    script: 'python3 get-village-brilliant.py',
    cwd: 'samunu',
    successMessage: 'Sending desa brilliant data to',
    errorMessage:
      'Error retrieving desa brilliant data. Please try again later.',
    noDataMessage: 'No desa brilliant data available.',
  },

  briva: {
    type: 'script_with_param',
    script: 'node briva-script.js',
    cwd: 'samunu',
    successMessage: 'Sending briva data to',
    errorMessage: 'Error executing briva script. Please try again later.',
    noDataMessage: 'No briva data available.',
    paramFormat: 'Format: !briva: <parameter>',
    allowedGroups: [
      '120363185522082107@g.us', // Test Node.js 1
    ],
    groupOnly: true,
  },
};
