#!/usr/bin/env node
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatTool(tool, params) {
  return `${colors.cyan}🔧 ${tool}:${colors.reset} ${JSON.stringify(params, null, 2)}`;
}

async function testScrollFunctionality() {
  log('🚀 Starting MCP Browser Server for Scroll Testing...', colors.bright);
  
  const serverProcess = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let messageId = 1;

  function sendMessage(method, params = {}) {
    const message = {
      jsonrpc: '2.0',
      id: messageId++,
      method,
      params
    };
    serverProcess.stdin.write(JSON.stringify(message) + '\n');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);

      const onData = (chunk) => {
        clearTimeout(timeout);
        serverProcess.stdout.removeListener('data', onData);
        try {
          const response = JSON.parse(chunk.toString().trim());
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };

      serverProcess.stdout.on('data', onData);
    });
  }

  try {
    log('✅ MCP Browser Server started', colors.green);

    log('\n🔍 Testing Scroll Functionality', colors.bright);
    log('====================================', colors.bright);

    // 1. Launch browser
    log('\n1️⃣ Launching browser...', colors.blue);
    const launchParams = {
      browser: 'chromium',
      headless: false,
      viewport: { width: 1280, height: 720 }
    };
    log(formatTool('launch_browser', launchParams));
    
    const launchResult = await sendMessage('tools/call', {
      name: 'launch_browser',
      arguments: launchParams
    });
    
    if (launchResult.result?.content?.[0]?.text) {
      log(`✅ launch_browser: ${launchResult.result.content[0].text}`, colors.green);
    }

    // 2. Navigate to a scrollable page
    log('\n2️⃣ Navigating to a scrollable page...', colors.blue);
    const navigateParams = { url: 'https://en.wikipedia.org/wiki/Web_browser' };
    log(formatTool('navigate', navigateParams));
    
    const navigateResult = await sendMessage('tools/call', {
      name: 'navigate',
      arguments: navigateParams
    });
    
    if (navigateResult.result?.content?.[0]?.text) {
      log(`✅ navigate: ${navigateResult.result.content[0].text}`, colors.green);
    }

    // 3. Check initial scrollability
    log('\n3️⃣ Checking initial scrollability...', colors.blue);
    const checkParams = { direction: 'both' };
    log(formatTool('check_scrollability', checkParams));
    
    const checkResult = await sendMessage('tools/call', {
      name: 'check_scrollability',
      arguments: checkParams
    });
    
    if (checkResult.result?.content?.[0]?.text) {
      log(`✅ check_scrollability: ${checkResult.result.content[0].text}`, colors.green);
    }

    // 4. Test scrolling down
    log('\n4️⃣ Testing scroll down...', colors.blue);
    const scrollDownParams = { direction: 'down', pixels: 500, behavior: 'smooth' };
    log(formatTool('scroll', scrollDownParams));
    
    const scrollDownResult = await sendMessage('tools/call', {
      name: 'scroll',
      arguments: scrollDownParams
    });
    
    if (scrollDownResult.result?.content?.[0]?.text) {
      log(`✅ scroll: ${scrollDownResult.result.content[0].text}`, colors.green);
    }

    // 5. Test scrolling up
    log('\n5️⃣ Testing scroll up...', colors.blue);
    const scrollUpParams = { direction: 'up', pixels: 200, behavior: 'auto' };
    log(formatTool('scroll', scrollUpParams));
    
    const scrollUpResult = await sendMessage('tools/call', {
      name: 'scroll',
      arguments: scrollUpParams
    });
    
    if (scrollUpResult.result?.content?.[0]?.text) {
      log(`✅ scroll: ${scrollUpResult.result.content[0].text}`, colors.green);
    }

    // 6. Check scrollability after scrolling
    log('\n6️⃣ Checking scrollability after scrolling...', colors.blue);
    const checkAfterParams = { direction: 'vertical' };
    log(formatTool('check_scrollability', checkAfterParams));
    
    const checkAfterResult = await sendMessage('tools/call', {
      name: 'check_scrollability',
      arguments: checkAfterParams
    });
    
    if (checkAfterResult.result?.content?.[0]?.text) {
      log(`✅ check_scrollability: ${checkAfterResult.result.content[0].text}`, colors.green);
    }

    // 7. Test default scroll (should scroll down)
    log('\n7️⃣ Testing default scroll...', colors.blue);
    const scrollDefaultParams = {}; // Should use defaults: down direction, auto behavior
    log(formatTool('scroll', scrollDefaultParams));
    
    const scrollDefaultResult = await sendMessage('tools/call', {
      name: 'scroll',
      arguments: scrollDefaultParams
    });
    
    if (scrollDefaultResult.result?.content?.[0]?.text) {
      log(`✅ scroll: ${scrollDefaultResult.result.content[0].text}`, colors.green);
    }

    // 8. Close browser
    log('\n8️⃣ Closing browser...', colors.blue);
    log(formatTool('close_browser', {}));
    
    const closeResult = await sendMessage('tools/call', {
      name: 'close_browser',
      arguments: {}
    });
    
    if (closeResult.result?.content?.[0]?.text) {
      log(`✅ close_browser: ${closeResult.result.content[0].text}`, colors.green);
    }

    log('\n🎉 Scroll functionality test completed successfully!', colors.green);

  } catch (error) {
    log(`❌ Error during testing: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    serverProcess.kill();
    log('🛑 MCP Browser Server stopped', colors.yellow);
  }
}

// Run the test
testScrollFunctionality().catch(console.error);
