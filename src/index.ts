#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { z } from 'zod';
import { Ollama } from 'ollama';

// Define our tool schemas using Zod
const LaunchBrowserSchema = z.object({
  browser: z.enum(['chromium', 'firefox', 'webkit']).default('chromium'),
  headless: z.boolean().default(true),
  viewport: z.object({
    width: z.number().default(1280),
    height: z.number().default(1024)
  }).optional()
});

const NavigateSchema = z.object({
  url: z.string().url(),
  waitForLoad: z.boolean().default(true)
});

const ClickElementSchema = z.object({
  selector: z.string(),
  timeout: z.number().default(5000)
});

const TypeTextSchema = z.object({
  selector: z.string(),
  text: z.string(),
  delay: z.number().default(100)
});

const ScreenshotSchema = z.object({
  fullPage: z.boolean().default(false),
  path: z.string().optional()
});

const GetElementTextSchema = z.object({
  selector: z.string(),
  timeout: z.number().default(5000)
});

const WaitForElementSchema = z.object({
  selector: z.string(),
  timeout: z.number().default(30000),
  state: z.enum(['attached', 'detached', 'visible', 'hidden']).default('visible')
});

const EvaluateJavaScriptSchema = z.object({
  script: z.string()
});

const GetConsoleLogsSchema = z.object({
  level: z.enum(['log', 'info', 'warn', 'error', 'debug']).optional(),
  clear: z.boolean().default(false)
});

const AnalyzeScreenshotSchema = z.object({
  fullPage: z.boolean().default(false),
  path: z.string().optional(),
  pretext: z.string().optional(),
  model: z.string().default('gemma3:4b'),
  detailed: z.boolean().default(false)
});

const ScrollSchema = z.object({
  direction: z.enum(['up', 'down', 'left', 'right']).default('down'),
  pixels: z.number().optional(),
  behavior: z.enum(['auto', 'smooth']).default('auto')
});

const CheckScrollabilitySchema = z.object({
  direction: z.enum(['vertical', 'horizontal', 'both']).default('both')
});

// Global browser state
let currentBrowser: Browser | null = null;
let currentContext: BrowserContext | null = null;
let currentPage: Page | null = null;

// Console logs storage
let consoleLogs: Array<{level: string, message: string, timestamp: Date}> = [];

