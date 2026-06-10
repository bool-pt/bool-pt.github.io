import { test, expect } from '@playwright/test';
import { ROUTES } from '@bool/shared';
import { dismissCookieBanner } from './helpers';

test.describe('Team grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.about);
    await dismissCookieBanner(page);
    // PersonCard.astro tags each rendered member with [data-person-card];
    // wait for at least one to render before any test assertion.
    await page.locator('[data-person-card]').first().waitFor();
  });

  test('renders ≥ 6 members with non-broken portraits', async ({ page }) => {
    const cards = page.locator('[data-person-card]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Portraits use loading="lazy"; scroll the grid into view so they start
    // loading before we check each <img> below (which waits per-image).
    await cards.first().scrollIntoViewIfNeeded();
    await cards.last().scrollIntoViewIfNeeded();

    const broken = await cards.locator('img.pcv2-photo').evaluateAll((imgs) =>
      Promise.all(
        imgs
          .filter((img): img is HTMLImageElement => img instanceof HTMLImageElement)
          .map(async (img) => {
            if (!img.complete) {
              await new Promise<void>((resolve) => {
                const done = () => resolve();
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
                setTimeout(done, 3_000);
              });
            }
            return img.complete && img.naturalWidth > 0 ? null : img.src;
          })
      ).then((results) => results.filter((src): src is string => src !== null))
    );
    expect(broken, `${broken.length} portrait(s) failed to load:\n${broken.join('\n')}`).toEqual(
      []
    );
  });

  test('clicking a card opens the detail panel with bio + tags', async ({ page }) => {
    const card = page.locator('[data-person-card]').first();
    const detail = card.locator('[data-person-detail]');

    // Closed state: hidden attribute present
    await expect(detail).toHaveAttribute('hidden', '');

    await card.click();

    // Open state: hidden attribute removed
    await expect(detail).not.toHaveAttribute('hidden', '', { timeout: 3_000 });

    // Detail content: name title is always present; bio paragraph and tag pills
    // are present whenever the JSON entry has them — the first member in
    // en.json (Afonso Metello) ships with both, so this assertion is safe.
    await expect(detail.locator('.pcv2-detail-title')).not.toBeEmpty();
    await expect(detail.locator('.pcv2-detail-body')).toBeVisible();
    await expect(detail.locator('ul.pcv2-detail-tags li').first()).toBeVisible();
  });

  test('every card exposes Email + (when set) LinkedIn ARIA links', async ({ page }) => {
    const cards = page.locator('[data-person-card]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      // Email link is always rendered (default email comes from COMPANY constant).
      await expect(card.locator('a[aria-label^="Email "]').first()).toBeVisible();
      // LinkedIn is optional; assert the count is 0 or 1 — not strictly visible.
      const linkedinCount = await card.locator('a[aria-label$="on LinkedIn"]').count();
      expect(linkedinCount).toBeLessThanOrEqual(1);
    }
  });

  test('clicking outside an open card closes the detail panel', async ({ page }) => {
    const card = page.locator('[data-person-card]').first();
    const detail = card.locator('[data-person-detail]');

    await card.click();
    await expect(detail).not.toHaveAttribute('hidden', '', { timeout: 3_000 });

    // Click the page background (the page <body> outside any [data-person-card]).
    await page.locator('footer').click({ position: { x: 5, y: 5 } });

    await expect(detail).toHaveAttribute('hidden', '');
  });
});
