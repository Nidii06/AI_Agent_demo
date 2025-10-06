import { AIChatAgent } from "agents-sdk";

export interface Env {
  AI: any;
  AGENT_STATE?: KVNamespace;
}

export class ConferenceFollowUpAgent extends AIChatAgent {
  async onChatMessage() {
    // Handle conference follow-up requests
    return new Response("I'll help you follow up with conference customers!");
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const agent = new ConferenceFollowUpAgent();
    return agent.handleRequest(request, env, ctx);
  },
};