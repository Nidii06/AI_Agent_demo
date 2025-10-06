import { ConferenceFollowUpAgent } from "./conference-agent.js";

export interface Env {
  AI: any;
  AGENT_STATE?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const agent = new ConferenceFollowUpAgent();
    return agent.handleRequest(request, env, ctx);
  },
};