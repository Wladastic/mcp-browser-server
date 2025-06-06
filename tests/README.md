# MCP Browser Server Tests

This directory contains various test scripts to validate the functionality of the MCP Browser Server.

## Test Files

### Basic Tests
- **`simple-test.mjs`** - Basic MCP server communication test
  - Tests the JSON-RPC protocol
  - Lists available tools
  - Verifies server startup

### Browser Automation Tests  
- **`demo-test.mjs`** - Comprehensive browser automation demo
  - Tests all major browser automation features
  - Screenshots, navigation, form interaction
  - Responsive design testing

- **`scroll-test.mjs`** - Basic page scrolling functionality test
  - Tests scroll tool with different directions and parameters
  - Tests scrollability detection for vertical/horizontal scrolling
  - Validates smooth and auto scrolling behaviors

- **`scroll-test-enhanced.mjs`** - Comprehensive scroll testing with guaranteed scrollable content
  - Tests with local HTML test page designed for scrolling
  - Tests all four scroll directions (up/down/left/right)
  - Tests with real-world website (Wikipedia)
  - Validates custom pixel amounts and behaviors

### AI Analysis Tests
- **`ai-analysis-test.mjs`** - Full AI analysis testing suite
  - Tests AI-powered screenshot analysis
  - Multiple test scenarios with different parameters
  - Validates Ollama integration

- **`simple-ai-test.mjs`** - Quick AI functionality test
  - Simple test for AI screenshot analysis
  - Good for quick validation

### Utility Tests
- **`status-check.mjs`** - System status and health check
  - Validates dependencies
  - Checks Ollama availability
  - Reports system configuration

## Running Tests

```bash
# Run individual tests
npm run test           # Basic communication test
npm run test:demo      # Browser automation demo
npm run test:scroll    # Basic page scrolling test
npm run test:scroll-enhanced # Enhanced scroll test with guaranteed scrollable content
npm run test:ai-simple # Quick AI test
npm run test:status    # System status check

# Run all tests
npm run test:all
```

## Requirements

- Node.js 18+
- Playwright browsers installed (`npx playwright install`)
- Ollama running with `gemma3:4b` model for AI tests

## Screenshots

Generated screenshots are saved to the `../screenshots/` directory.
