#!/usr/bin/env node

/**
 * Cleanup script for the MCP Browser Server project
 * Removes generated files and resets the project to a clean state
 */

import { rm } from 'fs/promises';
import { existsSync } from 'fs';

async function cleanup() {
  console.log('🧹 Cleaning up MCP Browser Server project...');

  const itemsToClean = [
    { path: 'build', description: 'Compiled JavaScript files' },
    { path: 'screenshots', description: 'Generated screenshots' },
  ];

  for (const item of itemsToClean) {
    if (existsSync(item.path)) {
      try {
        await rm(item.path, { recursive: true, force: true });
        console.log(`✅ Cleaned: ${item.description} (${item.path})`);
      } catch (error) {
        console.log(`⚠️  Could not clean ${item.path}: ${error.message}`);
      }
    } else {
      console.log(`ℹ️  Already clean: ${item.description} (${item.path})`);
    }
  }

  console.log('🎉 Cleanup completed!');
  console.log('💡 Run "npm run build" to rebuild the project');
}

cleanup().catch(console.error);
