import type { IconName } from "@/components/icon";
import type { DeliveryStatus, SimulatedVisit, SimulationReport } from "@/lib/simulation/report";

export type StepState = "complete" | "current" | "upcoming";

/**
 * Where you are in the three steps. Sending simulated traffic only counts once Vouched accepted it: without an API
 * key, the visits never leave this app, so step 2 isn't checked off.
 */
export function walkthroughSteps(options: { hasProjectId: boolean; isSaving: boolean; delivery?: DeliveryStatus }): {
  connect: StepState;
  simulate: StepState;
  dashboard: StepState;
} {
  const isConnected = options.hasProjectId && !options.isSaving;
  const isDelivered = options.delivery === "delivered";

  return {
    connect: isConnected ? "complete" : "current",
    simulate: isDelivered ? "complete" : isConnected ? "current" : "upcoming",
    dashboard: isDelivered ? "current" : "upcoming",
  };
}

export interface DeliveryMessage {
  readonly tone: "success" | "info" | "warning";
  readonly icon: IconName;
  readonly text: string;
}

export function deliveryMessage(report: SimulationReport): DeliveryMessage {
  switch (report.delivery) {
    case "delivered":
      return {
        tone: "success",
        icon: "check",
        text: `Delivered ${report.reportedCount} detections to your Checkpoint dashboard.`,
      };
    case "local-only":
      return {
        tone: "warning",
        icon: "lock",
        text: "Sending simulated traffic to your dashboard requires an API key. Add yours in step 1, then send again.",
      };
    case "rejected":
      return {
        tone: "warning",
        icon: "alert",
        text: `Vouched didn't accept the detections (HTTP ${report.failureStatus}). Double-check your API key in step 1, then send again.`,
      };
    case "retry-later":
      return {
        tone: "info",
        icon: "refresh",
        text: `Vouched asked to try again later (HTTP ${report.failureStatus}). Send again in a moment.`,
      };
    case "unreachable":
      return {
        tone: "warning",
        icon: "alert",
        text: "The detections didn't reach Vouched. Check your internet connection, then send again.",
      };
  }
}

export function verdictLabel(visit: SimulatedVisit): string {
  switch (visit.detectionClass) {
    case "AiAgent":
      return "AI agent";
    case "Bot":
      return "Bot";
    case "Human":
      return "Human";
    case "IncompleteData":
      return "Inconclusive";
    default:
      return "Unknown";
  }
}

export function verdictTone(visit: SimulatedVisit): "agent" | "bot" | "human" | "muted" {
  switch (visit.detectionClass) {
    case "AiAgent":
      return "agent";
    case "Bot":
      return "bot";
    case "Human":
      return "human";
    default:
      return "muted";
  }
}

export function verdictDetail(visit: SimulatedVisit): string {
  const confidence = visit.confidence > 0 && visit.confidence < 1 ? "<1%" : `${Math.round(visit.confidence)}%`;
  return visit.detectedAs ? `${visit.detectedAs} · ${confidence}` : confidence;
}

/** In observe mode, Checkpoint lets every visitor through, so it shows what enforce mode would block */
export function verdictBadge(visit: SimulatedVisit): { label: string; tone: "would-block" | "blocked" } | undefined {
  switch (visit.verdict) {
    case "would-block":
      return { label: "Would be blocked", tone: "would-block" };
    case "blocked":
      return { label: "Blocked", tone: "blocked" };
    default:
      return undefined;
  }
}
