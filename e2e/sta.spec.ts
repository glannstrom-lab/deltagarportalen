/**
 * STA/Arbetsprövning — e2e-täckning (D9, 2026-07-23).
 *
 * STA är en av portalens fyra huvudfunktioner (se CLAUDE.md) men saknade helt
 * e2e-täckning innan detta. Livstecken-nivå precis som golden-path — muterar
 * ingen data (inga formulär skickas, inga knappar som skapar/ändrar rader
 * klickas). Riktiga routes hämtade ur client/src/App.tsx:
 *   /#/steg-till-arbete — deltagarvy (StaParticipant). **Monteras bara när
 *     VITE_STA_ENABLED=true** — modulen avaktiverades 2026-08-03.
 *
 * Konsulentvyn (/#/konsulent/steg-till-arbete + dokumentarbetsytan) togs bort
 * 2026-08-03 och har ingen route längre. Den täcks nu av en regressionsvakt
 * längst ned i filen i stället för av ett livstecken.
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
  // Modulen är avaktiverad 2026-08-03 (MODULES.STA i client/src/config/features.ts).
  // Deltagarvyn har ingen route när flaggan är av → testerna skippas tills
  // miljön kör med STA påslaget (sätt E2E_STA_ENABLED=true).
  test.skip(process.env.E2E_STA_ENABLED !== 'true', 'STA-modulen är avaktiverad (VITE_STA_ENABLED)')
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

/**
 * Regressionsvakt för borttagningen 2026-08-03: STA-konsulentvyn ska INTE gå
 * att nå. Portalen har en konsulentvy — /consultant. Testet körs oavsett om
 * STA-modulen är påslagen igen, eftersom borttagningen är permanent och inte
 * flaggstyrd.
 */
test.describe('STA/Arbetsprövning — konsulentvyn är borttagen', () => {
  test.skip(!process.env.TEST_CONSULTANT_EMAIL, 'Consultant credentials not configured')

  test('/konsulent/steg-till-arbete finns inte — faller på catch-all', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.login(TEST_CONSULTANT.email, TEST_CONSULTANT.password)

    await page.goto('/#/konsulent/steg-till-arbete')
    await waitForAppReady(page)
    await expectPageAlive(page)

    // Catch-all i App.tsx navigerar till "/" när ingen route matchar
    await expect(page).not.toHaveURL(/konsulent\/steg-till-arbete/)
    // Och konsulentens riktiga vy ska fortfarande fungera
    await page.goto('/#/consultant')
    await waitForAppReady(page)
    await expectPageAlive(page)
    await expect(page.getByRole('tablist').first()).toBeVisible({ timeout: 10000 })
  })
})
