const { logWithDate } = require("../utils/logger");

async function txtContent(client, message, ids) {
    for (const id of ids) {
        try {
            let chat = await client.getChatById(id);
            let groupName = chat.name
            let sentMessage = await client.sendMessage(id, message);
            logWithDate(`Report berhasil dikirim ke ${groupName} dengan ID pesan: ${sentMessage.id._serialized}`);
        } catch (error) {
            logWithDate(`Error sending message: ${error}`);
        }
    }
}

module.exports = txtContent;