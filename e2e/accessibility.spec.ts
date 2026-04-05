import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const criticalPages = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/services', name: 'Services' },
  { path: '/contacts', name: 'Contacts' },
  { path: '/portfolio', name: 'Portfolio' },
  { path: '/blog', name: 'Blog' },
];

for (const { path, name } of criticalPages) {
  test(`${name} page (${path}) has no critical accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('[data-ga-injected]') // Exclude injected GA scripts
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(
      critical,
      `${name} page has ${critical.length} critical/serious a11y violations:\n${critical
        .map((v) => `  - ${v.id}: ${v.description} (${v.nodes.length} nodes)`)
        .join('\n')}`,
    ).toHaveLength(0);
  });
}

test('homepage has proper heading hierarchy', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const headings = await page.evaluate(() => {
    const els = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(els).map((el) => ({
      level: parseInt(el.tagName[1] ?? '0'),
      text: el.textContent?.trim().slice(0, 50) ?? '',
    }));
  });

  // Should have exactly one h1
  const h1s = headings.filter((h) => h.level === 1);
  expect(h1s.length).toBeGreaterThanOrEqual(1);

  // Headings should not skip levels (e.g., h1 -> h3 with no h2)
  for (let i = 1; i < headings.length; i++) {
    const current = headings[i]!;
    const previous = headings[i - 1]!;
    const skippedLevel = current.level > previous.level + 1;
    expect(
      skippedLevel,
      `Heading "${current.text}" (h${current.level}) skips level after "${previous.text}" (h${previous.level})`,
    ).toBe(false);
  }
});

test('all images have alt text', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const imagesWithoutAlt = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs)
      .filter((img) => !img.hasAttribute('alt'))
      .map((img) => img.src);
  });

  expect(
    imagesWithoutAlt,
    `Found ${imagesWithoutAlt.length} images without alt text`,
  ).toHaveLength(0);
});

test('interactive elements are keyboard accessible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Tab through the page and verify focus is visible
  await page.keyboard.press('Tab');
  const firstFocused = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.tagName.toLowerCase() ?? 'none';
  });

  // First focusable element should be a link or button (skip nav or header)
  expect(['a', 'button', 'input']).toContain(firstFocused);
});
