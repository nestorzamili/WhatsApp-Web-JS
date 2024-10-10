require("dotenv").config();
const qrcode = require("qrcode-terminal");
const { Client, RemoteAuth } = require("whatsapp-web.js");
const { AwsS3Store } = require("wwebjs-aws-s3");
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { logWithDate } = require("./utils/logger");
const fs = require("fs");
const express = require("express");
const routes = require("./routes");
const getAIResponse = require("./utils/geminiClient");

const app = express();
const { PORT = 3000, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REMOTE_DATA_PATH } = process.env;

app.use(express.json());
app.use(express.text());

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

const store = new AwsS3Store({
  bucketName: AWS_BUCKET_NAME,
  remoteDataPath: AWS_REMOTE_DATA_PATH,
  s3Client: s3,
  putObjectCommand: PutObjectCommand,
  headObjectCommand: HeadObjectCommand,
  getObjectCommand: GetObjectCommand,
  deleteObjectCommand: DeleteObjectCommand,
});

const client = new Client({
  puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"] },
  authStrategy: new RemoteAuth({
    clientId: "whatsapp-bot",
    dataPath: "whatsapp-bot-data",
    store,
    backupSyncIntervalMs: 600000,
  }),
});

routes(app, client);
client.initialize();

client.on("qr", (qr) => qrcode.generate(qr, { small: true }));
client.on("loading_screen", (percent, message) => log(`Loading: ${percent}% - ${message}`));
client.on("ready", () => startServer());

client.on("message", async (message) => {
  const { body, from } = message;

  if (body === "!ping") return handlePing(message, from);
  if (body === "!logs") return handleLogs(message, from);
  if (body.startsWith("!deleteMessage,")) return handleDeleteMessage(message, body);
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
