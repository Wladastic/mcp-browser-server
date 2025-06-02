# MCP Browser Server Development Instructions

This is a Model Context Protocol (MCP) server that provides browser automation capabilities using Playwright. It enables AI assistants to interact with web pages through a standardized interface.

## Project Structure

- `src/index.ts` - Main MCP server implementation with browser automation tools
- `build/` - Compiled JavaScript output
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript compiler configuration

## Development Workflow

1. **Build the project**: Use the "build" task or run `npm run build`
2. **Development mode**: Use the "dev" task or run `npm run dev` to build and run
3. **Test the server**: Use the "test-mcp-server" task to run the built server

## Available Tools

The MCP server provides these browser automation tools:

### Browser Management
- `launch_browser` - Launch a new browser instance (chromium, firefox, webkit)
- `close_browser` - Close the current browser instance
- `get_page_info` - Get information about the current page

### Navigation & Interaction
- `navigate` - Navigate to a URL
- `click_element` - Click on an element by CSS selector
- `type_text` - Type text into an input field
- `wait_for_element` - Wait for an element to appear/disappear

### Information Gathering
- `get_element_text` - Get text content of an element
- `screenshot` - Take a screenshot of the current page
- `evaluate_javascript` - Execute JavaScript in the browser context

## Usage Examples

### Testing Web Applications
```typescript
// Example usage for testing a generic web application:
// 1. launch_browser({ browser: "chromium", headless: false })
// 2. navigate({ url: "https://example.com/login" })
// 3. type_text({ selector: "input[name='username']", text: "testuser" })
// 4. type_text({ selector: "input[name='password']", text: "password" })
// 5. click_element({ selector: "button[type='submit']" })
// 6. wait_for_element({ selector: ".dashboard", timeout: 10000 })
```

## Browser Setup

The server supports three browser engines:
- **Chromium** (default) - Most compatible with modern web standards
- **Firefox** - Good for testing cross-browser compatibility
- **WebKit** - Safari engine for testing on Apple platforms

Browsers can run in headless mode (default) or headed mode for visual debugging.

## Integration with VS Code

This server is designed to be used as an MCP server with VS Code. Configure it in your VS Code settings or MCP configuration file to enable browser automation capabilities directly from your coding environment.

## Error Handling

The server includes comprehensive error handling for:
- Browser launch failures
- Element not found errors
- Navigation timeouts
- JavaScript execution errors

All errors are returned as structured responses with clear error messages.

## Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `playwright` - Browser automation library
- `zod` - Runtime type validation
- `typescript` - Type-safe development
