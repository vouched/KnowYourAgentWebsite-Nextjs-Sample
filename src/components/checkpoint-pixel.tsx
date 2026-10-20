import Script from "next/script";
import { connection } from "next/server";

import { readCredentials } from "@/lib/credentials";
import { pixelScriptUrl } from "@/lib/vouched";

/**
 * The Checkpoint pixel reports your browser visits to your dashboard with just your Project ID, and adds the signals
 * only a browser can see, like automation frameworks. It only renders once you add a Project ID, so a fork never
 * reports to someone else's project.
 */
export async function CheckpointPixel() {
  // Read the Project ID when a request arrives, rather than when the app is built
  await connection();

  const { projectId } = readCredentials();
  if (!projectId) {
    return null;
  }

  return (
    <Script
      src={pixelScriptUrl}
      strategy="afterInteractive"
      data-project-id={projectId}
      // Logs every report the pixel sends to your browser's console
      data-debug={process.env.CHECKPOINT_PIXEL_DEBUG === "true" ? "true" : undefined}
    />
  );
}
