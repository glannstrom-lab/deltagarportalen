import { test, expect, TEST_USER, waitForAppReady } from './fixtures'

/**
 * Översikt (/#/oversikt) — deltagarens startsida.
 *
 * Omskriven 2026-09-12 (D28). Den förra versionen var en generisk mall från
 * april: `page.goto('/')`, "snabbåtgärder", `[class*="kpi"]`, och
 * `if (await x.isVisible())` runt varje assertion — så den passerade tomt
 * mot en sida som inte fanns längre. Den här versionen asserterar på det
 * Översikt faktiskt är sedan 2026-09-10: hälsning med förnamn, ETT nästa
 * steg med länk, det som är igång, och de fyra kategorierna. Inga vakter:
 * saknas något ska testet falla.
 */

test.describe('Översikt', () => {
  test.beforeEach(async ({ page, auth }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    await auth.login(TEST_USER.email, TEST_USER.password)
    await page.goto('/#/oversikt')
    await waitForAppReady(page)
  })

  test('hälsar med förnamn i en h1', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    // DESIGN.md §2: "Hej Anna", aldrig "Välkommen tillbaka". Hälsningen följer
    // tid på dygnet (God morgon/dag/kväll) — CI 2026-09-12 föll på "God kväll Claude".
    await expect(h1).toHaveText(/^(hej|god morgon|god dag|god kväll|god natt)\s+\S+/i)
  })

  test('huvudnavigationen visar de fem hubbarna', async ({ page }) => {
    const hubnav = page.getByRole('navigation', { name: /huvudkategorier/i })
    await expect(hubnav).toBeVisible()
    for (const hub of [/^översikt$/i, /^söka jobb$/i, /^karriär$/i, /^resurser$/i, /^din vardag$/i]) {
      await expect(hubnav.getByRole('link', { name: hub })).toBeVisible()
    }
  })

  test('nästa steg är en rubrik med en länk som leder någonstans', async ({ page }) => {
    const main = page.getByRole('main')
    // Tre lägen: laddar / fel / klart. Statusraden säger när svaret är inne.
    await expect(main.getByRole('status').filter({ hasText: /uppdaterad/i })).toBeVisible({ timeout: 15000 })

    const rubrik = main.getByRole('heading', { level: 2 }).first()
    await expect(rubrik).toBeVisible()
    await expect(rubrik).not.toHaveText(/^\s*$/)

    // Nästa-steget är alltid en handling, aldrig en siffra
    const handling = main.getByRole('link').first()
    await expect(handling).toBeVisible()
    await handling.click()
    await expect(page).not.toHaveURL(/\/#\/oversikt$/)
  })

  test('siffror utan underlag visas aldrig som 0', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(main.getByRole('status').filter({ hasText: /uppdaterad/i })).toBeVisible({ timeout: 15000 })
    // CLAUDE.md: "Ett tomt fält är inte en nolla" — en ensam "0" som värde
    // i en länk/kort är regeln bruten. Räknas som text-noder som är exakt "0".
    const nollor = await main.locator('a, button').evaluateAll((els) =>
      els.filter((el) => Array.from(el.querySelectorAll('*')).some((n) => n.childElementCount === 0 && n.textContent?.trim() === '0')).length
    )
    expect(nollor).toBe(0)
  })

  test('undersidorna för hubben nås från undernavigationen', async ({ page }) => {
    const subnav = page.getByRole('navigation', { name: /undersidor/i })
    await expect(subnav).toBeVisible()
    await subnav.getByRole('link', { name: /^cv$/i }).click()
    await expect(page).toHaveURL(/\/#\/cv/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^cv$/i)
  })

  test('mobil: bottennavigeringen och menyn visar hubbarna', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/#/oversikt')
    await waitForAppReady(page)

    await expect(page.getByRole('main')).toBeVisible()
    const botten = page.getByRole('navigation', { name: /hubnavigering/i })
    await expect(botten).toBeVisible()
    await expect(botten.getByRole('link', { name: /söka jobb/i })).toBeVisible()

    await page.getByRole('button', { name: /^meny$/i }).click()
    const meny = page.getByRole('dialog', { name: /^meny$/i })
    await expect(meny).toBeVisible()
    await expect(meny.getByRole('link', { name: /^cv$/i })).toBeVisible()
  })

  test('tangentbord: första Tab landar på hopplänken', async ({ page }) => {
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /hoppa till huvudinnehåll/i })).toBeFocused()
  })

  test('varje synlig knapp har ett namn', async ({ page }) => {
    const knappar = page.getByRole('button')
    const antal = await knappar.count()
    expect(antal).toBeGreaterThan(0)
    for (let i = 0; i < antal; i++) {
      const knapp = knappar.nth(i)
      if (!(await knapp.isVisible())) continue
      await expect(knapp, `knapp ${i} saknar tillgängligt namn`).toHaveAccessibleName(/\S/)
    }
  })

  test('ingen felgräns och ingen evig laddning', async ({ page }) => {
    await expect(page.locator('[data-testid="route-error-fallback"]')).toHaveCount(0)
    await expect(page.getByText('Laddar Jobin...')).toHaveCount(0)
    await expect(page.getByText(/något gick fel/i)).toHaveCount(0)
  })
})
