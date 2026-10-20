import { describe, expect, it } from "vitest";

import { deliveryMessage, verdictBadge, verdictDetail, walkthroughSteps } from "@/lib/simulation/presentation";
import type { SimulatedVisit, SimulationReport } from "@/lib/simulation/report";

function report(overrides: Partial<SimulationReport>): SimulationReport {
  return { visits: [], delivery: "delivered", reportedCount: 9, ...overrides };
}

describe("Walkthrough", () => {
  it("starts at step 1", () => {
    expect(walkthroughSteps({ hasProjectId: false, isSaving: false })).toEqual({
      connect: "current",
      simulate: "upcoming",
      dashboard: "upcoming",
    });
  });

  it("moves on to step 2 once your project is connected", () => {
    expect(walkthroughSteps({ hasProjectId: true, isSaving: false })).toEqual({
      connect: "complete",
      simulate: "current",
      dashboard: "upcoming",
    });
  });

  it("stays on step 1 while your keys are saving", () => {
    expect(walkthroughSteps({ hasProjectId: true, isSaving: true }).connect).toBe("current");
  });

  it("checks off step 2 once Vouched accepts the traffic", () => {
    expect(walkthroughSteps({ hasProjectId: true, isSaving: false, delivery: "delivered" })).toEqual({
      connect: "complete",
      simulate: "complete",
      dashboard: "current",
    });
  });

  it.each(["local-only", "rejected", "retry-later", "unreachable"] as const)(
    "doesn't check off step 2 when the traffic is %s",
    (delivery) => {
      expect(walkthroughSteps({ hasProjectId: true, isSaving: false, delivery })).toEqual({
        connect: "complete",
        simulate: "current",
        dashboard: "upcoming",
      });
    },
  );

  it("says an API key is required to send traffic to your dashboard, without a checkmark", () => {
    expect(deliveryMessage(report({ delivery: "local-only", reportedCount: 0 }))).toEqual({
      tone: "warning",
      icon: "lock",
      text: "Sending simulated traffic to your dashboard requires an API key. Add yours in step 1, then send again.",
    });
  });

  it("confirms delivery with a checkmark", () => {
    expect(deliveryMessage(report({ delivery: "delivered" }))).toEqual({
      tone: "success",
      icon: "check",
      text: "Delivered 9 detections to your Checkpoint dashboard.",
    });
  });

  it("points you at your API key when Vouched turns the detections away", () => {
    expect(deliveryMessage(report({ delivery: "rejected", failureStatus: 401 })).text).toBe(
      "Vouched didn't accept the detections (HTTP 401). Double-check your API key in step 1, then send again.",
    );
  });

  it.each<[Partial<SimulatedVisit>, string]>([
    [{ detectedAs: "ChatGPT", confidence: 99.99999 }, "ChatGPT · 100%"],
    [{ detectedAs: "Googlebot", confidence: 99.4 }, "Googlebot · 99%"],
    [{ detectedAs: undefined, confidence: 0.05 }, "<1%"],
  ])("describes %o as %j", (visit, detail) => {
    expect(
      verdictDetail({ visitorId: "visitor", detectionClass: "Bot", confidence: 0, verdict: "allowed", ...visit }),
    ).toBe(detail);
  });

  it.each([
    ["would-block", { label: "Would be blocked", tone: "would-block" }],
    ["blocked", { label: "Blocked", tone: "blocked" }],
    ["allowed", undefined],
  ] as const)("labels a visit that's %s", (verdict, badge) => {
    expect(verdictBadge({ visitorId: "visitor", detectionClass: "AiAgent", confidence: 100, verdict })).toEqual(badge);
  });
});
