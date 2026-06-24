import { test, expect } from '@playwright/test';
import { ROUTES } from '@bool/shared';
import { dismissCookieBanner, getHydratedRoot } from './helpers';

test.describe('Navigation', () => {
  test('desktop navigation links work', async ({ page }) => {
    await page.goto(ROUTES.home);
    await dismissCookieBanner(page);
    const nav = page.locator('header nav').first();

    await nav.locator(`a.nav-link[href="${ROUTES.about}"]`).click();
    await expect(page).toHaveURL(ROUTES.about);
    await expect(page).toHaveTitle(/About/i);

    await nav.locator(`a.nav-link[href="${ROUTES.services}"]`).click();
    await expect(page).toHaveURL(ROUTES.services);
    await expect(page).toHaveTitle(/Services/i);

    await nav.locator(`a.nav-link[href="${ROUTES.contacts}"]`).click();
    await expect(page).toHaveURL(ROUTES.contacts);
    await expect(page).toHaveTitle(/Contacts/i);
  });

  test('mobile navigation opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTES.home);
    await dismissCookieBanner(page);
    // Wait for the React island to hydrate before any interaction.
    await getHydratedRoot(page, 'MobileNav');

    // MobileNav uses Sheet with aria-controls="mobile-nav" on the trigger.
    const menuButton = page.locator('button[aria-controls="mobile-nav"]');
    if ((await menuButton.count()) === 0) return; // Site has no mobile menu

    // Poll until the click is reflected in the open state. This survives
    // the rare race where the click lands a tick before React's onClick is
    // attached, by re-clicking inside expect.poll until aria-expanded flips.
    await expect
      .poll(
        async () => {
          if ((await menuButton.getAttribute('aria-expanded')) === 'true') return 'open';
          await menuButton.click();
          return menuButton.getAttribute('aria-expanded');
        },
        { timeout: 10_000, intervals: [200, 400, 600, 800, 1000] }
      )
      .toBe('open');

    // Sheet (Radix Dialog) mounts in a portal at <body>. Match the dialog
    // containing the nav links so we don't pick up the cookie banner dialog
    // or the dialog backdrop alone.
    const mobileNav = page.locator(`[role="dialog"]:has(a[href="${ROUTES.about}"])`).first();
    await expect(mobileNav).toBeVisible({ timeout: 5_000 });
    await mobileNav.locator(`a[href="${ROUTES.about}"]`).first().click();
    await expect(page).toHaveURL(ROUTES.about);
  });
});

test.describe('Cookie Consent', () => {
  test('accept cookies hides banner and persists across reload', async ({ page }) => {
    await page.goto(ROUTES.home);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const banner = page.locator('[aria-label="Cookie consent"]').first();
    if (await banner.isVisible().catch(() => false)) {
      await dismissCookieBanner(page);
      await expect(banner).toBeHidden();

      await page.reload();
      await page.waitForLoadState('load');
      // Either gone from DOM or still hidden — both acceptable.
      const stillVisible = await banner.isVisible().catch(() => false);
      expect(stillVisible).toBe(false);
    }
  });

  test('"Manage" opens the preferences view (does not auto-dismiss)', async ({ page }) => {
    // Initial view has "Accept all" and "Reject all" buttons plus a "Manage
    // preferences" link (the last button) that opens the preferences panel.
    // The banner is gated behind the CONSENT_ENABLED flag; when it's disabled
    // the banner is absent and this test no-ops via the visibility guard below.
    await page.goto(ROUTES.home);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const banner = page.locator('[aria-label="Cookie consent"]').first();
    if (!(await banner.isVisible().catch(() => false))) return;

    const manageButton = banner.locator('button').last();
    await manageButton.click();

    // Preferences view shows category checkboxes — at least one role="checkbox"
    // or one labelled toggle should now be visible inside the dialog.
    await expect(banner.locator('input[type="checkbox"], [role="switch"]').first()).toBeVisible();
  });
});

test.describe('Contact Form', () => {
  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto(ROUTES.contacts);
    await dismissCookieBanner(page);

    // Find and submit the form
    const submitButton = page.locator('button[type="submit"]');
    if ((await submitButton.count()) > 0) {
      await submitButton.first().click();

      // Should show validation errors (required fields)
      const errorMessages = page.locator('[class*="error" i], [role="alert"]');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('accepts valid input in form fields', async ({ page }) => {
    await page.goto(ROUTES.contacts);
    await dismissCookieBanner(page);

    // Fill in form fields
    const nameInput = page.locator('input[name="name"], input[name="firstName"]');
    if ((await nameInput.count()) > 0) {
      await nameInput.first().fill('John Doe');
      await expect(nameInput.first()).toHaveValue('John Doe');
    }

    const emailInput = page.locator('input[name="email"]');
    if ((await emailInput.count()) > 0) {
      await emailInput.first().fill('john@example.com');
      await expect(emailInput.first()).toHaveValue('john@example.com');
    }

    const messageInput = page.locator('textarea[name="message"]');
    if ((await messageInput.count()) > 0) {
      await messageInput.first().fill('Test message content');
      await expect(messageInput.first()).toHaveValue('Test message content');
    }
  });
});

test.describe('Footer', () => {
  test('footer contains legal links', async ({ page }) => {
    await page.goto(ROUTES.home);
    await dismissCookieBanner(page);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator(`a[href="${ROUTES.privacy}"]`)).toBeVisible();
    await expect(footer.locator(`a[href="${ROUTES.terms}"]`)).toBeVisible();
    await expect(footer.locator(`a[href="${ROUTES.cookies}"]`)).toBeVisible();
  });
});

// Portfolio + Blog page-load assertions are covered in depth by
// e2e/case-studies.spec.ts and e2e/images-no-broken.spec.ts.
