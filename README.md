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
   PORT=3000
   API_KEY=your_api_key_here
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Scan the QR code with your WhatsApp to authenticate

## 🔐 Authentication

All API endpoints require authentication via the `x-api-key` header.

### Generate API Key
```bash
node -e "console.log('whatsapp_' + require('crypto').randomBytes(32).toString('hex'))"
```

Or use OpenSSL:
```bash
echo "whatsapp_$(openssl rand -hex 32)"
```

## 🌐 API Documentation

All endpoints require the `x-api-key` header for authentication.

### Content Type Support

The API supports two content types for flexible usage:

1. **application/json** - For text messages and file paths only
2. **multipart/form-data** - For file uploads with optional text and file paths

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

**Endpoint:** `POST /send-message`

#### Send Text Message (JSON)
```bash
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": ["6281234567890@c.us"],
    "message": "Hello World!"
  }'
```

#### Send Text Message (Multiple Recipients)
```bash
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": ["6281234567890@c.us", "6281234567891@c.us", "120363185522082107@g.us"],
    "message": "Hello everyone!"
  }'
```

#### Send File from Path (JSON)
```bash
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": ["6281234567890@c.us"],
    "message": "File from server",
    "filePaths": ["/home/user/documents/file.pdf", "/path/to/image.jpg"]
  }'
```

#### Send File Upload with Caption (Form-Data)
```bash
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: your_api_key" \
  -F "id[]=6281234567890@c.us" \
  -F "message=Check this file" \
  -F "files=@/path/to/your/file.jpg"
```

#### Send Mixed Files (Form-Data)
```bash
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: your_api_key" \
  -F "id[]=6281234567890@c.us" \
  -F "id[]=6281234567891@c.us" \
  -F "message=Multiple files example" \
  -F "files=@/local/upload/file1.jpg" \
  -F "filePaths[]=/server/path/file2.pdf" \
  -F "filePaths[]=/server/path/file3.docx"
```

**Response:**
```json
{
  "status": "success",
  "message": "Sent to all recipients",
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0
  }
}
```

**Error Response (Partial Success):**
```json
{
  "status": "success",
  "message": "Sent to 1/2 recipients",
  "data": {
    "total": 2,
    "success": 1,
    "failed": 1,
    "errors": [
      {
        "id": "invalid@c.us",
        "error": "Chat not found"
      }
    ]
  }
}
```

#### Supported File Types (WhatsApp Compatible)
- **Images**: jpg, jpeg, png, gif, webp
- **Videos**: mp4, avi, mov, 3gp
- **Audio**: mp3, wav, ogg, aac, m4a
- **Documents**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt

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

## 🔧 API Parameters

### Send Message Parameters

| Parameter | Type | Required | Description | Content-Type |
|-----------|------|----------|-------------|--------------|
| `id` | array | ✅ | Array of WhatsApp IDs | Both |
| `message` | string | ✅ | Text message content | Both |
| `filePaths` | array | ❌ | Array of server file paths | Both |
| `files` | file(s) | ❌ | Upload file(s) via form-data | multipart only |

*At least one of: `message`, `files`, or `filePaths` is required.

### Content Type Guidelines

- **Use JSON** (`application/json`) for:
  - Text-only messages
  - Server-side file paths
  - API integrations
  - Lightweight requests

- **Use Form-Data** (`multipart/form-data`) for:
  - File uploads from client
  - Mixed file sources (upload + paths)
  - Web form submissions


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
