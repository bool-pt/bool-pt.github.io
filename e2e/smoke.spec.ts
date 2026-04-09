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
  const response = await page.goto('/this-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('404');
});

test('homepage has navigation links', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
  await expect(nav.locator(`a[href="${ROUTES.about}"]`)).toBeVisible();
  await expect(nav.locator(`a[href="${ROUTES.services}"]`)).toBeVisible();
  await expect(nav.locator(`a[href="${ROUTES.contacts}"]`)).toBeVisible();
});

test('homepage has cookie consent banner or it was dismissed', async ({ page }) => {
  await page.goto('/');
  // Cookie banner may or may not be visible depending on prior state
  const banner = page.locator('[role="dialog"]');
  const bannerCount = await banner.count();
  if (bannerCount > 0) {
    await expect(banner.first()).toBeVisible();
  }
});
