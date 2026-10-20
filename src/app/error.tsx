"use client";

import { Icon } from "@/components/icon";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  // Matches the error in the server's logs; production never sends the error's details to the browser
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;

  return (
    <section className="status-page" aria-labelledby="error-title">
      <div className="container status-page__inner">
        <p className="status-page__code">500</p>
        <h1 id="error-title">Something went wrong.</h1>
        <p className="lead">
          An unexpected error occurred while processing your request. Please try again in a moment.
        </p>
        {digest && (
          <p className="status-page__request-id">
            Error ID <code>{digest}</code>
          </p>
        )}
        <button type="button" className="btn btn--primary" onClick={() => retry()}>
          Try again
          <Icon name="refresh" size={18} />
        </button>
      </div>
    </section>
  );
}
