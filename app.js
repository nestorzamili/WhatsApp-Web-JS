import 'dotenv/config';
import express, { json, text, urlencoded } from 'express';
import qrcode from 'qrcode-terminal';
import whatsappWeb from 'whatsapp-web.js';

import { logWithDate } from './utils/logger.js';
import puppeteerConfig from './utils/puppeteer.config.js';
import routes from './routes/index.route.js';
import handleMessage from './services/command.service.js';

const { Client, LocalAuth } = whatsappWeb;
const { PORT = 3113 } = process.env;

const app = express();
app.use(json({ limit: '50mb' }));
app.use(text());
app.use(urlencoded({ extended: true }));

const client = new Client({
  takeoverOnConflict: true,
  takeoverTimeoutMs: 10,
  puppeteer: puppeteerConfig,
  authStrategy: new LocalAuth(),
  dataPath: 'session',
});

const startServer = () => {
  logWithDate('WhatsApp API is ready to use!');

  const server = app.listen(PORT, () =>
    logWithDate(`Server running on port ${PORT}`),
  );

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use, trying another port...`);
      server.listen(0);
    } else {
      throw err;
    }
  });
};

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('loading_screen', (percent, message) =>
  logWithDate(`Loading: ${percent}% - ${message}`),
);
client.on('auth_failure', () => logWithDate('Authentication failure!'));
client.on('disconnected', () => logWithDate('Client disconnected!'));
client.on('authenticated', () => logWithDate('Client authenticated!'));
client.on('ready', startServer);
client.on('message', async (message) => {
  await handleMessage(client, message);
});

routes(app, client);
client.initialize();
