const XLSX = require("xlsx");

function readExcelData() {
	const workbook = XLSX.readFile("D:/RPA/RPA-EOD-CERIA/Report.xlsx");
	const sheet = workbook.Sheets[workbook.SheetNames[0]];
	const rangeReport1 = { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } };
	const rangeReport2 = { s: { r: 0, c: 13 }, e: { r: 66, c: 13 } };

	const rawDataReport1 = XLSX.utils.sheet_to_json(sheet, {
		range: rangeReport1,
	});
	const rawDataReport2 = XLSX.utils.sheet_to_json(sheet, {
		range: rangeReport2,
	});

	const targetColumnNameReport1 = "Report1";
	const targetColumnNameReport2 = "Report2";

	const formattedData = {};

	// Process Report1
	rawDataReport1.forEach((row) => {
		if (targetColumnNameReport1 in row) {
			const key = targetColumnNameReport1
				.replace(/\s+/g, "_")
				.toLowerCase();
			formattedData[key] = formattedData[key] || [];
			formattedData[key].push(row[targetColumnNameReport1]);
		}
	});

	// Process Report2
	rawDataReport2.forEach((row) => {
		if (targetColumnNameReport2 in row) {
			const key = targetColumnNameReport2
				.replace(/\s+/g, "_")
				.toLowerCase();
			formattedData[key] = formattedData[key] || [];
			formattedData[key].push(row[targetColumnNameReport2]);
		}
	});

	const result = {};
	Object.keys(formattedData).forEach((key) => {
		result[key] = formattedData[key].join("\n");
	});

	return result;
}

module.exports = readExcelData;
