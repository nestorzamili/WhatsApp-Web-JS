const sendReport = require("./script/sendReport");
const getGroupID = require("./script/getGroupID");
const testSendMessage = require("./script/testSendMessage");

module.exports = function (app, client) {
	app.get("/send-report", async (req, res) => {
		await sendReport(client);
		res.send("Data berhasil dikirim ke grup WhatsApp!");
	});

	app.get("/get-group-id", async (req, res) => {
		const groupData = await getGroupID(client);
		res.json(groupData);
	});

	app.get("/test-send-message", async (req, res) => {
		await testSendMessage(client);
		res.send("Data berhasil dikirim ke grup WhatsApp!");
	});
};
