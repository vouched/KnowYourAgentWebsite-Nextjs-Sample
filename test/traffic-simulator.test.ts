import { VERSION } from "@kya-os/checkpoint-nextjs";
import { describe, expect, it } from "vitest";

import { checkpointConfig } from "@/checkpoint";
import { sendSimulatedTraffic } from "@/lib/simulation/traffic-simulator";
import { simulatedVisitors } from "@/lib/simulation/visitors";

import { TEST_API_KEY, TEST_PROJECT_ID } from "./support/requests";
import { vouched } from "./support/vouched";

const origin = new URL("http://localhost:3000");
const connected = checkpointConfig({ CHECKPOINT_PROJECT_ID: TEST_PROJECT_ID, CHECKPOINT_API_KEY: TEST_API_KEY });
const pixelOnly = checkpointConfig({ CHECKPOINT_PROJECT_ID: TEST_PROJECT_ID });

describe("Traffic simulator", () => {
  it("classifies every visitor like the real thing", async () => {
    const report = await sendSimulatedTraffic(origin, pixelOnly);

    expect(
      report.visits.map(({ visitorId, detectionClass, detectedAs, verdict }) => [
        visitorId,
        detectionClass,
        detectedAs,
        verdict,
      ]),
    ).toEqual([
      ["chatgpt", "AiAgent", "ChatGPT", "would-block"],
      ["claude", "AiAgent", "Claude", "would-block"],
      ["perplexity", "AiAgent", "Perplexity", "would-block"],
      ["gptbot", "Bot", "GPTBot", "would-block"],
      ["claudebot", "Bot", "ClaudeBot", "would-block"],
      ["googlebot", "Bot", "Googlebot", "allowed"],
      ["headless-chrome", "Bot", "Automation Tools", "would-block"],
      ["curl", "Bot", "Dev Tools", "allowed"],
      ["python-requests", "Bot", "HTTP Client", "allowed"],
    ]);
  });

  it("only classifies the visits locally without an API key", async () => {
    const report = await sendSimulatedTraffic(origin, pixelOnly);

    expect(report).toMatchObject({ delivery: "local-only", reportedCount: 0 });
    expect(vouched.reports).toEqual([]);
  });

  it("delivers every detection to your dashboard", async () => {
    const report = await sendSimulatedTraffic(origin, connected);

    expect(report).toMatchObject({ delivery: "delivered", reportedCount: simulatedVisitors.length });
    expect(vouched.reports.map((reported) => reported.body.context.userAgent)).toEqual(
      simulatedVisitors.map((visitor) => visitor.userAgent),
    );
  });

  it("reports exactly like the middleware does", async () => {
    await sendSimulatedTraffic(origin, connected);

    expect(vouched.reports[0]?.authorization).toBe(`Bearer ${TEST_API_KEY}`);
    expect(vouched.reports[0]?.body).toMatchObject({
      source: "middleware",
      sdk: { name: "@kya-os/checkpoint-nextjs", version: VERSION, runtime: "node" },
      context: { ipAddress: "127.0.0.1", path: "/", url: "http://localhost:3000/", method: "GET" },
      detection: { detectionClass: "ai_agent", agentName: "ChatGPT" },
    });
  });

  it("tells you when Vouched turns the detections away", async () => {
    vouched.respondWith = 401;

    const report = await sendSimulatedTraffic(origin, connected);

    expect(report).toMatchObject({ delivery: "rejected", failureStatus: 401 });
  });

  it.each([429, 503])("asks you to try again when Vouched answers %i", async (status) => {
    vouched.respondWith = status;

    const report = await sendSimulatedTraffic(origin, connected);

    expect(report).toMatchObject({ delivery: "retry-later", failureStatus: status });
  });

  it("tells you when Vouched can't be reached", async () => {
    vouched.respondWith = "offline";

    const report = await sendSimulatedTraffic(origin, connected);

    expect(report.delivery).toBe("unreachable");
  });

  it("blocks the same visitors in enforce mode", async () => {
    const report = await sendSimulatedTraffic(origin, { ...pixelOnly, enforcementMode: "enforce" });

    expect(report.visits.filter((visit) => visit.verdict === "blocked").map((visit) => visit.visitorId)).toEqual([
      "chatgpt",
      "claude",
      "perplexity",
      "gptbot",
      "claudebot",
      "headless-chrome",
    ]);
  });
});
