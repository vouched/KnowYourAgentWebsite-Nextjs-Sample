// Next.js 16.4 still exports this check under its old Middleware name; its docs already call it unstable_doesProxyMatch
import { unstable_doesMiddlewareMatch as doesProxyMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "@/proxy";

import nextConfig from "../next.config";

describe("proxy.ts", () => {
  it.each(["/", "/blocked", "/any/page/at/all"])("checks %s", (url) => {
    expect(doesProxyMatch({ config, nextConfig, url })).toBe(true);
  });

  it.each([
    "/_next/static/chunks/main.js",
    "/_next/image?url=%2Ficon.svg&w=64&q=75",
    "/favicon.ico",
    "/icon.svg",
    "/healthz",
  ])("skips %s", (url) => {
    expect(doesProxyMatch({ config, nextConfig, url })).toBe(false);
  });
});
