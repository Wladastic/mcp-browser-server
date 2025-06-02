#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { z } from 'zod';

// Define our tool schemas using Zod
const LaunchBrowserSchema = z.object({
  browser: z.enum(['chromium', 'firefox', 'webkit']).default('chromium'),
  headless: z.boolean().default(true),
  viewport: z.object({
    width: z.number().default(1280),
    height: z.number().default(720)
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

// Global browser state
let currentBrowser: Browser | null = null;
let currentContext: BrowserContext | null = null;
let currentPage: Page | null = null;

class BrowserAutomationServer {
  private server: Server;

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
