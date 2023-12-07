// Send messages to a specific group

const groups = require("./groups");

function logWithDate(message) {
	let date = new Date().toISOString();
	console.log(`[${date}] ${message}`);
}

async function testSendMessage(client) {
	const text = "Halo, ini adalah pesan dari Node.js";
	const groupName = ["Tes Node.js 1"];
	const filteredGroup = groups.filter((group) =>
		groupName.includes(group.name)
	);

	for (const group of filteredGroup) {
		await sendMessage(client, group.id, text);

		logWithDate(`Data berhasil dikirim ke grup ${group.name}`);
	}
}

async function sendMessage(client, groupId, text) {
	try {
		await client.sendMessage(groupId, text);
	} catch (error) {
		console.error("Gagal mengirim data ke WhatsApp:", error);
	}
}

module.exports = testSendMessage;
