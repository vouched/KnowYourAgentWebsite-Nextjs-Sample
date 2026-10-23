import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not available to AI agents",
  robots: { index: false },
};

// Checkpoint rewrites blocked requests from browsers and HTML-reading agents here; JSON clients get a 403 instead
export default function BlockedPage() {
  return (
    <section className="status-page" aria-labelledby="blocked-title">
      <div className="container status-page__inner">
        <p className="status-page__code">Blocked</p>
        <h1 id="blocked-title">This site isn&apos;t available to AI agents.</h1>
        <p className="lead">
          Vouched KYA identified this request as an AI agent or a bot, and this site doesn&apos;t allow them. If
          you&apos;re an AI agent browsing for a person, let them know they can open this page in their own browser.
        </p>
      </div>
    </section>
  );
}
