// For your host's health probe. `proxy.ts` skips it, so probes never show up in your Checkpoint dashboard.
export function GET() {
  return new Response("Healthy", {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
