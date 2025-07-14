export const COMMANDS = {
  // Example command to reply with a simple message
  ping: {
    type: 'simple',
    enabled: true,
    groupOnly: false,
    allowedGroups: [],
    pattern: '!test',
    exact: true,
    reply: 'ok',
  },

  // Example command to run a script without parameters
  report: {
    type: 'script',
    script: 'python3 generate_report.py',
    cwd: './scripts',
    enabled: true,
    groupOnly: true,
    allowedGroups: ['example_group_id@g.us'],
    pattern: '!report',
    exact: true,
    successMessage: 'Report data sent to',
    errorMessage: 'Error generating report.',
    noDataMessage: 'No report data available.',
  },

  // Example command to run a script with parameters
  search: {
    type: 'script_with_param',
    script: 'node search_data.js',
    cwd: './scripts',
    enabled: true,
    groupOnly: true,
    allowedGroups: ['example_group_id@g.us'],
    pattern: '!search:',
    exact: false,
    successMessage: 'Search results sent to',
    errorMessage: 'Error executing search.',
    noDataMessage: 'No search results found.',
  },
};

export function findCommand(messageBody) {
  if (!messageBody || typeof messageBody !== 'string') {
    return null;
  }

  for (const [commandName, config] of Object.entries(COMMANDS)) {
    if (!config.enabled) continue;

    if (config.exact) {
      if (messageBody === config.pattern) {
        return { commandName, config, parameter: null };
      }
    } else {
      if (messageBody.startsWith(config.pattern)) {
        const parameter = messageBody.substring(config.pattern.length).trim();
        return { commandName, config, parameter };
      }
    }
  }

  return null;
}
