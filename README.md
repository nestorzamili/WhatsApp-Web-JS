<!-- GitAds-Verify: 9WEWXRM3CHOGNTF3NUQUJ486O4J8DX91 -->

# Simple WhatsApp Bot

Simple WhatsApp bot built with Express.js, featuring clean architecture and comprehensive API endpoints.

## GitAds Sponsored
[![Sponsored by GitAds](https://gitads.dev/v1/ad-serve?source=nestorzamili/whatsapp-web-js@github)](https://gitads.dev/v1/ad-track?source=nestorzamili/whatsapp-web-js@github)

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

## ➕ Adding a New Command

To add a new command, edit the `utils/commands.js` file and add an entry to the `COMMANDS` object.

### Command Structure
```js
command_name: {
  type: 'simple' | 'script' | 'script_with_param',
  enabled: true, // enable or disable the command
  groupOnly: false, // true if only for groups
  allowedGroups: [], // array of allowed group IDs (or empty for all)
  pattern: '!commandname', // message prefix recognized as a command
  exact: true/false, // true: must match exactly, false: can have parameters after pattern
  reply: 'Reply text', // only for type: 'simple'
  script: 'script command', // only for type: 'script' or 'script_with_param'
  cwd: './scripts', // working directory for script (optional)
  successMessage: 'Message if success',
  errorMessage: 'Message if error',
  noDataMessage: 'Message if no data',
},
```

### Example: Simple Command
```js
hello: {
  type: 'simple',
  enabled: true,
  groupOnly: false,
  allowedGroups: [],
  pattern: '!hello',
  exact: true,
  reply: 'Hello there!',
},
```

### Example: Script Command with Parameter
```js
search: {
  type: 'script_with_param',
  script: 'node search_data.js',
  cwd: './scripts',
  enabled: true,
  groupOnly: true,
  allowedGroups: ['example_group_id@g.us'],
  pattern: '!search:', // message must start with !search:
  exact: false,
  successMessage: 'Search results sent to',
  errorMessage: 'Error executing search.',
  noDataMessage: 'No search results found.',
},
```

> **Tips:**
> - For commands with parameters, use `exact: false` and set the pattern as needed (`!command` or `!command:`)

## 🌐 API Documentation

All endpoints require the `x-api-key` header for authentication.

### Response Format

All API responses follow a consistent JSON format:

**Success Response:**
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

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
