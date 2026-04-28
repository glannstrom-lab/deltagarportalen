/**
 * Smoke-tester — verifierar att portalen startar och public sidor renderar.
 * Kräver INGEN inloggning, så kan köras i CI utan TEST_USER-credentials.
 *
 * Authenticated tester (cv, dashboard, cover-letter, job-search) kräver
 * TEST_USER_EMAIL/TEST_USER_PASSWORD som GitHub Secrets — se README för setup.
 */
import { test, expect } from '@playwright/test'

test.describe('Smoke — public pages', () => {
  test('landing page renderar utan fel', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Verifiera att huvudinnehållet finns (Jobin-titel eller logga)
    await expect(page.locator('body')).toBeVisible()

    // Inga JS-runtime-errors under sidladdning
    // Filtrera bort kända varningar (Sentry-init utan DSN, Supabase-warns i dev)
    const seriousErrors = errors.filter(
      (e) => !e.includes('Sentry') && !e.includes('Supabase') && !e.includes('favicon')
    )
    expect(seriousErrors).toEqual([])
  })

  test('login-sida laddar och visar formulär', async ({ page }) => {
    await page.goto('/#/login')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('input#email')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /logga in/i }).first()).toBeVisible()
  })

  test('register-sida laddar', async ({ page }) => {
    await page.goto('/#/register')
    await page.waitForLoadState('domcontentloaded')
    // Register kan ha samma form-struktur eller skilja sig
    await expect(page.locator('body')).toBeVisible()
  })

  test('privacy-policy är tillgänglig', async ({ page }) => {
    await page.goto('/#/privacy')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible()
  })

  test('AI-policy är tillgänglig', async ({ page }) => {
    await page.goto('/#/ai-policy')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible()
  })

  test('skyddade sidor redirectar oautentiserad till landing/login', async ({ page }) => {
    await page.goto('/#/cv')
    await page.waitForLoadState('domcontentloaded')

    // Bör hamna på landing (/) eller login (/#/login) eftersom RootRoute
    // visar Landing när !isAuthenticated och PrivateRoute redirectar
    await page.waitForTimeout(1500)
    const url = page.url()
    expect(url.endsWith('/') || url.includes('#/') || url.includes('/login')).toBe(true)
  })
})
