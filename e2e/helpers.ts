import type { Locator, Page } from '@playwright/test';

/**
 * Wait for the page to load and any in-flight images to settle, WITHOUT
 * `networkidle` — which never fires on this site because analytics, the
 * Cloudflare Turnstile widget, and similar third parties keep background
 * connections open.
 *
 * Only images that have actually started loading (`currentSrc` set) need to
 * reach `complete`; lazy/off-screen images that haven't begun are ignored, so
 * this resolves quickly instead of hanging on images that never enter the
 * viewport. Fail-soft — the test's own assertion decides pass/fail.
 */
export async function waitForImages(page: Page, timeout = 8_000): Promise<void> {
  await page.waitForLoadState('load');
  await page
    .waitForFunction(
      () => Array.from(document.images).every((img) => !img.currentSrc || img.complete),
      undefined,
      { timeout }
    )
    .catch(() => {});
}

/**
 * Dismiss the cookie banner if it's currently visible.
 *
 * No-op when the banner isn't present (e.g. consent already persisted in
 * a prior test). Use at the top of any test that needs to click through
 * the page; otherwise the fixed banner overlays content and intercepts
 * pointer events.
 */
export async function dismissCookieBanner(page: Page): Promise<void> {
  // The banner mounts after React hydration — wait briefly before deciding it
  // is absent (e.g. consent already stored in localStorage from a prior test).
  // Use aria-label only so the selector survives future role changes.
  const banner = page.locator('[aria-label="Cookie consent"]').first();
  await banner.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
  if (!(await banner.isVisible().catch(() => false))) return;
  const accept = banner.locator('button').first();
  if (!(await accept.isVisible().catch(() => false))) return;
  await accept.click();
  await banner.waitFor({ state: 'hidden', timeout: 5_000 });
}

/**
 * Scrolls a `client:visible` Astro island into view and waits for it to
 * hydrate. Identifies the island by its `component-url` (which contains the
 * component name as the file basename, e.g. `CaseStudyGrid.<hash>.js`).
 *
 * Use before any test that interacts with a React handler — without this,
 * Playwright can race React mount and click on a static button.
 */
export async function getHydratedRoot(page: Page, componentName: string): Promise<Locator> {
  const island = page.locator(`astro-island[component-url*="${componentName}"]`).first();
  await island.waitFor({ state: 'attached', timeout: 10_000 });
  await island.scrollIntoViewIfNeeded();
  // Hydrated islands drop the `await-children` attribute. Poll until it's
  // gone (or 10 s) — fail-soft if Astro changes the attribute name in a
  // future version; the test will fail loudly on its own assertion if the
  // island truly didn't hydrate.
  await page
    .waitForFunction(
      (component) => {
        const el = document.querySelector(`astro-island[component-url*="${component}"]`);
        return !!el && !el.hasAttribute('await-children');
      },
      componentName,
      { timeout: 10_000 }
    )
    .catch(() => {});
  return island;
}
