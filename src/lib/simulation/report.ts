/** What Checkpoint did with one simulated visit */
export interface SimulatedVisit {
  readonly visitorId: string;
  /** The engine's classification: `AiAgent`, `Bot`, `Human`, `IncompleteData` or `Unknown` */
  readonly detectionClass: string;
  /** The agent or tool Checkpoint recognized, like `ChatGPT` or `Dev Tools` */
  readonly detectedAs?: string;
  /** From 0 to 100 */
  readonly confidence: number;
  /** In observe mode, a visit Checkpoint would block still gets through, so it reads `would-block` */
  readonly verdict: "allowed" | "would-block" | "blocked";
}

/** Whether Vouched received the detections */
export type DeliveryStatus =
  /** There's no API key, so Checkpoint classified the visits without reporting them */
  | "local-only"
  /** Vouched accepted every detection */
  | "delivered"
  /** Vouched turned the detections away, usually because of a wrong API key */
  | "rejected"
  /** Vouched asked to try again later (HTTP 429 or 5xx) */
  | "retry-later"
  /** The detections never reached Vouched, for example because the machine is offline */
  | "unreachable";

export interface SimulationReport {
  readonly visits: readonly SimulatedVisit[];
  readonly delivery: DeliveryStatus;
  /** How many detections were sent to Vouched */
  readonly reportedCount: number;
  /** The HTTP status Vouched answered with, when it didn't accept every detection */
  readonly failureStatus?: number;
}
