import { AgentMessage } from '../types/index.js';

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function createDataStreamResponse(options: {
  execute: (dataStream: ReadableStreamDefaultController) => Promise<void>;
}) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  
  const dataStream = {
    write: (chunk: any) => {
      writer.write(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
    },
    close: () => {
      writer.close();
    }
  };

  options.execute(dataStream as any);
  
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export function unstable_getSchedulePrompt(options: { date: Date }): string {
  const currentDate = options.date.toISOString();
  return `Current date and time: ${currentDate}

You can schedule tasks using the schedule tool. When scheduling, provide a clear description of what needs to be done.`;
}

export async function processToolCalls(options: {
  messages: AgentMessage[];
  dataStream: any;
  tools: Map<string, any>;
  executions: Map<string, any>;
}): Promise<AgentMessage[]> {
  const { messages, dataStream, tools, executions } = options;
  const processedMessages: AgentMessage[] = [];

  for (const message of messages) {
    processedMessages.push(message);

    if (message.toolCalls) {
      for (const toolCall of message.toolCalls) {
        const execution = executions.get(toolCall.id);
        if (execution) {
          const tool = tools.get(toolCall.function.name);
          if (tool) {
            try {
              execution.status = 'running';
              const result = await tool.execute(JSON.parse(toolCall.function.arguments));
              execution.result = result;
              execution.status = 'completed';
              execution.completedAt = new Date();
              
              processedMessages.push({
                id: generateId(),
                role: 'tool',
                content: JSON.stringify(result),
                toolCallId: toolCall.id,
                createdAt: new Date(),
              });
            } catch (error) {
              execution.error = error instanceof Error ? error.message : String(error);
              execution.status = 'failed';
              execution.completedAt = new Date();
              
              processedMessages.push({
                id: generateId(),
                role: 'tool',
                content: `Error: ${execution.error}`,
                toolCallId: toolCall.id,
                createdAt: new Date(),
              });
            }
          }
        }
      }
    }
  }

  return processedMessages;
}

export function streamText(options: {
  model: any;
  system: string;
  messages: AgentMessage[];
  tools: Map<string, any>;
  onFinish: any;
  onError: (error: Error) => void;
  maxSteps: number;
}) {
  const { model, system, messages, tools, onFinish, onError, maxSteps } = options;
  
  return {
    mergeIntoDataStream: (dataStream: any) => {
      // Simulate streaming response
      const response = {
        finishReason: 'stop',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        }
      };
      
      try {
        dataStream.write({ type: 'text', content: 'AI response streamed...' });
        dataStream.close();
        onFinish(response);
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };
}
