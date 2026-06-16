import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { ROUTES } from '@bool/shared';
import { dismissCookieBanner } from './helpers';

// Load en.json via fs.readFileSync to avoid Node's import-attributes
// requirement (`with { type: 'json' }`) on JSON ESM imports. Keeps the e2e
// suite portable across Node versions.
const en = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../packages/i18n/src/locales/en.json', import.meta.url)),
    'utf8'
  )
) as Record<string, string>;

test.describe('Hero', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.home);
    await dismissCookieBanner(page);
  });

  test('renders with a non-broken background image and the first slide title', async ({ page }) => {
    const hero = page.locator('section.hero');
    await expect(hero).toBeVisible();

    const bg = hero.locator('img.hero-bg-img');
    await expect(bg).toBeVisible();
    const broken = await bg.evaluate((img) => {
      if (!(img instanceof HTMLImageElement)) return 'not-an-img';
      return img.complete && img.naturalWidth > 0 ? null : img.src;
    });
    expect(broken, `hero background failed to load: ${broken ?? ''}`).toBeNull();

    const firstTitle = en['hero.slides.1.title'];
    expect(firstTitle, 'hero.slides.1.title missing from en.json').toBeTruthy();
    await expect(hero.getByText(firstTitle!, { exact: true })).toBeVisible();
  });

  test('clicking a slide indicator changes the active slide', async ({ page }) => {
    const hero = page.locator('section.hero');
    const tabs = hero.locator('[role="tab"]');

    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);

    const initialTitle = en['hero.slides.1.title']!;
    const targetTitle = en['hero.slides.2.title']!;
    expect(targetTitle).toBeTruthy();

    await expect(hero.getByText(initialTitle, { exact: true })).toBeVisible();

    // Click second indicator
    await tabs.nth(1).click();

    // Active slide should change to slide 2's title.
    await expect(hero.getByText(targetTitle, { exact: true })).toBeVisible();
  });
});

test.describe('Testimonials carousel (homepage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.home);
    await dismissCookieBanner(page);
  });

  test('renders the first testimonial quote and the next button advances it', async ({ page }) => {
    // Homepage TestimonialsSection wraps the React island; the island itself
    // exposes prev/next buttons via aria-label="Previous"/"Next".
    const nextButton = page.getByRole('button', { name: en['carousel.next']! });
    await expect(nextButton).toBeVisible();

    const firstQuote = en['testimonials.items.1.quote']!;
    expect(firstQuote, 'testimonials.items.1.quote missing from en.json').toBeTruthy();
    // Quote is rendered inside the carousel; assert visible before clicking.
    await expect(page.getByText(firstQuote, { exact: false }).first()).toBeVisible();

    const secondQuote = en['testimonials.items.2.quote']!;
    expect(secondQuote, 'testimonials.items.2.quote missing from en.json').toBeTruthy();

    await nextButton.click();
    await expect(page.getByText(secondQuote, { exact: false }).first()).toBeVisible();
  });
});
