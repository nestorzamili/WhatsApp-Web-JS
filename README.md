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

**Important**: All POST requests must use `multipart/form-data` content type.

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

### Send Message

**Endpoint:** `POST /api/send-message`

**Content-Type:** `multipart/form-data`

#### Send Text Message
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: multipart/form-data" \
  -F "id=6281234567890@c.us" \
  -F "message=Hello World!"
```

#### Send Text Message (Multiple Recipients)
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: multipart/form-data" \
  -F "id=6281234567890@c.us,6281234567891@c.us,120363185522082107@g.us" \
  -F "message=Hello everyone!"
```

#### Send File Upload with Caption
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: multipart/form-data" \
  -F "id=6281234567890@c.us" \
  -F "message=Check this file" \
  -F "files=@/path/to/your/file.jpg"
```

#### Send File from Path (Ubuntu/Linux)
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: multipart/form-data" \
  -F "id=6281234567890@c.us" \
  -F "message=File from server" \
  -F "attachment=/home/user/documents/file.pdf"
```

#### Send Multiple Files (Mixed Methods)
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: multipart/form-data" \
  -F "id=6281234567890@c.us,6281234567891@c.us" \
  -F "message=Multiple files example" \
  -F "files=@/local/upload/file1.jpg" \
  -F "attachment=/server/path/file2.pdf,/server/path/file3.docx"
```

**Response:**
```json
{
  "status": "success", 
  "message": "Messages sent successfully",
  "data": {
    "results": [
      {
        "id": "6281234567890@c.us",
        "success": true,
        "messageId": "3EB0123456789ABCDEF"
      },
      {
        "id": "6281234567891@c.us", 
        "success": true,
        "messageId": "3EB0987654321FEDCBA"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  }
}
```

#### Supported File Types (WhatsApp Compatible)
- **Images**: jpg, jpeg, png, gif, webp
- **Videos**: mp4, avi, mov, 3gp
- **Audio**: mp3, wav, ogg, aac, m4a
- **Documents**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt

### Get Group ID

**Endpoint:** `GET /api/get-group-id?groupName=YourGroupName`

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

## 🔧 Development Features

### File Input Methods

The API supports flexible file input methods for different deployment scenarios:

1. **File Upload** (Web/Form scenarios):
   - Use `files` parameter with multipart form-data
   - Suitable for web interfaces and direct uploads

2. **File Path** (Server/Ubuntu scenarios):
   - Use `attachment` parameter with absolute file paths
   - Ideal for server-side automation and scheduled tasks
   - Supports comma-separated multiple file paths


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
