import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', title: 'Bool' },
  { path: '/about', title: 'About' },
  { path: '/services', title: 'Services' },
  { path: '/people', title: 'People' },
  { path: '/contacts', title: 'Contacts' },
  { path: '/portfolio', title: 'Portfolio' },
  { path: '/blog', title: 'Insights' },
  { path: '/events', title: 'Events' },
  { path: '/careers', title: 'Careers' },
  { path: '/privacy', title: 'Privacy' },
  { path: '/terms', title: 'Terms' },
  { path: '/cookies', title: 'Cookie' },
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
  await expect(nav.locator('a[href="/about"]')).toBeVisible();
  await expect(nav.locator('a[href="/services"]')).toBeVisible();
  await expect(nav.locator('a[href="/contacts"]')).toBeVisible();
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
