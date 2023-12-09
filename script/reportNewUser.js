const { MessageMedia } = require("whatsapp-web.js");
const readExcelData = require("./readExcelNewUser");
const groups = require("./groups");

function logWithDate(message) {
	let date = new Date().toISOString();
	console.log(`[${date}] ${message}`);
}

async function reportNewUser(client, imagePath) {
	// Find the group ID based on the group name
	const reportData = readExcelData();
	const groupName = ["Tes Node.js 1"];
	const filteredGroup = groups.filter((group) =>
		groupName.includes(group.name)
	);

	// Send a message to each group
	for (const group of filteredGroup) {
		await sendMessage(client, group.id, reportData.final_report, imagePath);
		logWithDate(`Report New User berhasil dikirim ke ${group.name}`);
	}
}

async function sendMessage(client, groupId, reportData, imagePath) {
	try {
		const media = MessageMedia.fromFilePath(imagePath);
		await client.sendMessage(groupId, media, { caption: reportData });
	} catch (error) {
		console.error("Gagal mengirim report New User ke WhatsApp:", error);
	}
}

module.exports = reportNewUser;
