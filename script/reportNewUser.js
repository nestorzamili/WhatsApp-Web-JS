const { MessageMedia } = require("whatsapp-web.js");
const groups = require("./groups");

function logWithDate(message) {
	let date = new Date().toISOString();
	console.log(`[${date}] ${message}`);
}

async function reportNewUser(client, caption, imagePath) {
	// Find the group ID based on the group name
	const groupName = ["Tes Node.js 1"];
	const filteredGroup = groups.filter((group) =>
		groupName.includes(group.name)
	);

	// Send a message to each group
	for (const group of filteredGroup) {
		await sendMessage(client, group.id, caption, imagePath);
		logWithDate(`Report New User berhasil dikirim ke ${group.name}`);
	}
}

async function sendMessage(client, groupId, caption, imagePath) {
	try {
		// Send the image and caption to the group
		const media = MessageMedia.fromFilePath(imagePath);
		await client.sendMessage(groupId, media, { caption: caption });
	} catch (error) {
		console.error("Gagal mengirim report New User ke WhatsApp:", error);
	}
}

module.exports = reportNewUser;
