import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { envFilePath, updateEnvFile, waitForEnvironment } from "@/lib/env-file";

describe(".env.local", () => {
  let directory: string;
  let file: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), "know-your-agent-"));
    file = envFilePath(directory);
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("is created with your keys", async () => {
    await updateEnvFile(file, { CHECKPOINT_PROJECT_ID: "acme-storefront", CHECKPOINT_API_KEY: "sk_test" });

    expect(await readFile(file, "utf8")).toBe("CHECKPOINT_PROJECT_ID=acme-storefront\nCHECKPOINT_API_KEY=sk_test\n");
  });

  it.skipIf(process.platform === "win32")("can only be read by you", async () => {
    await updateEnvFile(file, { CHECKPOINT_API_KEY: "sk_test" });

    expect((await stat(file)).mode & 0o777).toBe(0o600);
  });

  it("keeps your other settings and comments where they were", async () => {
    await writeFile(
      file,
      "# My app\nDATABASE_URL=postgres://localhost\nCHECKPOINT_PROJECT_ID=old\nexport FEATURE=on\n",
    );

    await updateEnvFile(file, { CHECKPOINT_PROJECT_ID: "acme-storefront", CHECKPOINT_API_KEY: "sk_test" });

    expect(await readFile(file, "utf8")).toBe(
      "# My app\nDATABASE_URL=postgres://localhost\nCHECKPOINT_PROJECT_ID=acme-storefront\nexport FEATURE=on\nCHECKPOINT_API_KEY=sk_test\n",
    );
  });

  it("removes a key you clear", async () => {
    await writeFile(file, "CHECKPOINT_PROJECT_ID=acme-storefront\nCHECKPOINT_API_KEY=sk_old\n");

    await updateEnvFile(file, { CHECKPOINT_PROJECT_ID: "acme-storefront", CHECKPOINT_API_KEY: undefined });

    expect(await readFile(file, "utf8")).toBe("CHECKPOINT_PROJECT_ID=acme-storefront\n");
  });

  it("drops duplicates, which would otherwise override your new value", async () => {
    await writeFile(file, "export CHECKPOINT_API_KEY=sk_one\nCHECKPOINT_API_KEY=sk_two\n");

    await updateEnvFile(file, { CHECKPOINT_API_KEY: "sk_new" });

    expect(await readFile(file, "utf8")).toBe("CHECKPOINT_API_KEY=sk_new\n");
  });

  it("leaves no temporary files behind", async () => {
    await updateEnvFile(file, { CHECKPOINT_PROJECT_ID: "acme-storefront" });

    expect(await readdir(directory)).toEqual([".env.local"]);
  });

  it("is in effect once `next dev` reloads it", async () => {
    vi.stubEnv("CHECKPOINT_PROJECT_ID", "acme-storefront");

    expect(await waitForEnvironment({ CHECKPOINT_PROJECT_ID: "acme-storefront", CHECKPOINT_API_KEY: undefined })).toBe(
      true,
    );
  });

  it("tells you when the values never take effect", async () => {
    vi.stubEnv("CHECKPOINT_PROJECT_ID", "set-in-your-terminal");

    expect(await waitForEnvironment({ CHECKPOINT_PROJECT_ID: "acme-storefront" }, 300)).toBe(false);
  });
});
