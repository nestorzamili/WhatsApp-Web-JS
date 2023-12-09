const XLSX = require("xlsx");

function readExcelData() {
	const workbook = XLSX.readFile("D:/RPA/New-User-Ceria/Report.xlsx");
	const sheet = workbook.Sheets[workbook.SheetNames[0]];
	const rangeReport = { s: { r: 12, c: 0 }, e: { r: 16, c: 0 } };

	const rawDataReport = XLSX.utils.sheet_to_json(sheet, {
		range: rangeReport,
	});

	const targetColumnNameReport = "Final Report";

	const formattedData = {};

	// Process Report
	rawDataReport.forEach((row) => {
		if (targetColumnNameReport in row) {
			const key = targetColumnNameReport
				.replace(/\s+/g, "_")
				.toLowerCase();
			formattedData[key] = formattedData[key] || [];
			formattedData[key].push(row[targetColumnNameReport]);
		}
	});

	const result = {};
	Object.keys(formattedData).forEach((key) => {
		result[key] = formattedData[key].join("\n");
	});

	return result;
}

module.exports = readExcelData;
