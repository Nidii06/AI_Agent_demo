import { AIChatAgent } from "agents-sdk";

export interface Env {
  AI: any;
  AGENT_STATE?: KVNamespace;
}

export class ConferenceFollowUpAgent extends AIChatAgent {
  async onChatMessage() {
    // Get the user's message from the request
    const message = await this.getUserMessage();
    
    if (message.includes("conference") || message.includes("follow up")) {
      return this.handleConferenceFollowUp();
    }
    
    return new Response("I can help you with conference follow-up campaigns. What would you like to do?");
  }

  private async handleConferenceFollowUp(): Promise<Response> {
    try {
      // Step 1: Get customers from conference
      const customers = await this.getConferenceCustomers();
      
      // Step 2: Create email campaign
      const campaign = await this.createEmailCampaign(customers);
      
      // Step 3: Send emails
      const results = await this.sendCampaignEmails(campaign);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Conference follow-up campaign completed!",
        results: {
          customersCount: customers.length,
          emailsSent: results.sent,
          failed: results.failed
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async getConferenceCustomers() {
    // Mock customer data - in production, this would query your database
    return [
      {
        id: 1,
        name: 'John Smith',
        email: 'john@techcorp.com',
        company: 'TechCorp',
        notes: 'Interested in DDoS protection and CDN services'
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah@startup.com',
        company: 'StartupXYZ',
        notes: 'Looking for edge computing solutions'
      },
      {
        id: 3,
        name: 'Mike Chen',
        email: 'mike@enterprise.com',
        company: 'Enterprise Inc',
        notes: 'Needs comprehensive security solutions'
      }
    ];
  }

  private async createEmailCampaign(customers: any[]) {
    const emailTemplate = `
Subject: Following up on our conversation at Cloudflare Connect 2024

Hi {{customerName}},

I hope this email finds you well! It was great meeting you at Cloudflare Connect 2024 and learning about {{company}}'s exciting initiatives.

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
    `.trim();

    return {
      id: Math.random().toString(36).substring(2),
      customers,
      template: emailTemplate,
      createdAt: new Date()
    };
  }

  private async sendCampaignEmails(campaign: any) {
    let sent = 0;
    let failed = 0;

    for (const customer of campaign.customers) {
      try {
        // Personalize email for each customer
        const personalizedEmail = campaign.template
          .replace(/{{customerName}}/g, customer.name)
          .replace(/{{company}}/g, customer.company)
          .replace(/{{notes}}/g, customer.notes || '');

        // In production, you would use Cloudflare Email Workers here
        console.log(`Sending email to ${customer.email}: ${customer.name} at ${customer.company}`);
        
        sent++;
      } catch (error) {
        console.error(`Failed to send email to ${customer.email}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }
}
