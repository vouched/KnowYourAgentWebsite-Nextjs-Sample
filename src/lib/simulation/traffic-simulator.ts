import "server-only";

import { type CheckpointConfig, VERSION, withCheckpoint } from "@kya-os/checkpoint-nextjs";
import type { VerifyResult } from "@kya-os/checkpoint-wasm-runtime/engine";
import { buildLogDetectionPayload } from "@kya-os/checkpoint-wasm-runtime/reporter";
import { NextRequest, type NextResponse } from "next/server";

import type { DeliveryStatus, SimulatedVisit, SimulationReport } from "@/lib/simulation/report";
import { type SimulatedVisitor, simulatedVisitors } from "@/lib/simulation/visitors";

const DEFAULT_BASE_URL = "https://kya.vouched.id";
const REPORT_TIMEOUT_MILLISECONDS = 10_000;

/**
 * Sends each simulated visitor through the Checkpoint engine, configured exactly like `proxy.ts`, then reports the
 * detections to your dashboard.
 *
 * The middleware reports in the background and never surfaces an error, which is what you want for live traffic. This
 * page wants to tell you whether Vouched accepted the detections, so it runs the engine without your API key and sends
 * the reports itself, using the payload the middleware builds.
 */
export async function sendSimulatedTraffic(origin: URL, config: CheckpointConfig): Promise<SimulationReport> {
  const results = new Map<NextRequest, VerifyResult>();
  const engine = withCheckpoint({
    ...config,
    // Reported below instead, so they aren't sent twice
    apiKey: undefined,
    // Your dashboard's policies are fetched with your API key, so the engine can't load them here
    projectId: undefined,
    onResult: (result, request) => {
      results.set(request, result);
    },
  });

  const classified: { visitor: SimulatedVisitor; result: VerifyResult }[] = [];
  const visits: SimulatedVisit[] = [];

  for (const visitor of simulatedVisitors) {
    const request = new NextRequest(new URL("/", origin), {
      headers: { "user-agent": visitor.userAgent, accept: "text/html,application/xhtml+xml" },
    });

    const response = await engine(request);
    const result = results.get(request);
    if (!result) {
      throw new Error(`Vouched KYA didn't classify the ${visitor.name} visit.`);
    }

    classified.push({ visitor, result });
    visits.push(toVisit(visitor, result, response));
  }

  if (!config.apiKey) {
    return { visits, delivery: "local-only", reportedCount: 0 };
  }

  const endpoint = `${(config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "")}/api/v1/log-detection`;
  const sdk = { name: "@kya-os/checkpoint-nextjs", version: VERSION, runtime: "node" as const };
  const statuses = await Promise.all(
    classified.map(({ visitor, result }) =>
      report(
        endpoint,
        config.apiKey!,
        buildLogDetectionPayload(
          result,
          {
            userAgent: visitor.userAgent,
            ipAddress: "127.0.0.1",
            path: "/",
            url: new URL("/", origin).href,
            method: "GET",
          },
          sdk,
        ),
      ),
    ),
  );

  return { visits, reportedCount: statuses.length, ...deliveryStatus(statuses) };
}

function toVisit(visitor: SimulatedVisitor, result: VerifyResult, response: NextResponse): SimulatedVisit {
  const detail = result.detectionDetail;
  const isAllowed = result.decision.kind === "Permit";
  // In observe mode the engine still decides, but the response always lets the visitor through
  const wasBlocked =
    !isAllowed && result.enforcementMode === "enforce" && response.headers.has("x-checkpoint-decision");

  return {
    visitorId: visitor.id,
    detectionClass: detail.detectionClass.type,
    detectedAs: detail.detectedAgent?.name,
    confidence: detail.confidence,
    verdict: isAllowed ? "allowed" : wasBlocked ? "blocked" : "would-block",
  };
}

async function report(endpoint: string, apiKey: string, payload: unknown): Promise<number | "unreachable"> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REPORT_TIMEOUT_MILLISECONDS),
    });

    return response.status;
  } catch {
    return "unreachable";
  }
}

function deliveryStatus(statuses: (number | "unreachable")[]): {
  delivery: DeliveryStatus;
  failureStatus?: number;
} {
  const rejected = statuses.find(
    (status): status is number =>
      typeof status === "number" && status >= 400 && status < 500 && status !== 408 && status !== 429,
  );
  if (rejected !== undefined) {
    return { delivery: "rejected", failureStatus: rejected };
  }

  const busy = statuses.find((status): status is number => typeof status === "number" && status >= 400);
  if (busy !== undefined) {
    return { delivery: "retry-later", failureStatus: busy };
  }

  return statuses.includes("unreachable") ? { delivery: "unreachable" } : { delivery: "delivered" };
}
