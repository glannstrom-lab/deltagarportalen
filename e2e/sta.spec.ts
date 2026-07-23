/**
 * STA/Arbetsprövning — e2e-täckning (D9, 2026-07-23).
 *
 * STA är en av portalens fyra huvudfunktioner (se CLAUDE.md) men saknade helt
 * e2e-täckning innan detta. Livstecken-nivå precis som golden-path — muterar
 * ingen data (inga formulär skickas, inga knappar som skapar/ändrar rader
 * klickas). Riktiga routes hämtade ur client/src/App.tsx:
 *   /#/steg-till-arbete                        — deltagarvy (StaParticipant)
 *   /#/konsulent/steg-till-arbete               — konsulentvy (StaConsultant,
 *                                                  roller CONSULTANT/ADMIN/
 *                                                  SUPERADMIN/ARBETSTERAPEUT)
 *   /#/konsulent/steg-till-arbete/dokument/:id/:docType — dokumentarbetsyta,
 *     kräver riktiga enrollment-id:n från DB — täcks inte här (ingen
 *     mutationsfri väg att hitta ett giltigt par utan att skapa data).
 *
 * Deltagarvyn visar antingen ett fliksystem (aktiv STA-koppling) eller ett
 * tomtillstånd ("När din arbetskonsulent har kopplat dig...") om testkontot
 * saknar enrollment — båda är giltiga livstecken, så testerna grenar på vilket
 * som visas i stället för att anta att data finns.
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

test.describe('STA/Arbetsprövning — deltagarflöde', () => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')

  test('login → /steg-till-arbete laddar utan route-fel', async ({ page, auth }) => {
    await auth.login(TEST_USER.email, TEST_USER.password)

    await page.goto('/#/steg-till-arbete')
    await waitForAppReady(page)
    await expectPageAlive(page)

    // Både aktiv-koppling-heron och tomtillståndets hero delar chippen
    // "Steg till arbete" — ett säkert livstecken oavsett vilket läge testkontot är i.
    await expect(page.getByText('Steg till arbete').first()).toBeVisible({ timeout: 10000 })
  })

  test('fliksystem + DOA-självskattningens vy nås (om testkontot har en aktiv insats)', async ({ page, auth }) => {
    await auth.login(TEST_USER.email, TEST_USER.password)

    await page.goto('/#/steg-till-arbete')
    await waitForAppReady(page)
    await expectPageAlive(page)

    const tablist = page.getByRole('tablist').first()
    const hasEnrollment = (await tablist.count()) > 0
    test.skip(!hasEnrollment, 'Testkontot har ingen aktiv STA-koppling — visar tomtillstånd, inget fliksystem att verifiera')

    // Översiktsfliken är förvald
    await expect(page.getByRole('tab', { name: /Översikt/i })).toBeVisible()

    // Del 1 — Lära känna dig är alltid upplåst (deltagaren startar där) och
    // innehåller DOA-självskattningen ("Min skattning") som obligatorisk aktivitet.
    const del1Tab = page.getByRole('tab', { name: /Del 1/i })
    await expect(del1Tab).toBeVisible()
    await del1Tab.click()
    await waitForAppReady(page)
    await expectPageAlive(page)

    await expect(page.getByText('Min skattning').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('STA/Arbetsprövning — konsulentvy smoke', () => {
  test.skip(!process.env.TEST_CONSULTANT_EMAIL, 'Consultant credentials not configured')

  test('login → /konsulent/steg-till-arbete laddar med fliksystem', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.login(TEST_CONSULTANT.email, TEST_CONSULTANT.password)

    await page.goto('/#/konsulent/steg-till-arbete')
    await waitForAppReady(page)
    await expectPageAlive(page)

    const tablist = page.getByRole('tablist').first()
    await expect(tablist).toBeVisible({ timeout: 10000 })
    for (const tabName of [/Översikt/i, /Deltagare/i, /Skattningar/i, /Arbetsplatser/i, /Dokument/i]) {
      await expect(tablist.getByRole('tab', { name: tabName })).toBeVisible()
    }
  })
})
