# Changelog

All notable changes to the MCP Browser Server project will be documented in this file.

## [Unreleased]

### Planned
- Additional browser automation tools
- Enhanced AI analysis capabilities
- Performance optimizations

## [1.1.0] - 2025-06-06 🔄

### ✨ **NEW FEATURES**

**Enhanced Scrolling Capabilities**

#### Added
- **`scroll` tool** - Scroll pages in any direction (up/down/left/right)
  - Custom pixel amounts (default: 100)
  - Smooth or auto scrolling behavior
  - Full validation and error handling
- **`check_scrollability` tool** - Detect page scrollability
  - Check vertical, horizontal, or both directions
  - Detailed scroll position information
  - Current position and maximum scroll reporting

#### Enhanced
- **Testing Suite** - Added comprehensive scroll testing
  - `scroll-test.mjs` - Basic scroll functionality test
  - `scroll-test-enhanced.mjs` - Enhanced test with guaranteed scrollable content
  - `test-page.html` - Local HTML test page with scrollable content
- **Documentation** - Updated README.md and tests/README.md with scroll examples
- **Tool Count** - Expanded from 12 to 14 browser automation tools

#### Technical
- **TypeScript** - Full type safety for new scroll tools
- **Zod Validation** - Runtime validation for scroll parameters
- **Package Scripts** - Added `test:scroll` and `test:scroll-enhanced`

## [1.0.0] - 2025-06-02 🎉

### 🚀 **OFFICIAL RELEASE**

**The MCP Browser Server is now officially released as v1.0.0!**

This release includes a complete refactoring and all the features needed for production use.

### Added

- 🎨 **Project Restructuring**: Organized project with clean directory structure
  - Moved all test files to `tests/` directory
  - Moved generated screenshots to `screenshots/` directory  
  - Added example configurations in `examples/` directory
  - Created utility scripts in `scripts/` directory

- 🛠️ **Development Tools**:
  - Development helper script (`scripts/dev.mjs`) for common tasks
  - Cleanup script (`scripts/cleanup.mjs`) for project maintenance
  - Comprehensive test documentation in `tests/README.md`
  - Example MCP configuration files

- 📝 **Enhanced Documentation**:
  - Updated README.md with new project structure
  - Added testing documentation and examples
  - Created setup and configuration guides

- 🧪 **Improved Testing**:
  - New npm scripts for different test scenarios
  - `npm run test:all` - runs comprehensive test suite
  - `npm run test:ai-simple` - quick AI functionality test
  - `npm run setup` - one-command project setup

### Changed
- 📦 **Package Scripts**: Updated all npm scripts to work with new structure
- 🗂️ **File Organization**: All generated files now organized in dedicated directories
- 🧹 **Cleanup**: Improved project cleanup and maintenance workflows

### Fixed
- 🔧 **Path References**: Updated all file paths to work with reorganized structure
- 📋 **Documentation**: Fixed outdated references and improved accuracy

## [1.0.0] - Initial Release

### Added
- ✨ **Core MCP Browser Server**: Full Model Context Protocol implementation
- 🌐 **Multi-Browser Support**: Chromium, Firefox, and WebKit automation
- 🤖 **AI Integration**: Screenshot analysis using Ollama and Gemma3 models
- 🎯 **Comprehensive Tools**: 12 browser automation tools including:
  - Browser launching and navigation
  - Element interaction (click, type, wait)
  - Screenshot capture and analysis
  - JavaScript execution
  - Console log monitoring
- 📱 **Cross-Platform**: Works on Linux, macOS, and Windows
- 🔒 **Type Safety**: Full TypeScript implementation with Zod validation
- 🧪 **Testing Suite**: Comprehensive test coverage for all features
