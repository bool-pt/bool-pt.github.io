import { test, expect } from '@playwright/test';
import { ROUTES } from '@bool/shared';
import { dismissCookieBanner } from './helpers';

const PAGES_TO_CHECK = [
  { path: ROUTES.home, name: 'Home' },
  { path: ROUTES.about, name: 'About' },
  { path: ROUTES.services, name: 'Services' },
  { path: ROUTES.people, name: 'People' },
  { path: ROUTES.portfolio, name: 'Portfolio' },
  { path: ROUTES.blog, name: 'Blog' },
  { path: ROUTES.contacts, name: 'Contacts' },
];

for (const { path, name } of PAGES_TO_CHECK) {
  test(`${name} (${path}) — no image / asset responses with 4xx or 5xx`, async ({ page }) => {
    // Network-level check: any <img>, background image, font, etc. that
    // returns 4xx/5xx points to a broken media path. Catches en.json typos
    // that the loader's glob doesn't catch (e.g. wrong extension), CDN
    // misses, and broken @bool/media wildcard exports.
    const failures: Array<{ url: string; status: number }> = [];
    page.on('response', (response) => {
      const status = response.status();
      if (status < 400) return;
      const url = response.url();
      // Only flag asset URLs (images / fonts / SVGs). Skip API/HTML 4xx
      // (those have their own tests).
      if (!/\.(jpg|jpeg|png|webp|avif|svg|woff2?|gif)(\?|$)/i.test(url) &&
          !url.includes('/_image?')) {
        return;
      }
      failures.push({ url, status });
    });

    await page.goto(path);
    await dismissCookieBanner(page);
    await page.waitForLoadState('networkidle');

    // Force lazy-loaded images: scroll to the bottom and back.
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 500));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
    });
    await page.waitForLoadState('networkidle');

    expect(
      failures,
      `${name}: ${failures.length} asset response(s) with non-OK status:\n${failures
        .map((f) => `  - ${f.status} ${f.url}`)
        .join('\n')}`,
    ).toEqual([]);
  });
}
