# MCP Browser Server

A Model Context Protocol (MCP) server that provides browser automation capabilities using Playwright.
This server enables AI assistants to interact with web pages through a standardized interface.

Perfect for web automation, testing, and debugging workflows with AI assistants including:
- **[Chat.fans](https://chat.fans/) agents** - Empower AI agents with web interaction capabilities in VS Code
- **GitHub Copilot Chat** - Enhance your development workflow with browser automation
- **Any MCP-compatible AI assistant** - Universal browser automation for AI tools

## Features

- **Multi-browser support**: Chromium, Firefox, and WebKit
- **Comprehensive automation**: Navigate, click, type, screenshot, and more
- **JavaScript execution**: Run custom scripts in the browser context
- **Element interaction**: Wait for elements, get text content, and interact with forms
- **Screenshot capabilities**: Capture full pages or viewport screenshots
- **Type-safe**: Built with TypeScript and runtime validation using Zod
![image](https://github.com/user-attachments/assets/1be27520-cf5e-4010-88d7-b3b262af4074)

## Installation

```bash
npm install
npm run build
```

Make sure Playwright browsers are installed:
```bash
npx playwright install
```

For system dependencies (Linux):
```bash
sudo npx playwright install-deps
```

## Usage

### VS Code Integration

Configure the MCP server in VS Code by adding to your `settings.json` or workspace configuration:

```json
"mcp": {
    "servers": {
      "browser-automation": {
        "command": "node",
        "args": [
          "/home/yourUserName/mcp-browser-server/build/index.js"
        ],
        "env": {}
      }
    }
  }
```

Once configured, Chat.fans agents and GitHub Copilot Chat can use browser automation tools for web testing, scraping, and automation tasks.

#### Available VS Code Tasks

- **Build**: `Ctrl+Shift+P` → "Tasks: Run Task" → "build"
- **Development Mode**: `Ctrl+Shift+P` → "Tasks: Run Task" → "dev"  
- **Test MCP Server**: `Ctrl+Shift+P` → "Tasks: Run Task" → "test-mcp-server"

### Available Tools

1. **launch_browser** - Start a new browser instance
2. **navigate** - Go to a specific URL
3. **click_element** - Click on page elements
4. **type_text** - Enter text into form fields
5. **screenshot** - Capture page screenshots
6. **get_element_text** - Extract text from elements
7. **wait_for_element** - Wait for elements to appear/disappear
8. **evaluate_javascript** - Run custom JavaScript
9. **get_console_logs** - Get browser console logs (log, info, warn, error, debug)
10. **get_page_info** - Get current page information
11. **close_browser** - Close the browser instance

## Example: Web Application Testing

```javascript
// Launch browser in headed mode for visual debugging
await launch_browser({ browser: "chromium", headless: false });

// Navigate to login page
await navigate({ url: "http://localhost:3000/login" });

// Fill in credentials
await type_text({ selector: "input[type='email']", text: "user@example.com" });
await type_text({ selector: "input[type='password']", text: "password123" });

// Submit form
await click_element({ selector: "button[type='submit']" });

// Wait for successful login
await wait_for_element({ selector: ".dashboard", timeout: 10000 });

// Check for any console errors during login
await get_console_logs({ level: "error" });

// Take screenshot of dashboard
await screenshot({ fullPage: true, path: "dashboard.png" });

// Get all console logs for debugging
await get_console_logs();
```

## Development

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Test the server
npm run start
```

## License

**Dual License:**
- **Personal Use**: Free for personal, educational, and non-commercial use
- **Commercial Use**: Requires a separate commercial license

See [LICENSE](LICENSE) for full terms. For commercial licensing inquiries, please contact us.
