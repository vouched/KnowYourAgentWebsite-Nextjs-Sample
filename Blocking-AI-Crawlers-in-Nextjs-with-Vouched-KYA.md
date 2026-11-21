# Blocking AI Crawlers in Next.js with Vouched KYA

Not every AI visitor is the same: AI crawlers like GPTBot collect training data and send no one back to our website, while AI agents like ChatGPT browse for real people. The good news is that we can block one and welcome the other! In this post, we'll write a five-line policy with Vouched KYA (short for Know Your Agent), then test it and enforce it in a Next.js app, in about 10 minutes.

## What are AI Crawlers, AI Agents and Policies?

An AI crawler, like OpenAI's GPTBot or Anthropic's ClaudeBot, is a bot that reads websites in bulk to collect training data for AI models. It takes our content and sends no one back.

AI agents are different. When ChatGPT visits our website, it's browsing for a real person who might buy something, book something or sign up. Those are our customers!

And search engines, like Googlebot, still send us visitors. So here's the rule we'll create: block the AI crawlers, but let the AI agents and search engines in.

A policy is a rule that decides what happens to each request, and [KYA Enforce](https://kya.vouched.id/docs/enforce?utm_source=vouched-blog&utm_medium=blog&utm_campaign=kya-brandon-enforce-2026-11&utm_content=post) applies our policies to every request. We write ours in the Vouched KYA dashboard, and our Next.js app downloads it.

Vouched KYA policies are written in [Cedar](https://www.cedarpolicy.com/), an open-source language for writing access rules, created by AWS. For each request, [KYA Detect](https://kya.vouched.id/docs/detect?utm_source=vouched-blog&utm_medium=blog&utm_campaign=kya-brandon-enforce-2026-11&utm_content=post) labels the visitor as a human, an AI agent or a bot, and our policy decides: Permit or Block.

## Code

### Prerequisites

- The Next.js app from the [first post in this series](https://www.vouched.id/learn/blog/detecting-ai-agents-in-next.js-with-vouched-kya?utm_source=vouched-blog&utm_medium=blog&utm_campaign=kya-brandon-enforce-2026-11&utm_content=post)
- A [Vouched KYA account](https://kya.vouched.id/signup?utm_source=vouched-blog&utm_medium=blog&utm_campaign=kya-brandon-enforce-2026-11&utm_content=post) on a paid plan, with a project and an API key. KYA Enforce isn't part of the free plan.

Our app keeps its API key in `.env.local` and runs Vouched KYA in [`proxy.ts`](https://nextjs.org/docs/app/getting-started/proxy), the file Next.js runs before every request. It's in observe mode: it reports every request to our dashboard and logs it, but never blocks one. Here's the whole file we start from:

```ts
import { withCheckpoint } from "@kya-os/checkpoint-nextjs";

export default withCheckpoint({
  // Reports every request to our Vouched KYA dashboard
  apiKey: process.env.CHECKPOINT_API_KEY,

  // Observe mode: classify and report every request, but never block one
  enforcementMode: "observe",

  // Runs after Vouched KYA classifies each request
  onResult: (result, request) => {
    const { detectionClass, detectedAgent, confidence } = result.detectionDetail;
    console.log(
      `${request.nextUrl.pathname}: ${detectionClass.type} ${detectedAgent?.name ?? ""} (${Math.round(confidence)}%)`,
    );
  },
});

export const config = {
  // Run on every page, but skip Next.js' static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

The first post's [completed sample](https://github.com/vouched/KnowYourAgentWebsite-Nextjs-Sample) does more than this post needs, so let's start from this file instead.

Let's start it up:

```bash
npm run dev
```

### 1. Add the Project ID

Our app needs to know which Vouched KYA project to download its policies from. In the [Vouched KYA dashboard](https://kya.vouched.id/dashboard?utm_source=vouched-blog&utm_medium=blog&utm_campaign=kya-brandon-enforce-2026-11&utm_content=post), click **Installations** at the bottom of the left sidebar, and copy the Project ID.

In `.env.local`, add a new line below our API key:

```bash
CHECKPOINT_PROJECT_ID=<your project id>
```

Then in `proxy.ts`, right below our API key, add `projectId`:

```ts
  // Downloads the policies we deploy in our dashboard
  projectId: process.env.CHECKPOINT_PROJECT_ID,
```

Vouched KYA only shares our policies with apps that send both our Project ID and our API key.

### 2. Write the policy

In the dashboard, click **Policy**. Our policy is only five lines of Cedar, so let's write it ourselves: below the box that says "Say the rule", click **Know Cedar? Write it directly**, and paste this:

```text
// Block AI crawlers on every page
@id("block-ai-crawlers")
@verdict("BLOCK")
forbid (principal, action, resource)
when { principal.category == "scraper" };
```

The comment names our policy, and the two lines that start with `@` give it an ID and a verdict: `BLOCK`. Then the rule forbids any request whose category is `scraper`, which is what Vouched KYA calls AI crawlers.

Click the purple button in the corner of the box (or press Command-Return), and Vouched KYA reads our policy back to us in plain English: "Block scraper agents on every path, no way through." Anything our policy doesn't block is still allowed, so AI agents and search engines get right in.

_Screenshot to come: our policy, read back in plain English._

### 3. Test it with a replay

Before our policy touches any real traffic, let's test it. Under **What would happen**, click **Run the replay**. Vouched KYA replays our policy against sample requests, or against the last seven days of our website's traffic, without blocking anyone.

_Screenshot to come: the replay results._

GPTBot and the other crawlers would be blocked, while people, AI agents like Claude, and other bots get in. Exactly what we want!

### 4. Deploy it

Click **Deploy policy**. "Policy deployed. It is live." And there's our **LIVE** badge.

### 5. Watch it in observe mode

Our app is still in observe mode, so it never blocks anyone. That's the safest way to try a new policy on a real website: watch what it would do, before it does it.

First, let's add the decision to our log. In `proxy.ts`, in `onResult`, add `${result.decision.kind}` right after the colon:

```ts
console.log(
  `${request.nextUrl.pathname}: ${result.decision.kind} ${detectionClass.type} ${detectedAgent?.name ?? ""} (${Math.round(confidence)}%)`,
);
```

Our Next.js app checks for policy changes every five minutes, but we don't have to wait. Let's restart the dev server, so it loads our new policy right away: press Control-C in its terminal, then run `npm run dev` again.

Now let's pretend to be GPTBot. In a second terminal (on Windows PowerShell, type `curl.exe` instead of `curl`):

```bash
curl -I -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot" http://localhost:3000/
```

Among the response headers, we'll find these:

```text
x-checkpoint-mode: observe
x-checkpoint-would-have-been: Block
x-checkpoint-would-have-been-reason: PolicyDenied
```

`x-checkpoint-would-have-been` is `Block`, and the reason is `PolicyDenied`. That's our policy! But we're in observe mode, so GPTBot still got a `200 OK`.

Next, ChatGPT:

```bash
curl -I -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot" http://localhost:3000/
```

This time, `x-checkpoint-would-have-been` is `Permit`.

### 6. Turn on enforce

We've seen what our policy would do, so let's turn it on. In `proxy.ts`, change `observe` to `enforce`, and update the comment above it:

```ts
  // Enforce mode: block every request our policy forbids
  enforcementMode: "enforce",
```

Save, and send the GPTBot request again:

```text
HTTP/1.1 403 Forbidden
x-checkpoint-decision: block
x-checkpoint-reason: PolicyDenied
```

`403 Forbidden`! GPTBot is blocked, and `x-checkpoint-reason` tells us it was our policy. 🎉

Now send the ChatGPT request again, then pretend to be Googlebot:

```bash
curl -I -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" http://localhost:3000/
```

ChatGPT gets a `200 OK`, and so does Googlebot, so our search traffic is safe. And our log tells the whole story:

```text
/: Block Bot GPTBot (100%)
/: Permit AiAgent ChatGPT (100%)
/: Permit Bot Googlebot (100%)
```

One thing to know: in enforce mode, if Vouched KYA can't load our policy, say because of a typo in our Project ID, it answers every request with a `503` error instead of guessing. If that happens, double-check the Project ID. And if GPTBot still gets a `200 OK`, check that `proxy.ts` has the `projectId` line from Step 1: without it, our app has no policy to enforce.

### 7. Add a page for blocked visitors

Our `curl` requests only asked for headers, so they got a `403`. But a crawler that asks for a web page gets our app's blocked page instead, and we don't have one yet.

Let's create `app/blocked/page.tsx` (in `src/app/blocked/` if our app uses a `src` folder):

```tsx
// Vouched KYA shows this page to blocked visitors that ask for a web page
export default function Blocked() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">No AI crawlers, please</h1>
      <p>This site doesn&apos;t share its content for AI training.</p>
    </main>
  );
}
```

Now let's see what GPTBot sees. Open `http://localhost:3000` in the browser, then the developer tools (Command-Option-I).

In the **⋮** menu, choose **More tools**, then **Network conditions**. Under **User agent**, uncheck **Use browser default**, choose **Custom**, and paste GPTBot's user agent (the name it sends with each request):

```text
Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot
```

Reload, and there's our page!

_Screenshot to come: our blocked page, as GPTBot sees it._

When we're done, check **Use browser default** again.

And in our dashboard, under **Activity**, our GPTBot requests now show the verdict **BLOCK**, with our policy's name and the reason, `PolicyDenied`.

_Screenshot to come: blocked GPTBot requests under Activity._

## Conclusion

And that's it! One Project ID, one five-line policy, and one word in `proxy.ts` to turn it on. Our Next.js app now keeps the AI crawlers out, while it welcomes AI agents and search engines.

To learn more about writing KYA Enforce policies, check out the [policy docs](https://kya.vouched.id/docs/enforce/policies?utm_source=vouched-blog&utm_medium=blog&utm_campaign=kya-brandon-enforce-2026-11&utm_content=post).

Next, we'll verify signed AI agents. Subscribe to the Vouched KYA newsletter at the bottom of the [Vouched KYA home page](https://kya.vouched.id/?utm_source=vouched-blog&utm_medium=blog&utm_campaign=kya-brandon-enforce-2026-11&utm_content=post) so you don't miss it!
