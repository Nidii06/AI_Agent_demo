# AI Agent Platform

A comprehensive platform for building AI agents on Cloudflare, featuring autonomous task execution, tool usage, and intelligent decision-making capabilities.

## 🚀 Features

### 01 | Comprehensive Product Suite
Build agentic AI entirely on Cloudflare with our extensive suite of products:

- **📧 Email Workers**: Receive input via email
- **💬 WebSockets**: Real-time chat interactions with hibernation support
- **🎙️ Calls**: Voice input capabilities
- **🤖 Workers AI**: Host LLMs directly on Cloudflare
- **🌐 AI Gateway**: Connect to popular LLM providers
- **⚡ Durable Objects**: State management and execution engine
- **🔄 Workflows**: Orchestrate complex multi-step processes
- **🛠️ MCP Servers**: Tool integration for external APIs
- **🎨 Browser Rendering**: Visual capabilities
- **🗃️ Vectorize**: Vector database for embeddings
- **💾 D1**: SQL database for persistent storage

### 02 | Low Cost
Scale up or down with cost-effective pricing:

- **💰 Pay only for CPU time**: Not wall time, saving costs when waiting on external resources
- **💤 WebSocket Hibernation**: Automatic resource management for long-running connections
- **📊 Predictable pricing**: No guessing or committing to unused hardware

### 03 | Developer Instructions

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Usage Examples

### Chat Agent

```typescript
import { Chat } from './src/agents/chat-agent.js';

const chatAgent = new Chat(env, model, agentContext);

// Handle chat messages with streaming
const response = await chatAgent.onChatMessage(async (result) => {
  console.log('Chat completed:', result);
});

// Add user messages
await chatAgent.addMessage('user', 'Help me follow up with conference customers');
```

### Email Campaign Agent

```typescript
import { EmailAgent } from './src/agents/email-agent.js';

const emailAgent = new EmailAgent(env);

// Create follow-up campaign
const campaign = await emailAgent.createFollowUpCampaign(
  'Cloudflare Connect 2024',
  '2024-12-10'
);

// Send campaign emails
await emailAgent.executeTool('send_campaign_emails', {
  campaignId: campaign.id
});
```

### Workflow Engine

```typescript
import { WorkflowEngine } from './src/workflows/workflow-engine.js';

const workflowEngine = new WorkflowEngine(env);

// Create workflow
const workflow = workflowEngine.createWorkflow('Customer Follow-up', [
  {
    id: 'get_customers',
    name: 'Get Conference Customers',
    type: 'action',
    execute: async (context) => {
      // Implementation
    }
  }
]);

// Execute workflow
const result = await workflowEngine.executeWorkflow(workflow.id);
```

## API Endpoints

### Chat API
- `POST /api/chat` - Send message to chat agent
- `GET /api/chat/history` - Get conversation history

### Email Campaign API
- `POST /api/email-campaign` - Create email campaign
- `POST /api/email-campaign/send` - Send campaign emails
- `GET /api/email-campaign/responses` - Monitor campaign responses

### Workflow API
- `POST /api/workflow` - Create new workflow
- `POST /api/workflow/execute` - Execute workflow
- `GET /api/workflow/list` - List all workflows

### WebSocket API
- `GET /api/websocket` - Establish WebSocket connection with hibernation

## Example: Conference Follow-up Campaign

```typescript
import { runConferenceFollowUpCampaign } from './examples/conference-followup.js';

// Run complete campaign
const result = await runConferenceFollowUpCampaign(env);
console.log(`Campaign completed: ${result.emailsSent} emails sent`);
```

This example demonstrates:
1. ✅ Get customer list from conference
2. ✅ Draft personalized emails
3. ✅ Create email campaign
4. ✅ Send emails to all customers
5. ✅ Monitor responses

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │───▶│   AI Agent       │───▶│   Tool Execution│
│   (Email/Chat)  │    │   (LLM + Tools)  │    │   (APIs/Tasks)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Workflow Engine │
                       │  (Orchestration) │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Durable Objects │
                       │  (State + Compute)│
                       └──────────────────┘
```

## Configuration

### Environment Variables

```toml
# wrangler.toml
[env.production.kv_namespaces]
binding = "AGENT_STATE"
id = "your-kv-namespace-id"

[[env.production.durable_objects]]
binding = "AGENT_EXECUTOR"
class_name = "AgentExecutor"

[env.production.ai]
binding = "AI"
```

## Tools Available

### Built-in Tools
- `schedule` - Schedule tasks for future execution
- `send_email` - Send emails via Cloudflare Email Workers
- `get_customers` - Retrieve customer data
- `draft_email` - Generate personalized email templates
- `create_email_campaign` - Create multi-recipient campaigns
- `monitor_campaign_responses` - Track email engagement

### MCP Server Integration
Connect to external tools via MCP (Model Context Protocol) servers:
- API integrations
- Database connections
- Third-party services
- Custom business logic

## Development

### Project Structure
```
src/
├── agents/           # AI agent implementations
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── tools/           # Tool registry and MCP integration
├── workflows/       # Workflow engine
├── durable-objects/ # Durable Object implementations
└── websocket/       # WebSocket support with hibernation

examples/            # Usage examples and demos
```

### Adding New Tools

```typescript
// Register a new tool
agent.addTool({
  name: 'custom_tool',
  description: 'Description of what the tool does',
  parameters: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' }
    },
    required: ['param1']
  },
  execute: async (args) => {
    // Tool implementation
    return { result: 'success' };
  }
});
```

## Deployment

1. **Configure Cloudflare resources**:
   - Create KV namespace for agent state
   - Set up Durable Objects for execution
   - Configure Workers AI binding

2. **Deploy the application**:
   ```bash
   npm run deploy
   ```

3. **Set up environment variables** in Cloudflare dashboard

## Monitoring

- **Health check**: `GET /api/health`
- **Agent execution logs**: Available in Cloudflare Workers dashboard
- **Campaign metrics**: Email delivery and response tracking
- **Workflow status**: Execution progress and error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ on Cloudflare Workers
