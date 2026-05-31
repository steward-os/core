import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('app loads and shows login form', async ({ page }) => {
    // Go to the app
    await page.goto('/');
    
    // Should show login form when not authenticated
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('can type in email field', async ({ page }) => {
    await page.goto('/');
    
    // Wait for and fill email field
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('login button is present', async ({ page }) => {
    await page.goto('/');
    
    // Check submit button exists
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 10000 });
  });
});