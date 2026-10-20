# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report vulnerabilities privately through GitHub: open the repository's **Security** tab and select **Report a vulnerability** ([GitHub's guide](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)). Include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- The commit or release you tested

We'll acknowledge your report, keep you updated on our progress and credit you in the advisory unless you'd rather stay anonymous.

Vulnerabilities in the Checkpoint SDK itself (the `@kya-os/checkpoint-nextjs` npm package) or the Vouched platform should be reported to Vouched directly through [vouched.id](https://www.vouched.id).

## Supported versions

Only the latest commit on `main` is supported.

## Handling credentials

This project never stores Vouched credentials in source control: they live in `.env.local`, which git ignores, or in your host's environment variables. If you accidentally commit an API key, **revoke it in the [Checkpoint dashboard](https://kya.vouched.id/dashboard) immediately** and create a new one. Removing it from git history is not enough once it has been pushed.
