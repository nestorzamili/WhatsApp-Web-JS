import 'dotenv/config';
import express, { json, text, urlencoded } from 'express';
import qrcode from 'qrcode-terminal';
import whatsappWeb from 'whatsapp-web.js';

import logger from './utils/logger.js';
import puppeteerConfig from './utils/puppeteer.config.js';
import routes from './routes/index.route.js';
import handleMessage from './services/command.service.js';
import { cleanup } from './utils/commands.js';

const { Client, LocalAuth } = whatsappWeb;
const { PORT = 3113, API_KEY } = process.env;

if (!API_KEY) {
  console.error('ERROR: API_KEY environment variable is required');
  process.exit(1);
}

const app = express();

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(json({ limit: '50mb' }));
app.use(text());
app.use(urlencoded({ extended: true }));

const client = new Client({
  takeoverOnConflict: true,
  takeoverTimeoutMs: 10,
  puppeteer: puppeteerConfig,
  authStrategy: new LocalAuth({
    dataPath: 'session',
  }),
});

const startServer = () => {
  logger.info('WhatsApp API is ready to use!');

  const server = app.listen(PORT, () =>
    logger.info(`Server running on port ${PORT}`),
  );

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`Port ${PORT} is already in use, trying another port...`);
      server.listen(0);
    } else {
      logger.error(`Server error: ${err.message}`);
      throw err;
    }
  });
};

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('loading_screen', (percent, message) =>
  logger.info(`Loading: ${percent}% - ${message}`),
);
client.on('auth_failure', () => logger.error('Authentication failure!'));
client.on('disconnected', () => logger.warn('Client disconnected!'));
client.on('authenticated', () => logger.info('Client authenticated!'));
client.on('ready', startServer);
client.on('message', async (message) => {
  await handleMessage(message);
});

routes(app, client);
client.initialize();

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(`Stack: ${error.stack}`);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  cleanup();
  process.exit(1);
});
