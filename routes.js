const verifyKey = require("./utils/auth");
const txtContent = require("./scripts/txtContent");
const jsonContent = require("./scripts/jsonContent");
const getChatName = require("./scripts/getChatName");
const getGroupID = require("./scripts/getGroupId");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

module.exports = function (app, client) {

	// Route untuk mengirim pesan teks ke id yang diberikan
    app.post("/send-plaintext", verifyKey, async (req, res) => {
        const message = req.body;
        const ids = req.header("ids") ? req.header("ids").split(',') : [];

		if (Object.keys(message).length === 0 || !ids || ids.length === 0) {
			return res.status(400).send('Bad Request: Message and IDs are required!');
		}

        try {
            await txtContent(client, message, ids);
            const names = await getChatName(client, ids);
            res.send(`Pesan berhasil dikirim ke ${names.join(', ')}!`);
        } catch (error) {
			res.status(500).send(`Failed to send message: ${error}`);
		}
    });

	// Route untuk mengirim pesan berupa file ke id yang diberikan
    app.post("/send-file", verifyKey, upload.single('attachment'), async (req, res) => {
        const caption = req.body.caption;
        const ids = req.header("ids") ? req.header("ids").split(',') : [];
        const attachmentFile = req.file;

        if (!attachmentFile || !ids || ids.length === 0 ) {
			return res.status(400).send('Bad Request: Attachment, and IDs are required!');
		}

        try {
            await jsonContent(client, caption, attachmentFile, ids);
            const names = await getChatName(client, ids);
            res.send(`Pesan berhasil dikirim ke ${names.join(', ')}!`);
        } catch (error) {
            res.status(500).send(`Failed to send message: ${error}`);
        }
    });

	// Route untuk mendapatkan id dari group berdasarkan nama group
	app.get("/get-group-id", verifyKey, async (req, res) => {
		const groupName = req.header('groupName');
		if (!groupName) return res.status(400).send('Bad Request: Group Name is required!');
		
		const groupId = await getGroupID(client, groupName);
		if (!groupId) return res.status(404).send('Group not found!');
		
		res.send(groupId);
	});
};
