require("dotenv").config();
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { logWithDate } = require("./utils/logger");
const fs = require("fs");
const express = require("express");
const routes = require("./routes");
const getAIResponse = require("./utils/geminiClient");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.text());

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
  authStrategy: new LocalAuth(),
  dataPath: "session",
  // webVersionCache: {
  // 	type: "remote",
  // 	remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  // },
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
