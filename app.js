require("dotenv").config();
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { logWithDate } = require("./utils/logger");
const fs = require("fs");
const express = require("express");
const routes = require("./routes");
const { exec } = require("child_process");

const app = express();
const { PORT = 3113 } = process.env;

app.use(express.json({ limit: "50mb" }));
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

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
  authStrategy: new LocalAuth(),
  dataPath: "session",
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
  if (body === "!jadwaldeo") return handleSchedule(message, from);
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

async function handleSchedule(message, from) {
  exec("python3 getSchedule.py", (error, stdout) => {
    if (error) {
      log(`Error getting schedule: ${error}`);
      return;
    }
    message.reply(stdout);
    log(`Sending schedule to ${from}`);
  });
}
