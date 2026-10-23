# AGENTS.md

Guidance for AI coding agents (GitHub Copilot, Claude Code, Codex, Cursor and friends) working in this repository.

## What this is

A one-page Next.js 16 (App Router) app that shows .NET and JavaScript developers how to add [Checkpoint by Vouched](https://kya.vouched.id/docs/integrations/nextjs) AI agent detection to a Next.js site. You connect a Vouched project, send simulated AI agent and bot traffic through the Checkpoint middleware, and watch it arrive in the Vouched dashboard. It's a sample that people fork, so clarity beats cleverness.

## Commands

Run all of these before you finish a change. CI runs the same ones on Linux, Windows and macOS.

```bash
npm install            # restore dependencies
npm run format         # Prettier (CI runs `npm run format:check`)
npm run lint           # ESLint with eslint-config-next
npm run typecheck      # generates Next.js route types, then runs tsc
npm test               # Vitest; no Vouched keys or network needed
npm run build          # production build
npm run dev            # http://localhost:3000
```

## Secrets

- Never commit a Vouched Project ID or API key, and never hard-code one in source, tests or docs. Tests use the fake values in `test/support/requests.ts`.
- Keys are read from `CHECKPOINT_PROJECT_ID` and `CHECKPOINT_API_KEY` (`src/lib/credentials.ts`). Locally they live in `.env.local`, which git ignores; deployed apps use their host's environment variables. `.env.example` only holds placeholders.
- If a user asks you to add their API key, point them to step 1 on the home page or to `.env.local` (see README.md). Don't write it into a tracked file.
- Never commit the `.kya-os/` folder that the kya-os CLI creates; it is gitignored.

## Architecture

- `src/proxy.ts` is the Checkpoint middleware: `withCheckpoint(checkpointConfig())` from `@kya-os/checkpoint-nextjs`, which runs Vouched's WebAssembly detection engine in-process on every request the matcher covers. Next.js 16 renamed `middleware.ts` to `proxy.ts`; it runs on the Node.js runtime.
- `src/checkpoint.ts` holds the shared Checkpoint config, used by both the proxy and the traffic simulator. Prefer changing settings there.
- `next.config.ts` lists `@kya-os/checkpoint-wasm-runtime` in `serverExternalPackages`. Don't remove it. `proxy.ts` can load a bundled engine, but in Server Functions and Server Components, Turbopack turns the engine's `new URL('kya_os_engine_bg.wasm', import.meta.url)` into a web URL, so sending simulated traffic fails with `EngineLoadError` ("Received an instance of URL"). `test/next-config.test.ts` guards it.
- A Project ID alone is a supported, happy setup: the pixel (`src/components/checkpoint-pixel.tsx`) reports browser visits with just the Project ID. `checkpointConfig()` only passes `projectId` to the middleware when there's also an API key, because Vouched answers the policy fetch with 401 without one, and since `@kya-os/checkpoint-nextjs` 1.11.0, a policy fetch that fails makes the middleware answer every request with a 503, even in observe mode. Keep the API key optional. Sending simulated traffic is the one feature that needs it: without a key, the page says so and never checks off step 2.
- `src/lib/simulation/traffic-simulator.ts` runs each simulated visitor through its own `withCheckpoint` instance (without the API key, reading the verdict with `onResult`), then reports the detections itself with the SDK's `buildLogDetectionPayload`. The SDK's own reporter is fire-and-forget and hides errors; reporting here lets the page tell you whether Vouched accepted them. Keep the payload identical to the middleware's.
- `src/lib/simulation/visitors.ts` lists the visitors. Use each one's real, published user agent, and update the tables in `test/traffic-simulator.test.ts` and `test/checkpoint-detection.test.ts` when you change the list.
- The developer tools, saving keys and sending simulated traffic, are Server Functions in `src/app/actions.ts`. Each one checks `isLocalDeveloperRequest()` (`src/lib/local-developer.ts`) itself, because anyone can call a Server Function directly. The check requires development mode, a loopback `Host`, loopback `X-Forwarded-For` addresses and no proxy headers. `npm run dev` binds to localhost because Next.js keeps a client's own `X-Forwarded-For` header; don't remove `--hostname localhost`.
- Saving keys writes `.env.local` (`src/lib/env-file.ts`) and waits for `next dev` to reload it. No restart is needed: Next.js re-evaluates `proxy.ts` and re-renders pages with the new values.
- `src/instrumentation.ts` keeps a production server from serving pages without a Project ID: every request fails, and the server log says how to add one. Keep that message actionable.
- Cache Components is on (`cacheComponents: true`). Anything that reads environment variables or request headers must run inside `<Suspense>` after `await headers()` or `await connection()`, or its value is baked in at build time.

## Front end

- The stylesheet is hand-written (`src/app/globals.css`) with design tokens in `:root`; there is no CSS framework. Reuse the existing tokens and class names, which match the sample's .NET sibling.
- Production responses carry a Content-Security-Policy from `next.config.ts`. Don't add inline `style` attributes or third-party scripts without updating it. `script-src` allows `'unsafe-inline'` only because Next.js streams page data in inline scripts.
- The page is one Server Component (`src/app/page.tsx`) that renders the client component `src/components/walkthrough.tsx`. Keep the step logic and messages in `src/lib/simulation/presentation.ts`, where `test/walkthrough.test.ts` covers them.

## Tests

- Vitest, in `test/`. `test/support/setup.ts` replaces `fetch` with the fake Vouched API in `test/support/vouched.ts`, so no test touches the network and every report Checkpoint sends can be inspected.
- `test/checkpoint-detection.test.ts` and `test/checkpoint-enforcement.test.ts` pin how `@kya-os/checkpoint-nextjs` classifies traffic. If a Dependabot update changes them, report what changed rather than loosening the assertions.
- Test names describe behavior in plain English. Prefer one behavior per test.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
