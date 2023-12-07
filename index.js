const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const express = require("express");
const app = express();
const port = 3001;

function logWithDate(message) {
	let date = new Date().toISOString();
	console.log(`[${date}] ${message}`);
}

const client = new Client({
	authStrategy: new LocalAuth(),
});

const routes = require("./routes");
routes(app, client);

client.on("qr", (qr) => {
	qrcode.generate(qr, { small: true });
});

client.on("message", (message) => {
	if (message.body === "!ping") {
		message.reply("pong");
		logWithDate(` ${message.from}: pinged!`);
	} else if (message.body === "!status") {
		fs.readFile("log/status.log", "utf8", (err, data) => {
			if (err) {
				console.log("Error reading file:", err);
				return;
			}
			let lines = data.trim().split("\n");
			let lastTwoLines = lines.slice(-5).join("\n");
			message.reply(lastTwoLines);
			logWithDate(` ${message.from}: status!`);
		});
	}
});

client.on("ready", () => {
	logWithDate("WhatsApp API siap digunakan!");

	app.listen(port, () => {
		logWithDate(`Server berjalan di http://localhost:${port}`);
	});
});

client.initialize();
