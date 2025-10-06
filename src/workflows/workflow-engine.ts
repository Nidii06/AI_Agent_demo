import { Env, Schedule } from '../types/index.js';
import { generateId } from '../utils/index.js';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'parallel' | 'sequential';
  execute: (context: WorkflowContext) => Promise<WorkflowResult>;
  dependsOn?: string[];
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface WorkflowContext {
  data: Record<string, any>;
  env: Env;
  workflowId: string;
  stepId: string;
}

export interface WorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  nextSteps?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  currentStep?: string;
}

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private schedules: Map<string, Schedule<any>> = new Map();

  constructor(private env: Env) {}

  createWorkflow(name: string, steps: WorkflowStep[]): Workflow {
    const workflow: Workflow = {
      id: generateId(),
      name,
      steps,
      status: 'pending',
      createdAt: new Date(),
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async executeWorkflow(workflowId: string, initialData: Record<string, any> = {}): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'running';
    workflow.startedAt = new Date();

    const context: WorkflowContext = {
      data: initialData,
      env: this.env,
      workflowId,
      stepId: '',
    };

    try {
      // Execute workflow steps in order
      for (const step of workflow.steps) {
        workflow.currentStep = step.id;
        context.stepId = step.id;

        const result = await this.executeStep(step, context);
        
        if (!result.success) {
          workflow.status = 'failed';
          return result;
        }

        // Merge step result data into context
        if (result.data) {
          context.data = { ...context.data, ...result.data };
        }
      }

      workflow.status = 'completed';
      workflow.completedAt = new Date();

      return {
        success: true,
        data: context.data,
      };
    } catch (error) {
      workflow.status = 'failed';
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<WorkflowResult> {
    const maxRetries = step.retryPolicy?.maxRetries || 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await step.execute(context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          const backoffMs = step.retryPolicy?.backoffMs || 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
    };
  }

  scheduleTask<T>(task: T, scheduledFor: Date, description?: string): Schedule<T> {
    const schedule: Schedule<T> = {
      id: generateId(),
      task,
      scheduledFor,
      status: 'scheduled',
      createdAt: new Date(),
    };

    this.schedules.set(schedule.id, schedule);
    
    // In a real implementation, you would use Cloudflare Workers scheduled events
    // or a cron job system to execute tasks at the scheduled time
    console.log(`Task scheduled for ${scheduledFor.toISOString()}: ${description || 'No description'}`);
    
    return schedule;
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getSchedule(id: string): Schedule<any> | undefined {
    return this.schedules.get(id);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  listSchedules(): Schedule<any>[] {
    return Array.from(this.schedules.values());
  }
}
