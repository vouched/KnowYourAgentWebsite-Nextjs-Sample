import { AsyncLocalStorage } from "node:async_hooks";

import { beforeEach, vi } from "vitest";

import { vouched } from "./vouched";

// Next.js puts AsyncLocalStorage on globalThis before it loads anything else, and its test helpers rely on it. Without
// it, the first console.warn after importing them throws "AsyncLocalStorage accessed in runtime where it is not
// available", and Checkpoint warns once when it starts.
(globalThis as { AsyncLocalStorage?: typeof AsyncLocalStorage }).AsyncLocalStorage ??= AsyncLocalStorage;

// No test reaches the real Vouched API: every request Checkpoint makes goes to the fake instead
beforeEach(() => {
  vouched.reset();
  vi.stubGlobal("fetch", vouched.fetch);
});
