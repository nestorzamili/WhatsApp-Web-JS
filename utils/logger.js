import { appendFileSync } from 'fs';

export function logWithDate(message) {
  let date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  let logMessage = `- ${date} - ${message}`;

  console.log(logMessage);
  appendFileSync('logs/status.log', logMessage + '\n');
  return logMessage;
}
