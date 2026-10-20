"use client";

import "./globals.css";

// Replaces the root layout when it fails, so it renders its own <html> and <body>
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <section className="status-page" aria-labelledby="global-error-title">
          <div className="container status-page__inner">
            <p className="status-page__code">500</p>
            <h1 id="global-error-title">Something went wrong.</h1>
            <p className="lead">An unexpected error occurred. Please try again in a moment.</p>
            <button type="button" className="btn btn--primary" onClick={() => retry()}>
              Try again
            </button>
          </div>
        </section>
      </body>
    </html>
  );
}
