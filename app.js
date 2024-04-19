require("dotenv").config();
const qrcode = require("qrcode-terminal");
const { Client, RemoteAuth } = require("whatsapp-web.js");
const { AwsS3Store } = require("wwebjs-aws-s3");
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { logWithDate } = require("./utils/logger");
const fs = require("fs");
const express = require("express");
const routes = require("./routes");

const app = express();

app.use(express.json());
app.use(express.text());

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
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
    deleteObjectCommand
});

const client = new Client({
    authStrategy: new RemoteAuth({
        clientId: "whatsapp-bot",
        dataPath: "whatsapp-bot-data",
        store: store,
        backupSyncIntervalMs: 600000
    }),
	webVersionCache: {
		type: 'remote',
		remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51-beta.html',
    }
});

routes(app, client);

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("message", (message) => {
    if (message.body === "!ping") {
        message.reply("pong");
        logWithDate(` ${message.from}: pinged!`);
    } else if (message.body === "!status") {
        fs.readFile("logs/status.log", "utf8", (err, data) => {
            if (err) {
                return;
            }
            let lines = data.trim().split("\n");
            let recentLines = lines.slice(-5).join("\n");
            message.reply(recentLines);
            logWithDate(` ${message.from}: status!`);
        });
    }
});

client.on("ready", () => {
    logWithDate("WhatsApp API siap digunakan!");

    app.listen(process.env.PORT)
    logWithDate(`Server berjalan di port ${process.env.PORT}`);
});

client.initialize();