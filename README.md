# WhatsApp Bot with Command System

WhatsApp bot built with Express.js featuring dynamic command system, REST API, and clean architecture.

## GitAds Sponsored
[![Sponsored by GitAds](https://gitads.dev/v1/ad-serve?source=nestorzamili/whatsapp-web-js@github)](https://gitads.dev/v1/ad-track?source=nestorzamili/whatsapp-web-js@github)

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/nestorzamili/whatsapp-web-js.git
   cd whatsapp-web-js
   npm install
   ```

2. **Configure Environment**
   ```env
   PORT=3000
   API_KEY=your_api_key_here
   ```

3. **Start & Authenticate**
   ```bash
   npm start
   # Scan QR code with WhatsApp
   ```

## 🔐 Authentication

Generate API key:
```bash
node -e "console.log('whatsapp_' + require('crypto').randomBytes(32).toString('hex'))"
```

Use `x-api-key` header for all API requests.

## 🤖 Command System

### Command Types

#### 1. Simple Commands
```json
{
  "ping": {
    "type": "simple",
    "enabled": true,
    "access": "both",
    "pattern": "!ping",
    "reply": "Pong!"
  }
}
```

#### 2. Script Commands
```json
{
  "schedule": {
    "type": "script",
    "enabled": true,
    "access": "group",
    "script": "python3 getSchedule.py",
    "cwd": "./samunu",
    "pattern": "!jadwal:",
    "param_placeholder": "<hari>"
  }
}
```

#### 3. Command List
```json
{
  "help": {
    "type": "command_list",
    "enabled": true,
    "access": "both",
    "pattern": "!help"
  }
}
```

### Access Control

| Access | Description | Example |
|--------|-------------|---------|
| `"personal"` | Personal chats only | `"access": "personal"` |
| `"group"` | All groups | `"access": "group"` |
| `"both"` | Personal + groups (default) | `"access": "both"` |

### Group Restrictions
```json
{
  "admin": {
    "type": "simple",
    "enabled": true,
    "access": "group",
    "allowedGroups": ["120363123456789012@g.us"],
    "pattern": "!admin",
    "reply": "Admin command"
  }
}
```

### Command Configuration

| Field | Required | Description |
|-------|----------|-------------|
| `type` | ✅ | `simple`, `script`, `command_list` |
| `enabled` | ✅ | `true` or `false` |
| `pattern` | ✅ | Command trigger pattern |
| `access` | ❌ | `personal`, `group`, `both` (default: `both`) |
| `reply` | ❌ | Response text (simple commands) |
| `script` | ❌ | Script command (script commands) |
| `cwd` | ❌ | Working directory (default: current) |
| `allowedGroups` | ❌ | Array of group IDs for restrictions |
| `param_placeholder` | ❌ | Parameter description for help |

### Auto-Reload
- Changes to `command-list.json` are detected automatically
- No restart required
- ~100ms detection time

## 🌐 API Endpoints

### Health Check
```bash
GET /
curl -H "x-api-key: your_key" http://localhost:3000/
```

### Send Message
```bash
POST /send-message
```

**Text Message (JSON):**
```bash
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": ["6281234567890@c.us"],
    "message": "Hello World!"
  }'
```

**File Upload (Form-Data):**
```bash
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: your_key" \
  -F "id[]=6281234567890@c.us" \
  -F "message=Check this file" \
  -F "files=@/path/to/file.jpg"
```

**Server Files (JSON):**
```bash
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": ["6281234567890@c.us"],
    "message": "File from server",
    "filePaths": ["/path/to/file.pdf"]
  }'
```

### Get Group ID
```bash
GET /get-group-id?groupName=YourGroupName
curl -H "x-api-key: your_key" "http://localhost:3000/get-group-id?groupName=My%20Group"
```

## 📋 API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | array | ✅ | WhatsApp IDs (personal: `@c.us`, group: `@g.us`) |
| `message` | string | ❌ | Text message |
| `filePaths` | array | ❌ | Server file paths |
| `files` | file(s) | ❌ | Upload files (form-data only) |

*At least one of: `message`, `files`, or `filePaths` required*

## 🔧 Key Features

- **Dynamic Commands**: Add/modify commands without restart
- **Access Control**: Personal, group, or restricted access
- **File Support**: Upload files or use server paths
- **Auto-Reload**: Command changes applied instantly
- **Clean API**: Consistent JSON responses
- **Session Persistence**: WhatsApp session preserved
- **Comprehensive Logging**: Detailed operation logs

## 📄 License

Apache-2.0 License - see `LICENSE` file for details.

---

**Built with ❤️ using modern JavaScript and clean architecture.**