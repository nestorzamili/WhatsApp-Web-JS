# WhatsApp Bot with Command System

WhatsApp bot built with Express.js featuring dynamic command system, REST API, and clean architecture.

## GitAds Sponsored
[![Sponsored by GitAds](https://gitads.dev/v1/ad-serve?source=nestorzamili/whatsapp-web-js@github)](https://gitads.dev/v1/ad-track?source=nestorzamili/whatsapp-web-js@github)

## Quick Start

```bash
git clone https://github.com/nestorzamili/whatsapp-web-js.git
cd whatsapp-web-js
npm install
npm start
```

Scan QR code with WhatsApp to authenticate.

## Environment

```env
NODE_ENV=development
PORT=3000
API_KEY=your_api_key_here
```

Generate API key:
```bash
node -e "console.log('samunu_' + require('crypto').randomBytes(32).toString('hex'))"
```

## Commands

Configure commands in `command-list.json` (root folder). Changes auto-reload without restart.

```bash
# Copy the example file to create your command configuration
cp command-list.example.json command-list.json
```

> **Note:** `command-list.json` is gitignored. If the file doesn't exist, the command system will be disabled but the REST API will continue to work normally.

### Simple Command
```json
{
  "ping": {
    "type": "simple",
    "enabled": true,
    "pattern": "!ping",
    "description": "Check bot status",
    "reply": "🏓 Pong!"
  }
}
```

### Script Command
```json
{
  "weather": {
    "type": "script",
    "enabled": true,
    "pattern": "!weather:",
    "description": "Get weather info",
    "script": "python weather.py",
    "cwd": "./scripts",
    "param_placeholder": "<city>"
  }
}
```
Usage: `!weather:Jakarta`

### Command List
```json
{
  "help": {
    "type": "command_list",
    "enabled": true,
    "pattern": "!help",
    "description": "Show available commands"
  }
}
```

### Configuration Options

| Field | Required | Description |
|-------|----------|-------------|
| `type` | ✅ | `simple`, `script`, or `command_list` |
| `enabled` | ✅ | Enable/disable command |
| `pattern` | ✅ | Trigger pattern (add `:` suffix for parameters) |
| `description` | | Help text description |
| `reply` | ✅* | Response for simple commands (*required for simple type) |
| `script` | ✅* | Executable command (*required for script type) |
| `cwd` | | Working directory for script (default: current) |
| `access` | | `personal`, `group`, or `both` (default: `both`) |
| `allowedGroups` | | Restrict to specific group IDs |
| `caseSensitive` | | Case sensitivity (default: `true`) |
| `param_placeholder` | | Parameter description for help text |

## API

All requests require `x-api-key` header.

### Send Message
```bash
# Text
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": ["6281234567890@c.us"], "message": "Hello!"}'

# With file
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: YOUR_KEY" \
  -F "id[]=6281234567890@c.us" \
  -F "message=Check this" \
  -F "files=@photo.jpg"
```

### Get Group ID
```bash
curl -H "x-api-key: YOUR_KEY" "http://localhost:3000/get-group-id?groupName=My%20Group"
```

## Security

- Parameter sanitization (prevents command injection)
- Rate limiting (3 commands/minute per user)
- Script timeout (30 seconds)
- API key authentication

## License

Apache-2.0 License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using modern JavaScript and clean architecture.**