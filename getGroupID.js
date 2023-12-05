const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const client = new Client({
	authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
	qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
	console.log("Client is ready!");
	await findGroup();
	process.exit(0);
});

client.initialize();

async function findGroup() {
	const groupName = "DDB x CDD Ceria Ops";
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
		const groupId = targetGroup.id;
		console.log(`ID Grup: ${groupId}`);
		console.log(`Nama Grup: ${groupName}`);
	} else {
		console.log(`Grup "${groupName}" tidak ditemukan.`);
	}
}
