/**
 * Build the site's Content-Security-Policy string.
 *
 * Google Analytics domains (Tag Manager, Analytics, DoubleClick) are added only
 * when GA is configured, so a deployment without `PUBLIC_GA_MEASUREMENT_ID` never
 * widens `script-src`/`img-src`/`connect-src` to Google endpoints it cannot use.
 *
 * Note: `frame-ancestors`/`X-Frame-Options` are intentionally absent — browsers
 * only honour those as real HTTP response headers, not meta tags, so framing
 * protection must be set at the CDN/edge in production.
 */
export function buildContentSecurityPolicy(gaEnabled: boolean): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com'];
  const imgSrc = ["'self'", 'data:'];
  const connectSrc = ["'self'", 'https://challenges.cloudflare.com', 'https://*.amazonaws.com'];

  if (gaEnabled) {
    scriptSrc.push('https://www.googletagmanager.com');
    imgSrc.push('https://www.google-analytics.com');
    connectSrc.push(
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://stats.g.doubleclick.net'
    );
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
