require('dotenv').config();
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { logWithDate } = require('./utils/logger');
const puppeteerConfig = require('./utils/puppeteerConfig');
const fs = require('fs');
const express = require('express');
const routes = require('./routes');
const { exec } = require('child_process');

const app = express();
const { PORT = 3113 } = process.env;

app.use(express.json({ limit: '50mb' }));
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const client = new Client({
  puppeteer: puppeteerConfig,
  authStrategy: new LocalAuth(),
  dataPath: 'session',
});

routes(app, client);
client.initialize();

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('loading_screen', (percent, message) =>
  log(`Loading: ${percent}% - ${message}`),
);
client.on('auth_failure', () => log('Authentication failure!'));
client.on('disconnected', () => log('Client disconnected!'));
client.on('authenticated', () => log('Client authenticated!'));
client.on('ready', () => startServer());

client.on('message', async (message) => {
  const { body, from } = message;

  if (body === '!ping') return handlePing(message, from);
  if (body === '!logs') return handleLogs(message, from);
  if (body.startsWith('!deleteMessage,'))
    return handleDeleteMessage(message, body);
  if (body === '!jadwaldeo') return handleSchedule(message, from);
});

function log(message) {
  logWithDate(message);
  console.log(message);
}

function startServer() {
  log('WhatsApp API is ready to use!');

  const server = app.listen(PORT, () => log(`Server running on port ${PORT}`));
  server.on('error', handleError(server));
}

function handleError(server) {
  return (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use, trying another port...`);
      server.listen(0);
    } else {
      throw err;
    }
  };
}

async function handlePing(message, from) {
  message.reply('pong');
  log(`${from}: pinged!`);
}

function handleLogs(message, from) {
  fs.readFile('logs/status.log', 'utf8', (err, data) => {
    if (err) return;
    const recentLines = data.trim().split('\n').slice(-10).join('\n');
    message.reply(recentLines);
    log(`${from}: !logs`);
  });
}

async function handleDeleteMessage(message, body) {
  const messageID = body.split(',')[1];
  try {
    const msg = await client.getMessageById(messageID);
    if (msg.fromMe) {
      msg.delete(true);
      message.reply(`Message with ID ${messageID} has been deleted!`);
      log(`Message with ID ${messageID} has been deleted!`);
    }
  } catch (error) {
    log(`Error getting message: ${error}`);
  }
}

// Example function to interact with Python script
// This function assumes you have a Python script named getSchedule.py
async function handleSchedule(message, from) {
  exec('python3 getSchedule.py', (error, stdout) => {
    if (error) {
      log(`Error getting schedule: ${error}`);
      return;
    }
    message.reply(stdout);
    log(`Sending schedule to ${from}`);
  });
}
