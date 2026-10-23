import { withCheckpoint } from "@kya-os/checkpoint-nextjs";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

import { checkpointConfig } from "@/checkpoint";
import { isLocalDeveloperRequest } from "@/lib/local-developer";

const checkpoint = withCheckpoint(checkpointConfig());
let warnedAboutFault = false;

// Runs before every page and Server Function, and classifies each request as a person, an AI agent or a bot
export default async function proxy(
  request: NextRequest,
  event?: Pick<NextFetchEvent, "waitUntil">,
): Promise<NextResponse> {
  const response = await checkpoint(request, event);

  // Checkpoint answers 503 when it can't check a request, for example when Vouched rejects your API key while it loads
  // your dashboard's policies. That would also block the page where you fix your keys, so on your own machine in
  // development, the page loads anyway. Everywhere else, the 503 stands.
  if (isLocalDeveloperRequest(request.headers) && (await isCheckpointFault(response))) {
    if (!warnedAboutFault) {
      warnedAboutFault = true;
      console.warn(
        "Checkpoint couldn't check your requests (see the error above), so this dev server lets them through. If " +
          "Vouched rejected your API key, paste a new one in step 1.",
      );
    }
    return NextResponse.next();
  }

  return response;
}

/** The 503 Checkpoint fails closed with, as opposed to a verdict about the request */
async function isCheckpointFault(response: Response): Promise<boolean> {
  if (response.status !== 503) {
    return false;
  }

  try {
    const body: unknown = await response.clone().json();
    return typeof body === "object" && body !== null && "source" in body && body.source === "checkpoint-middleware";
  } catch {
    return false;
  }
}

export const config = {
  // Everything except Next.js' static files, the icons and the health check
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|healthz).*)"],
};
