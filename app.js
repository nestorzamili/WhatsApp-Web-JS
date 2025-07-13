require('dotenv').config();
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { logWithDate } = require('./utils/logger');
const puppeteerConfig = require('./utils/puppeteerConfig');
const express = require('express');
const routes = require('./routes');
const handleMessage = require('./handlers/messageHandler');

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
  await handleMessage(client, message);
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
