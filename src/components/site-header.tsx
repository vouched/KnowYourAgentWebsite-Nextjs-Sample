import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { Icon } from "@/components/icon";
import { site } from "@/lib/site";
import { vouchedLinks } from "@/lib/vouched";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="brand" href="/">
          <BrandMark size={30} />
          <span className="brand__text">
            <span className="brand__name">{site.name}</span>
            <span className="brand__by">A Vouched KYA sample</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Resources">
          <a href={vouchedLinks.nextjsDocs} rel="noopener">
            Docs
          </a>
          <a href={site.repositoryUrl} rel="noopener">
            GitHub
          </a>
          <a className="btn btn--ghost btn--sm" href={vouchedLinks.dashboard} target="_blank" rel="noopener">
            Dashboard
            <Icon name="external" size={14} />
          </a>
        </nav>
      </div>
    </header>
  );
}
