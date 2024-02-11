const puppeteer = require("puppeteer");

(async () => {
	const browser = await puppeteer.launch({ headless: "new" });
	const page = await browser.newPage();
	
	await page.goto("http://172.18.219.98:3000/d/TyVKigg7z/metric_empty?orgId=1&refresh=5m&from=now-1h&to=now&var-job=node-exporter&var-hostname=All&var-node=172.18.102.153_ceria-finacle-och-db-active-1:9100&var-node=172.18.102.71_ceria-finacle-cpp-2:9100&var-node=172.18.102.62_ceria-finacle-cpp-1:9100&var-maxmount=%2Fmnt%2Fbackup&var-env=&var-name=", {"waitUntil" : "networkidle0"});
    await page.type('input[name="user"]', 'grafana');
    await page.type('input[name="password"]', 'ddb2021');
    await page.click(".css-1daj7gy-button");
    await page.waitForNavigation();
	await page.setViewport({ width: 1920, height: 1480 });
    await page.waitForSelector(".flot-overlay")
	await page.screenshot({ path: "D:/Santai/WhatsApp-Web-JS/images/grafana.png", fullPage: true });

	const cpuUsage = await page.evaluate(() => {
        const cpuElement = document.querySelector('.graph-legend-value .current');
        return cpuElement ? cpuElement.textContent.trim() : null;
    });
	console.log("CPU Usage: " + cpuUsage);

	await browser.close();
})();