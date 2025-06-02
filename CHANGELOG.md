# Changelog

All notable changes to the MCP Browser Server project will be documented in this file.

## [1.1.0] - 2025-06-02

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
