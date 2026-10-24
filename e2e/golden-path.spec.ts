/**
 * Golden path (D2, 2026-07-10) — deltagarens kärnflöde + konsulent-smoke.
 *
 * Muterar ingen data (mutationsflödena täcks av spontan-verify.cjs m.fl.
 * verktygsskript) — verifierar att varje kärnsida laddar med sitt
 * nyckelinnehåll utan felgräns, i en sammanhängande inloggad session.
 *
 * Kräver TEST_USER_EMAIL/TEST_USER_PASSWORD (skippas annars).
 * Konsulentdelen kräver TEST_CONSULTANT_EMAIL/TEST_CONSULTANT_PASSWORD.
 */
import { test, expect, TEST_USER, TEST_CONSULTANT, waitForAppReady, AuthHelper } from './fixtures'
import type { Page } from '@playwright/test'

async function expectPageAlive(page: Page) {
  // Ingen route-felgräns och inte fast i evig laddning
  await expect(page.locator('[data-testid="route-error-fallback"]')).toHaveCount(0)
  await expect(page.getByText('Laddar Jobin...')).toHaveCount(0)
}

test.describe('Golden path — deltagare', () => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')

  test('login → översikt → cv → jobbsök → ansökningar → spontanansökan → profil', async ({ page, auth }) => {
    await auth.login(TEST_USER.email, TEST_USER.password)

    // 1. Översikt (index redirectar hit)
    await page.goto('/#/oversikt')
    await waitForAppReady(page)
    await expectPageAlive(page)

    // 2. CV-sidan
    await page.goto('/#/cv')
    await waitForAppReady(page)
    await expectPageAlive(page)

    // 3. Jobbsök — sidan laddar och sökfältet finns
    await page.goto('/#/job-search')
    await waitForAppReady(page)
    await expectPageAlive(page)
    await expect(page.locator('input[type="text"], input[type="search"]').first()).toBeVisible({ timeout: 10000 })

    // 4. Ansökningar
    await page.goto('/#/applications')
    await waitForAppReady(page)
    await expectPageAlive(page)

    // 5. Spontanansökan — sök-fliken med AI/orgnr-läge
    await page.goto('/#/spontanansökan')
    await waitForAppReady(page)
    await expectPageAlive(page)
    await expect(page.getByRole('button', { name: /AI-sökning/ })).toBeVisible({ timeout: 10000 })

    // 6. Profil
    await page.goto('/#/profile')
    await waitForAppReady(page)
    await expectPageAlive(page)
  })

  test('hubbnavigeringen fungerar: sidebar visar 5 hubbar', async ({ page, auth }) => {
    await auth.login(TEST_USER.email, TEST_USER.password)
    await page.goto('/#/oversikt')
    await waitForAppReady(page)

    // Omläggningen 2026-08-17: hubbarna ligger i toppnavens <nav aria-label="Huvudkategorier">,
    // inte i en <aside>. Etiketterna kommer ur nav.hubs.* i sv.json.
    const hubnav = page.getByRole('navigation', { name: /huvudkategorier/i })
    // Etiketten först, men inte exakt: hubben med användarens nästa steg får
    // skärmläsartexten "Ditt nästa steg finns här" efter namnet (NastaStegPrick),
    // så exakt matchning föll så fort testkontots nästa steg låg i en hubb (CI 2026-10-23).
    // (?:\s|$) i stället för \b — \b ser inte "ä" som bokstav och fäller "Karriär".
    for (const hub of [/^översikt(?:\s|$)/i, /^söka jobb(?:\s|$)/i, /^karriär(?:\s|$)/i, /^resurser(?:\s|$)/i, /^din vardag(?:\s|$)/i]) {
      await expect(hubnav.getByRole('link', { name: hub }).first()).toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('Konsulent-smoke', () => {
  test.skip(!process.env.TEST_CONSULTANT_EMAIL, 'Consultant credentials not configured')

  test('login → konsulentvy → deltagarlista laddar', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.login(TEST_CONSULTANT.email, TEST_CONSULTANT.password)

    await page.goto('/#/consultant?tab=participants')
    await waitForAppReady(page)
    await expectPageAlive(page)
  })
})