class BrowserAutomationServer {
  private readonly server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-browser-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Handle errors
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  private async cleanup() {
    if (currentPage) {
      await currentPage.close();
    }
    if (currentContext) {
      await currentContext.close();
    }
    if (currentBrowser) {
      await currentBrowser.close();
    }
    process.exit(0);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'launch_browser',
            description: 'Launch a new browser instance (chromium, firefox, or webkit)',
            inputSchema: {
              type: 'object',
              properties: {
                browser: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit'],
                  default: 'chromium',
                  description: 'Browser engine to use'
                },
                headless: {
                  type: 'boolean',
                  default: true,
                  description: 'Run browser in headless mode'
                },
                viewport: {
                  type: 'object',
                  properties: {
                    width: { type: 'number', default: 1280 },
                    height: { type: 'number', default: 720 }
                  }
                }
              }
            }
          },
          {
            name: 'navigate',
            description: 'Navigate to a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to navigate to'
                },
                waitForLoad: {
                  type: 'boolean',
                  default: true,
                  description: 'Wait for page to fully load'
                }
              },
              required: ['url']
            }
          },
          {
            name: 'click_element',
            description: 'Click on an element by CSS selector',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the element to click'
                },
                timeout: {
                  type: 'number',
                  default: 5000,
                  description: 'Timeout in milliseconds'
                }
              },
              required: ['selector']
            }
          },
          {
            name: 'type_text',
            description: 'Type text into an input field',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the input element'
                },
                text: {
                  type: 'string',
                  description: 'Text to type'
                },
                delay: {
                  type: 'number',
                  default: 100,
                  description: 'Delay between keystrokes in milliseconds'
                }
              },
              required: ['selector', 'text']
            }
          },
          {
            name: 'screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                fullPage: {
                  type: 'boolean',
                  default: false,
                  description: 'Capture full scrollable page'
                },
                path: {
                  type: 'string',
                  description: 'Path to save screenshot (optional)'
                }
              }
            }
          },
          {
            name: 'get_element_text',
            description: 'Get text content of an element',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the element'
                },
                timeout: {
                  type: 'number',
                  default: 5000,
                  description: 'Timeout in milliseconds'
                }
              },
              required: ['selector']
            }
          },
          {
            name: 'wait_for_element',
            description: 'Wait for an element to appear or disappear',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the element'
                },
                timeout: {
                  type: 'number',
                  default: 30000,
                  description: 'Timeout in milliseconds'
                },
                state: {
                  type: 'string',
                  enum: ['attached', 'detached', 'visible', 'hidden'],
                  default: 'visible',
                  description: 'State to wait for'
                }
              },
              required: ['selector']
            }
          },
          {
            name: 'evaluate_javascript',
            description: 'Execute JavaScript in the browser context',
            inputSchema: {
              type: 'object',
              properties: {
                script: {
                  type: 'string',
                  description: 'JavaScript code to execute'
                }
              },
              required: ['script']
            }
          },
          {
            name: 'get_console_logs',
            description: 'Get console logs from the browser',
            inputSchema: {
              type: 'object',
              properties: {
                level: {
                  type: 'string',
                  enum: ['log', 'info', 'warn', 'error', 'debug'],
                  description: 'Filter logs by level'
                },
                clear: {
                  type: 'boolean',
                  default: false,
                  description: 'Clear console logs after retrieving'
                }
              }
            }
          },
          {
            name: 'get_page_info',
            description: 'Get information about the current page',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'close_browser',
            description: 'Close the current browser instance',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'analyze_screenshot',
            description: 'Take a screenshot and analyze it with AI (Gemma3) to describe what is visible on the page',
            inputSchema: {
              type: 'object',
              properties: {
                fullPage: {
                  type: 'boolean',
                  default: false,
                  description: 'Capture full scrollable page'
                },
                path: {
                  type: 'string',
                  description: 'Path to save screenshot (optional)'
                },
                pretext: {
                  type: 'string',
                  description: 'Optional context or specific instructions for what to look for in the analysis'
                },
                model: {
                  type: 'string',
                  default: 'gemma3:4b',
                  description: 'AI model to use for analysis (default: gemma3:4b)'
                },
                detailed: {
                  type: 'boolean',
                  default: false,
                  description: 'Provide detailed structural analysis of the page'
                }
              }
            }
          },
          {
            name: 'scroll',
            description: 'Scroll the page in the specified direction',
            inputSchema: {
              type: 'object',
              properties: {
                direction: {
                  type: 'string',
                  enum: ['up', 'down', 'left', 'right'],
                  default: 'down',
                  description: 'Direction to scroll'
                },
                pixels: {
                  type: 'number',
                  description: 'Number of pixels to scroll (optional)'
                },
                behavior: {
                  type: 'string',
                  enum: ['auto', 'smooth'],
                  default: 'auto',
                  description: 'Scrolling behavior'
                }
              }
            }
          },
          {
            name: 'check_scrollability',
            description: 'Check if the page is scrollable in the specified direction',
            inputSchema: {
              type: 'object',
              properties: {
                direction: {
                  type: 'string',
                  enum: ['vertical', 'horizontal', 'both'],
                  default: 'both',
                  description: 'Direction to check for scrollability'
                }
              }
            }
          }
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'launch_browser': {
            const params = LaunchBrowserSchema.parse(args);
            
            // Close existing browser if any
            if (currentBrowser) {
              await currentBrowser.close();
            }

            // Clear console logs
            consoleLogs = [];

            // Launch new browser
            const browserType = params.browser === 'firefox' ? firefox : 
                              params.browser === 'webkit' ? webkit : chromium;
            
            currentBrowser = await browserType.launch({ 
              headless: params.headless 
            });
            
            currentContext = await currentBrowser.newContext({
              viewport: params.viewport ? {
                width: params.viewport.width,
                height: params.viewport.height
              } : undefined
            });
            
            currentPage = await currentContext.newPage();

            // Set up console event listener
            currentPage.on('console', (msg) => {
              consoleLogs.push({
                level: msg.type(),
                message: msg.text(),
                timestamp: new Date()
              });
            });

            return {
              content: [
                {
                  type: 'text',
                  text: `Browser ${params.browser} launched successfully ${params.headless ? '(headless)' : '(headed)'}`
                }
              ]
            };
          }

          case 'navigate': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = NavigateSchema.parse(args);
            
            if (params.waitForLoad) {
              await currentPage.goto(params.url, { waitUntil: 'networkidle' });
            } else {
              await currentPage.goto(params.url);
            }

            const title = await currentPage.title();
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Navigated to ${params.url}\nPage title: ${title}`
                }
              ]
            };
          }

          case 'click_element': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = ClickElementSchema.parse(args);
            await currentPage.click(params.selector, { timeout: params.timeout });

            return {
              content: [
                {
                  type: 'text',
                  text: `Clicked element: ${params.selector}`
                }
              ]
            };
          }

          case 'type_text': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = TypeTextSchema.parse(args);
            await currentPage.fill(params.selector, params.text);

            return {
              content: [
                {
                  type: 'text',
                  text: `Typed "${params.text}" into element: ${params.selector}`
                }
              ]
            };
          }

          case 'screenshot': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = ScreenshotSchema.parse(args);
            const buffer = await currentPage.screenshot({
              fullPage: params.fullPage,
              path: params.path
            });

            const result = params.path 
              ? `Screenshot saved to: ${params.path}`
              : `Screenshot captured (${buffer.length} bytes)`;

            return {
              content: [
                {
                  type: 'text',
                  text: result
                }
              ]
            };
          }

          case 'get_element_text': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = GetElementTextSchema.parse(args);
            const text = await currentPage.textContent(params.selector, { timeout: params.timeout });

            return {
              content: [
                {
                  type: 'text',
                  text: `Element text: ${text || '(empty)'}`
                }
              ]
            };
          }

          case 'wait_for_element': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = WaitForElementSchema.parse(args);
            await currentPage.waitForSelector(params.selector, {
              timeout: params.timeout,
              state: params.state as any
            });

            return {
              content: [
                {
                  type: 'text',
                  text: `Element ${params.selector} is now ${params.state}`
                }
              ]
            };
          }

          case 'evaluate_javascript': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = EvaluateJavaScriptSchema.parse(args);
            const result = await currentPage.evaluate(params.script);

            return {
              content: [
                {
                  type: 'text',
                  text: `JavaScript result: ${JSON.stringify(result, null, 2)}`
                }
              ]
            };
          }

          case 'get_console_logs': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = GetConsoleLogsSchema.parse(args);
            
            // Filter logs by level if specified
            const filteredLogs = params.level 
              ? consoleLogs.filter(log => log.level === params.level)
              : consoleLogs;

            // Clear logs if requested
            if (params.clear) {
              consoleLogs = [];
            }

            const logText = filteredLogs.length > 0 
              ? filteredLogs.map(log => `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`).join('\n')
              : '(no console logs)';

            return {
              content: [
                {
                  type: 'text',
                  text: `Console Logs:\n${logText}`
                }
              ]
            };
          }

          case 'get_page_info': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const title = await currentPage.title();
            const url = currentPage.url();
            const viewport = currentPage.viewportSize();

            return {
              content: [
                {
                  type: 'text',
                  text: `Page Info:
