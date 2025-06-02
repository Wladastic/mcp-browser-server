#!/usr/bin/env node

import { spawn } from 'child_process';

class SimpleMCPTest {
  constructor() {
    this.requestId = 1;
  }

  async testMCPServer() {
    console.log('🚀 Testing MCP Server Communication...');
    
    // Start the MCP server process
    const mcpProcess = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    mcpProcess.stderr.on('data', (data) => {
      console.log('📊 Server:', data.toString().trim());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test basic communication
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/list',
      params: {}
    };

    console.log('📤 Sending tools/list request...');
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');

    // Listen for response
    let responseReceived = false;
    mcpProcess.stdout.on('data', (data) => {
      const responseText = data.toString();
      console.log('📥 Raw response:', responseText);
      
      try {
        const response = JSON.parse(responseText);
        if (response.result && response.result.tools) {
          console.log(`✅ Found ${response.result.tools.length} tools:`);
          response.result.tools.forEach(tool => {
            console.log(`  - ${tool.name}: ${tool.description}`);
          });
          responseReceived = true;
        }
      } catch (e) {
        console.log('⚠️  Could not parse response as JSON');
      }
    });

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (!responseReceived) {
      console.log('❌ No valid response received');
    }

    // Clean up
    mcpProcess.kill();
    console.log('🛑 Test completed');
  }
}

// Run the test
const test = new SimpleMCPTest();
test.testMCPServer().catch(console.error);
