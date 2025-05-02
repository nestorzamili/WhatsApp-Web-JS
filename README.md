# Simple WhatsApp Bot

This is a WhatsApp bot built with Express.js that connects through the WhatsApp Web browser app and uses the [WhatsApp Web JS](https://wwebjs.dev/) client library for the WhatsApp Web API.

## Features

- Send text messages to multiple individuals or groups simultaneously via API
- Send file messages with or without captions to multiple individuals or groups via API
- Send images as base64 to multiple individuals or groups via API
- Check WhatsApp Group IDs
- Test response with `!ping` command
- Check logs with `!logs` command
- Delete messages by message ID with `!deleteMessage,yourmessageid` command (You can check messageId in the logs)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nestorzamili/whatsapp-web.js.git
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   API_KEY=your_api_key_here
   
   # Only required for remote authentication (AWS S3)
   AWS_REGION=your_aws_region
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_BUCKET_NAME=your_s3_bucket_name
   AWS_REMOTE_DATA_PATH=your_remote_path
   ```

4. Start the bot:
   ```bash
   npm start
   ```

The bot will display a QR code in the terminal. Scan this QR code with your phone to log in to WhatsApp Web and start using the bot.

## Authentication Options

The bot offers two authentication strategies:

- **Local Authentication**: Uses `app.js` to store WhatsApp session data locally
- **Remote Authentication**: Uses `remoteAuth.js` to store session data in AWS S3

To use Remote Authentication with AWS S3, make sure you have properly configured the AWS environment variables in your `.env` file.

## API Key Generation

Generate your API key using Node.js in your terminal:

```bash
echo "samunu_$(openssl rand -hex 32)"
```

Copy the generated key to the `API_KEY` variable in your `.env` file.

## API Usage

All API endpoints require authentication via the `x-api-key` header.

### Get Group ID

```
GET http://localhost:3000/get-group-id
```

| Header | Type | Description |
| :--- | :--- | :--- |
| `x-api-key` | `string` | **Required**. Your API key |

Request Body:
```json
{
  "groupName": "Name of the group."
}
```

### Send Text Message

```
POST http://localhost:3000/send-plaintext
```

| Header | Type | Description |
| :--- | :--- | :--- |
| `x-api-key` | `string` | **Required**. Your API key |
| `Content-Type` | `application/json` | **Required**. |

Request Body:
```json
{
  "message": "Your message here",
  "id": "123456789@g.us,987654321@c.us"
}
```

The `id` parameter can contain multiple IDs separated by commas without spaces.

### Send File

```
POST http://localhost:3000/send-file
```

| Header | Type | Description |
| :--- | :--- | :--- |
| `x-api-key` | `string` | **Required**. Your API key |

Form Data:
- `id` (string): **Required**. Recipient ID(s), separate multiple with comma
- `caption` (string): Optional caption text
- `attachment` (file): **Required**. File to send

### Send Base64 Image

```
POST http://localhost:3000/send-base64-image
```

| Header | Type | Description |
| :--- | :--- | :--- |
| `x-api-key` | `string` | **Required**. Your API key |
| `Content-Type` | `application/json` | **Required**. |

Request Body:
```json
{
  "id": "123456789@g.us",
  "caption": "Optional image caption",
  "images": [
    {
      "mimetype": "image/jpeg",
      "data": "base64encodedstring...",
      "filename": "image1.jpg"
    },
    {
      "mimetype": "image/png",
      "data": "base64encodedstring...",
      "filename": "image2.png"
    }
  ]
}
```

## WhatsApp Commands

The bot responds to the following commands in WhatsApp chats:

- `!ping`: Tests if the bot is active; it will respond with "pong"
- `!logs`: Shows the last 10 lines from the log file
- `!deleteMessage,messageID`: Deletes a message with the specified ID (only works for messages sent by the bot)

## Documentation

For more details about the WhatsApp Web JS library, visit:
https://docs.wwebjs.dev/

## Contributing

Contributions are always welcome! Please fork this repository and submit pull requests.

## License

This project is licensed under the Apache-2.0 License. See the `LICENSE` file for more details.
