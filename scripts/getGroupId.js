const { logWithDate } = require("../utils/logger");

async function getGroupID(client, groupName) {
    const chats = await client.getChats();
    const targetGroup = chats
        .filter((chat) => chat.isGroup && chat.name === groupName)
        .map((chat) => {
            return {
                id: chat.id._serialized,
                name: chat.name,
            };
        })[0];
    
    if (targetGroup) {
        logWithDate(`ID grup ${groupName}: ${targetGroup.id}`);
        return targetGroup.id;
    } else {
        logWithDate(`ID grup ${groupName} tidak ditemukan`);
        return null;
    }
}

module.exports = getGroupID;
