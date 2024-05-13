const path = require('path');
const { MessageMedia } = require("whatsapp-web.js");
const { logWithDate } = require("../utils/logger");

async function jsonContent(client, caption, attachmentFiles, ids) {
    const promises = ids.map(async (id) => {
        for (let attachmentFile of attachmentFiles) {
            const ext = path.extname(attachmentFile.originalname).toLowerCase();

            let mimetype = attachmentFile.mimetype;
            if (mimetype === 'application/octet-stream') {
                if (ext === '.jpg' || ext === '.jpeg') {
                    mimetype = 'image/jpeg';
                } else if (ext === '.png') {
                    mimetype = 'image/png';
                }
            }

            const media = new MessageMedia(
                mimetype,
                attachmentFile.buffer.toString("base64"),
                attachmentFile.originalname
            );

            try {
                let chat = await client.getChatById(id);
                let groupName = chat.name;
                let sentMessage = await client.sendMessage(id, media, { caption: caption });
                logWithDate(`Report berhasil dikirim ke ${groupName} dengan ID pesan: ${sentMessage.id._serialized}`);
            } catch (error) {
                logWithDate(`Error sending message: ${error}`);
            }
        }
    });

    return Promise.all(promises);
}

module.exports = jsonContent;