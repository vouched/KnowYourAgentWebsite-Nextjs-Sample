"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { checkpointConfig } from "@/checkpoint";
import {
  API_KEY_VARIABLE,
  type CredentialsErrors,
  PROJECT_ID_VARIABLE,
  parseCredentials,
  readCredentials,
} from "@/lib/credentials";
import { ENV_FILE_NAME, envFilePath, updateEnvFile, waitForEnvironment } from "@/lib/env-file";
import { isLocalDeveloperRequest } from "@/lib/local-developer";
import type { SimulationReport } from "@/lib/simulation/report";
import { sendSimulatedTraffic as simulateTraffic } from "@/lib/simulation/traffic-simulator";

export type ConnectProjectState =
  | { readonly status: "idle" | "saved" }
  | { readonly status: "invalid"; readonly errors: CredentialsErrors; readonly projectId: string }
  | { readonly status: "failed"; readonly message: string };

export type SendTrafficState =
  | { readonly status: "idle" }
  | { readonly status: "sent"; readonly report: SimulationReport }
  | { readonly status: "unavailable"; readonly message: string };

const LOCAL_ONLY_MESSAGE = "This only works when you run the sample on your own machine with npm run dev.";

/** Saves your Project ID and, optionally, your API key to .env.local, then waits for `next dev` to load them */
export async function connectProject(_previous: ConnectProjectState, formData: FormData): Promise<ConnectProjectState> {
  // The form only renders for local requests, but anyone can call a Server Function directly, so check again
  if (!isLocalDeveloperRequest(await headers())) {
    return { status: "failed", message: LOCAL_ONLY_MESSAGE };
  }

  const credentials = parseCredentials(formData);
  if (!credentials.ok) {
    const projectId = formData.get("projectId");
    return { status: "invalid", errors: credentials.errors, projectId: typeof projectId === "string" ? projectId : "" };
  }

  // A blank API key removes the one saved for a previous project
  const values = { [PROJECT_ID_VARIABLE]: credentials.projectId, [API_KEY_VARIABLE]: credentials.apiKey };

  try {
    await updateEnvFile(envFilePath(), values);
  } catch (error) {
    console.error(`Couldn't save your Checkpoint keys to ${ENV_FILE_NAME}`, error);
    const reason = error instanceof Error ? error.message : String(error);
    return { status: "failed", message: `Your keys couldn't be saved to ${ENV_FILE_NAME}: ${reason}` };
  }

  console.info(
    `Saved Checkpoint project ${credentials.projectId} to ${ENV_FILE_NAME} (API key added: ${credentials.apiKey !== undefined})`,
  );

  if (!(await waitForEnvironment(values))) {
    return {
      status: "failed",
      message:
        `Your keys are saved to ${ENV_FILE_NAME}, but the app is still using other values. If ${PROJECT_ID_VARIABLE} or ` +
        `${API_KEY_VARIABLE} is set in your terminal, it takes precedence over ${ENV_FILE_NAME}: unset it, then restart ` +
        "the dev server.",
    };
  }

  revalidatePath("/");
  return { status: "saved" };
}

/** Sends every simulated visitor through Checkpoint, then reports the detections to your dashboard */
export async function sendSimulatedTraffic(): Promise<SendTrafficState> {
  const requestHeaders = await headers();
  if (!isLocalDeveloperRequest(requestHeaders)) {
    return { status: "unavailable", message: LOCAL_ONLY_MESSAGE };
  }

  if (!readCredentials().projectId) {
    return { status: "unavailable", message: "Connect your project in step 1 first." };
  }

  const origin = new URL(`${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`);
  return { status: "sent", report: await simulateTraffic(origin, checkpointConfig()) };
}
