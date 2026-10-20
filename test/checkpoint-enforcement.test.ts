import { withCheckpoint } from "@kya-os/checkpoint-nextjs";
import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { checkpointConfig } from "@/checkpoint";

import { CHROME_HEADERS, CHROME_USER_AGENT, loadProxy, userAgentOf, visit } from "./support/requests";

describe("Checkpoint enforcement", () => {
  describe("in observe mode, the sample's default", () => {
    it.each(["chatgpt", "claude", "perplexity", "gptbot", "claudebot", "headless-chrome"])(
      "lets %s through, but flags what it would have done",
      async (visitor) => {
        const proxy = await loadProxy();

        const response = await visit(proxy, userAgentOf(visitor));

        expect(isRewrite(response)).toBe(false);
        expect(response.headers.get("x-checkpoint-mode")).toBe("observe");
        expect(response.headers.get("x-checkpoint-would-have-been")).toBe("Block");
      },
    );
  });

  describe("in enforce mode", () => {
    const enforce = () => withCheckpoint({ ...checkpointConfig({}), enforcementMode: "enforce" });

    it.each(["chatgpt", "claude", "perplexity", "gptbot", "claudebot", "headless-chrome"])(
      "shows %s the /blocked page",
      async (visitor) => {
        const response = await visit(enforce(), userAgentOf(visitor));

        expect(isRewrite(response)).toBe(true);
        expect(getRewrittenUrl(response)).toBe("http://localhost:3000/blocked");
        expect(response.headers.get("x-checkpoint-decision")).toBe("block");
      },
    );

    it("answers an agent that asks for JSON with 403 Forbidden", async () => {
      const response = await visit(enforce(), userAgentOf("chatgpt"), { accept: "application/json" });

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ reason: "Tier3UAMatch", pattern_id: "ChatGPT" });
    });

    it.each(["googlebot", "curl", "python-requests"])("lets %s through", async (visitor) => {
      const response = await visit(enforce(), userAgentOf(visitor));

      expect(isRewrite(response)).toBe(false);
      expect(response.headers.get("x-checkpoint-decision")).toBe("permit");
    });

    it("never blocks people", async () => {
      const response = await visit(enforce(), CHROME_USER_AGENT, { headers: CHROME_HEADERS });

      expect(isRewrite(response)).toBe(false);
      expect(response.headers.get("x-checkpoint-decision")).toBe("permit");
    });
  });
});
