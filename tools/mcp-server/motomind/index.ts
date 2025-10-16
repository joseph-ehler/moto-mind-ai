#!/usr/bin/env node
/**
 * MotoMind MCP Server
 * 
 * Custom Model Context Protocol server that exposes MotoMind's
 * god-tier tooling as native tools for Cascade.
 * 
 * This makes Cascade naturally aware of and able to use:
 * - windsurf:guide (context generation)
 * - ai-platform:enforce (pattern validation)
 * - ai-platform:guardian (dependency checking)
 * - ai-platform:quality (quality monitoring)
 * - windsurf:graph (codebase mapping)
 * - And more!
 * 
 * Installation:
 * 1. npm install (installs dependencies)
 * 2. Configure in Windsurf settings
 * 3. Cascade can now use these tools natively!
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root (where package.json is)
const PROJECT_ROOT = join(__dirname, '../..');

/**
 * Execute a command in the project root
 */
async function execInProject(command: string): Promise<{ stdout: string; stderr: string }> {
  return execAsync(command, { cwd: PROJECT_ROOT });
}

/**
 * Read a file from the project root
 */
async function readProjectFile(relativePath: string): Promise<string> {
  const fullPath = join(PROJECT_ROOT, relativePath);
  return readFile(fullPath, 'utf-8');
}

/**
 * Check if a file exists in the project root
 */
