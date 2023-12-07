const { MessageMedia } = require("whatsapp-web.js");
const path = require("path");
const readExcelData = require("./readExcel");
const groups = require("./groups");

function logWithDate(message) {
	let date = new Date().toISOString();
	console.log(`[${date}] ${message}`);
}

async function sendReports(client) {
	const imagePath = "D:/EOD/RPA/RPA-EOD-CERIA/Images/img1.png";
	const caption =
		"9. Information about autodebet job status (failed, success, and partial success)";

	const reportData = readExcelData();
	for (const group of groups) {
		await sendReportToWhatsApp(client, group.id, reportData.report1);
		await sendReportToWhatsApp(client, group.id, reportData.report2);
		await sendImageWithCaption(client, group.id, imagePath, caption);

		logWithDate(`Data berhasil dikirim ke grup ${group.name}`);
	}
}

async function sendReportToWhatsApp(client, groupId, reportData) {
	try {
		const message = `${reportData}`;
		await client.sendMessage(groupId, message);
	} catch (error) {
		console.error("Gagal mengirim data ke WhatsApp:", error);
	}
}

async function sendImageWithCaption(client, groupId, imagePath, caption) {
	try {
		const media = MessageMedia.fromFilePath(path.resolve(imagePath));
		await client.sendMessage(groupId, media, { caption: caption });
	} catch (error) {
		console.error(
			"Gagal mengirim gambar dengan caption ke WhatsApp:",
			error
		);
	}
}

module.exports = sendReports;
