import { beforeEach, vi } from "vitest";

import { vouched } from "./vouched";

// No test reaches the real Vouched API: every request Checkpoint makes goes to the fake instead
beforeEach(() => {
  vouched.reset();
  vi.stubGlobal("fetch", vouched.fetch);
});
