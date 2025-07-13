# Simple WhatsApp Bot

Simple WhatsApp bot built with Express.js, featuring clean architecture and comprehensive API endpoints.

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nestorzamili/whatsapp-web-js.git
   cd whatsapp-web-js
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   PORT=3113
   API_KEY=your_api_key_here
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Scan the QR code with your WhatsApp to authenticate

## 🔐 API Key Generation

Generate a secure API key:

```bash
echo "samunu_$(openssl rand -hex 32)"
```

## 🌐 API Documentation

All endpoints require the `x-api-key` header for authentication.

### Health Check

**Endpoint:** `GET /`

**Response:**
```json
{
  "status": "success",
  "message": "Server is running healthy",
  "data": {
    "status": "healthy",
    "uptime": "1h 0m 0s"
  }
}
```

**Endpoint:** `POST /send-message`

**Send Text Message (Multiple Recipients):**
```json
{
  "id": [
    "6281234567890@c.us",
    "6281234567891@c.us",
    "120363185522082107@g.us"
  ],
  "message": "Hello World!"
}
```

**Send Files with Caption:**
```bash
# Form data
id: ["6281234567890@c.us"]
caption: "Check this file"
attachment: [file upload]
```

**Send Base64 Images:**
```json
{
  "id": ["6281234567890@c.us"], 
  "caption": "Check these images",
  "images": [
    {
      "mimetype": "image/jpeg",
      "data": "base64string...",
      "filename": "image.jpg"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Message sent to all recipients",
  "data": {
    "total": 1,
    "success": 1,
    "failed": 0
  }
}
```

### Get Group ID

**Endpoint:** `GET /get-group-id?groupName=YourGroupName`

**Response:**
```json
{
  "status": "success",
  "message": "Group found successfully",
  "data": {
    "groupName": "YourGroupName",
    "groupId": "120363185522082107@g.us"
  }
}
```

## 🔧 Adding New Commands

1. Add command configuration in `utils/commands.js`:
```javascript
export const COMMANDS = {
  // ...existing commands...
  
  newcommand: {
    type: 'script',
    script: 'python3 your-script.py',
    cwd: 'samunu',
    successMessage: 'Data sent to',
    errorMessage: 'Error retrieving data',
    noDataMessage: 'No data available'
  }
}
```

2. Command will be automatically handled by the service layer

## 📚 Documentation

- [WhatsApp Web JS Documentation](https://docs.wwebjs.dev/)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the Apache-2.0 License. See the `LICENSE` file for details.

---

**Built with ❤️ using modern JavaScript and clean architecture principles.**
