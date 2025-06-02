#!/usr/bin/env node

/**
 * Quick test for AI analysis functionality
 */

import { spawn } from 'child_process';

class QuickAITest {
  constructor() {
    this.requestId = 1;
  }

  async testAIAnalysis() {
    console.log('🤖 Testing AI Screenshot Analysis...');
    
    const mcpProcess = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    mcpProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message && !message.includes('MCP Browser Server running')) {
        console.log('🔧 Server:', message);
      }
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Test 1: Launch browser
      console.log('\n1️⃣ Launching browser...');
      await this.sendRequest(mcpProcess, 'tools/call', {
        name: 'launch_browser',
        arguments: { browser: 'chromium', headless: true }
      });

      // Test 2: Navigate to a simple page
      console.log('\n2️⃣ Navigating to example.com...');
      await this.sendRequest(mcpProcess, 'tools/call', {
        name: 'navigate',
        arguments: { url: 'https://example.com' }
      });

      // Test 3: AI Analysis
      console.log('\n3️⃣ Performing AI analysis...');
      const response = await this.sendRequest(mcpProcess, 'tools/call', {
        name: 'analyze_screenshot',
        arguments: { 
          fullPage: false,
          pretext: "Describe what you see on this webpage"
        }
      });

      if (response && response.content && response.content[0]) {
        console.log('✅ AI Analysis Result:');
        console.log(response.content[0].text);
      }

      // Test 4: Close browser
      console.log('\n4️⃣ Closing browser...');
      await this.sendRequest(mcpProcess, 'tools/call', {
        name: 'close_browser',
        arguments: {}
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      mcpProcess.kill();
      console.log('\n🛑 Test completed');
    }
  }

  async sendRequest(process, method, params) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method,
        params
      };

      let responseReceived = false;
      const timeout = setTimeout(() => {
        if (!responseReceived) {
          reject(new Error('Request timeout'));
        }
      }, 30000);

      const dataHandler = (data) => {
        const responseText = data.toString();
        try {
          const response = JSON.parse(responseText);
          if (response.id === request.id) {
            responseReceived = true;
            clearTimeout(timeout);
            process.stdout.removeListener('data', dataHandler);
            
            if (response.error) {
              console.error('❌ Error:', response.error.message);
              reject(new Error(response.error.message));
            } else {
              console.log('✅ Success');
              resolve(response.result);
            }
          }
        } catch (e) {
          // Ignore JSON parse errors for partial responses
        }
      };

      process.stdout.on('data', dataHandler);
      process.stdin.write(JSON.stringify(request) + '\n');
    });
  }
}

// Run the test
const test = new QuickAITest();
test.testAIAnalysis().catch(console.error);
