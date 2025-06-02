#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

// Generic test credentials for demonstration
const TEST_EMAIL = 'demo@example.com';
const TEST_PASSWORD = 'demo123';
const TEST_URL = 'http://localhost:3000';

class MCPClient {
  constructor() {
    this.requestId = 1;
    this.mcpProcess = null;
    this.pendingRequests = new Map();
  }

  async start() {
    console.log('🚀 Starting MCP Browser Server...');
    
    this.mcpProcess = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    // Handle server logs
    this.mcpProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message && !message.includes('MCP Browser Server running')) {
        console.log('🔧 Server:', message);
      }
    });

    // Handle responses
    this.mcpProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            const request = this.pendingRequests.get(response.id);
            if (request) {
              this.pendingRequests.delete(response.id);
              if (response.error) {
                request.reject(new Error(response.error.message || 'Unknown error'));
              } else {
                request.resolve(response.result);
              }
            }
          } catch (e) {
            // Ignore malformed JSON
          }
        }
      }
    });

    // Wait for server to start
    await sleep(2000);
    console.log('✅ MCP Browser Server started');
  }

  async sendRequest(method, params = {}) {
    const id = this.requestId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Timeout waiting for response to ${method}`));
        }
      }, 30000);

      // Send request
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async callTool(name, arguments_ = {}) {
    console.log(`🔧 ${name}:`, Object.keys(arguments_).length > 0 ? arguments_ : '(no params)');
    
    const result = await this.sendRequest('tools/call', { 
      name, 
      arguments: arguments_ 
    });
    
    if (result.content && result.content[0] && result.content[0].text) {
      console.log(`✅ ${name}:`, result.content[0].text);
    }
    
    return result;
  }

  async stop() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      console.log('🛑 MCP Browser Server stopped');
    }
  }
}

async function testWebApplication() {
  const client = new MCPClient();
  
  try {
    await client.start();

    console.log('\n🔍 Testing Web Application Automation');
    console.log('====================================');

    // 1. Launch browser (visible for debugging)
    console.log('\n1️⃣ Launching browser...');
    await client.callTool('launch_browser', { 
      browser: 'chromium', 
      headless: false,
      viewport: { width: 1280, height: 720 }
    });

    // 2. Navigate to application
    console.log('\n2️⃣ Navigating to web application...');
    await client.callTool('navigate', { 
      url: TEST_URL 
    });

    // 3. Take initial screenshot
    await client.callTool('screenshot', { 
      path: './homepage.png' 
    });

    // 4. Get page information
    await client.callTool('get_page_info');

    // 5. Demonstrate JavaScript execution
    console.log('\n3️⃣ Executing JavaScript...');
    await client.callTool('evaluate_javascript', {
      script: 'document.title'
    });

    // 6. Try to find and interact with common elements
    console.log('\n4️⃣ Looking for interactive elements...');
    
    try {
      // Look for common button or link patterns
      const commonSelectors = [
        'button',
        'a[href]',
        'input[type="text"]',
        'input[type="email"]',
        '.btn',
        '.button'
      ];
      
      for (const selector of commonSelectors) {
        try {
          await client.callTool('wait_for_element', { 
            selector,
            timeout: 2000 
          });
          console.log(`✅ Found element: ${selector}`);
          
          // Get text if it's a button or link
          if (selector.includes('button') || selector.includes('a[href]')) {
            try {
              await client.callTool('get_element_text', { 
                selector,
                timeout: 1000 
              });
            } catch (e) {
              // Element might not have text
            }
          }
          break;
        } catch (e) {
          // Try next selector
        }
      }
      
    } catch (error) {
      console.log('ℹ️  No common interactive elements found');
    }

    // 7. Demonstrate form interaction if available
    console.log('\n5️⃣ Testing form interaction...');
    try {
      // Look for input fields
      await client.callTool('wait_for_element', { 
        selector: 'input[type="text"], input[type="email"]',
        timeout: 3000 
      });
      
      // Type in the first input field found
      await client.callTool('type_text', { 
        selector: 'input[type="text"], input[type="email"]',
        text: 'Test input from MCP automation' 
      });
      
      console.log('✅ Successfully interacted with form field');
      
    } catch (error) {
      console.log('ℹ️  No form fields found for interaction');
    }

    // 8. Test navigation if links are available
    console.log('\n6️⃣ Testing navigation...');
    try {
      // Look for navigation links
      await client.callTool('wait_for_element', { 
        selector: 'a[href]:not([href="#"])',
        timeout: 3000 
      });
      
      // Get the href attribute using JavaScript
      const linkResult = await client.callTool('evaluate_javascript', {
        script: 'document.querySelector(\'a[href]:not([href="#"])\')?.href || "No link found"'
      });
      
      console.log('✅ Found navigation links on page');
      
    } catch (error) {
      console.log('ℹ️  No navigation links found');
    }

    // 9. Take final screenshot
    console.log('\n7️⃣ Taking final screenshot...');
    await client.callTool('screenshot', { 
      path: './final-state.png',
      fullPage: true 
    });

    // 10. Demonstrate responsive testing
    console.log('\n8️⃣ Testing responsive design...');
    await client.callTool('evaluate_javascript', {
      script: 'window.innerWidth + "x" + window.innerHeight'
    });

    console.log('\n🎉 Web application automation test completed!');
    console.log('📸 Screenshots saved: homepage.png, final-state.png');

    // Keep browser open for observation
    console.log('\n⏱️  Keeping browser open for 10 seconds for observation...');
    await sleep(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Clean up
    try {
      await client.callTool('close_browser');
    } catch (e) {
      // Browser might already be closed
    }
    
    await client.stop();
  }
}

// Run the test
testWebApplication().catch(console.error);
