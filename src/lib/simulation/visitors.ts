/** Whether a visitor browses on behalf of a person (an AI agent) or on its own (a crawler or a script) */
export type VisitorKind = "ai-agent" | "bot";

/**
 * A real-world AI agent or bot, described by the user agent it actually sends. `token` is the part of the user agent
 * that identifies it, shown on the page.
 */
export interface SimulatedVisitor {
  readonly id: string;
  readonly name: string;
  readonly operator: string;
  readonly description: string;
  readonly kind: VisitorKind;
  readonly token: string;
  readonly userAgent: string;
}

export const simulatedVisitors: readonly SimulatedVisitor[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    operator: "OpenAI",
    description: "Fetches a page for a ChatGPT user",
    kind: "ai-agent",
    token: "ChatGPT-User/1.0",
    userAgent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
  },
  {
    id: "claude",
    name: "Claude",
    operator: "Anthropic",
    description: "Fetches a page for a Claude user",
    kind: "ai-agent",
    token: "Claude-User/1.0",
    userAgent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    operator: "Perplexity",
    description: "Fetches a page for a Perplexity user",
    kind: "ai-agent",
    token: "Perplexity-User/1.0",
    userAgent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)",
  },
  {
    id: "gptbot",
    name: "GPTBot",
    operator: "OpenAI",
    description: "Crawls the web to train OpenAI models",
    kind: "bot",
    token: "GPTBot/1.4",
    userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot",
  },
  {
    id: "claudebot",
    name: "ClaudeBot",
    operator: "Anthropic",
    description: "Crawls the web to train Claude models",
    kind: "bot",
    token: "ClaudeBot/1.0",
    userAgent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  },
  {
    id: "googlebot",
    name: "Googlebot",
    operator: "Google",
    description: "Crawls the web for Google Search",
    kind: "bot",
    token: "Googlebot/2.1",
    userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  },
  {
    id: "headless-chrome",
    name: "Headless Chrome",
    operator: "Anyone",
    description: "Browser automation, like Puppeteer or Playwright",
    kind: "bot",
    token: "HeadlessChrome/141.0",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36",
  },
  {
    id: "curl",
    name: "curl",
    operator: "Anyone",
    description: "A command-line HTTP client",
    kind: "bot",
    token: "curl/8.7.1",
    userAgent: "curl/8.7.1",
  },
  {
    id: "python-requests",
    name: "Python script",
    operator: "Anyone",
    description: "A script using the requests library",
    kind: "bot",
    token: "python-requests/2.32.3",
    userAgent: "python-requests/2.32.3",
  },
];
