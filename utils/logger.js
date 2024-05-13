const fs = require('fs');

function logWithDate(message) {
    let date = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    let logMessage = `- ${date} - ${message}`;
    fs.appendFileSync('logs/status.log', logMessage + '\n');
    return logMessage;
}

module.exports = { logWithDate };