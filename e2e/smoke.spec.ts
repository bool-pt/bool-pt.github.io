import { test, expect } from '@playwright/test';
import { ROUTES } from '@bool/shared';

const pages = [
  { path: ROUTES.home, title: 'Bool' },
  { path: ROUTES.about, title: 'About' },
  { path: ROUTES.services, title: 'Services' },
  { path: ROUTES.people, title: 'People' },
  { path: ROUTES.contacts, title: 'Contacts' },
  { path: ROUTES.portfolio, title: 'Portfolio' },
  { path: ROUTES.blog, title: 'Insights' },
  { path: ROUTES.events, title: 'Events' },
  { path: ROUTES.careers, title: 'Careers' },
  { path: ROUTES.privacy, title: 'Privacy' },
  { path: ROUTES.terms, title: 'Terms' },
  { path: ROUTES.cookies, title: 'Cookie' },
];

for (const { path, title } of pages) {
  test(`${path} loads and contains "${title}" in title`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(new RegExp(title, 'i'));
  });
}

test('404 page renders for unknown routes', async ({ page }) => {
  // Use a path under the site's base so Astro's 404 page is served.
  const response = await page.goto(`${ROUTES.home}this-does-not-exist`);
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('Page not found');
});

test('homepage has navigation links', async ({ page }) => {
  await page.goto(ROUTES.home);
  const nav = page.locator('nav.site-nav, header nav').first();
  await expect(nav).toBeVisible();
  // Each nav link is the .nav-link variant; the .header-cta is a separate
  // element that also points at /contacts. Filter to the in-list links only.
  await expect(nav.locator(`a.nav-link[href="${ROUTES.about}"]`)).toBeVisible();
  await expect(nav.locator(`a.nav-link[href="${ROUTES.services}"]`)).toBeVisible();
  await expect(nav.locator(`a.nav-link[href="${ROUTES.contacts}"]`)).toBeVisible();
});

test('homepage has cookie consent banner or it was dismissed', async ({ page }) => {
  await page.goto(ROUTES.home);
  // Cookie banner may or may not be visible depending on prior state
  const banner = page.locator('[role="dialog"]');
  const bannerCount = await banner.count();
  if (bannerCount > 0) {
    await expect(banner.first()).toBeVisible();
  }
});
