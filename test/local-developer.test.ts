import { describe, expect, it } from "vitest";

import { isLocalDeveloperRequest } from "@/lib/local-developer";

// What Next.js' dev server sees when you browse to http://localhost:3000 on the machine running it
const local = { host: "localhost:3000", "x-forwarded-host": "localhost:3000", "x-forwarded-for": "::1" };

function isAllowed(headers: Record<string, string>, environment = "development"): boolean {
  return isLocalDeveloperRequest(new Headers(headers), environment);
}

describe("Developer tools", () => {
  it("work on your own machine", () => {
    expect(isAllowed(local)).toBe(true);
  });

  it.each(["127.0.0.1", "::ffff:127.0.0.1", "::1"])("work from the loopback address %s", (address) => {
    expect(isAllowed({ ...local, "x-forwarded-for": address })).toBe(true);
  });

  it.each(["127.0.0.1:3000", "[::1]:3000", "LOCALHOST:3000"])("work at %s", (host) => {
    expect(isAllowed({ host, "x-forwarded-host": host, "x-forwarded-for": "127.0.0.1" })).toBe(true);
  });

  it.each(["production", "test"])("are off in %s", (environment) => {
    expect(isAllowed(local, environment)).toBe(false);
  });

  it("turn away other machines", () => {
    expect(isAllowed({ ...local, "x-forwarded-for": "192.168.1.20" })).toBe(false);
  });

  it("turn away a request that only claims to be local", () => {
    expect(isAllowed({ ...local, "x-forwarded-for": "127.0.0.1, 203.0.113.7" })).toBe(false);
  });

  it("turn away a request without the address Next.js records", () => {
    expect(isAllowed({ host: "localhost:3000" })).toBe(false);
  });

  it("turn away pages that point their own hostname at your machine", () => {
    expect(isAllowed({ ...local, host: "rebinding.example:3000", "x-forwarded-host": "rebinding.example:3000" })).toBe(
      false,
    );
  });

  it("turn away a dev tunnel that forwards a public hostname", () => {
    expect(isAllowed({ ...local, "x-forwarded-host": "my-app.tunnel.example" })).toBe(false);
  });

  it.each([
    "forwarded",
    "via",
    "x-forwarded-server",
    "x-original-host",
    "x-real-ip",
    "cf-connecting-ip",
    "true-client-ip",
  ])("turn away requests that came through a proxy (%s)", (header) => {
    expect(isAllowed({ ...local, [header]: "127.0.0.1" })).toBe(false);
  });
});
