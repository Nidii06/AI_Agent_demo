import { Tool } from '../types/index.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolDefinitions(): Record<string, any> {
    const definitions: Record<string, any> = {};
    for (const [name, tool] of this.tools) {
      definitions[name] = {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      };
    }
    return definitions;
  }
}

// MCP Server integration for external tools
export class MCPServer {
  constructor(private serverUrl: string) {}

  async connect(): Promise<void> {
    // Connect to MCP server
    console.log(`Connecting to MCP server at ${this.serverUrl}`);
  }

  async listTools(): Promise<Tool[]> {
    // Fetch available tools from MCP server
    const response = await fetch(`${this.serverUrl}/tools`);
    const tools = await response.json();
    return tools;
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    // Execute tool on MCP server
    const response = await fetch(`${this.serverUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: toolName,
        arguments: args,
      }),
    });
    
    return await response.json();
  }
}
