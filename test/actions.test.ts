import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { connectProject, sendSimulatedTraffic } from "@/app/actions";

import { TEST_API_KEY, TEST_PROJECT_ID } from "./support/requests";
import { vouched } from "./support/vouched";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const local = {
  host: "localhost:3000",
  "x-forwarded-host": "localhost:3000",
  "x-forwarded-for": "::1",
  "x-forwarded-proto": "http",
};
const remote = { ...local, "x-forwarded-for": "192.168.1.20" };

function requestFrom(requestHeaders: Record<string, string>) {
  vi.mocked(headers).mockResolvedValue(new Headers(requestHeaders) as Awaited<ReturnType<typeof headers>>);
}

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }

  return formData;
}

describe("Server Functions", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), "know-your-agent-"));
    vi.spyOn(process, "cwd").mockReturnValue(directory);
    vi.stubEnv("NODE_ENV", "development");
    requestFrom(local);
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  describe("connectProject", () => {
    it("saves your keys to .env.local and refreshes the page", async () => {
      // What `next dev` does once it notices the updated .env.local
      vi.stubEnv("CHECKPOINT_PROJECT_ID", TEST_PROJECT_ID);
      vi.stubEnv("CHECKPOINT_API_KEY", TEST_API_KEY);

      const state = await connectProject(
        { status: "idle" },
        form({ projectId: TEST_PROJECT_ID, apiKey: TEST_API_KEY }),
      );

      expect(state).toEqual({ status: "saved" });
      expect(await readFile(path.join(directory, ".env.local"), "utf8")).toBe(
        `CHECKPOINT_PROJECT_ID=${TEST_PROJECT_ID}\nCHECKPOINT_API_KEY=${TEST_API_KEY}\n`,
      );
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });

    it("removes the API key you saved for a previous project", async () => {
      await writeFile(
        path.join(directory, ".env.local"),
        `CHECKPOINT_PROJECT_ID=old\nCHECKPOINT_API_KEY=${TEST_API_KEY}\n`,
      );
      vi.stubEnv("CHECKPOINT_PROJECT_ID", TEST_PROJECT_ID);
      vi.stubEnv("CHECKPOINT_API_KEY", "");

      const state = await connectProject({ status: "idle" }, form({ projectId: TEST_PROJECT_ID, apiKey: "" }));

      expect(state).toEqual({ status: "saved" });
      expect(await readFile(path.join(directory, ".env.local"), "utf8")).toBe(
        `CHECKPOINT_PROJECT_ID=${TEST_PROJECT_ID}\n`,
      );
    });

    it("explains what's wrong without saving anything", async () => {
      const state = await connectProject({ status: "idle" }, form({ projectId: "not a project id" }));

      expect(state).toEqual({
        status: "invalid",
        projectId: "not a project id",
        errors: { projectId: "A Project ID only contains letters, numbers, dashes and underscores." },
      });
      await expect(readFile(path.join(directory, ".env.local"), "utf8")).rejects.toThrow();
    });

    it("refuses requests from other machines", async () => {
      requestFrom(remote);

      const state = await connectProject({ status: "idle" }, form({ projectId: TEST_PROJECT_ID }));

      expect(state.status).toBe("failed");
      await expect(readFile(path.join(directory, ".env.local"), "utf8")).rejects.toThrow();
    });
  });

  describe("sendSimulatedTraffic", () => {
    it("sends every visitor and reports them to your dashboard", async () => {
      vi.stubEnv("CHECKPOINT_PROJECT_ID", TEST_PROJECT_ID);
      vi.stubEnv("CHECKPOINT_API_KEY", TEST_API_KEY);

      const state = await sendSimulatedTraffic();

      expect(state).toMatchObject({ status: "sent", report: { delivery: "delivered", reportedCount: 9 } });
      expect(vouched.reports[0]?.body.context.url).toBe("http://localhost:3000/");
    });

    it("asks you to connect your project first", async () => {
      vi.stubEnv("CHECKPOINT_PROJECT_ID", "");

      expect(await sendSimulatedTraffic()).toEqual({
        status: "unavailable",
        message: "Connect your project in step 1 first.",
      });
    });

    it("refuses requests from other machines", async () => {
      vi.stubEnv("CHECKPOINT_PROJECT_ID", TEST_PROJECT_ID);
      requestFrom(remote);

      expect((await sendSimulatedTraffic()).status).toBe("unavailable");
      expect(vouched.reports).toEqual([]);
    });
  });
});
