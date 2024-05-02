require("dotenv").config();
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { logWithDate } = require("./utils/logger");
const fs = require("fs");
const express = require("express");
const logWithDate = require("./utils/logger");
const routes = require("./routes");
const { log } = require("util");

const app = express();

app.use(express.json());
app.use(express.text());

const client = new Client({
	authStrategy: new LocalAuth(),
	dataPath: "session",
	webVersionCache: {
		type: "remote",
		remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
	},
});

routes(app, client);

client.initialize();

client.on("qr", (qr) => {
	qrcode.generate(qr, { small: true });
});

client.on("loading_screen", (percent, message) => {
    logWithDate(`Loading: ${percent}% - ${message}`);
});

client.on("ready", () => {
	logWithDate("WhatsApp API siap digunakan!");

	app.listen(process.env.PORT)
	logWithDate(`Server berjalan di port ${process.env.PORT}`);
});

client.on("message", async (message) => {
    if (message.body === "!ping") {
        message.reply("pong");
        logWithDate(` ${message.from}: pinged!`);
    } else if (message.body === "!logs") {
        fs.readFile("logs/status.log", "utf8", (err, data) => {
            if (err) {
                return;
            }
            let lines = data.trim().split("\n");
            let recentLines = lines.slice(-5).join("\n");
            message.reply(recentLines);
            logWithDate(` ${message.from}: status!`);
        });
    } else if (message.body.startsWith("!deleteMessage,")) {
        let messageID = message.body.split(",")[1];
        try {
            let msg = await client.getMessageById(messageID);
            if (msg.fromMe) {
                msg.delete(true);
                logWithDate(`Pesan dengan ID ${messageID} telah dihapus!`);
            }
        } catch (error) {
            logWithDate(`Error getting message: ${error}`);
        }
    } 
});