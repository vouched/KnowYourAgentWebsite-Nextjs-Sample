import { NextRequest, type NextResponse } from "next/server";
import { vi } from "vitest";

import { simulatedVisitors } from "@/lib/simulation/visitors";

export const TEST_PROJECT_ID = "acme-storefront";
export const TEST_API_KEY = "sk_test_0123456789abcdef0123456789abcdef";

export const CHROME_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

type Middleware = (
  request: NextRequest,
  event?: { waitUntil(promise: Promise<unknown>): void },
) => Promise<NextResponse>;

/** Loads `src/proxy.ts` the way Next.js does when the app starts, with the given environment variables */
export async function loadProxy(env: Record<string, string> = {}): Promise<Middleware> {
  for (const [name, value] of Object.entries(env)) {
    vi.stubEnv(name, value);
  }

  vi.resetModules();
  return (await import("@/proxy")).default;
}

/** Sends a request through the middleware and waits until any report it made has reached the fake Vouched API */
export async function visit(
  middleware: Middleware,
  userAgent: string,
  options: { accept?: string; headers?: Record<string, string> } = {},
): Promise<NextResponse> {
  const pending: Promise<unknown>[] = [];
  const request = new NextRequest("http://localhost:3000/", {
    headers: {
      "user-agent": userAgent,
      accept: options.accept ?? "text/html,application/xhtml+xml",
      ...options.headers,
    },
  });

  const response = await middleware(request, { waitUntil: (promise) => pending.push(promise) });
  await Promise.all(pending);
  return response;
}

export function userAgentOf(visitorId: string): string {
  const visitor = simulatedVisitors.find((candidate) => candidate.id === visitorId);
  if (!visitor) {
    throw new Error(`There's no simulated visitor named ${visitorId}.`);
  }

  return visitor.userAgent;
}

// What a real Chrome browser sends when you open a page
export const CHROME_HEADERS = {
  "accept-language": "en-US,en;q=0.9",
  "accept-encoding": "gzip, deflate, br, zstd",
  "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
};
