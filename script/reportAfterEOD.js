const { MessageMedia } = require("whatsapp-web.js");
const readExcelData = require("./readExcel");
const groups = require("./groups");

function logWithDate(message) {
	let date = new Date().toISOString();
	console.log(`[${date}] ${message}`);
}

async function reportAfterEOD(client, caption, imagePath) {
	const reportData = readExcelData();
	const groupName = ["DDB Operation", "DDB x CDD Ceria Ops"];
	const filteredGroup = groups.filter((group) =>
		groupName.includes(group.name)
	);
	for (const group of filteredGroup) {
		await sendReportToWhatsApp(client, group.id, reportData.report1);
		await sendReportToWhatsApp(client, group.id, reportData.report2);
		await sendImageWithCaption(client, group.id, caption, imagePath);

		logWithDate(`Report after EOD berhasil dikirim ke ${group.name}`);
	}
}

async function sendReportToWhatsApp(client, groupId, reportData) {
	try {
		const message = `${reportData}`;
		await client.sendMessage(groupId, message);
	} catch (error) {
		console.error("Gagal mengirim report after EOD ke WhatsApp:", error);
	}
}

async function sendImageWithCaption(client, groupId, caption, imagePath) {
	try {
		const media = MessageMedia.fromFilePath(imagePath);
		await client.sendMessage(groupId, media, { caption: caption });
	} catch (error) {
		console.error("Gagal mengirim report No.9 ke WhatsApp:", error);
	}
}

module.exports = reportAfterEOD;
