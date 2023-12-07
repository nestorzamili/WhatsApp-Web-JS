const sendReport = require("./script/sendReport");
const getGroupID = require("./script/getGroupID");

module.exports = function (app, client) {
	app.get("/send-report", async (req, res) => {
		await sendReport(client);
		res.send("Data berhasil dikirim ke grup WhatsApp!");
	});

	app.get("/get-group-id", async (req, res) => {
		const groupData = await getGroupID(client);
		res.json(groupData);
	});
};
