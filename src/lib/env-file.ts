import "server-only";

import { randomUUID } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Environment } from "@/lib/credentials";

/** Next.js loads `.env.local` everywhere except in tests, and `next dev` reloads it whenever it changes. */
export const ENV_FILE_NAME = ".env.local";

// `NAME=value` and `export NAME=value`, the two forms Next.js reads
const ASSIGNMENT = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;

export function envFilePath(directory: string = process.cwd()): string {
  return path.join(directory, ENV_FILE_NAME);
}

/**
 * Sets each variable in an env file, or removes it when its value is `undefined`, and leaves every other line alone.
 * The file is replaced in one step, so a half-written file is never loaded, and only your user can read it.
 */
export async function updateEnvFile(filePath: string, values: Environment): Promise<void> {
  const written = new Set<string>();
  const lines: string[] = [];

  for (const line of await readLines(filePath)) {
    const name = ASSIGNMENT.exec(line)?.[1];
    if (name === undefined || !Object.hasOwn(values, name)) {
      lines.push(line);
      continue;
    }

    // Replace the first assignment and drop any later ones, which would override it
    if (!written.has(name)) {
      written.add(name);
      const value = values[name];
      if (value !== undefined) {
        lines.push(`${name}=${value}`);
      }
    }
  }

  for (const [name, value] of Object.entries(values)) {
    if (!written.has(name) && value !== undefined) {
      lines.push(`${name}=${value}`);
    }
  }

  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, lines.length > 0 ? `${lines.join("\n")}\n` : "", { mode: 0o600 });
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

/**
 * `next dev` notices the updated `.env.local` and reloads `process.env` a moment later. Waits until it has, so the
 * next render already uses the new values. Returns `false` if they never show up, for example because the same
 * variable is set in your terminal, which takes precedence over `.env.local`.
 */
export async function waitForEnvironment(expected: Environment, timeoutMilliseconds = 10_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMilliseconds;

  while (!Object.entries(expected).every(([name, value]) => (process.env[name]?.trim() || undefined) === value)) {
    if (Date.now() >= deadline) {
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return true;
}

async function readLines(filePath: string): Promise<string[]> {
  try {
    const content = await readFile(filePath, "utf8");
    return content === "" ? [] : content.replace(/\r?\n$/, "").split(/\r?\n/);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}
