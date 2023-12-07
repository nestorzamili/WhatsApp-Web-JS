# My WhatsApp Bot

This is a WhatsApp bot built with Node.js that connects through the WhatsApp Web browser app. It uses the `whatsapp-web.js` client library for the WhatsApp Web API.

## Features

-   Responds to messages
-   Logs all received messages with timestamps
-   Responds with the last log message when someone sends `!status`

## Usage

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npm start` to start the bot

The bot will display a QR code in the terminal. Scan this QR code with your phone to log in to WhatsApp Web and start using the bot.

## Commands

-   `!ping`: The bot will reply with `pong`.
-   `!status`: The bot will reply with the last log message.

## Logging

The bot logs all received messages with timestamps to `log/status.log`. The log messages include the sender and the body of the message.

## License

This project is licensed under the MIT License.
