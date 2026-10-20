import Link from "next/link";

import { Icon } from "@/components/icon";

export default function NotFound() {
  return (
    <section className="status-page" aria-labelledby="not-found-title">
      <div className="container status-page__inner">
        <p className="status-page__code">404</p>
        <h1 id="not-found-title">This page wandered off.</h1>
        <p className="lead">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link className="btn btn--primary" href="/">
          Back to the sample
          <Icon name="arrow-right" size={18} />
        </Link>
      </div>
    </section>
  );
}
