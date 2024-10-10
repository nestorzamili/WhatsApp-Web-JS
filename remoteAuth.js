require("dotenv").config();
const qrcode = require("qrcode-terminal");
const { Client, RemoteAuth } = require("whatsapp-web.js");
const { AwsS3Store } = require("wwebjs-aws-s3");
const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { logWithDate } = require("./utils/logger");
const fs = require("fs");
const express = require("express");
const routes = require("./routes");
const getAIResponse = require("./utils/geminiClient");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.text());

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const putObjectCommand = PutObjectCommand;
const headObjectCommand = HeadObjectCommand;
const getObjectCommand = GetObjectCommand;
const deleteObjectCommand = DeleteObjectCommand;

const store = new AwsS3Store({
  bucketName: process.env.AWS_BUCKET_NAME,
  remoteDataPath: process.env.AWS_REMOTE_DATA_PATH,
  s3Client: s3,
  putObjectCommand,
  headObjectCommand,
  getObjectCommand,
  deleteObjectCommand,
});

const client = new Client({
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  },
  authStrategy: new RemoteAuth({
    clientId: "whatsapp-bot",
    dataPath: "whatsapp-bot-data",
    store: store,
    backupSyncIntervalMs: 600000,
  }),
  //   webVersionCache: {
  //     type: "remote",
  //     remotePath:
  //       "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51-beta.html",
  //   },
});

routes(app, client);
client.initialize();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("loading_screen", (percent, message) => {
  logWithDate(`Loading: ${percent}% - ${message}`);
  console.log(`Loading: ${percent}% - ${message}`);
});

client.on("ready", () => {
  logWithDate("WhatsApp API siap digunakan!");
  console.log("WhatsApp API siap digunakan!");

  app.listen(PORT, () => {
    logWithDate(`Server berjalan di port ${PORT}`);
    console.log(`Server berjalan di port ${PORT}`);
  });
});

client.on("message", async (message) => {
  if (message.body === "!ping") {
    message.reply("pong");
    logWithDate(` ${message.from}: pinged!`);
    console.log(`${message.from}: pinged!`);
  } else if (message.body === "!logs") {
    fs.readFile("logs/status.log", "utf8", (err, data) => {
      if (err) {
        return;
      }
      let lines = data.trim().split("\n");
      let recentLines = lines.slice(-10).join("\n");
      message.reply(recentLines);
      logWithDate(` ${message.from}: !logs`);
      console.log(`${message.from}: !logs`);
    });
  } else if (message.body.startsWith("!deleteMessage,")) {
    let messageID = message.body.split(",")[1];
    try {
      let msg = await client.getMessageById(messageID);
      if (msg.fromMe) {
        msg.delete(true);
        message.reply(`Pesan dengan ID ${messageID} telah dihapus!`);
        logWithDate(`Pesan dengan ID ${messageID} telah dihapus!`);
        console.log(`Pesan dengan ID ${messageID} telah dihapus!`);
      }
    } catch (error) {
      logWithDate(`Error getting message: ${error}`);
      console.log(`Error getting message: ${error}`);
    }
  } else if (message.body.startsWith("!AI ")) {
    let question = message.body.slice(4);
    try {
      const response = await getAIResponse(question);
      message.reply(response);
      logWithDate(` ${message.from}: ${question}`);
      console.log(`${message.from}: ${question}`);
    } catch (error) {
      logWithDate(`Error getting AI response: ${error}`);
      console.log(`Error getting AI response: ${error}`);
    }
  }
});
