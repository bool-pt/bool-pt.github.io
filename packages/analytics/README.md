# @bool/analytics

GA4 event tracking, the LinkedIn Insight Tag, and Sentry error monitoring.

`Analytics.astro` is the single mount point (rendered by `BaseLayout`); each tracker guards on
its own `PUBLIC_*` var and routes consent through `@bool/compliance`'s shared gate
(`onConsentGranted` / `onConsentRevoked`). GA4 is gated on `analytics` and runs off the main
thread via Partytown; the LinkedIn Insight Tag is gated on `marketing` and runs on the main
thread. Nothing loads before consent. See [CLAUDE.md](../../.claude/CLAUDE.md).
