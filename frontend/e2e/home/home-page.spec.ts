import { test, expect } from '@playwright/test';
import { AuthHelper } from '../fixtures/auth-helpers';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.setupMockAPI();
  });

  test('shows login form when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('email field can be filled', async ({ page }) => {
    await page.goto('/');
    
    // Fill email field
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Should still show login form on mobile
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('shows authenticated content when logged in', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('regularUser');
    
    await page.goto('/');
    
    // Should show authenticated home page content
    await expect(page.locator('h2:has-text("Repetities en optredens")')).toBeVisible();
    
    // Should show app header with navigation
    await expect(page.locator('text=Fanfare app')).toBeVisible();
    
    // Should show navigation links
    await expect(page.locator('text=Repetities en optredens')).toBeVisible();
    await expect(page.locator('text=Vrijwilligers gevraagd')).toBeVisible();
    
    // Should show logout button
    await expect(page.locator('button:has-text("Uitloggen")')).toBeVisible();
    
    // Should show mock attendance data
    await expect(page.locator('text=Mock Rehearsal')).toBeVisible();
    await expect(page.locator('text=Mock Orchestra')).toBeVisible();
    
    // Should show banner messages
    await expect(page.locator('text=Mock banner message')).toBeVisible();
    
    // Should NOT show login form
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
  });

  test('shows empty state when no attendance data', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('regularUser');
    
    // Override the mock to return empty attendance
    await page.route('**/api/collections/attendance**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] })
      });
    });
    
    await page.goto('/');
    
    // Should show the heading
    await expect(page.locator('h2:has-text("Repetities en optredens")')).toBeVisible();
    
    // Should show empty state message
    await expect(page.locator('text=Geen repetities of optredens gevonden')).toBeVisible();
  });

  test('shows loading state initially', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('regularUser');
    
    // Add delay to API response to catch loading state
    await page.route('**/api/collections/attendance**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] })
      });
    });
    
    await page.goto('/');
    
    // Should show loading spinner initially
    await expect(page.locator('text=Laden...')).toBeVisible();
    
    // Should eventually show content
    await expect(page.locator('h2:has-text("Repetities en optredens")')).toBeVisible();
  });

  test('attendance items are clickable and show session details', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('regularUser');
    
    await page.goto('/');
    
    // Should show attendance item
    await expect(page.locator('text=Mock Rehearsal')).toBeVisible();
    
    // Attendance item should be clickable (ListRow component)
    const attendanceRow = page.locator('text=Mock Rehearsal').locator('..');
    await expect(attendanceRow).toBeVisible();
    
    // Should show attendance state
    await expect(page.locator('text=Aangemeld')).toBeVisible();
  });

  test('regular user cannot see admin navigation', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('regularUser');
    
    await page.goto('/');
    
    // Should NOT see admin navigation items
    await expect(page.locator('text=Admin')).not.toBeVisible();
    await expect(page.locator('text=Beheer sessies')).not.toBeVisible();
    await expect(page.locator('text=Leden')).not.toBeVisible();
    await expect(page.locator('text=Banners')).not.toBeVisible();
  });

  test('session admin can see admin navigation', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('sessionAdmin');
    
    await page.goto('/');
    
    // Should show authenticated content
    await expect(page.locator('h2:has-text("Repetities en optredens")')).toBeVisible();
    
    // Should see admin navigation
    await expect(page.locator('text=Admin')).toBeVisible();
    
    // Click admin dropdown to see menu items
    await page.click('text=Admin');
    await expect(page.locator('text=Beheer sessies')).toBeVisible();
    await expect(page.locator('text=Leden')).toBeVisible();
    
    // Should NOT see banner admin options
    await expect(page.locator('text=Banners')).not.toBeVisible();
  });

  test('banner admin can see banner management', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('bannerAdmin');
    
    await page.goto('/');
    
    // Should show authenticated content
    await expect(page.locator('h2:has-text("Repetities en optredens")')).toBeVisible();
    
    // Should see admin navigation
    await expect(page.locator('text=Admin')).toBeVisible();
    
    // Click admin dropdown to see menu items
    await page.click('text=Admin');
    await expect(page.locator('text=Banners')).toBeVisible();
    
    // Should NOT see session admin options
    await expect(page.locator('text=Beheer sessies')).not.toBeVisible();
    await expect(page.locator('text=Leden')).not.toBeVisible();
  });
});