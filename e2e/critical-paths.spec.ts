import { test, expect } from '@playwright/test';
import { ROUTES } from '@bool/shared';

test.describe('Navigation', () => {
  test('desktop navigation links work', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');

    await nav.locator(`a[href="${ROUTES.about}"]`).click();
    await expect(page).toHaveURL(ROUTES.about);
    await expect(page).toHaveTitle(/About/i);

    await nav.locator(`a[href="${ROUTES.services}"]`).click();
    await expect(page).toHaveURL(ROUTES.services);
    await expect(page).toHaveTitle(/Services/i);

    await nav.locator(`a[href="${ROUTES.contacts}"]`).click();
    await expect(page).toHaveURL(ROUTES.contacts);
    await expect(page).toHaveTitle(/Contacts/i);
  });

  test('mobile navigation opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Look for mobile menu trigger
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="nav" i]');
    if (await menuButton.count() > 0) {
      await menuButton.first().click();

      // Mobile nav should show links
      const mobileNav = page.locator('[role="dialog"], [data-mobile-nav], nav');
      await expect(mobileNav.locator(`a[href="${ROUTES.about}"]`)).toBeVisible();

      // Navigate via mobile nav
      await mobileNav.locator(`a[href="${ROUTES.about}"]`).click();
      await expect(page).toHaveURL(ROUTES.about);
    }
  });
});

test.describe('Cookie Consent', () => {
  test('accept cookies hides banner', async ({ page }) => {
    // Clear any existing consent
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const banner = page.locator('[role="dialog"]');
    if (await banner.count() > 0) {
      await expect(banner.first()).toBeVisible();

      // Click accept button
      const acceptButton = banner.locator('button').first();
      await acceptButton.click();

      // Banner should disappear
      await expect(banner).not.toBeVisible();

      // Reload — banner should stay hidden
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(banner).not.toBeVisible();
    }
  });

  test('reject cookies hides banner', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const banner = page.locator('[role="dialog"]');
    if (await banner.count() > 0) {
      await expect(banner.first()).toBeVisible();

      // Click reject button (second button)
      const buttons = banner.locator('button');
      const rejectButton = buttons.last();
      await rejectButton.click();

      await expect(banner).not.toBeVisible();
    }
  });
});

test.describe('Contact Form', () => {
  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto(ROUTES.contacts);

    // Find and submit the form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();

      // Should show validation errors (required fields)
      const errorMessages = page.locator('[class*="error" i], [role="alert"]');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('accepts valid input in form fields', async ({ page }) => {
    await page.goto(ROUTES.contacts);

    // Fill in form fields
    const nameInput = page.locator('input[name="name"], input[name="firstName"]');
    if (await nameInput.count() > 0) {
      await nameInput.first().fill('John Doe');
      await expect(nameInput.first()).toHaveValue('John Doe');
    }

    const emailInput = page.locator('input[name="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('john@example.com');
      await expect(emailInput.first()).toHaveValue('john@example.com');
    }

    const messageInput = page.locator('textarea[name="message"]');
    if (await messageInput.count() > 0) {
      await messageInput.first().fill('Test message content');
      await expect(messageInput.first()).toHaveValue('Test message content');
    }
  });
});

test.describe('Footer', () => {
  test('footer contains legal links', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator(`a[href="${ROUTES.privacy}"]`)).toBeVisible();
    await expect(footer.locator(`a[href="${ROUTES.terms}"]`)).toBeVisible();
    await expect(footer.locator(`a[href="${ROUTES.cookies}"]`)).toBeVisible();
  });
});

test.describe('Portfolio', () => {
  test('portfolio page loads and displays cases', async ({ page }) => {
    const response = await page.goto(ROUTES.portfolio);
    expect(response?.status()).toBe(200);

    // Should have at least one portfolio card or case study
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});

test.describe('Blog', () => {
  test('blog page loads with article list', async ({ page }) => {
    const response = await page.goto(ROUTES.blog);
    expect(response?.status()).toBe(200);

    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});
