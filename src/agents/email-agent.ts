import { BaseAgent } from './base-agent.js';
import { Tool, Env } from '../types/index.js';

export interface Customer {
  id: number;
  name: string;
  email: string;
  company: string;
  notes?: string;
  conference: string;
  meetingDate: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  customers: Customer[];
  emailTemplate: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  createdAt: Date;
  scheduledFor?: Date;
  sentCount: number;
  failedCount: number;
}

export class EmailAgent extends BaseAgent {
  private campaigns: Map<string, EmailCampaign> = new Map();

  constructor(env: Env) {
    super(env);
  }

  protected registerTools(): void {
    // Get customers from conference
    this.addTool({
      name: 'get_conference_customers',
      description: 'Retrieve all customers met at a specific conference',
      parameters: {
        type: 'object',
        properties: {
          conference: {
            type: 'string',
            description: 'Conference name or identifier'
          },
          date: {
            type: 'string',
            description: 'Conference date (ISO format)'
          }
        },
        required: ['conference']
      },
      execute: async (args) => {
        const { conference, date } = args;
        
        // Mock customer data - in real implementation, query from database
        const customers: Customer[] = [
          {
            id: 1,
            name: 'John Smith',
            email: 'john@techcorp.com',
            company: 'TechCorp',
            notes: 'Interested in DDoS protection and CDN services',
            conference,
            meetingDate: new Date(date || '2024-12-10')
          },
          {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah@startup.com',
            company: 'StartupXYZ',
            notes: 'Looking for edge computing solutions for their mobile app',
            conference,
            meetingDate: new Date(date || '2024-12-10')
          },
          {
            id: 3,
            name: 'Mike Chen',
            email: 'mike@enterprise.com',
            company: 'Enterprise Inc',
            notes: 'Needs comprehensive security solutions and compliance',
            conference,
            meetingDate: new Date(date || '2024-12-10')
          },
          {
            id: 4,
            name: 'Emily Davis',
            email: 'emily@retail.com',
            company: 'RetailGiant',
            notes: 'Interested in performance optimization for e-commerce',
            conference,
            meetingDate: new Date(date || '2024-12-10')
          }
        ];
        
        return { success: true, customers };
      }
    });

    // Draft personalized email template
    this.addTool({
      name: 'draft_personalized_email',
      description: 'Create a personalized email template for a customer',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'Customer name'
          },
          company: {
            type: 'string',
            description: 'Customer company'
          },
          notes: {
            type: 'string',
            description: 'Notes from the conference meeting'
          },
          conferenceName: {
            type: 'string',
            description: 'Conference name'
          }
        },
        required: ['customerName', 'company', 'conferenceName']
      },
      execute: async (args) => {
        const { customerName, company, notes, conferenceName } = args;
        
        const emailTemplate = `
Subject: Following up on our conversation at ${conferenceName}

Hi ${customerName},

I hope this email finds you well! It was great meeting you at ${conferenceName} and learning about ${company}'s exciting initiatives.

As we discussed, Cloudflare's comprehensive platform could provide significant value to ${company}:

🔒 **Security & DDoS Protection**: Shield your infrastructure from evolving threats
🌐 **Global CDN**: Accelerate content delivery to users worldwide
⚡ **Workers Platform**: Build and deploy applications at the edge
🤖 **AI & Machine Learning**: Leverage AI capabilities with Workers AI
📊 **Analytics & Insights**: Get detailed performance and security metrics

${notes ? `Based on our conversation about ${notes}, I believe our solutions could address your specific needs and help ${company} achieve its goals.` : ''}

I'd love to schedule a brief call to discuss how Cloudflare can support ${company}'s objectives. I can arrange a personalized demo that focuses on the areas most relevant to your business.

Would you be available for a 30-minute call next week? I'm flexible with timing and can work around your schedule.

Looking forward to continuing our conversation!

Best regards,
Your Name
Cloudflare Solutions Team

P.S. I've attached some relevant case studies that might interest you based on our discussion.
        `.trim();
        
        return { 
          success: true, 
          email: {
            subject: `Following up on our conversation at ${conferenceName}`,
            body: emailTemplate,
            personalized: true
          }
        };
      }
    });

    // Create email campaign
    this.addTool({
      name: 'create_email_campaign',
      description: 'Create an email campaign for multiple customers',
      parameters: {
        type: 'object',
        properties: {
          campaignName: {
            type: 'string',
            description: 'Name of the email campaign'
          },
          customers: {
            type: 'array',
            description: 'Array of customer objects',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                email: { type: 'string' },
                company: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          },
          emailTemplate: {
            type: 'string',
            description: 'Base email template to use'
          }
        },
        required: ['campaignName', 'customers', 'emailTemplate']
      },
      execute: async (args) => {
        const { campaignName, customers, emailTemplate } = args;
        
        const campaignId = Math.random().toString(36).substring(2);
        const campaign: EmailCampaign = {
          id: campaignId,
          name: campaignName,
          customers,
          emailTemplate,
          status: 'draft',
          createdAt: new Date(),
          sentCount: 0,
          failedCount: 0
        };
        
        this.campaigns.set(campaignId, campaign);
        
        return { 
          success: true, 
          campaignId,
          campaign 
        };
      }
    });

    // Send campaign emails
    this.addTool({
      name: 'send_campaign_emails',
      description: 'Send emails from a campaign to all customers',
      parameters: {
        type: 'object',
        properties: {
          campaignId: {
            type: 'string',
            description: 'Campaign ID to send'
          }
        },
        required: ['campaignId']
      },
      execute: async (args) => {
        const { campaignId } = args;
        const campaign = this.campaigns.get(campaignId);
        
        if (!campaign) {
          throw new Error(`Campaign ${campaignId} not found`);
        }
        
        campaign.status = 'sending';
        const results = [];
        
        for (const customer of campaign.customers) {
          try {
            // Personalize email for each customer
            const personalizedEmail = campaign.emailTemplate
              .replace(/{{customerName}}/g, customer.name)
              .replace(/{{company}}/g, customer.company)
              .replace(/{{notes}}/g, customer.notes || '');
            
            // In real implementation, use Cloudflare Email Workers
            console.log(`Sending email to ${customer.email}: ${customer.name} at ${customer.company}`);
            
            results.push({
              customerId: customer.id,
              email: customer.email,
              status: 'sent',
              messageId: Math.random().toString(36).substring(2)
            });
            
            campaign.sentCount++;
          } catch (error) {
            results.push({
              customerId: customer.id,
              email: customer.email,
              status: 'failed',
              error: error instanceof Error ? error.message : String(error)
            });
            
            campaign.failedCount++;
          }
        }
        
        campaign.status = campaign.failedCount === 0 ? 'completed' : 'completed';
        
        return {
          success: true,
          campaignId,
          results,
          summary: {
            total: campaign.customers.length,
            sent: campaign.sentCount,
            failed: campaign.failedCount
          }
        };
      }
    });

    // Monitor campaign responses
    this.addTool({
      name: 'monitor_campaign_responses',
      description: 'Monitor and track responses to email campaigns',
      parameters: {
        type: 'object',
        properties: {
          campaignId: {
            type: 'string',
            description: 'Campaign ID to monitor'
          }
        },
        required: ['campaignId']
      },
      execute: async (args) => {
        const { campaignId } = args;
        const campaign = this.campaigns.get(campaignId);
        
        if (!campaign) {
          throw new Error(`Campaign ${campaignId} not found`);
        }
        
        // Mock response data - in real implementation, check email provider API
        const responses = [
          {
            customerId: 1,
            customerName: 'John Smith',
            email: 'john@techcorp.com',
            responded: true,
            responseDate: new Date(),
            interested: true,
            nextAction: 'Schedule demo call'
          },
          {
            customerId: 2,
            customerName: 'Sarah Johnson',
            email: 'sarah@startup.com',
            responded: false,
            responseDate: null,
            interested: null,
            nextAction: 'Follow up in 3 days'
          }
        ];
        
        return {
          success: true,
          campaignId,
          responses,
          summary: {
            totalCustomers: campaign.customers.length,
            responded: responses.filter(r => r.responded).length,
            interested: responses.filter(r => r.interested === true).length
          }
        };
      }
    });
  }

  async createFollowUpCampaign(conferenceName: string, conferenceDate?: string): Promise<EmailCampaign> {
    // Get customers from conference
    const customersResult = await this.executeTool('get_conference_customers', {
      conference: conferenceName,
      date: conferenceDate
    });
    
    if (!customersResult.success) {
      throw new Error('Failed to retrieve customers');
    }
    
    // Create campaign
    const campaignResult = await this.executeTool('create_email_campaign', {
      campaignName: `${conferenceName} Follow-up Campaign`,
      customers: customersResult.customers,
      emailTemplate: `
Subject: Following up on our conversation at {{conferenceName}}

Hi {{customerName}},

I hope this email finds you well! It was great meeting you at {{conferenceName}} and learning about {{company}}'s exciting initiatives.

As we discussed, Cloudflare's comprehensive platform could provide significant value to {{company}}:

🔒 **Security & DDoS Protection**: Shield your infrastructure from evolving threats
🌐 **Global CDN**: Accelerate content delivery to users worldwide
⚡ **Workers Platform**: Build and deploy applications at the edge
🤖 **AI & Machine Learning**: Leverage AI capabilities with Workers AI

{{#if notes}}Based on our conversation about {{notes}}, I believe our solutions could address your specific needs.{{/if}}

I'd love to schedule a brief call to discuss how Cloudflare can support {{company}}'s objectives.

Would you be available for a 30-minute call next week?

Best regards,
Your Name
Cloudflare Solutions Team
      `.trim()
    });
    
    return campaignResult.campaign;
  }
}
