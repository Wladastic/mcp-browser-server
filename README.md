# MCP Browser Server

A Model Context Protocol (MCP) server that provides browser automation capabilities using Playwright.
This server enables AI assistants to interact with web pages through a standardized interface.

Perfect for web automation, testing, and debugging workflows with AI assistants including:
- **GitHub Copilot Chat** - Enhance your development workflow with browser automation
- **[Chat.fans](https://chat.fans/) agents** - Empower AI agents with web interaction capabilities
- **Any MCP-compatible AI assistant** - Universal browser automation for AI tools

## Features

- **Multi-browser support**: Chromium, Firefox, and WebKit
- **Comprehensive automation**: Navigate, click, type, screenshot, and more
- **JavaScript execution**: Run custom scripts in the browser context
- **Element interaction**: Wait for elements, get text content, and interact with forms
- **Screenshot capabilities**: Capture full pages or viewport screenshots
- **Type-safe**: Built with TypeScript and runtime validation using Zod

## Installation

```bash
npm install
npm run build
```

## Usage

### As an MCP Server

The server is designed to be used with MCP-compatible AI assistants. Configure it in your MCP client:

```json
{
  "mcpServers": {
    "browser-automation": {
      "command": "node",
      "args": ["/path/to/mcp-browser-server/build/index.js"],
      "env": {}
    }
  }
}
```

### Available Tools

1. **launch_browser** - Start a new browser instance
2. **navigate** - Go to a specific URL
3. **click_element** - Click on page elements
4. **type_text** - Enter text into form fields
5. **screenshot** - Capture page screenshots
6. **get_element_text** - Extract text from elements
7. **wait_for_element** - Wait for elements to appear/disappear
8. **evaluate_javascript** - Run custom JavaScript
9. **get_page_info** - Get current page information
10. **close_browser** - Close the browser instance

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

// Take screenshot of dashboard
await screenshot({ fullPage: true, path: "dashboard.png" });
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

## Browser Dependencies

Make sure Playwright browsers are installed:

```bash
npx playwright install
```

For system dependencies (Linux):
```bash
sudo npx playwright install-deps
```

## VS Code Integration

This project includes VS Code configuration files:

- `.vscode/tasks.json` - Build and test tasks
- `.vscode/mcp.json` - MCP server configuration
- `copilot-instructions.md` - Development guidelines

## License

**Dual License:**
- **Personal Use**: Free for personal, educational, and non-commercial use
- **Commercial Use**: Requires a separate commercial license

See [LICENSE](LICENSE) for full terms. For commercial licensing inquiries, please contact us.
