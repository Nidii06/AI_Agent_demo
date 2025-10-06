/**
 * Example: Chat Agent with Tool Integration
 * 
 * This example demonstrates how to create a chat agent that can:
 * 1. Handle conversational interactions
 * 2. Use tools for various tasks (scheduling, email, customer lookup)
 * 3. Stream responses in real-time
 * 4. Maintain conversation context
 */

import { Chat } from '../src/agents/chat-agent.js';
import { Env, AgentContext } from '../src/types/index.js';
import { generateId } from '../src/utils/index.js';

export async function createChatAgent(env: Env) {
  // Mock AI model (in real implementation, use Cloudflare Workers AI)
  const model = {
    name: 'gpt-4',
    provider: 'cloudflare-workers-ai'
  };

  // Agent context for execution
  const agentContext: AgentContext = {
    run: async (agent: any, fn: () => Promise<any>) => {
      console.log('Agent execution started');
      const result = await fn();
      console.log('Agent execution completed');
      return result;
    }
  };

  // Create chat agent
  const chatAgent = new Chat(env, model, agentContext);

  return chatAgent;
}

export async function demonstrateChatAgent(env: Env) {
  console.log('💬 Starting Chat Agent Demo...');

  const chatAgent = await createChatAgent(env);

  // Example conversations
  const conversations = [
    {
      user: "Hi! I met some customers at a conference last week. Can you help me follow up with them?",
      expectedResponse: "I'd be happy to help you follow up with your conference contacts!"
    },
    {
      user: "Can you get me a list of customers from the Cloudflare Connect 2024 conference?",
      expectedResponse: "Let me retrieve the customer list from that conference for you."
    },
    {
      user: "Great! Now can you draft a personalized email for John Smith at TechCorp? He was interested in DDoS protection.",
      expectedResponse: "I'll create a personalized email for John Smith focusing on DDoS protection solutions."
    },
    {
      user: "Perfect! Can you schedule a follow-up call with him for next Tuesday at 2 PM?",
      expectedResponse: "I'll schedule a follow-up call with John Smith for next Tuesday at 2 PM."
    }
  ];

  for (const conversation of conversations) {
    console.log(`\n👤 User: ${conversation.user}`);
    
    // Add user message
    await chatAgent.addMessage('user', conversation.user);
    
    // Process message and get response
    try {
      const response = await chatAgent.onChatMessage(async (result) => {
        console.log('✅ Chat completed with result:', result);
      });

      console.log(`🤖 Agent: Processing your request...`);
      
      // In a real implementation, you would handle the streaming response
      // For demo purposes, we'll simulate the response
      console.log(`🤖 Agent: ${conversation.expectedResponse}`);
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  }

  console.log('\n🎉 Chat Agent Demo completed!');
}

export async function demonstrateToolUsage(env: Env) {
  console.log('🔧 Starting Tool Usage Demo...');

  const chatAgent = await createChatAgent(env);

  // Example 1: Get customers tool
  console.log('\n📋 Example 1: Getting customers from conference...');
  try {
    const customersResult = await chatAgent.executeTool('get_customers', {
      conference: 'Cloudflare Connect 2024'
    });
    console.log('✅ Customers retrieved:', customersResult);
  } catch (error) {
    console.error('❌ Error getting customers:', error);
  }

  // Example 2: Draft email tool
  console.log('\n📧 Example 2: Drafting personalized email...');
  try {
    const emailResult = await chatAgent.executeTool('draft_email', {
      customerName: 'John Smith',
      company: 'TechCorp',
      notes: 'Interested in DDoS protection and CDN services'
    });
    console.log('✅ Email drafted:', emailResult);
  } catch (error) {
    console.error('❌ Error drafting email:', error);
  }

  // Example 3: Schedule task tool
  console.log('\n📅 Example 3: Scheduling follow-up task...');
  try {
    const scheduleResult = await chatAgent.executeTool('schedule', {
      description: 'Follow up with John Smith about DDoS protection demo',
      scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next week
    });
    console.log('✅ Task scheduled:', scheduleResult);
  } catch (error) {
    console.error('❌ Error scheduling task:', error);
  }

  console.log('\n🎉 Tool Usage Demo completed!');
}

export async function demonstrateStreamingResponse(env: Env) {
  console.log('🌊 Starting Streaming Response Demo...');

  const chatAgent = await createChatAgent(env);

  // Add a user message
  await chatAgent.addMessage('user', 'Can you help me create an email campaign for all the customers I met at the conference?');

  console.log('👤 User: Can you help me create an email campaign for all the customers I met at the conference?');
  console.log('🤖 Agent: Processing your request...');

  try {
    // Simulate streaming response
    const response = await chatAgent.onChatMessage(async (result) => {
      console.log('✅ Streaming completed with result:', result);
    });

    // In a real implementation, this would handle the streaming response
    console.log('🤖 Agent: I\'d be happy to help you create an email campaign! Let me:');
    console.log('   1. 📋 Retrieve your conference contacts');
    console.log('   2. 📧 Draft personalized email templates');
    console.log('   3. 🚀 Create and send the campaign');
    console.log('   4. 📊 Monitor responses for you');
    
  } catch (error) {
    console.error('❌ Error in streaming response:', error);
  }

  console.log('\n🎉 Streaming Response Demo completed!');
}

// Main demo function
export async function runChatAgentDemo(env: Env) {
  console.log('🚀 Starting Chat Agent Demonstration...\n');

  try {
    await demonstrateChatAgent(env);
    await demonstrateToolUsage(env);
    await demonstrateStreamingResponse(env);
    
    console.log('\n🎉 All Chat Agent demos completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}
