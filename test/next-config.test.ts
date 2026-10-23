import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config.ts", () => {
  // Bundled, the engine loads in proxy.ts but not in Server Functions, where Turbopack turns its path to its
  // WebAssembly file into a web URL. Sending simulated traffic then fails with EngineLoadError.
  it("loads the Checkpoint engine from node_modules, so the traffic simulator's Server Function can run it", () => {
    expect(nextConfig.serverExternalPackages).toContain("@kya-os/checkpoint-wasm-runtime");
  });
});
