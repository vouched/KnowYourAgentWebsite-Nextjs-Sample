export interface ReportedDetection {
  readonly authorization: string | null;
  // The JSON body Checkpoint sends to /api/v1/log-detection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly body: any;
}

/**
 * Stands in for Vouched's API, so tests never touch the network. It records every detection Checkpoint reports, serves
 * your project's policy to requests that carry an API key, as Vouched does, and answers everything else, like requests
 * for Checkpoint's latest detection rules, with a 404.
 */
class FakeVouched {
  readonly reports: ReportedDetection[] = [];
  readonly requests: string[] = [];

  /** The status Vouched answers reports with, or "offline" to make it unreachable */
  respondWith: number | "offline" = 200;

  /** Turns away the API key when Checkpoint fetches your project's policy, as Vouched does with a revoked key */
  rejectApiKey = false;

  readonly fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    this.requests.push(`${request.method} ${request.url}`);

    const { pathname } = new URL(request.url);

    // A project with no policies deployed yet. Vouched answers 401 without an API key, and since
    // @kya-os/checkpoint-nextjs 1.11.0, a policy the SDK can't fetch makes it answer every request with a 503.
    if (pathname.startsWith("/api/internal/policies/")) {
      return request.headers.get("authorization") && !this.rejectApiKey
        ? Response.json({ blockThreshold: 70, enabled: true })
        : new Response("Unauthorized", { status: 401 });
    }

    if (pathname !== "/api/v1/log-detection") {
      return new Response("Not found", { status: 404 });
    }

    if (this.respondWith === "offline") {
      throw new TypeError("fetch failed");
    }

    this.reports.push({ authorization: request.headers.get("authorization"), body: await request.json() });
    return new Response(null, { status: this.respondWith });
  };

  reset() {
    this.reports.length = 0;
    this.requests.length = 0;
    this.respondWith = 200;
    this.rejectApiKey = false;
  }
}

export const vouched = new FakeVouched();
