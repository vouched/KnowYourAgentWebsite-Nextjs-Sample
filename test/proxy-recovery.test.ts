import { describe, expect, it, vi } from "vitest";

import {
  CHROME_HEADERS,
  CHROME_USER_AGENT,
  LOCAL_DEVELOPER_HEADERS,
  loadProxy,
  TEST_API_KEY,
  TEST_PROJECT_ID,
  visit,
} from "./support/requests";
import { vouched } from "./support/vouched";

// Since @kya-os/checkpoint-nextjs 1.11.0, Checkpoint answers every request with a 503 when it can't load your
// dashboard's policies, which is what happens when Vouched turns away your API key
describe("When Vouched rejects your saved API key", () => {
  const savedKeys = { CHECKPOINT_PROJECT_ID: TEST_PROJECT_ID, CHECKPOINT_API_KEY: TEST_API_KEY };
  const browsing = { headers: { ...CHROME_HEADERS, ...LOCAL_DEVELOPER_HEADERS } };

  it("still shows you the page in development, so you can paste a new key", async () => {
    vouched.rejectApiKey = true;
    vi.stubEnv("NODE_ENV", "development");
    const proxy = await loadProxy(savedKeys);

    const response = await visit(proxy, CHROME_USER_AGENT, browsing);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("still lets you save the new key in development", async () => {
    vouched.rejectApiKey = true;
    vi.stubEnv("NODE_ENV", "development");
    const proxy = await loadProxy(savedKeys);

    // Saving your keys is a Server Function, which the browser calls with a POST to the page
    const response = await visit(proxy, CHROME_USER_AGENT, {
      method: "POST",
      headers: { ...browsing.headers, "next-action": "connectProject" },
    });

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("still fails closed for requests from other machines", async () => {
    vouched.rejectApiKey = true;
    vi.stubEnv("NODE_ENV", "development");
    const proxy = await loadProxy(savedKeys);

    const response = await visit(proxy, CHROME_USER_AGENT, {
      headers: { ...browsing.headers, "x-forwarded-for": "192.168.1.20" },
    });

    expect(response.status).toBe(503);
  });

  it("still fails closed in production", async () => {
    vouched.rejectApiKey = true;
    vi.stubEnv("NODE_ENV", "production");
    const proxy = await loadProxy(savedKeys);

    const response = await visit(proxy, CHROME_USER_AGENT, browsing);

    expect(response.status).toBe(503);
  });
});
