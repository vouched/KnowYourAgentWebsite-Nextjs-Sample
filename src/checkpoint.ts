import type { CheckpointConfig } from "@kya-os/checkpoint-nextjs";

import { type Environment, readCredentials } from "@/lib/credentials";

/**
 * How Checkpoint handles your traffic. `proxy.ts` applies it to every request, and the home page's traffic simulator
 * uses it too. See https://kya.vouched.id/docs/enforce/middleware for every option.
 */
export function checkpointConfig(env: Environment = process.env): CheckpointConfig {
  const { projectId, apiKey } = readCredentials(env);

  return {
    // 'observe' classifies every request but never blocks one. Change it to 'enforce' to block the visitors that the
    // engine flags with `tier3Action` below.
    enforcementMode: "observe",

    // Flags known AI agents, AI crawlers and headless browsers. In observe mode, that only shows up in your dashboard
    // and in the X-Checkpoint-Would-Have-Been response header.
    engineConfig: { tier3Action: "block" },

    // Reports every request to your dashboard. Without it, Checkpoint still classifies requests, but only locally.
    apiKey,

    // Applies the policies you deploy in your dashboard. Vouched only shares them with your API key, so without one,
    // leave it out instead of failing to fetch them on every request.
    projectId: apiKey ? projectId : undefined,

    // Only for a staging or self-hosted Checkpoint dashboard
    baseUrl: env.CHECKPOINT_BASE_URL || undefined,
  };
}
