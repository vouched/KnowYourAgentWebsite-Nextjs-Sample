import { headers } from "next/headers";
import { Suspense } from "react";

import { Walkthrough } from "@/components/walkthrough";
import { apiKeyHint, readCredentials } from "@/lib/credentials";
import { ENV_FILE_NAME } from "@/lib/env-file";
import { isLocalDeveloperRequest } from "@/lib/local-developer";

export default function HomePage() {
  return (
    <>
      <section className="intro" aria-labelledby="intro-title">
        <div className="container">
          <p className="kicker">Next.js sample · Vouched KYA Detect</p>
          <h1 id="intro-title" className="intro__title">
            See AI agents arrive in your Vouched dashboard
          </h1>
          <p className="lead">
            This app runs the Vouched KYA middleware on every request. Connect your project, send it a burst of
            simulated AI agent and bot traffic, then open your dashboard to watch it arrive.
          </p>
        </div>
      </section>

      <div className="container">
        <Suspense>
          <CurrentWalkthrough />
        </Suspense>
      </div>
    </>
  );
}

// Your keys, and whether you're browsing from the machine running the app, are only known once a request arrives
async function CurrentWalkthrough() {
  const requestHeaders = await headers();
  const { projectId, apiKey } = readCredentials();
  const hint = apiKeyHint(apiKey);

  return (
    <Walkthrough
      // Start over, including any simulation results, whenever you connect a different project or key
      key={`${projectId}:${hint}`}
      projectId={projectId}
      apiKeyHint={hint}
      canUseDeveloperTools={isLocalDeveloperRequest(requestHeaders)}
      envFileName={ENV_FILE_NAME}
    />
  );
}
