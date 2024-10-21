require("dotenv").config();
const qrcode = require("qrcode-terminal");
const { Client, RemoteAuth } = require("whatsapp-web.js");
const { logWithDate } = require("./utils/logger");
const fs = require("fs");
const express = require("express");
const routes = require("./routes");
const getAIResponse = require("./utils/geminiClient");
const { AwsS3Store, S3Client } = require("./utils/awsS3Store");

const app = express();
const { PORT = 3000 } = process.env;

app.use(express.json({ limit: "50mb" }));
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const S3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  httpOptions: {
    timeout: 60000,
  },
});

const store = new AwsS3Store({
  bucketName: process.env.AWS_BUCKET_NAME,
  remoteDataPath: process.env.AWS_REMOTE_DATA_PATH,
  s3Client: S3,
});

const client = new Client({
  puppeteer: {
    headless: true,
    args: [
      "--disable-accelerated-2d-canvas",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-cache",
      "--disable-component-extensions-with-background-pages",
      "--disable-crash-reporter",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-gpu",
      "--disable-hang-monitor",
      "--disable-ipc-flooding-protection",
      "--disable-mojo-local-storage",
      "--disable-notifications",
      "--disable-popup-blocking",
      "--disable-print-preview",
      "--disable-prompt-on-repost",
      "--disable-renderer-backgrounding",
      "--disable-software-rasterizer",
      "--ignore-certificate-errors",
      "--log-level=3",
      "--no-default-browser-check",
      "--no-first-run",
      "--no-sandbox",
      "--no-zygote",
      "--renderer-process-limit=100",
      "--enable-gpu-rasterization",
      "--enable-zero-copy",
    ],
  },
  authStrategy: new RemoteAuth({
    clientId: "whatsapp-bot",
    dataPath: "./.wwebjs_auth",
    store: store,
    backupSyncIntervalMs: 600000,
  }),
});

routes(app, client);
client.initialize();

client.on("qr", (qr) => qrcode.generate(qr, { small: true }));
client.on("loading_screen", (percent, message) =>
  log(`Loading: ${percent}% - ${message}`)
);
client.on("auth_failure", () => log("Authentication failure!"));
client.on("disconnected", () => log("Client disconnected!"));
client.on("authenticated", () => log("Client authenticated!"));
client.on("ready", () => startServer());

client.on("message", async (message) => {
  const { body, from } = message;

  if (body === "!ping") return handlePing(message, from);
  if (body === "!logs") return handleLogs(message, from);
  if (body.startsWith("!deleteMessage,"))
    return handleDeleteMessage(message, body);
  if (body.startsWith("!AI ")) return handleAIResponse(message, body, from);
});

function log(message) {
  logWithDate(message);
  console.log(message);
}

function startServer() {
  log("WhatsApp API siap digunakan!");

  const server = app.listen(PORT, () => log(`Server berjalan di port ${PORT}`));
  server.on("error", handleError(server));
}

function handleError(server) {
  return (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} sudah digunakan, mencoba port lain...`);
      server.listen(0);
    } else {
      throw err;
    }
  };
}

async function handlePing(message, from) {
  message.reply("pong");
  log(`${from}: pinged!`);
}

function handleLogs(message, from) {
  fs.readFile("logs/status.log", "utf8", (err, data) => {
    if (err) return;
    const recentLines = data.trim().split("\n").slice(-10).join("\n");
    message.reply(recentLines);
    log(`${from}: !logs`);
  });
}

async function handleDeleteMessage(message, body) {
  const messageID = body.split(",")[1];
  try {
    const msg = await client.getMessageById(messageID);
    if (msg.fromMe) {
      msg.delete(true);
      message.reply(`Pesan dengan ID ${messageID} telah dihapus!`);
      log(`Pesan dengan ID ${messageID} telah dihapus!`);
    }
  } catch (error) {
    log(`Error getting message: ${error}`);
  }
}

async function handleAIResponse(message, body, from) {
  const question = body.slice(4);
  try {
    const response = await getAIResponse(question);
    message.reply(response);
    log(`${from}: ${question}`);
  } catch (error) {
    log(`Error getting AI response: ${error}`);
  }
}
