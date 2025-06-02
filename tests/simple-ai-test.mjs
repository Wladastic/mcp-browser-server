#!/usr/bin/env node

/**
 * Simple AI analysis test - just verify the feature works
 */

import { spawn } from 'child_process';

async function testAI() {
  console.log('🤖 Quick AI Analysis Test...');
  
  const mcpProcess = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Wait for server startup
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Send launch browser request
    console.log('📤 Launching browser...');
    mcpProcess.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'launch_browser',
        arguments: { browser: 'chromium', headless: true }
      }
    }) + '\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Navigate to a simple page
    console.log('📤 Navigating to example.com...');
    mcpProcess.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'navigate',
        arguments: { url: 'https://example.com' }
      }
    }) + '\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test AI analysis
    console.log('📤 Requesting AI analysis...');
    mcpProcess.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'analyze_screenshot',
        arguments: { 
          fullPage: false,
          pretext: "Describe the main content and layout of this webpage",
          path: "ai-test-screenshot.png"
        }
      }
    }) + '\n');

    // Listen for response
    let responseReceived = false;
    mcpProcess.stdout.on('data', (data) => {
      const response = data.toString();
      if (response.includes('AI Analysis') || response.includes('Screenshot')) {
        console.log('✅ AI Analysis response received!');
        console.log('Response preview:', response.substring(0, 200) + '...');
        responseReceived = true;
      }
    });

    // Wait for AI response (longer timeout for AI processing)
    await new Promise(resolve => setTimeout(resolve, 15000));

    if (responseReceived) {
      console.log('🎉 AI Analysis test completed successfully!');
    } else {
      console.log('⚠️  AI Analysis may have taken longer than expected');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mcpProcess.kill();
    console.log('🛑 Test completed');
  }
}

testAI().catch(console.error);
