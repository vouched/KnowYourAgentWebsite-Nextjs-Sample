import type { Metadata, Viewport } from "next";
import { type ReactNode, Suspense } from "react";

import { CheckpointPixel } from "@/components/checkpoint-pixel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${site.name} · Checkpoint by Vouched sample`, template: `%s · ${site.name}` },
  description:
    "A Next.js sample that detects AI agents with Checkpoint by Vouched and sends simulated agent traffic to your dashboard.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#08071a",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <div className="site-backdrop" aria-hidden="true" />

        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />

        <Suspense>
          <CheckpointPixel />
        </Suspense>
      </body>
    </html>
  );
}
