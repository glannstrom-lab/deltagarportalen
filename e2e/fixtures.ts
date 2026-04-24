import { test as base, expect, Page } from '@playwright/test'

/**
 * Custom test fixtures for Deltagarportalen E2E tests
 */

// Test user credentials (use test accounts in staging)
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
}

export const TEST_CONSULTANT = {
  email: process.env.TEST_CONSULTANT_EMAIL || 'consultant@example.com',
  password: process.env.TEST_CONSULTANT_PASSWORD || 'testpassword123',
}

/**
 * Page Object Model helpers
 */
export class AuthHelper {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.goto('/#/login')
    await waitForAppReady(this.page)
    await this.page.locator('input#email').fill(email)
    await this.page.locator('input#password').fill(password)
    await this.page.getByRole('button', { name: /^logga in$/i }).click()
    // Wait for redirect to dashboard
    await this.page.waitForURL(/\/$/, { timeout: 10000 })
  }

  async logout() {
    // Open user menu and click logout
    await this.page.getByRole('button', { name: /profil|meny/i }).click()
    await this.page.getByRole('menuitem', { name: /logga ut/i }).click()
    await this.page.waitForURL(/\/#\/login/)
  }

  async isLoggedIn(): Promise<boolean> {
    // Check if we're on a protected page (not login/register/landing)
    const url = this.page.url()
    return !url.includes('/#/login') && !url.includes('/#/register')
  }
}

export class NavigationHelper {
  constructor(private page: Page) {}

  async goToDashboard() {
    await this.page.goto('/#/')
    await waitForAppReady(this.page)
  }

  async goToCV() {
    await this.page.goto('/#/cv')
    await waitForAppReady(this.page)
  }

  async goToJobSearch() {
    await this.page.goto('/#/job-search')
    await waitForAppReady(this.page)
  }

  async goToCoverLetter() {
    await this.page.goto('/#/cover-letter')
    await waitForAppReady(this.page)
  }

  async goToProfile() {
    await this.page.goto('/#/profile')
    await waitForAppReady(this.page)
  }
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<{
  auth: AuthHelper
  nav: NavigationHelper
}>({
  auth: async ({ page }, use) => {
    const auth = new AuthHelper(page)
    await use(auth)
  },
  nav: async ({ page }, use) => {
    const nav = new NavigationHelper(page)
    await use(nav)
  },
})

export { expect }

/**
 * Common assertions
 */
export async function expectToast(page: Page, text: string | RegExp) {
  const toast = page.getByRole('alert').or(page.locator('[class*="toast"]'))
  await expect(toast).toContainText(text)
}

export async function expectNoErrors(page: Page) {
  // Check for error boundaries
  const errorBoundary = page.locator('[class*="error-boundary"]')
  await expect(errorBoundary).not.toBeVisible()

  // Check for error messages
  const errorMessage = page.getByRole('alert').filter({ hasText: /fel|error/i })
  await expect(errorMessage).not.toBeVisible()
}

/**
 * Wait helpers
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle')
}

export async function waitForSkeleton(page: Page) {
  // Wait for skeleton to appear and then disappear
  const skeleton = page.locator('[class*="skeleton"]').first()
  if (await skeleton.isVisible()) {
    await expect(skeleton).not.toBeVisible({ timeout: 10000 })
  }
}

/**
 * Wait for app to finish loading (auth initialization)
 * The app shows "Laddar Jobin..." or a spinner while auth initializes
 */
export async function waitForAppReady(page: Page, timeout = 15000) {
  // Wait for loading indicators to disappear
  const loadingIndicators = [
    page.getByText('Laddar Jobin...'),
    page.getByText('Laddar...'),
    page.locator('[role="status"][aria-busy="true"]'),
  ]

  for (const indicator of loadingIndicators) {
    try {
      // Wait a bit for potential loading state to appear
      await page.waitForTimeout(500)
      if (await indicator.isVisible({ timeout: 1000 })) {
        await expect(indicator).not.toBeVisible({ timeout })
      }
    } catch {
      // Loading indicator not found or already gone
    }
  }

  // Dismiss cookie consent if present
  try {
    const acceptCookies = page.getByRole('button', { name: /endast nödvändiga/i })
    if (await acceptCookies.isVisible({ timeout: 1000 })) {
      await acceptCookies.click()
      await page.waitForTimeout(300)
    }
  } catch {
    // Cookie consent not found or already dismissed
  }

  // Extra wait for React hydration and state updates
  await page.waitForTimeout(500)
}
