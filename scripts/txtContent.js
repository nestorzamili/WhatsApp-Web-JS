const { logWithDate } = require("../utils/logger");

async function txtContent(client, message, ids) {
    for (const id of ids) {
        try {
            await client.sendMessage(id, message);
            logWithDate(`Report berhasil dikirim ke ${id}`);
        } catch (error) {
            logWithDate(`Error sending message: ${error}`);
        }
    }
}

module.exports = txtContent;