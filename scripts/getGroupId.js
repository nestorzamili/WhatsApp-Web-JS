const { logWithDate } = require('../utils/logger');

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
    logWithDate(`Group ID ${groupName}: ${targetGroup.id}`);
    return targetGroup.id;
  } else {
    logWithDate(`Group ID ${groupName} not found`);
    return null;
  }
}

module.exports = getGroupID;
