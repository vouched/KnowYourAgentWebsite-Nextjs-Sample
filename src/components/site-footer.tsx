import { site } from "@/lib/site";
import { vouchedLinks } from "@/lib/vouched";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>An open-source Next.js sample for Checkpoint by Vouched, released under the MIT License.</p>
        <nav className="site-footer__links" aria-label="Footer">
          <a href={vouchedLinks.nextjsDocs} rel="noopener">
            Checkpoint Next.js docs
          </a>
          <a href={site.repositoryUrl} rel="noopener">
            Source on GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
