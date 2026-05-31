import { test, expect } from '@playwright/test';
import { AuthHelper } from '../fixtures/auth-helpers';

test.describe('Authentication', () => {
  test('login flow works correctly', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.setupMockAPI();
    
    await page.goto('/');
    
    // Should show login form initially
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Fill in email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Click to show OTP input
    await page.click('text=Ik heb mijn mail op een ander apparaat ontvangen');
    
    // Should show OTP input
    await expect(page.locator('input[placeholder*="wachtwoord"]')).toBeVisible();
    
    // Fill in OTP
    await page.fill('input[placeholder*="wachtwoord"]', '123456');
    await page.click('button[type="submit"]');
    
    // Should redirect to home page
    await expect(page.locator('h2:has-text("Repetities en optredens")')).toBeVisible();
  });

  test('invalid OTP shows error', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.setupMockAPI();
    
    await page.goto('/');
    
    // Fill in email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Click to show OTP input
    await page.click('text=Ik heb mijn mail op een ander apparaat ontvangen');
    
    // Fill in wrong OTP
    await page.fill('input[placeholder*="wachtwoord"]', '000000');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Ongeldig')).toBeVisible();
  });

  test.skip('different user roles have different access', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.setupMockAPI();
    
    // Test regular user
    await authHelper.mockAuthenticatedUser('regularUser');
    await page.goto('/');
    
    // Should not see admin navigation
    await expect(page.locator('text=Beheer sessies')).not.toBeVisible();
    await expect(page.locator('text=Leden')).not.toBeVisible();
    await expect(page.locator('text=Banners')).not.toBeVisible();
    
    // Test session admin
    await authHelper.mockAuthenticatedUser('sessionAdmin');
    await page.reload();
    
    // Should see session admin navigation (need to click Admin dropdown on desktop)
    if (await page.locator('text=Admin').isVisible()) {
      await page.click('text=Admin');
    }
    await expect(page.locator('text=Beheer sessies')).toBeVisible();
    await expect(page.locator('text=Leden')).toBeVisible();
    await expect(page.locator('text=Banners')).not.toBeVisible();
  });

  test.skip('logout works correctly', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.setupMockAPI();
    await authHelper.mockAuthenticatedUser('regularUser');
    
    await page.goto('/');
    
    // Should be on home page
    await expect(page.locator('h2:has-text("Repetities en optredens")')).toBeVisible();
    
    // Handle logout confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Click logout button
    await page.click('button:has-text("Uitloggen")');
    
    // Wait for redirect and should show login form
    await page.waitForURL('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/sessions');
    
    // Should redirect to login
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('authentication persists across page refreshes', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.setupMockAPI();
    await authHelper.mockAuthenticatedUser('regularUser');
    
    await page.goto('/');
    
    // Should be authenticated
    await expect(page.locator('h2:has-text("Repetities en optredens")')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated
    await expect(page.locator('h2:has-text("Repetities en optredens")')).toBeVisible();
  });
});