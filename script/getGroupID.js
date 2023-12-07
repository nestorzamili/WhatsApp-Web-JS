const groups = require("./groups");

function logWithDate(message) {
	let date = new Date().toISOString();
	console.log(`[${date}] ${message}`);
}

async function getGroupID(client) {
	const groupData = [];

	for (const group of groups) {
		const groupName = group.name;
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
			groupData.push({
				id: targetGroup.id,
				name: groupName,
			});
			logWithDate(`ID grup ${groupName}: ${targetGroup.id}`);
		} else {
			groupData.push({
				id: null,
				name: groupName,
			});
			logWithDate(`ID grup ${groupName} tidak ditemukan`);
		}
	}

	return groupData;
}

module.exports = getGroupID;
