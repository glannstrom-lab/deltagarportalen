import { test, expect, TEST_USER, waitForAppReady } from './fixtures'

/**
 * Sök jobb (/#/job-search) — AF-sökningen.
 *
 * Omskriven 2026-09-12 (D28). Den förra versionen sökte `searchbox` och
 * `[class*="job-card"]` bakom `if (isVisible())`-vakter och gick till
 * `/job-search` utan hash. Sidan har i dag en combobox "Vad vill du jobba
 * med?", filtergrupper, en statusrad "Visar N av M jobb" och ett <article>
 * per annons med Spara / Skriv brev / Ansök.
 *
 * Sökningen går mot Arbetsförmedlingen på riktigt. Är AF nere faller
 * sökningstestet — det är sant, inte flakigt (searchJobs KASTAR sedan
 * 2026-08-18; ett avbrott är inte noll jobb).
 */

const SOKFALT = /vad vill du jobba med/i

test.describe('Sök jobb', () => {
  test.beforeEach(async ({ page, auth }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    await auth.login(TEST_USER.email, TEST_USER.password)
    await page.goto('/#/job-search')
    await waitForAppReady(page)
  })

  test('sidan har rubrik, sökfält och avsnitten i skenan', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^sök jobb$/i)
    await expect(page.getByRole('combobox', { name: SOKFALT })).toBeVisible()
    const skena = page.getByRole('navigation', { name: /^sök jobb — avsnitt$/i })
    for (const lank of [/^sök$/i, /dagens jobb/i, /slumpjobbet/i, /^sparade$/i, /bevakningar/i, /matchningar/i]) {
      await expect(skena.getByRole('link', { name: lank })).toBeVisible()
    }
  })

  test('en sökning ger annonser med rubrik och tre handlingar', async ({ page }) => {
    const falt = page.getByRole('combobox', { name: SOKFALT })
    await falt.fill('lager')
    await falt.press('Enter')

    const status = page.getByRole('status').filter({ hasText: /visar \d+ av \d+ jobb|inga jobb/i })
    await expect(status).toBeVisible({ timeout: 20000 })

    const annonser = page.getByRole('article')
    expect(await annonser.count()).toBeGreaterThan(0)
    const forsta = annonser.first()
    await expect(forsta.getByRole('heading', { level: 3 })).toBeVisible()
    await expect(forsta.getByRole('button', { name: /^spara$/i })).toBeVisible()
    await expect(forsta.getByRole('link', { name: /skriv brev/i })).toBeVisible()
    await expect(forsta.getByRole('button', { name: /^ansök$/i })).toBeVisible()
  })

  test('platsfiltret finns och sökningen svarar efter val', async ({ page }) => {
    const plats = page.getByRole('group', { name: /^plats$/i })
    await expect(plats.getByRole('combobox', { name: /^kommun$/i })).toBeVisible()
    await expect(plats.getByRole('combobox', { name: /^län$/i })).toBeVisible()

    await plats.getByRole('combobox', { name: /^kommun$/i }).selectOption({ label: 'Stockholm' })
    await expect(page.getByRole('status').filter({ hasText: /visar \d+ av \d+ jobb|inga jobb/i })).toBeVisible({ timeout: 20000 })
  })

  test('"Sparade" i skenan byter avsnitt', async ({ page }) => {
    const lank = page.getByRole('navigation', { name: /^sök jobb — avsnitt$/i }).getByRole('link', { name: /^sparade$/i })
    await lank.click()
    await expect(lank).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^sök jobb$/i)
  })

  test('mobil: sökfältet syns på 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/#/job-search')
    await waitForAppReady(page)
    await expect(page.getByRole('combobox', { name: SOKFALT })).toBeVisible()
    await expect(page.getByRole('navigation', { name: /hubnavigering/i })).toBeVisible()
  })

  test('tillgänglighet: sökfältet har namn och resultatet annonseras', async ({ page }) => {
    await expect(page.getByRole('combobox', { name: SOKFALT })).toHaveAccessibleName(/\S/)
    await expect(page.getByRole('status').filter({ hasText: /visar \d+ av \d+ jobb|inga jobb/i })).toBeVisible({ timeout: 20000 })
  })
})
