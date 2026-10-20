import { describe, expect, it } from "vitest";

import {
  CHROME_HEADERS,
  CHROME_USER_AGENT,
  loadProxy,
  TEST_API_KEY,
  TEST_PROJECT_ID,
  userAgentOf,
  visit,
} from "./support/requests";
import { vouched } from "./support/vouched";

// These tests send requests through src/proxy.ts and read what Checkpoint reports to your dashboard. They pin the
// behavior of @kya-os/checkpoint-nextjs: when an update changes how traffic is classified, CI tells you before your
// users notice.
describe("Checkpoint detection", () => {
  it.each([
    { visitor: "chatgpt", detectionClass: "ai_agent", agent: "ChatGPT" },
    { visitor: "claude", detectionClass: "ai_agent", agent: "Claude" },
    { visitor: "perplexity", detectionClass: "ai_agent", agent: "Perplexity" },
    { visitor: "gptbot", detectionClass: "bot", agent: "GPTBot" },
    { visitor: "claudebot", detectionClass: "bot", agent: "ClaudeBot" },
    { visitor: "googlebot", detectionClass: "bot", agent: "Googlebot" },
    { visitor: "headless-chrome", detectionClass: "bot", agent: "Automation Tools" },
    { visitor: "curl", detectionClass: "bot", agent: "Dev Tools" },
    { visitor: "python-requests", detectionClass: "bot", agent: "HTTP Client" },
  ])("reports $visitor to your dashboard as $detectionClass $agent", async ({ visitor, detectionClass, agent }) => {
    const proxy = await loadProxy({ CHECKPOINT_PROJECT_ID: TEST_PROJECT_ID, CHECKPOINT_API_KEY: TEST_API_KEY });

    await visit(proxy, userAgentOf(visitor));

    expect(vouched.reports).toHaveLength(1);
    expect(vouched.reports[0]?.body.detection).toMatchObject({ detectionClass, agentName: agent });
    expect(vouched.reports[0]?.body.detection.confidence).toBeGreaterThan(99);
  });

  it("doesn't mistake a person's browser for an agent", async () => {
    const proxy = await loadProxy({ CHECKPOINT_PROJECT_ID: TEST_PROJECT_ID, CHECKPOINT_API_KEY: TEST_API_KEY });

    const response = await visit(proxy, CHROME_USER_AGENT, { headers: CHROME_HEADERS });

    expect(vouched.reports[0]?.body.detection.isAgent).toBe(false);
    expect(response.headers.get("x-checkpoint-would-have-been")).toBe("Permit");
  });

  it("reports with your API key, as the Next.js middleware", async () => {
    const proxy = await loadProxy({ CHECKPOINT_PROJECT_ID: TEST_PROJECT_ID, CHECKPOINT_API_KEY: TEST_API_KEY });

    await visit(proxy, userAgentOf("chatgpt"));

    expect(vouched.reports[0]?.authorization).toBe(`Bearer ${TEST_API_KEY}`);
    expect(vouched.reports[0]?.body).toMatchObject({
      source: "middleware",
      sdk: { name: "@kya-os/checkpoint-nextjs", runtime: "node" },
      context: { path: "/", method: "GET", userAgent: userAgentOf("chatgpt") },
    });
  });

  it("classifies requests without an API key, but only locally", async () => {
    const proxy = await loadProxy({ CHECKPOINT_PROJECT_ID: TEST_PROJECT_ID });

    const response = await visit(proxy, userAgentOf("chatgpt"));

    expect(response.headers.get("x-checkpoint-would-have-been")).toBe("Block");
    // Not even a request for your dashboard's policies, which Vouched would turn away without an API key
    expect(vouched.requests.filter((request) => request.includes("kya.vouched.id"))).toEqual([]);
  });

  it("runs before you add any keys", async () => {
    const proxy = await loadProxy();

    const response = await visit(proxy, userAgentOf("gptbot"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-checkpoint-would-have-been")).toBe("Block");
  });
});
