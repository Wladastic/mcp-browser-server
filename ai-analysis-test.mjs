#!/usr/bin/env node

/**
 * Test script for AI-powered screenshot analysis functionality
 * This script tests the analyze_screenshot tool with different parameters
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

// Test cases for AI analysis
const testCases = [
  {
    name: "Basic Analysis",
    actions: [
      { tool: "launch_browser", args: { browser: "chromium", headless: true } },
      { tool: "navigate", args: { url: "https://example.com" } },
      { tool: "analyze_screenshot", args: { fullPage: false } },
      { tool: "close_browser", args: {} }
    ]
  },
  {
    name: "Detailed Analysis with Pretext",
    actions: [
      { tool: "launch_browser", args: { browser: "chromium", headless: true } },
      { tool: "navigate", args: { url: "https://httpbin.org/forms/post" } },
      { tool: "analyze_screenshot", args: { 
        detailed: true, 
        pretext: "Identify all form fields and their labels",
        path: "form-analysis.png"
      }},
      { tool: "close_browser", args: {} }
    ]
  }
];

async function runTest(testCase) {
  console.log(`\n🧪 Running test: ${testCase.name}`);
  console.log('=' .repeat(50));

  const mcpProcess = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  return new Promise((resolve, reject) => {
    let currentActionIndex = 0;
    let responseBuffer = '';

    mcpProcess.stdout.on('data', (data) => {
      responseBuffer += data.toString();
      
      // Look for complete JSON responses
      const lines = responseBuffer.split('\n');
      responseBuffer = lines.pop() || ''; // Keep incomplete line
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            console.log(`📤 Response:`, JSON.stringify(response, null, 2));
            
            // Send next action
            if (currentActionIndex < testCase.actions.length) {
              const action = testCase.actions[currentActionIndex];
              currentActionIndex++;
              
              const request = {
                jsonrpc: "2.0",
                id: currentActionIndex,
                method: "tools/call",
                params: {
                  name: action.tool,
                  arguments: action.args
                }
              };
              
              console.log(`📥 Sending:`, JSON.stringify(request, null, 2));
              mcpProcess.stdin.write(JSON.stringify(request) + '\n');
            } else {
              // Test complete
              mcpProcess.kill();
              resolve();
            }
          } catch (e) {
            // Not a JSON response, might be initialization
            console.log(`📄 Output:`, line);
          }
        }
      }
    });

    mcpProcess.on('error', reject);
    mcpProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Process exited with code ${code}`));
      } else {
        resolve();
      }
    });

    // Start with initialization
    const initRequest = {
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: "ai-analysis-test",
          version: "1.0.0"
        }
      }
    };

    console.log(`📥 Initializing:`, JSON.stringify(initRequest, null, 2));
    mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  });
}

async function main() {
  console.log('🔬 AI Analysis Test Suite');
  console.log('Testing AI-powered screenshot analysis functionality');
  console.log('\n⚠️  Prerequisites:');
  console.log('   - Ollama must be running (ollama serve)');
  console.log('   - Gemma3:4b model must be installed (ollama pull gemma3:4b)');

  try {
    for (const testCase of testCases) {
      await runTest(testCase);
      console.log(`✅ Test "${testCase.name}" completed`);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 All AI analysis tests completed!');
    console.log('\n📋 Check the following:');
    console.log('   - Screenshots were taken and analyzed');
    console.log('   - AI descriptions were provided');
    console.log('   - form-analysis.png was created');
    console.log('   - No errors occurred during analysis');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Ensure Ollama is running: ollama serve');
    console.log('   - Install model: ollama pull gemma3:4b');
    console.log('   - Check build: npm run build');
    process.exit(1);
  }
}

main().catch(console.error);
