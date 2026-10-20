import { withCheckpoint } from "@kya-os/checkpoint-nextjs";

import { checkpointConfig } from "@/checkpoint";

// Runs before every page and Server Function, and classifies each request as a person, an AI agent or a bot
export default withCheckpoint(checkpointConfig());

export const config = {
  // Everything except Next.js' static files, the icons and the health check
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|healthz).*)"],
};
