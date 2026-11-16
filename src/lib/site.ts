/** Where this sample lives, for the source links on the page. Point it at your fork. */
export const site = {
  name: "Know Your Agent",
  repositoryUrl: "https://github.com/vouched/KnowYourAgentWebsite-Nextjs-Sample",
} as const;

export function sourceUrl(path: string): string {
  return `${site.repositoryUrl}/blob/main/${path}`;
}

export function readmeUrl(section: string): string {
  return `${site.repositoryUrl}#${section}`;
}
