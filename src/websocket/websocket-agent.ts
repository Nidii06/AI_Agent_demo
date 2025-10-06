import { DurableObject } from 'cloudflare:workers';
import { BaseAgent } from '../agents/base-agent.js';
import { Env, AgentMessage } from '../types/index.js';
import { generateId } from '../utils/index.js';

export interface WebSocketConnection {
  id: string;
  websocket: WebSocket;
  agentId: string;
  connectedAt: Date;
  lastActivity: Date;
  isHibernated: boolean;
}

export class WebSocketAgent extends DurableObject {
  private connections: Map<string, WebSocketConnection> = new Map();
  private agents: Map<string, BaseAgent> = new Map();
  private hibernationTimeout: number = 30000; // 30 seconds

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case '/websocket':
        return this.handleWebSocket(request);
      case '/hibernate':
        return this.handleHibernation(request);
      case '/wake':
        return this.handleWake(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const agentId = url.searchParams.get('agentId') || 'default';
    
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the WebSocket connection
    server.accept();

    // Create connection record
    const connectionId = generateId();
    const connection: WebSocketConnection = {
      id: connectionId,
      websocket: server,
      agentId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      isHibernated: false,
    };

    this.connections.set(connectionId, connection);

    // Set up message handlers
    server.addEventListener('message', async (event) => {
      await this.handleMessage(connectionId, event.data);
    });

    server.addEventListener('close', () => {
      this.connections.delete(connectionId);
    });

    server.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.connections.delete(connectionId);
    });

    // Set up hibernation timer
    this.setupHibernationTimer(connectionId);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handleMessage(connectionId: string, data: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Update last activity
    connection.lastActivity = new Date();
    connection.isHibernated = false;

    try {
      const message = JSON.parse(data);
      await this.processAgentMessage(connection, message);
    } catch (error) {
      console.error('Error processing message:', error);
      this.sendError(connection, 'Invalid message format');
    }

    // Reset hibernation timer
    this.setupHibernationTimer(connectionId);
  }

  private async processAgentMessage(connection: WebSocketConnection, message: any): Promise<void> {
    const { type, data } = message;

    switch (type) {
      case 'chat':
        await this.handleChatMessage(connection, data);
        break;
      case 'tool_call':
        await this.handleToolCall(connection, data);
        break;
      case 'ping':
        this.sendPong(connection);
        break;
      default:
        this.sendError(connection, `Unknown message type: ${type}`);
    }
  }

  private async handleChatMessage(connection: WebSocketConnection, data: any): Promise<void> {
    const { message } = data;
    
    // Get or create agent for this connection
    let agent = this.agents.get(connection.agentId);
    if (!agent) {
      // Create a new agent instance
      agent = await this.createAgent(connection.agentId);
      this.agents.set(connection.agentId, agent);
    }

    try {
      // Process the message through the agent
      const response = await agent.processMessage(message);
      
      // Send response back to client
      this.sendMessage(connection, {
        type: 'chat_response',
        data: { message: response }
      });
    } catch (error) {
      this.sendError(connection, `Agent processing error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleToolCall(connection: WebSocketConnection, data: any): Promise<void> {
    const { toolName, args } = data;
    
    const agent = this.agents.get(connection.agentId);
    if (!agent) {
      this.sendError(connection, 'Agent not found');
      return;
    }

    try {
      const result = await agent.executeTool(toolName, args);
      
      this.sendMessage(connection, {
        type: 'tool_result',
        data: { toolName, result }
      });
    } catch (error) {
      this.sendError(connection, `Tool execution error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private setupHibernationTimer(connectionId: string): void {
    // Clear existing timer
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Set new timer
    setTimeout(() => {
      this.hibernateConnection(connectionId);
    }, this.hibernationTimeout);
  }

  private async hibernateConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.isHibernated) return;

    console.log(`Hibernating connection ${connectionId}`);
    
    // Mark as hibernated
    connection.isHibernated = true;

    // Send hibernation notification
    this.sendMessage(connection, {
      type: 'hibernated',
      data: { message: 'Connection hibernated to save resources' }
    });

    // In a real implementation, you would:
    // 1. Save agent state to persistent storage
    // 2. Close the WebSocket connection
    // 3. Clean up memory resources
    // 4. The Durable Object can shut down and be recreated when needed
  }

  private async handleHibernation(request: Request): Promise<Response> {
    const { connectionId } = await request.json();
    
    if (connectionId) {
      await this.hibernateConnection(connectionId);
    } else {
      // Hibernate all connections
      for (const [id] of this.connections) {
        await this.hibernateConnection(id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleWake(request: Request): Promise<Response> {
    const { connectionId } = await request.json();
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      return new Response(JSON.stringify({ error: 'Connection not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Wake up the connection
    connection.isHibernated = false;
    connection.lastActivity = new Date();

    this.sendMessage(connection, {
      type: 'woken',
      data: { message: 'Connection woken up' }
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async createAgent(agentId: string): Promise<BaseAgent> {
    // In a real implementation, you would create the appropriate agent type
    // For now, return a mock agent
    return {
      processMessage: async (message: string) => {
        return `Echo: ${message}`;
      },
      executeTool: async (toolName: string, args: any) => {
        return { toolName, args, result: 'mock result' };
      }
    } as any;
  }

  private sendMessage(connection: WebSocketConnection, message: any): void {
    if (connection.websocket.readyState === WebSocket.OPEN) {
      connection.websocket.send(JSON.stringify(message));
    }
  }

  private sendError(connection: WebSocketConnection, error: string): void {
    this.sendMessage(connection, {
      type: 'error',
      data: { error }
    });
  }

  private sendPong(connection: WebSocketConnection): void {
    this.sendMessage(connection, {
      type: 'pong',
      data: { timestamp: Date.now() }
    });
  }
}
