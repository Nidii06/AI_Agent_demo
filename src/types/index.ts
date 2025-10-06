export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: Date;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolExecution {
  id: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  result?: any;
  error?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>) => Promise<any>;
}

export interface StreamTextOnFinishCallback<T> {
  (result: {
    finishReason: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }): Promise<void> | void;
}

export interface Schedule<T> {
  id: string;
  task: T;
  scheduledFor: Date;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  createdAt: Date;
}

export interface AgentContext {
  run<T>(agent: any, fn: () => Promise<T>): Promise<T>;
}

export interface Env {
  AI: any;
  AGENT_STATE: KVNamespace;
  AGENT_EXECUTOR: DurableObjectNamespace;
}