async function fileExists(relativePath: string): Promise<boolean> {
  const fullPath = join(PROJECT_ROOT, relativePath);
  try {
    await access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * MotoMind MCP Server
 */
class MotoMindServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'motomind-tools',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MotoMind MCP Server Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_context':
            return await this.generateContext(args);
          case 'validate_patterns':
            return await this.validatePatterns(args);
          case 'check_dependencies':
            return await this.checkDependencies(args);
          case 'monitor_quality':
            return await this.monitorQuality(args);
          case 'build_graph':
            return await this.buildGraph(args);
          case 'analyze_complexity':
            return await this.analyzeComplexity(args);
          case 'record_decision':
            return await this.recordDecision(args);
          case 'batch_replace':
            return await this.batchReplace(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Get list of available tools
   */
  private getTools(): Tool[] {
    return [
      {
        name: 'generate_context',
        description: 'Generate Windsurf context for a feature or task. This provides architectural patterns, import rules, and examples from the codebase. ALWAYS run this BEFORE building any feature!',
        inputSchema: {
          type: 'object',
          properties: {
            intent: {
              type: 'string',
              description: 'What you want to build (e.g., "build notifications feature")',
            },
          },
          required: ['intent'],
        },
      },
      {
        name: 'validate_patterns',
        description: 'Validate code against architectural patterns. Checks for violations of the features/*/domain/data/ui structure, barrel files, etc. Run this AFTER making code changes.',
        inputSchema: {
          type: 'object',
          properties: {
            checkAll: {
              type: 'boolean',
              description: 'Check all files (true) or only staged files (false)',
              default: false,
            },
            autoFix: {
              type: 'boolean',
              description: 'Automatically fix violations',
              default: false,
            },
          },
        },
      },
      {
        name: 'check_dependencies',
        description: 'Check for circular dependencies and import rule violations. Run this AFTER adding new imports or creating new files.',
        inputSchema: {
          type: 'object',
          properties: {
            fix: {
              type: 'boolean',
              description: 'Attempt to fix circular dependencies',
              default: false,
            },
          },
        },
      },
      {
        name: 'monitor_quality',
        description: 'Monitor code quality metrics including complexity, maintainability, and technical debt. Run this weekly or after major changes.',
        inputSchema: {
          type: 'object',
          properties: {
            compare: {
              type: 'boolean',
              description: 'Compare with previous snapshot',
              default: false,
            },
          },
        },
      },
      {
        name: 'build_graph',
        description: 'Build a complete codebase knowledge graph showing all files, exports, imports, and dependencies. Run this weekly or before major refactorings.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'analyze_complexity',
        description: 'Analyze complexity of a feature for migration planning. Provides estimated time, dependency count, and complexity score.',
        inputSchema: {
          type: 'object',
          properties: {
            featureName: {
              type: 'string',
              description: 'Name of the feature to analyze',
            },
          },
          required: ['featureName'],
        },
      },
      {
        name: 'record_decision',
        description: 'Record an important architectural or technical decision for future reference.',
        inputSchema: {
          type: 'object',
          properties: {
            what: {
              type: 'string',
              description: 'What decision was made',
            },
            why: {
              type: 'string',
              description: 'Why the decision was made',
            },
            category: {
              type: 'string',
              description: 'Category (architecture, feature, refactor, etc.)',
            },
            priority: {
              type: 'string',
              description: 'Priority level (high, medium, low)',
            },
          },
          required: ['what', 'why', 'category', 'priority'],
        },
      },
      {
        name: 'batch_replace',
        description: 'Perform batch find/replace operations across multiple files safely. Preview changes before executing.',
        inputSchema: {
          type: 'object',
          properties: {
            find: {
              type: 'string',
              description: 'Text to find',
            },
            replace: {
              type: 'string',
              description: 'Text to replace with',
            },
            execute: {
              type: 'boolean',
              description: 'Execute the replacement (false = preview only)',
              default: false,
            },
          },
          required: ['find', 'replace'],
        },
      },
    ];
  }

  /**
   * Tool Implementations
   */

  private async generateContext(args: any) {
    const { intent } = args;
    
    // Run windsurf:guide
    const { stdout, stderr } = await execInProject(`npm run windsurf:guide "${intent}"`);
    
    // Read the generated context file
    const contextExists = await fileExists('.windsurf-context.md');
    let contextContent = '';
    
    if (contextExists) {
      contextContent = await readProjectFile('.windsurf-context.md');
    }
    
    return {
      content: [
        {
          type: 'text',
          text: contextContent || stdout,
        },
      ],
    };
  }

  private async validatePatterns(args: any) {
    const { checkAll = false, autoFix = false } = args;
    
    let command = 'npm run ai-platform:enforce';
    if (checkAll) command += ' -- --check-all';
    if (autoFix) command += ' -- --auto-fix';
    
    const { stdout, stderr } = await execInProject(command);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || stderr,
        },
      ],
    };
  }

  private async checkDependencies(args: any) {
    const { fix = false } = args;
    
    let command = 'npm run ai-platform:guardian -- --check';
    if (fix) command += ' --fix';
    
    const { stdout, stderr } = await execInProject(command);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || stderr,
        },
      ],
    };
  }

  private async monitorQuality(args: any) {
    const { compare = false } = args;
    
    let command = 'npm run ai-platform:quality';
    if (compare) command += ' --compare';
    
    const { stdout, stderr } = await execInProject(command);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || stderr,
        },
      ],
    };
  }

  private async buildGraph(args: any) {
    const { stdout, stderr } = await execInProject('npm run windsurf:graph');
    
    // Read the generated graph
    const graphExists = await fileExists('.windsurf/codebase-graph.json');
    let graphSummary = stdout;
    
    if (graphExists) {
      const graphContent = await readProjectFile('.windsurf/codebase-graph.json');
      const graph = JSON.parse(graphContent);
      const fileCount = Object.keys(graph.files || {}).length;
      graphSummary = `✅ Codebase graph built successfully!\n\n` +
                     `📊 Summary:\n` +
                     `- Files indexed: ${fileCount}\n` +
                     `- Graph saved to: .windsurf/codebase-graph.json\n\n` +
                     `${stdout}`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: graphSummary,
        },
      ],
    };
  }

  private async analyzeComplexity(args: any) {
    const { featureName } = args;
    
    const { stdout, stderr } = await execInProject(`npm run migrate:analyze ${featureName}`);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || stderr,
        },
      ],
    };
  }

  private async recordDecision(args: any) {
    const { what, why, category, priority } = args;
    
    const command = `npm run windsurf:context decision "${what}" "${why}" ${category} ${priority}`;
    const { stdout, stderr } = await execInProject(command);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || stderr,
        },
      ],
    };
  }

  private async batchReplace(args: any) {
    const { find, replace, execute = false } = args;
    
    let command = `npm run windsurf:batch replace "${find}" "${replace}"`;
    if (execute) command += ' --execute';
    
    const { stdout, stderr } = await execInProject(command);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || stderr,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MotoMind MCP Server running on stdio');
  }
}

// Start the server
const server = new MotoMindServer();
server.run().catch(console.error);