Title: ${title}
URL: ${url}
Viewport: ${viewport?.width}x${viewport?.height}`
                }
              ]
            };
          }

          case 'close_browser': {
            if (currentBrowser) {
              await currentBrowser.close();
              currentBrowser = null;
              currentContext = null;
              currentPage = null;

              return {
                content: [
                  {
                    type: 'text',
                    text: 'Browser closed successfully'
                  }
                ]
              };
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'No browser instance to close'
                  }
                ]
              };
            }
          }

          case 'analyze_screenshot': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = AnalyzeScreenshotSchema.parse(args);
            
            // Take screenshot
            const screenshotPath = params.path || `screenshot-${Date.now()}.png`;
            const screenshotBuffer = await currentPage.screenshot({ 
              fullPage: params.fullPage,
              path: screenshotPath
            });

            try {
              // Initialize Ollama client
              const ollama = new Ollama({ host: 'http://localhost:11434' });

              // Convert screenshot to base64
              const base64Image = screenshotBuffer.toString('base64');

              // Prepare the prompt
              let prompt = 'Analyze this website screenshot and describe exactly what you see. ';
              
              if (params.detailed) {
                prompt += 'Provide a detailed structural analysis including layout, navigation elements, content sections, forms, buttons, and any interactive elements. ';
              } else {
                prompt += 'Focus on the main content and key elements visible on the page. ';
              }

              if (params.pretext) {
                prompt += `Additional context/instructions: ${params.pretext}. `;
              }

              prompt += 'Be specific about colors, text content, images, and the overall design and functionality of the page.';

              // Make AI request
              const response = await ollama.generate({
                model: params.model,
                prompt: prompt,
                images: [base64Image],
                stream: false
              });

              return {
                content: [
                  {
                    type: 'text',
                    text: `AI Analysis of Screenshot (${screenshotPath}):

${response.response}

Screenshot saved to: ${screenshotPath}
Model used: ${params.model}
Analysis type: ${params.detailed ? 'Detailed structural analysis' : 'General description'}`
                  }
                ]
              };

            } catch (aiError) {
              // If AI analysis fails, still return screenshot info
              const fallbackMessage = aiError instanceof Error ? aiError.message : String(aiError);
              
              return {
                content: [
                  {
                    type: 'text',
                    text: `Screenshot taken and saved to: ${screenshotPath}

AI Analysis Error: ${fallbackMessage}

