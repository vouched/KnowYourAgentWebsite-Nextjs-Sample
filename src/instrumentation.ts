import { API_KEY_VARIABLE, PROJECT_ID_VARIABLE, readCredentials } from "@/lib/credentials";
import { vouchedLinks } from "@/lib/vouched";

/** Runs once when the server starts. In production, the app answers every request with an error until it has a
 * Project ID, and the server log says how to add one. */
export function register() {
  // `next build` loads the app too, but your keys only need to exist where the app runs
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  if (readCredentials().projectId) {
    return;
  }

  throw new Error(
    `${PROJECT_ID_VARIABLE} isn't set, so Checkpoint can't connect this site to your Vouched project. ` +
      `Set ${PROJECT_ID_VARIABLE}, and ${API_KEY_VARIABLE} to report detections to your dashboard, ` +
      `in your host's environment variables. You'll find both under Installations in your Checkpoint dashboard: ` +
      vouchedLinks.dashboard,
  );
}
