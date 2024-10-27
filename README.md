
# WhatsApp Bot

This is a WhatsApp bot built with Express.js that connects through the WhatsApp Web browser app and uses the [WhatsApp Web](https://wwebjs.dev/) client library for the WhatsApp Web API.

## Features

- Send text messages to multiple individuals or groups simultaneously via API.
- Send file messages with or without captions to multiple individuals or groups simultaneously via API.
- *Send images as base64*
- Check WhatsApp Group IDs.
- Test response with `!ping`.
- Check logs with `!logs`.
- Delete messages by message id `!deleteMessage,yourmessageid` (You can check messageId in the logs😊)
- ✨ Ask AI with `!AI your question`.✨

## Usage

1. Clone the repository using `git clone https://github.com/nestorzamili/whatsapp-web.js.git`.
2. Run `npm install` to install the dependencies.
3. Run `npm start` to start the bot.

The bot will display a QR code in the terminal. Scan this QR code with your phone to log in to WhatsApp Web and start using the bot.

## API Usage

You can generate your own API Key using Node.js in your terminal by executing the following command:

```bash
echo "samunu_$(openssl rand -hex 32)"
```

#### Get Group ID

```bash
  GET http://localhost:3000/get-group-id
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `x-api-key` | `string` | **Required**. Your API key |
| `groupName` | `string` | **Requierd**. Type only 1 group name |


#### Send Plain Text

```bash
  POST http://localhost:3000/send-plaintext
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `x-api-key` | `string` | **Required**. Your API key |
| `ids` | `string` | **Required**. *Single or Multiples ID, separate with comma without space. Example: 120363185xxxxxx@g.us,120363199xxxxxx@g.us*|
| `Content-Type` | `text/plain` | 
| `body` | `string` | *Example:*`This is a test` |

#### Send File

```bash
  POST http://localhost:3000/send-file
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `x-api-key` | `string` | **Required**. Your API key |
| `ids` | `string` | **Required**. *Single or Multiples ID, separate with comma without space. Example: 120363185xxxxxx@g.us,120363199xxxxxx@g.us*|
| `Content-Type` | `form-data` | or `application/json` |
| `attachment` | `file` | **Required**. *Example:*`D:/test.jpg` |
| `caption` | `string` | *Optional* |

#### Send Base64 Image

```bash
  POST http://localhost:3000/send-base64-image
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `x-api-key` | `string` | **Required**. Your API key |
| `ids` | `string` | **Required**. *Single or Multiples ID, separate with comma without space. Example: 120363185xxxxxx@g.us,120363199xxxxxx@g.us*|
| `Content-Type` | `application/json` |
| `body` | `json` | `see example JSON body`

Example JSON body:
```
{
  "caption": "caption",
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

## Note

Use the `app.js` file if you want to use localAuth, use the `remoteAuth.js` file if you want to use AWS S3 for auth. **Edit your `package.json` file**


## Doc

See more details here 
https://docs.wwebjs.dev/

## Contributing

Contributions are always welcome! Please Fork this repository.

## License

This project is licensed under the Apache-2.0 License. See the `LICENSE` file for more details.
