import { AgentMessage, Tool, ToolExecution, Env } from '../types/index.js';
import { generateId } from '../utils/index.js';

export abstract class BaseAgent {
  protected env: Env;
  protected messages: AgentMessage[] = [];
  protected tools: Map<string, Tool> = new Map();
  protected executions: Map<string, ToolExecution> = new Map();

  constructor(env: Env) {
    this.env = env;
    this.registerTools();
  }

  protected abstract registerTools(): void;

  protected addTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async saveMessages(messages: AgentMessage[]): Promise<void> {
    this.messages = messages;
    // In a real implementation, you would save to KV or database
    console.log('Messages saved:', messages.length);
  }

  async loadMessages(): Promise<AgentMessage[]> {
    // In a real implementation, you would load from KV or database
    return this.messages;
  }

  protected createToolExecution(toolCallId: string, toolName: string, args: Record<string, any>): ToolExecution {
    const execution: ToolExecution = {
      id: generateId(),
      toolCallId,
      toolName,
      args,
      status: 'pending',
      createdAt: new Date(),
    };
    
    this.executions.set(toolCallId, execution);
    return execution;
  }

  protected async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    return await tool.execute(args);
  }

  abstract processMessage(message: string): Promise<string>;
}
