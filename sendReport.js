const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const path = require("path");
const client = new Client({
	authStrategy: new LocalAuth(),
});

const readExcelData = require("./readExcel");

client.on("qr", (qr) => {
	qrcode.generate(qr, { small: true });
});

const groups = [
	{
		id: "6281213564523-1586315736@g.us",
		name: "DDB Operation",
	},
	{
		id: "6281213564523-1594269318@g.us",
		name: "DDB x CDD Ceria Ops",
	},
];

const imagePath = "D:/RPA/RPA-EOD-CERIA/Images/img1.png";
const caption =
	"9. Information about autodebet job status (failed, success, and partial success)";
const delayBeforeExit = 10000; // milisecond

client.on("ready", async () => {
	console.log("Client is ready!");

	const reportData = readExcelData();

	for (const group of groups) {
		await sendReportToWhatsApp(group.id, reportData.report1);

		await sendReportToWhatsApp(group.id, reportData.report2);

		await sendImageWithCaption(group.id, imagePath, caption);

		console.log(`Data berhasil dikirim ke grup ${group.name}!`);
	}

	await delay(delayBeforeExit);
	console.log("Report selesai!");
	process.exit(0);
});

client.initialize();

async function sendReportToWhatsApp(groupId, reportData) {
	try {
		const message = `${reportData}`;
		await client.sendMessage(groupId, message);
	} catch (error) {
		console.error("Gagal mengirim data ke WhatsApp:", error);
	}
}

async function sendImageWithCaption(groupId, imagePath, caption) {
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

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
