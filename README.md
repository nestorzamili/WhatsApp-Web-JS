<!-- GitAds-Verify: 9WEWXRM3CHOGNTF3NUQUJ486O4J8DX91 -->

# Simple WhatsApp Bot

Simple WhatsApp bot built with Express.js, featuring clean architecture and comprehensive API endpoints.

## 📑 Navigation
- [🚀 Installation](#-installation)
- [🔐 Authentication](#-authentication)
- [➕ Adding a New Command](#-adding-a-new-command)
  - [Command Types & Pattern Matching](#command-types--pattern-matching)
  - [Auto-Reload Feature](#auto-reload-feature)
- [🌐 API Documentation](#-api-documentation)
  - [Health Check](#health-check)
  - [Send Message](#send-message)
  - [Get Group ID](#get-group-id)
- [🔧 API Parameters](#-api-parameters)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

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

To add a new command, edit the `utils/command-list.json` file. The system uses **automatic file watching**, so changes are applied immediately without restarting the bot.

### Command Types

#### 1. Simple Commands
Reply with a fixed message.
```json
{
  "ping": {
    "type": "simple",
    "enabled": true,
    "groupOnly": false,
    "allowedGroups": [],
    "pattern": "!test",
    "reply": "ok"
  }
}
```

#### 2. Script Commands
Execute a script with optional parameters.
```json
{
  "getSchedule": {
    "type": "script",
    "script": "python3 getSchedule.py",
    "cwd": "./script",
    "enabled": true,
    "groupOnly": false,
    "allowedGroups": [],
    "pattern": "!jadwal:"
  }
}
```

#### 3. Command List
Built-in command to show available commands.
```json
{
  "commandList": {
    "type": "command_list",
    "enabled": true,
    "groupOnly": false,
    "allowedGroups": [],
    "pattern": "!command-list"
  }
}
```

### Pattern Matching

- **Exact match**: `"!test"` matches only `"!test"`
- **Prefix match**: `"!jadwal:"` matches `"!jadwal:parameter"`
- Scripts handle their own parameter validation

### Configuration Properties

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `type` | string | `simple`, `script`, or `command_list` | ✅ |
| `enabled` | boolean | Enable/disable command | ✅ |
| `groupOnly` | boolean | Restrict to group chats only | ✅ |
| `allowedGroups` | array | Array of allowed group IDs (empty = all groups) | ✅ |
| `pattern` | string | Command pattern to match | ✅ |
| `reply` | string | Reply message (for simple commands) | ❌ |
| `script` | string | Script command to execute | ❌ |
| `cwd` | string | Working directory for script execution | ❌ |

### Group Control & Security

Commands can be configured to work only in groups and restricted to specific groups:

#### Configuration Examples:

**Public Command (Works Everywhere):**
```json
{
  "ping": {
    "type": "simple",
    "enabled": true,
    "groupOnly": false,          // ← Works in private chats too
    "allowedGroups": [],         // ← No restrictions
    "pattern": "!ping",
    "reply": "pong!"
  }
}
```

**Group-Only Command:**
```json
{
  "admin": {
    "type": "script",
    "enabled": true,
    "groupOnly": true,           // ← Groups only
    "allowedGroups": [],         // ← All groups allowed
    "pattern": "!admin",
    "script": "python admin.py",
    "cwd": "./scripts"
  }
}
```

**Restricted Command:**
```json
{
  "secret": {
    "type": "simple",
    "enabled": true,
    "groupOnly": true,           // ← Groups only
    "allowedGroups": [           // ← Only these specific groups
      "120363185522082107@g.us",
      "120363185522082108@g.us"
    ],
    "pattern": "!secret",
    "reply": "This is a secret command!"
  }
}
```

> **💡 Tip**: Use the [Get Group ID](#get-group-id) endpoint to find group IDs for `allowedGroups` configuration.

### Auto-Reload Feature

The system automatically detects changes to `command-list.json` and reloads the configuration:
- **Detection time**: ~100ms after file save
- **No restart required**: Changes apply immediately
- **Logging**: All reload events are logged with timestamps

### Available Commands

Users can type `!command-list` to see all available commands in their chat.

**Example output:**
```
Available commands:
• !test
• !jadwal: <parameter>
• !command-list
```

> **💡 Tip**: Use the [Get Group ID](#get-group-id) endpoint to find group IDs for `allowedGroups` configuration.

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
    "id": ["6281234567890@c.us", "6281234567891@c.us", "1234567890123343445@g.us"],
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

**Example Request:**
```bash
curl -X GET "http://localhost:3000/get-group-id?groupName=My%20Family%20Group" \
  -H "x-api-key: your_api_key"
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Group found successfully", 
  "data": {
    "groupName": "My Family Group",
    "groupId": "120363185522082107@g.us"
  }
}
```

**Error Response (Group Not Found):**
```json
{
  "status": "error",
  "message": "Group not found",
  "error": {
    "code": "GROUP_NOT_FOUND",
    "details": "No group found with name: My Family Group"
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

### Key Features
- **Auto-reload commands**: Changes to `command-list.json` are detected automatically
- **Clean architecture**: Separation of concerns with controllers, services, and utilities
- **File watcher optimization**: Event-driven file monitoring with debouncing
- **Flexible API**: Support for both JSON and multipart form data
- **Session persistence**: WhatsApp session data preserved across restarts
- **Group access control**: Commands can be restricted to specific groups or group-only
- **Enhanced logging**: Detailed logs with sender names and IDs for better monitoring
- **Three command types**: Simple replies, script execution, and built-in command list

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
