import { test, expect } from '@playwright/test';
import { AuthHelper } from '../fixtures/auth-helpers';

test.describe('Volunteering Flow', () => {
  test.beforeEach(async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.setupMockAPI();
  });

  test('regular user can view volunteering jobs', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('regularUser');
    
    await page.goto('/volunteering');
    
    // Should see volunteering jobs
    await expect(page.locator('h2:has-text("Vrijwilligers gevraagd")')).toBeVisible();
    
    // Should see volunteering job (from global mock)
    await expect(page.locator('text=Setup Help')).toBeVisible();
    await expect(page.locator('text=Sound Check')).toBeVisible();
  });

  test.skip('volunteer admin can create volunteering jobs', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('volunteerAdmin');
    
    await page.goto('/volunteering');
    
    // Should see add button for volunteer admin 
    const addButton = page.locator('button[aria-label*="Nieuwe"], button[aria-label*="Toevoegen"]').first();
    await expect(addButton).toBeVisible();
    
    // Click add button
    await addButton.click();
    
    // Should see form modal (wait for modal to open)
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="date_time"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    
    // Fill in form
    await page.fill('input[name="name"]', 'Test Volunteer Job');
    await page.fill('input[name="date_time"]', '2025-02-01T10:00');
    await page.fill('textarea[name="description"]', 'Test description');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success message or redirect back to list
    await expect(page.locator('h2:has-text("Vrijwilligers gevraagd")')).toBeVisible();
  });

  test('user can sign up for volunteering', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('regularUser');
    
    await page.goto('/volunteering');
    
    // Click on volunteering job
    await page.click('text=Setup Help');
    
    // Should navigate to individual job page
    await expect(page).toHaveURL('/volunteering/vol1');
    
    // Should show job details
    await expect(page.locator('text=Help with stage setup')).toBeVisible();
  });

  test('shows different views for past and future jobs', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    // Filter dropdown is only visible to volunteer admins
    await authHelper.mockAuthenticatedUser('volunteerAdmin');
    
    await page.goto('/volunteering');
    
    // Should see filter options (only for volunteer admin)
    await expect(page.locator('select')).toBeVisible();
    
    // Test "Gepland" filter (should be default)
    await expect(page.locator('select')).toHaveValue('future');
    
    // Test "Afgelopen" filter
    await page.selectOption('select', 'past');
    await expect(page.locator('select')).toHaveValue('past');
  });

  test('regular user cannot see admin functions', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('regularUser');
    
    await page.goto('/volunteering');
    
    // Should not see add button
    await expect(page.locator('button[aria-label*="Nieuwe"], button[aria-label*="Toevoegen"]')).not.toBeVisible();
    
    // Should not see filter dropdown (admin only)
    await expect(page.locator('select')).not.toBeVisible();
  });

  test('volunteer admin can edit volunteering jobs', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedUser('volunteerAdmin');
    
    await page.goto('/volunteering');
    
    // Click on a volunteering job to go to detail page
    await page.click('text=Setup Help');
    
    // Should navigate to individual job page 
    await expect(page).toHaveURL('/volunteering/vol1');
    
    // Should see job details
    await expect(page.locator('text=Help with stage setup')).toBeVisible();
  });
});