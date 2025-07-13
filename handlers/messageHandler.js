const pingHandler = require('./commands/pingHandler');
const logsHandler = require('./commands/logsHandler');
const deleteMessageHandler = require('./commands/deleteMessageHandler');
const scheduleHandler = require('./commands/scheduleHandler');
const brivaHandler = require('./commands/brivaHandler');
const desaBrillianHandler = require('./commands/desaBrillianHandler');
const { logWithDate } = require('../utils/logger');

async function handleMessage(client, message) {
  const { body, from } = message;

  try {
    if (body === '!ping') {
      return await pingHandler(message, from);
    }

    if (body === '!logs') {
      return await logsHandler(message, from);
    }

    if (body.startsWith('!deleteMessage,')) {
      return await deleteMessageHandler(client, message, body);
    }

    if (body === '!jadwaldeo') {
      return await scheduleHandler(message, from);
    }

    if (body.startsWith('!briva:')) {
      const parameter = body.substring(7).trim();
      return await brivaHandler(message, from, parameter);
    }

    if (body === '!desabrillian') {
      return await desaBrillianHandler(message, from);
    }
  } catch (error) {
    logWithDate(`Error handling message: ${error}`);
    console.error('Error handling message:', error);
  }
}

module.exports = handleMessage;
