import type { Locator, Page } from '@playwright/test';

/**
 * Dismiss the cookie banner if it's currently visible.
 *
 * No-op when the banner isn't present (e.g. consent already persisted in
 * a prior test). Use at the top of any test that needs to click through
 * the page; otherwise the fixed banner overlays content and intercepts
 * pointer events.
 */
export async function dismissCookieBanner(page: Page): Promise<void> {
  // Match the CookieBanner specifically (it carries aria-label="Cookie consent");
  // matching just role="dialog" can also match Radix dialogs opened later.
  const banner = page
    .locator('[role="dialog"][aria-label="Cookie consent"]')
    .first();
  if (!(await banner.isVisible().catch(() => false))) return;
  const accept = banner.locator('button').first();
  if (!(await accept.isVisible().catch(() => false))) return;
  await accept.click();
  await banner.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
}

/**
 * Scrolls a `client:visible` Astro island into view and waits for it to
 * hydrate. Identifies the island by its `component-url` (which contains the
 * component name as the file basename, e.g. `CaseStudyGrid.<hash>.js`).
 *
 * Use before any test that interacts with a React handler — without this,
 * Playwright can race React mount and click on a static button.
 */
export async function getHydratedRoot(
  page: Page,
  componentName: string,
): Promise<Locator> {
  const island = page
    .locator(`astro-island[component-url*="${componentName}"]`)
    .first();
  await island.waitFor({ state: 'attached', timeout: 10_000 });
  await island.scrollIntoViewIfNeeded();
  // Hydrated islands drop the `await-children` attribute. Poll until it's
  // gone (or 10 s) — fail-soft if Astro changes the attribute name in a
  // future version; the test will fail loudly on its own assertion if the
  // island truly didn't hydrate.
  await page
    .waitForFunction(
      (component) => {
        const el = document.querySelector(
          `astro-island[component-url*="${component}"]`,
        );
        return !!el && !el.hasAttribute('await-children');
      },
      componentName,
      { timeout: 10_000 },
    )
    .catch(() => {});
  return island;
}
