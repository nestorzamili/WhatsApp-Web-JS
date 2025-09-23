import { appendFileSync, existsSync, mkdirSync } from 'node:fs';

export function logWithDate(message) {
  let date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  let logMessage = `- ${date} - ${message}`;

  console.log(logMessage);
  const dir = './logs';
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  appendFileSync(dir + '/status.log', logMessage + '\n');
  return logMessage;
}
