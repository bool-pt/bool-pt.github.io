/**
 * Build the site's Content-Security-Policy string.
 *
 * Each tracker's domains are added only when that tracker is configured, so a
 * deployment without `PUBLIC_GA_MEASUREMENT_ID` / `PUBLIC_LINKEDIN_PARTNER_ID`
 * never widens `script-src`/`img-src`/`connect-src` to endpoints it cannot use.
 *
 * `apiOrigin` is the exact form-API origin (from `PUBLIC_API_BASE_URL`) so
 * `connect-src` is pinned to that host rather than all of `*.amazonaws.com`.
 * It is empty only in local dev (the var is unset), where no API call is made.
 *
 * Note: `frame-ancestors`/`X-Frame-Options` are intentionally absent — browsers
 * only honour those as real HTTP response headers, not meta tags, so framing
 * protection must be set at the CDN/edge in production.
 */
export interface ContentSecurityPolicyOptions {
  /** Google Analytics 4 is configured (`PUBLIC_GA_MEASUREMENT_ID`). */
  gaEnabled: boolean;
  /** LinkedIn Insight Tag is configured (`PUBLIC_LINKEDIN_PARTNER_ID`). */
  linkedInEnabled: boolean;
  /** Exact origin of the form API, or `''` in local dev. */
  apiOrigin: string;
}

export function buildContentSecurityPolicy({
  gaEnabled,
  linkedInEnabled,
  apiOrigin,
}: ContentSecurityPolicyOptions): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com'];
  const imgSrc = ["'self'", 'data:'];
  const connectSrc = ["'self'", 'https://challenges.cloudflare.com'];
  if (apiOrigin) connectSrc.push(apiOrigin);

  if (gaEnabled) {
    scriptSrc.push('https://www.googletagmanager.com');
    imgSrc.push('https://www.google-analytics.com');
    connectSrc.push(
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://stats.g.doubleclick.net'
    );
  }

  if (linkedInEnabled) {
    // insight.min.js is served from snap.licdn.com; it then fires tracking pixels
    // at px.ads.linkedin.com (which redirects to px4) and linkedin.com itself.
    scriptSrc.push('https://snap.licdn.com');
    imgSrc.push(
      'https://px.ads.linkedin.com',
      'https://px4.ads.linkedin.com',
      'https://www.linkedin.com'
    );
    connectSrc.push('https://px.ads.linkedin.com', 'https://px4.ads.linkedin.com');
  }

  return (
    [
      "default-src 'self'",
      `script-src ${scriptSrc.join(' ')}`,
      "style-src 'self' 'unsafe-inline'",
      "frame-src 'self' https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      `img-src ${imgSrc.join(' ')}`,
      `connect-src ${connectSrc.join(' ')}`,
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ') + ';'
  );
}
