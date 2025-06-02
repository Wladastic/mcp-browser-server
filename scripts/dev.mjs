#!/usr/bin/env node

/**
 * Development helper script for MCP Browser Server
 * Provides quick commands for common development tasks
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

const commands = {
  setup: {
    description: 'Install dependencies and set up the project',
    action: async () => {
      console.log('🔧 Setting up MCP Browser Server...');
      await runCommand('npm', ['install']);
      await runCommand('npx', ['playwright', 'install']);
      await runCommand('npm', ['run', 'build']);
      console.log('✅ Setup complete! Run "npm run test" to verify.');
    }
  },
  
  dev: {
    description: 'Start development mode with auto-rebuild',
    action: async () => {
      console.log('🚀 Starting development mode...');
      await runCommand('npm', ['run', 'dev']);
    }
  },
  
  test: {
    description: 'Run all tests',
    action: async () => {
      console.log('🧪 Running all tests...');
      await runCommand('npm', ['run', 'test:all']);
    }
  },
  
  demo: {
    description: 'Run the browser automation demo',
    action: async () => {
      console.log('🎬 Running browser demo...');
      await runCommand('npm', ['run', 'test:demo']);
    }
  },
  
  clean: {
    description: 'Clean build artifacts and screenshots',
    action: async () => {
      console.log('🧹 Cleaning project...');
      await runCommand('npm', ['run', 'clean']);
    }
  },
  
  status: {
    description: 'Check system status and requirements',
    action: async () => {
      console.log('📊 Checking system status...');
      await runCommand('npm', ['run', 'test:status']);
    }
  }
};

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

function showHelp() {
  console.log('🤖 MCP Browser Server - Development Helper');
  console.log('');
  console.log('Usage: node scripts/dev.mjs <command>');
  console.log('');
  console.log('Available commands:');
  
  for (const [name, cmd] of Object.entries(commands)) {
    console.log(`  ${name.padEnd(10)} - ${cmd.description}`);
  }
  
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/dev.mjs setup   # First-time setup');
  console.log('  node scripts/dev.mjs test    # Run all tests');
  console.log('  node scripts/dev.mjs demo    # Browser demo');
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help' || command === '--help') {
    showHelp();
    return;
  }
  
  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }
  
  try {
    await commands[command].action();
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