Note: Make sure Ollama is running locally with the ${params.model} model installed.
You can install it with: ollama pull ${params.model}
And start Ollama with: ollama serve`
                  }
                ]
              };
            }
          }

          case 'scroll': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = ScrollSchema.parse(args);
            const { direction, pixels, behavior } = params;

            // Determine scroll distance
            const scrollDistance = pixels !== undefined ? pixels : 100;

            // Scroll the page
            await currentPage.evaluate(({ direction, scrollDistance, behavior }) => {
              let newX = window.scrollX;
              let newY = window.scrollY;
              
              switch (direction) {
                case 'down':
                  newY += scrollDistance;
                  break;
                case 'up':
                  newY -= scrollDistance;
                  break;
                case 'right':
                  newX += scrollDistance;
                  break;
                case 'left':
                  newX -= scrollDistance;
                  break;
              }
              
              window.scrollTo({
                top: newY,
                left: newX,
                behavior: behavior
              });
            }, { direction, scrollDistance, behavior });

            return {
              content: [
                {
                  type: 'text',
                  text: `Scrolled ${direction} by ${scrollDistance} pixels`
                }
              ]
            };
          }

          case 'check_scrollability': {
            if (!currentPage) {
              throw new Error('No browser page available. Launch a browser first.');
            }

            const params = CheckScrollabilitySchema.parse(args);
            const { direction } = params;

            // Check scrollability with proper typing
            const scrollInfo = await currentPage.evaluate((dir) => {
              const documentHeight = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
              );
              
              const documentWidth = Math.max(
                document.body.scrollWidth,
                document.body.offsetWidth,
                document.documentElement.clientWidth,
                document.documentElement.scrollWidth,
                document.documentElement.offsetWidth
              );
              
              const viewportHeight = window.innerHeight;
              const viewportWidth = window.innerWidth;
              
              const verticalScrollable = documentHeight > viewportHeight;
              const horizontalScrollable = documentWidth > viewportWidth;
              
              const currentScrollY = window.scrollY;
              const currentScrollX = window.scrollX;
              const maxScrollY = Math.max(0, documentHeight - viewportHeight);
              const maxScrollX = Math.max(0, documentWidth - viewportWidth);
              
              const verticalInfo = {
                scrollable: verticalScrollable,
                currentPosition: currentScrollY,
                maxScroll: maxScrollY,
                canScrollDown: currentScrollY < maxScrollY,
                canScrollUp: currentScrollY > 0
              };
              
              const horizontalInfo = {
                scrollable: horizontalScrollable,
                currentPosition: currentScrollX,
                maxScroll: maxScrollX,
                canScrollRight: currentScrollX < maxScrollX,
                canScrollLeft: currentScrollX > 0
              };
              
              return {
                direction: dir,
                vertical: verticalInfo,
                horizontal: horizontalInfo,
                anyScrollable: verticalScrollable || horizontalScrollable
              };
            }, direction);

            // Format the response message based on direction
            let message = '';
            
            if (direction === 'both') {
              const v = scrollInfo.vertical;
              const h = scrollInfo.horizontal;
              message = `Page scrollability status:
Vertical: ${v.scrollable ? 'Scrollable' : 'Not scrollable'}${v.scrollable ? ` (${v.currentPosition}/${v.maxScroll})` : ''}
Horizontal: ${h.scrollable ? 'Scrollable' : 'Not scrollable'}${h.scrollable ? ` (${h.currentPosition}/${h.maxScroll})` : ''}
Overall: ${scrollInfo.anyScrollable ? 'Page is scrollable' : 'Page is not scrollable'}`;
            } else if (direction === 'vertical') {
              const v = scrollInfo.vertical;
              message = `Vertical scrolling: ${v.scrollable ? 'Available' : 'Not available'}`;
              if (v.scrollable) {
                message += `\nPosition: ${v.currentPosition}/${v.maxScroll}`;
                message += `\nCan scroll up: ${v.canScrollUp}`;
                message += `\nCan scroll down: ${v.canScrollDown}`;
              }
            } else {
              const h = scrollInfo.horizontal;
              message = `Horizontal scrolling: ${h.scrollable ? 'Available' : 'Not available'}`;
              if (h.scrollable) {
                message += `\nPosition: ${h.currentPosition}/${h.maxScroll}`;
                message += `\nCan scroll left: ${h.canScrollLeft}`;
                message += `\nCan scroll right: ${h.canScrollRight}`;
              }
            }

            return {
              content: [
                {
                  type: 'text',
                  text: message
                }
              ]
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`
            }
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Browser Server running on stdio');
  }
}

// Run the server
const server = new BrowserAutomationServer();
server.run().catch(console.error);
