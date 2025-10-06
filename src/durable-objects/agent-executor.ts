import { DurableObject } from 'cloudflare:workers';

export class AgentExecutor extends DurableObject {
  private state: Map<string, any> = new Map();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case '/execute':
        return this.handleExecution(request);
      case '/state':
        return this.handleState(request);
      case '/schedule':
        return this.handleSchedule(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async handleExecution(request: Request): Promise<Response> {
    try {
      const { agentId, action, data } = await request.json();
      
      // Execute agent action with state management
      const result = await this.executeAgentAction(agentId, action, data);
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private async handleState(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (request.method === 'GET') {
      const value = key ? this.state.get(key) : Object.fromEntries(this.state);
      return new Response(JSON.stringify(value), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (request.method === 'POST') {
      const { key: newKey, value } = await request.json();
      this.state.set(newKey, value);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  private async handleSchedule(request: Request): Promise<Response> {
    try {
      const { task, scheduledFor, description } = await request.json();
      
      // Store scheduled task in state
      const scheduleId = Math.random().toString(36).substring(2);
      const schedule = {
        id: scheduleId,
        task,
        scheduledFor: new Date(scheduledFor),
        status: 'scheduled',
        createdAt: new Date(),
      };

      this.state.set(`schedule:${scheduleId}`, schedule);
      
      return new Response(JSON.stringify({ 
        success: true, 
        scheduleId,
        schedule 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private async executeAgentAction(agentId: string, action: string, data: any): Promise<any> {
    // Store execution state
    const executionId = Math.random().toString(36).substring(2);
    const execution = {
      id: executionId,
      agentId,
      action,
      data,
      status: 'running',
      startedAt: new Date(),
    };

    this.state.set(`execution:${executionId}`, execution);

    try {
      // Simulate agent execution
      const result = await this.simulateAgentExecution(action, data);
      
      execution.status = 'completed';
      execution.completedAt = new Date();
      this.state.set(`execution:${executionId}`, execution);

      return {
        success: true,
        executionId,
        result,
      };
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completedAt = new Date();
      this.state.set(`execution:${executionId}`, execution);

      return {
        success: false,
        executionId,
        error: execution.error,
      };
    }
  }

  private async simulateAgentExecution(action: string, data: any): Promise<any> {
    // Simulate different agent actions
    switch (action) {
      case 'send_email':
        return {
          messageId: Math.random().toString(36).substring(2),
          status: 'sent',
          recipient: data.to,
        };
      
      case 'get_customers':
        return {
          customers: [
            { id: 1, name: 'John Smith', email: 'john@example.com' },
            { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com' },
          ],
        };
      
      case 'draft_email':
        return {
          subject: 'Follow-up from conference',
          body: 'Thank you for meeting with us...',
        };
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}
