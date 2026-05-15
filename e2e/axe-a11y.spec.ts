/**
 * WCAG 2.1 AA-audit av portalens viktiga sidor.
 *
 * Använder @axe-core/playwright för att skanna efter automatiska tillgänglighets-
 * brister. Kompletterar manuell granskning — Axe fångar ~30% av WCAG-issues men
 * det är 30% gratis.
 *
 * Kör: npx playwright test e2e/axe-a11y.spec.ts
 *
 * EAA (European Accessibility Act, 2025-06-28) + Lag (2018:1937) kräver WCAG 2.1 AA.
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { TEST_USER, waitForAppReady, AuthHelper } from './fixtures'

// Sidor som ska auditas (publika först, sedan inloggade)
const PUBLIC_PAGES = [
  { name: 'Login', path: '/#/login' },
  { name: 'Register', path: '/#/register' },
  { name: 'Landing', path: '/' },
  { name: 'Privacy', path: '/#/privacy' },
  { name: 'Terms', path: '/#/terms' },
  { name: 'AI Policy', path: '/#/ai-policy' },
  { name: 'Accessibility', path: '/#/tillganglighet' },
]

const AUTH_PAGES = [
  { name: 'Overview', path: '/#/oversikt' },
  { name: 'Job Search', path: '/#/jobb' },
  { name: 'Career', path: '/#/karriar' },
  { name: 'Resources', path: '/#/resurser' },
  { name: 'My day', path: '/#/min-vardag' },
  { name: 'CV', path: '/#/cv' },
  { name: 'Cover Letter', path: '/#/cover-letter' },
  { name: 'Profile', path: '/#/profile' },
  { name: 'Settings', path: '/#/settings' },
]

test.describe('A11y — Public pages (WCAG 2.1 AA)', () => {
  for (const page of PUBLIC_PAGES) {
    test(`${page.name} ska inte ha WCAG-overträdelser`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path)
      await waitForAppReady(browserPage)

      const results = await new AxeBuilder({ page: browserPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      // Logga overträdelser för senare granskning
      if (results.violations.length > 0) {
        console.log(`\n[${page.name}] ${results.violations.length} violations:`)
        for (const v of results.violations) {
          console.log(`  - [${v.impact}] ${v.id}: ${v.description}`)
          console.log(`    Help: ${v.helpUrl}`)
          for (const node of v.nodes.slice(0, 3)) {
            console.log(`    Selector: ${node.target.join(' ')}`)
          }
        }
      }

      // Vi misslyckas hård bara på serious + critical violations.
      // moderate + minor loggas men blockerar inte CI.
      const blockingViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      )
      expect(blockingViolations, `Critical/serious WCAG violations on ${page.name}`).toEqual([])
    })
  }
})

test.describe('A11y — Authenticated pages (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.login(TEST_USER.email, TEST_USER.password)
  })

  for (const targetPage of AUTH_PAGES) {
    test(`${targetPage.name} ska inte ha WCAG-overträdelser`, async ({ page }) => {
      await page.goto(targetPage.path)
      await waitForAppReady(page)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Exkludera vissa kända områden där 3:e-parts iframes har egna brister
        .exclude('iframe[src*="google"]')
        .exclude('iframe[src*="linkedin"]')
        .analyze()

      if (results.violations.length > 0) {
        console.log(`\n[${targetPage.name}] ${results.violations.length} violations:`)
        for (const v of results.violations) {
          console.log(`  - [${v.impact}] ${v.id}: ${v.description}`)
          console.log(`    Help: ${v.helpUrl}`)
        }
      }

      const blockingViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      )
      expect(blockingViolations, `Critical/serious WCAG violations on ${targetPage.name}`).toEqual([])
    })
  }
})

test.describe('A11y — Specific WCAG checks', () => {
  test('All images on Landing have alt text', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const ariaHidden = await img.getAttribute('aria-hidden')
      // Tillåt aria-hidden="true" för dekorativa bilder
      if (ariaHidden !== 'true') {
        expect(alt, 'Image missing alt attribute').not.toBeNull()
      }
    }
  })

  test('All form inputs on Login have labels', async ({ page }) => {
    await page.goto('/#/login')
    await waitForAppReady(page)
    const inputs = await page.locator('input:not([type="hidden"])').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      // En av: id med matchande label, aria-label, eller aria-labelledby
      const hasLabel = (id && await page.locator(`label[for="${id}"]`).count() > 0)
        || !!ariaLabel
        || !!ariaLabelledBy
      expect(hasLabel, 'Input missing accessible name').toBeTruthy()
    }
  })

  test('Skip-link finns på huvudsidan', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    // Sök efter länk till #main-content eller liknande
    const skipLink = page.locator('a[href*="#main"], a[href*="#content"]').first()
    expect(await skipLink.count(), 'Skip-link saknas').toBeGreaterThan(0)
  })
})
