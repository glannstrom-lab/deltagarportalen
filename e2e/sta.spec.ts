/**
 * STA (Steg till arbete) är ARKIVERAD sedan 2026-09-12 — archive/2026-09-sta/.
 *
 * Det här är regressionsvakten som blev kvar: ingen av STA:s rutter får gå att nå.
 * Utan route faller de på App.tsx catch-all → tillbaka till Översikt. De gamla
 * flödestesterna (deltagarvy, konsulentvy) ligger i archive/2026-09-sta/e2e/.
 *
 * Filen finns kvar under sitt gamla namn för att ci.yml räknar upp den i
 * e2e-jobbets kommandorad; en saknad fil hade fällt hela jobbet.
 *
 * Kräver TEST_USER_EMAIL/TEST_USER_PASSWORD (skippas annars).
 */
import { test, expect, TEST_USER, waitForAppReady } from './fixtures'

test.describe('STA — arkiverad, rutterna får inte finnas', () => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')

  test.beforeEach(async ({ auth }) => {
    await auth.login(TEST_USER.email, TEST_USER.password)
  })

  for (const rutt of ['/#/steg-till-arbete', '/#/konsulent/steg-till-arbete']) {
    test(`${rutt} faller på catch-all`, async ({ page }) => {
      await page.goto(rutt)
      await waitForAppReady(page)
      await expect(page.locator('[data-testid="route-error-fallback"]')).toHaveCount(0)
      await expect(page).not.toHaveURL(/steg-till-arbete/)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }
})
