const reportAfterEOD = require("./script/reportAfterEOD");
const getGroupID = require("./script/getGroupID");
const reportNewUser = require("./script/reportNewUser");

module.exports = function (app, client) {
	app.post("/report-after-eod", async (req, res) => {
		const caption = req.body.caption;
		const imagePath = req.body.imagePath;
		await reportAfterEOD(client, caption, imagePath);
		res.send("Pesan berhasil dikirim ke grup WhatsApp!");
	});

	app.get("/get-group-id", async (req, res) => {
		const groupData = await getGroupID(client);
		res.json(groupData);
	});

	app.post("/report-new-user", async (req, res) => {
		const imagePath = req.body.imagePath;
		await reportNewUser(client, imagePath);
		res.send("Pesan berhasil dikirim ke grup WhatsApp!");
	});
};
