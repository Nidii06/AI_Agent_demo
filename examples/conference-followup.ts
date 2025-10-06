/**
 * Example: Conference Follow-up Campaign Agent
 * 
 * This example demonstrates how to create an AI agent that:
 * 1. Gets a list of customers from a conference
 * 2. Drafts personalized emails
 * 3. Creates an email campaign
 * 4. Sends emails to all customers
 * 5. Monitors responses
 */

import { EmailAgent } from '../src/agents/email-agent.js';
import { WorkflowEngine, WorkflowStep } from '../src/workflows/workflow-engine.js';
import { Env } from '../src/types/index.js';

export async function runConferenceFollowUpCampaign(env: Env) {
  console.log('🚀 Starting Conference Follow-up Campaign...');

  // Step 1: Get customers from conference
  console.log('📋 Step 1: Getting customers from conference...');
  const emailAgent = new EmailAgent(env);
  
  const customersResult = await emailAgent.executeTool('get_conference_customers', {
    conference: 'Cloudflare Connect 2024',
    date: '2024-12-10'
  });

  if (!customersResult.success) {
    throw new Error('Failed to retrieve customers');
  }

  console.log(`✅ Found ${customersResult.customers.length} customers`);

  // Step 2: Create email campaign
  console.log('📧 Step 2: Creating email campaign...');
  const campaignResult = await emailAgent.executeTool('create_email_campaign', {
    campaignName: 'Cloudflare Connect 2024 Follow-up',
    customers: customersResult.customers,
    emailTemplate: `
Subject: Following up on our conversation at Cloudflare Connect 2024

Hi {{customerName}},

I hope this email finds you well! It was great meeting you at Cloudflare Connect 2024 and learning about {{company}}'s exciting initiatives.

As we discussed, Cloudflare's comprehensive platform could provide significant value to {{company}}:

🔒 **Security & DDoS Protection**: Shield your infrastructure from evolving threats
🌐 **Global CDN**: Accelerate content delivery to users worldwide  
⚡ **Workers Platform**: Build and deploy applications at the edge
🤖 **AI & Machine Learning**: Leverage AI capabilities with Workers AI

{{#if notes}}Based on our conversation about {{notes}}, I believe our solutions could address your specific needs.{{/if}}

I'd love to schedule a brief call to discuss how Cloudflare can support {{company}}'s objectives. I can arrange a personalized demo that focuses on the areas most relevant to your business.

Would you be available for a 30-minute call next week?

Looking forward to continuing our conversation!

Best regards,
Your Name
Cloudflare Solutions Team
    `.trim()
  });

  console.log(`✅ Campaign created: ${campaignResult.campaignId}`);

  // Step 3: Send campaign emails
  console.log('📤 Step 3: Sending campaign emails...');
  const sendResult = await emailAgent.executeTool('send_campaign_emails', {
    campaignId: campaignResult.campaignId
  });

  if (sendResult.success) {
    console.log(`✅ Emails sent: ${sendResult.summary.sent}/${sendResult.summary.total}`);
    if (sendResult.summary.failed > 0) {
      console.log(`⚠️  Failed: ${sendResult.summary.failed}`);
    }
  }

  // Step 4: Monitor responses (simulated)
  console.log('👀 Step 4: Monitoring responses...');
  setTimeout(async () => {
    const responseResult = await emailAgent.executeTool('monitor_campaign_responses', {
      campaignId: campaignResult.campaignId
    });

    if (responseResult.success) {
      console.log(`📊 Response Summary:`);
      console.log(`   Total Customers: ${responseResult.summary.totalCustomers}`);
      console.log(`   Responded: ${responseResult.summary.responded}`);
      console.log(`   Interested: ${responseResult.summary.interested}`);
    }
  }, 5000); // Check after 5 seconds

  return {
    success: true,
    campaignId: campaignResult.campaignId,
    customersCount: customersResult.customers.length,
    emailsSent: sendResult.summary?.sent || 0
  };
}

/**
 * Example: Workflow-based Campaign
 * 
 * This example shows how to use the workflow engine to orchestrate
 * the entire campaign process with error handling and retries.
 */
export async function runWorkflowBasedCampaign(env: Env) {
  console.log('🔄 Starting Workflow-based Campaign...');

  const workflowEngine = new WorkflowEngine(env);

  // Define workflow steps
  const steps: WorkflowStep[] = [
    {
      id: 'get_customers',
      name: 'Get Conference Customers',
      type: 'action',
      execute: async (context) => {
        const emailAgent = new EmailAgent(env);
        const result = await emailAgent.executeTool('get_conference_customers', {
          conference: 'Cloudflare Connect 2024',
          date: '2024-12-10'
        });

        if (!result.success) {
          throw new Error('Failed to get customers');
        }

        return {
          success: true,
          data: { customers: result.customers }
        };
      }
    },
    {
      id: 'create_campaign',
      name: 'Create Email Campaign',
      type: 'action',
      dependsOn: ['get_customers'],
      execute: async (context) => {
        const emailAgent = new EmailAgent(env);
        const customers = context.data.customers;

        const result = await emailAgent.executeTool('create_email_campaign', {
          campaignName: 'Cloudflare Connect 2024 Follow-up',
          customers,
          emailTemplate: `Hi {{customerName}}, thanks for meeting us at the conference!`
        });

        return {
          success: true,
          data: { campaignId: result.campaignId }
        };
      }
    },
    {
      id: 'send_emails',
      name: 'Send Campaign Emails',
      type: 'action',
      dependsOn: ['create_campaign'],
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000
      },
      execute: async (context) => {
        const emailAgent = new EmailAgent(env);
        const campaignId = context.data.campaignId;

        const result = await emailAgent.executeTool('send_campaign_emails', {
          campaignId
        });

        if (!result.success) {
          throw new Error('Failed to send emails');
        }

        return {
          success: true,
          data: { emailsSent: result.summary.sent }
        };
      }
    }
  ];

  // Create and execute workflow
  const workflow = workflowEngine.createWorkflow('Conference Follow-up', steps);
  const result = await workflowEngine.executeWorkflow(workflow.id);

  console.log('🎉 Workflow completed:', result);

  return result;
}

// Example usage
export async function main(env: Env) {
  try {
    // Run simple campaign
    const simpleResult = await runConferenceFollowUpCampaign(env);
    console.log('Simple campaign result:', simpleResult);

    // Run workflow-based campaign
    const workflowResult = await runWorkflowBasedCampaign(env);
    console.log('Workflow campaign result:', workflowResult);

  } catch (error) {
    console.error('Campaign failed:', error);
  }
}
