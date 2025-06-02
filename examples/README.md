# Example MCP Configuration

This directory contains example configuration files for integrating the MCP Browser Server with different AI assistants.

## For VS Code (Claude Desktop/Cline)

Copy the `mcp-config.json` configuration and adapt the absolute path:

```json
{
  "mcpServers": {
    "browser-automation": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-browser-server/build/index.js"
      ],
      "env": {
        "OLLAMA_HOST": "http://localhost:11434"
      }
    }
  }
}
```

## Setup Instructions

1. **Update the path**: Replace `/absolute/path/to/mcp-browser-server/` with your actual project path
2. **Ensure Ollama is running**: Start Ollama service if you want to use AI analysis features
3. **Install Playwright browsers**: Run `npx playwright install` in the project directory
4. **Build the project**: Run `npm run build` to compile TypeScript

## Environment Variables

- `OLLAMA_HOST`: URL for Ollama service (default: http://localhost:11434)
- `HEADLESS`: Set to "false" to run browsers in headed mode for debugging

## Testing Your Configuration

Run the included tests to verify everything works:

```bash
npm run test:all
```
