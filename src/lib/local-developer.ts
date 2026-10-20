import "server-only";

// Reverse proxies, dev tunnels and CDNs add at least one of these when they forward a request
const PROXY_HEADERS = [
  "forwarded",
  "via",
  "x-forwarded-server",
  "x-original-host",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
];

/**
 * Decides whether the page's developer tools, saving your keys and sending simulated traffic, may be used.
 *
 * They write to your disk and to your Vouched dashboard, so they only work in development, and only for requests made
 * on the machine running the app:
 *
 * - `npm run dev` binds the dev server to localhost, so other machines can't connect. Plain `next dev` listens on every
 *   network interface, and Next.js keeps an `X-Forwarded-For` header that a client sends instead of replacing it.
 * - The `Host` header must name localhost, which stops pages that use DNS rebinding from reaching the tools.
 * - Requests that came through a proxy are turned away, which keeps the tools out of reach of dev tunnels and reverse
 *   proxies, since those connect from localhost too.
 */
export function isLocalDeveloperRequest(
  headers: Headers,
  environment: string | undefined = process.env.NODE_ENV,
): boolean {
  if (environment !== "development") {
    return false;
  }

  const host = headers.get("host");
  // Next.js sets X-Forwarded-For to the address of the connection, unless the request already has one
  const forwardedFor = headers.get("x-forwarded-for");

  return (
    isLoopbackHost(host) &&
    isLoopbackHost(headers.get("x-forwarded-host") ?? host) &&
    forwardedFor !== null &&
    forwardedFor.split(",").every((address) => isLoopbackAddress(address.trim())) &&
    !PROXY_HEADERS.some((name) => headers.has(name))
  );
}

function isLoopbackHost(host: string | null): boolean {
  if (!host) {
    return false;
  }

  const hostname = host.startsWith("[") ? host.slice(1, host.indexOf("]")) : host.replace(/:\d+$/, "");
  return hostname.toLowerCase() === "localhost" || isLoopbackAddress(hostname);
}

function isLoopbackAddress(address: string): boolean {
  const ipv4 = address.replace(/^::ffff:/i, "");
  return /^127(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(ipv4) || address === "::1" || address === "0:0:0:0:0:0:0:1";
}
