import { test, expect } from '@playwright/test';
import { ROUTES } from '@bool/shared';
import { dismissCookieBanner, getHydratedRoot } from './helpers';

test.describe('Case studies grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.portfolio);
    await dismissCookieBanner(page);
    await getHydratedRoot(page, 'CaseStudyGrid');
  });

  test('renders ≥ 6 cards with client + subtitle + cover image', async ({ page }) => {
    const grid = page.locator('[data-testid="case-study-grid"]');
    await expect(grid).toBeVisible();

    // Each card has a flip-card structure inside the FilterableGrid.
    // Front face shows .frontLabel (uppercase client) and .frontTitle (subtitle).
    const frontLabels = grid.locator('[class*="frontLabel"]');
    const frontTitles = grid.locator('[class*="frontTitle"]');
    const frontImages = grid.locator('[class*="frontImage"]');

    const labelCount = await frontLabels.count();
    expect(labelCount).toBeGreaterThanOrEqual(6);

    // Sanity: every front label / title is non-empty
    for (let i = 0; i < labelCount; i++) {
      const label = (await frontLabels.nth(i).textContent())?.trim() ?? '';
      const title = (await frontTitles.nth(i).textContent())?.trim() ?? '';
      expect(label, `card #${i + 1} client (frontLabel)`).not.toBe('');
      expect(typeof title, `card #${i + 1} subtitle (frontTitle)`).toBe('string');
    }

    // Every front cover image must have actually loaded (no 404 / 0-byte).
    const brokenCovers = await frontImages.evaluateAll((imgs) =>
      imgs
        .filter((img): img is HTMLImageElement => img instanceof HTMLImageElement)
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src)
    );
    expect(
      brokenCovers,
      `${brokenCovers.length} cover image(s) failed to load:\n${brokenCovers.join('\n')}`
    ).toEqual([]);
  });

  test('back face shows derived `{SECTOR} · {TECH}` header', async ({ page }) => {
    const grid = page.locator('[data-testid="case-study-grid"]');
    const backTags = grid.locator('[class*="backTag"]');
    const count = await backTags.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // At least one back tag must look like `WORD · WORD` (uppercase tokens
    // joined by a U+00B7 middle dot — matches the loader's derived header).
    const headerTexts = await backTags.allTextContents();
    const matched = headerTexts.some((t) => /^[A-Z][A-Z0-9 -]+ · [A-Z][A-Z0-9 -]+$/.test(t.trim()));
    expect(
      matched,
      `expected at least one back tag like "BANKING · MENDIX"; saw:\n${headerTexts.join('\n')}`
    ).toBe(true);
  });

  test('sector filter narrows visible cards', async ({ page }) => {
    const grid = page.locator('[data-testid="case-study-grid"]');
    const cards = grid.locator('[class*="frontTitle"]');

    const totalBefore = await cards.count();
    expect(totalBefore).toBeGreaterThanOrEqual(2);

    // Click the BANKING sector tab; FilterableGrid renders pills as role="tab".
    const bankingTab = page.getByRole('tab', { name: /^BANKING$/i });
    await bankingTab.click();

    // The filter narrows the rendered set; expect strictly fewer cards.
    await expect.poll(async () => cards.count()).toBeLessThan(totalBefore);

    // Reset to ALL — count should bounce back.
    const allTab = page.getByRole('tab', { name: /^ALL$/i });
    await allTab.click();
    await expect.poll(async () => cards.count()).toBe(totalBefore);
  });

  test('"Full Case Study" opens modal with challenge / solution / tech-stack labels and Talk to Expert CTA', async ({
    page,
  }) => {
    const grid = page.locator('[data-testid="case-study-grid"]');
    // Flip the first card so its back face (which holds the CTA) is on top.
    const firstCard = grid.locator('[class*="flipCard"]').first();
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.click();
    // CTA's onClick uses stopPropagation so this second click opens the modal
    // without flipping the card back.
    await grid
      .locator('button', { hasText: /^Full Case Study$/i })
      .first()
      .click();

    // Radix Dialog renders the content as role="dialog".
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Modal labels (en.json: caseStudies.{challenge,solution,techStack}Label)
    await expect(modal).toContainText(/the challenge/i);
    await expect(modal).toContainText(/the solution/i);
    await expect(modal).toContainText(/technology stack/i);

    // CTA: caseStudies.talkToExpertCta
    await expect(modal.getByRole('link', { name: /talk to an expert/i })).toBeVisible();
  });

  test('"Back to Cases" closes the modal', async ({ page }) => {
    const grid = page.locator('[data-testid="case-study-grid"]');
    const firstCard = grid.locator('[class*="flipCard"]').first();
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.click();
    await grid
      .locator('button', { hasText: /^Full Case Study$/i })
      .first()
      .click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: /back to cases/i }).click();
    await expect(modal).toBeHidden();
  });
});
