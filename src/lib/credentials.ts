/**
 * The two values that connect this site to your Checkpoint project. Both come from your Vouched dashboard and are read
 * from environment variables, never from source code:
 *
 * - The Project ID is all the Checkpoint pixel needs to report your visits.
 * - The API key is optional. Add it so the Checkpoint middleware reports its detections too, like the simulated
 *   traffic on the home page.
 *
 * Locally, paste them into the home page, which saves them to `.env.local`. When you deploy, set them in your host's
 * environment variables.
 */
export const PROJECT_ID_VARIABLE = "CHECKPOINT_PROJECT_ID";
export const API_KEY_VARIABLE = "CHECKPOINT_API_KEY";

export type Environment = Readonly<Record<string, string | undefined>>;

export interface CheckpointCredentials {
  readonly projectId?: string;
  readonly apiKey?: string;
}

export function readCredentials(env: Environment = process.env): CheckpointCredentials {
  return {
    projectId: env[PROJECT_ID_VARIABLE]?.trim() || undefined,
    apiKey: env[API_KEY_VARIABLE]?.trim() || undefined,
  };
}

/** Masks an API key, so the page can show which key is in use without ever displaying it */
export function apiKeyHint(apiKey: string | undefined): string | undefined {
  if (!apiKey) {
    return undefined;
  }

  return apiKey.length > 12 ? `••••${apiKey.slice(-4)}` : "••••";
}

export type CredentialsErrors = Partial<Record<"projectId" | "apiKey", string>>;

export type ParsedCredentials =
  | { readonly ok: true; readonly projectId: string; readonly apiKey?: string }
  | { readonly ok: false; readonly errors: CredentialsErrors };

// Both values are written to .env.local unquoted, so neither may contain spaces, quotes or `#`
const VALUE_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Validates the "Connect your Vouched project" form. A blank API key is fine: the pixel only needs the Project ID. */
export function parseCredentials(formData: FormData): ParsedCredentials {
  const projectId = readField(formData, "projectId");
  const apiKey = readField(formData, "apiKey");
  const errors: CredentialsErrors = {};

  if (!projectId) {
    errors.projectId = "Paste the Project ID from your Vouched dashboard.";
  } else if (projectId.length > 128) {
    errors.projectId = "A Project ID is at most 128 characters.";
  } else if (!VALUE_PATTERN.test(projectId)) {
    errors.projectId = "A Project ID only contains letters, numbers, dashes and underscores.";
  }

  if (apiKey.length > 512) {
    errors.apiKey = "An API key is at most 512 characters.";
  } else if (apiKey && !VALUE_PATTERN.test(apiKey)) {
    errors.apiKey = "An API key only contains letters, numbers, dashes and underscores.";
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, projectId, apiKey: apiKey || undefined };
}

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
