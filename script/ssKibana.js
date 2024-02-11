const puppeteer = require("puppeteer");

(async () => {
	const browser = await puppeteer.launch({ headless: "new" });
	const page = await browser.newPage();
	
	await page.goto("https://kibana-ml.ddb.bri.co.id/s/ceria/app/dashboards#/view/86d9bd23-199e-4683-8b5a-991ae6b12aa6?_g=(filters:!(),refreshInterval:(pause:!t,value:60000),time:(from:now-15m,to:now))", {"waitUntil" : "networkidle0"});
	await page.type('.euiFieldText', 'elastic');
    await page.type('.euiFieldPassword', 'heEtw3C3J3kEURk9VGqB');
    await page.click(".css-1km4ln8-euiButtonDisplayContent");
	await page.waitForNavigation();
	await page.setViewport({ width: 1920, height: 1120 });
	await page.waitForSelector('[data-test-subj="dashboardFullScreenMode"]', { timeout: 5000 });
	await page.click('[data-test-subj="dashboardFullScreenMode"]');
	await new Promise(_func=> setTimeout(_func, 60000));
	await page.screenshot({ path: "kibana.png", fullPage: true });
	await browser.close();
})();