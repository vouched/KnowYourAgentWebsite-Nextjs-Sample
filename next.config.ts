import type { NextConfig } from "next";

// The Checkpoint pixel loads from, and reports to, this origin
const vouchedOrigin = "https://kya.vouched.id";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js streams each page's data in inline scripts, so they can't be limited to files
  `script-src 'self' 'unsafe-inline' ${vouchedOrigin}`,
  `connect-src 'self' ${vouchedOrigin}`,
  "img-src 'self' data:",
  "style-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // `next dev` relies on eval and websockets for Fast Refresh, so the policy only applies to production builds
  ...(process.env.NODE_ENV === "development" ? [] : [{ key: "Content-Security-Policy", value: contentSecurityPolicy }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Load the Checkpoint engine from node_modules instead of bundling it. In Server Functions and Server Components,
  // Turbopack turns the engine's own path to its WebAssembly file into a web URL, so the engine fails to load there
  serverExternalPackages: ["@kya-os/checkpoint-wasm-runtime"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
