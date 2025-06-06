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
10. **analyze_screenshot** - AI-powered screenshot analysis using Gemma3 (requires Ollama)
11. **get_page_info** - Get current page information
12. **close_browser** - Close the browser instance
13. **scroll** - Scroll the page in the specified direction (up/down/left/right)
14. **check_scrollability** - Check if the page is scrollable in specific directions

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

// Scroll down to see more content
await scroll({ direction: "down", pixels: 500, behavior: "smooth" });

// Check if page can be scrolled vertically
await check_scrollability({ direction: "vertical" });

// Scroll back to top
await scroll({ direction: "up", pixels: 500 });
```

## Page Scrolling and Navigation

The MCP Browser Server includes comprehensive scrolling tools for navigating long pages and checking scroll capabilities:

### Scroll Tool

The `scroll` tool allows you to scroll the page in any direction with fine-grained control:

```javascript
// Scroll down by default amount (100px)
await scroll();

// Scroll in specific directions with custom distances
await scroll({ direction: "down", pixels: 300, behavior: "smooth" });
await scroll({ direction: "up", pixels: 200, behavior: "auto" });
await scroll({ direction: "left", pixels: 150 });
await scroll({ direction: "right", pixels: 150 });

// Smooth scrolling for better user experience
await scroll({ direction: "down", pixels: 500, behavior: "smooth" });
```

**Parameters:**
- `direction`: `"up"`, `"down"`, `"left"`, `"right"` (default: `"down"`)
- `pixels`: Number of pixels to scroll (default: 100)
- `behavior`: `"auto"` or `"smooth"` (default: `"auto"`)

### Scrollability Check Tool

The `check_scrollability` tool determines whether a page can be scrolled in specific directions:

```javascript
// Check both vertical and horizontal scrollability
await check_scrollability({ direction: "both" });

// Check only vertical scrolling
await check_scrollability({ direction: "vertical" });

// Check only horizontal scrolling  
await check_scrollability({ direction: "horizontal" });
```

**Response includes:**
- Current scroll position
- Maximum scroll distance
- Whether scrolling is possible in each direction
- Detailed position information

## AI-Powered Screenshot Analysis

The `analyze_screenshot` tool provides AI-powered analysis of web pages using local Gemma3 models via Ollama. This feature can describe what's visible on a page, analyze page structure, and look for specific elements based on context.

### Prerequisites

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Install Gemma3 model**:
   ```bash
   ollama pull gemma3:4b
   ```
3. **Start Ollama service**:
   ```bash
   ollama serve
   ```

### Usage Examples

#### Basic Screenshot Analysis
```javascript
// Take and analyze a screenshot with AI
await analyze_screenshot({ 
  fullPage: true,
  model: "gemma3:4b"
});
```

#### Detailed Structural Analysis
```javascript
// Get detailed analysis of page structure
await analyze_screenshot({ 
  detailed: true,
  pretext: "Focus on navigation elements and form fields"
});
```

#### Context-Specific Analysis
```javascript
// Look for specific elements or issues
await analyze_screenshot({ 
  pretext: "Check if there are any error messages or broken layouts",
  path: "error-check.png"
});
```

### Parameters

- **fullPage** (boolean): Capture entire scrollable page vs viewport only
- **path** (string): Optional file path to save the screenshot
- **pretext** (string): Additional context or specific instructions for the AI
- **model** (string): AI model to use (default: "gemma3:4b")
- **detailed** (boolean): Request detailed structural analysis

### Supported Models

- `gemma3:4b` (default, good balance of speed and quality)
- Any other vision-capable model available in your Ollama installation

## Development & Testing

### Quick Setup

```bash
# One-command setup (installs dependencies, browsers, and builds)
npm run setup

# Or step by step:
npm install
npx playwright install
npm run build
```

### Development Commands

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Start the server
npm run start

# Development helper (shows all available commands)
npm run dev-helper help
```

### Testing

The project includes comprehensive tests in the `tests/` directory:

```bash
# Run basic communication test
npm run test

# Run browser automation demo
npm run test:demo

# Run AI analysis test (requires Ollama)
npm run test:ai-simple

# Check system status
npm run test:status

# Run all tests
npm run test:all
```

### Development Helper

Use the development helper for common tasks:

```bash
# Show all available commands
npm run dev-helper help

# Quick setup from scratch
npm run dev-helper setup

# Run comprehensive tests
npm run dev-helper test

# Clean generated files
npm run dev-helper clean
```

For more details about testing, see [tests/README.md](tests/README.md).

### Project Structure

```
mcp-browser-server/
├── src/                 # TypeScript source code
│   └── index.ts        # Main MCP server implementation
├── build/              # Compiled JavaScript output
├── tests/              # Test scripts and documentation
│   ├── README.md       # Testing documentation
│   ├── simple-test.mjs # Basic communication test
│   ├── demo-test.mjs   # Browser automation demo
│   └── *.mjs          # Additional test files
├── screenshots/        # Generated screenshots from tests
├── package.json        # Project configuration
└── README.md          # This file
```

## License

**Dual License:**
- **Personal Use**: Free for personal, educational, and non-commercial use
- **Commercial Use**: Requires a separate commercial license

See [LICENSE](LICENSE) for full terms. For commercial licensing inquiries, please contact us.
