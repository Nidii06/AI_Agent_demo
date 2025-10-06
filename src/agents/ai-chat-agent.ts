import { BaseAgent } from './base-agent.js';
import { AgentMessage, Tool, StreamTextOnFinishCallback, Env, AgentContext } from '../types/index.js';
import { createDataStreamResponse, processToolCalls, streamText, unstable_getSchedulePrompt, generateId } from '../utils/index.js';

export abstract class AIChatAgent<T extends Env> extends BaseAgent {
  protected model: any;
  protected agentContext: AgentContext;

  constructor(env: T, model: any, agentContext: AgentContext) {
    super(env);
    this.model = model;
    this.agentContext = agentContext;
  }

  /**
   * Handles incoming chat messages and manages the response stream
   * @param onFinish - Callback function executed when streaming completes
   */
  async onChatMessage(onFinish: StreamTextOnFinishCallback<{}>) {
    // Create a streaming response that handles both text and tool outputs
    return this.agentContext.run(this, async () => {
      const dataStreamResponse = createDataStreamResponse({
        execute: async (dataStream) => {
          // Process any pending tool calls from previous messages
          // This handles human-in-the-loop confirmations for tools
          const processedMessages = await processToolCalls({
            messages: this.messages,
            dataStream,
            tools: this.tools,
            executions: this.executions,
          });

          // Stream the AI response using the configured model
          const result = streamText({
            model: this.model,
            system: `You are a helpful assistant that can do various tasks... 

${unstable_getSchedulePrompt({ date: new Date() })}

If the user asks to schedule a task, use the schedule tool to schedule the task.
`,
            messages: processedMessages,
            tools: this.tools,
            onFinish,
            onError: (error) => {
              console.error("Error while streaming:", error);
            },
            maxSteps: 10,
          });

          // Merge the AI response stream with tool execution outputs
          result.mergeIntoDataStream(dataStream);
        },
      });

      return dataStreamResponse;
    });
  }

  async executeTask(description: string, task: any) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        content: `Running scheduled task: ${description}`,
        createdAt: new Date(),
      },
    ]);
  }

  async addMessage(role: 'user' | 'assistant' | 'system', content: string, toolCalls?: any[]): Promise<void> {
    const message: AgentMessage = {
      id: generateId(),
      role,
      content,
      createdAt: new Date(),
      toolCalls,
    };

    this.messages.push(message);
    await this.saveMessages(this.messages);
  }

  async getMessages(): Promise<AgentMessage[]> {
    return this.messages;
  }
}
