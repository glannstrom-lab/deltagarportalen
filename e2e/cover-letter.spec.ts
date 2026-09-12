import { test, expect, TEST_USER, waitForAppReady } from './fixtures'

/**
 * Personligt brev (/#/cover-letter).
 *
 * Omskriven 2026-09-12 (D28). Den förra versionen gick till `/cover-letter`
 * utan hash (landar på Översikt), letade efter `[class*="letter-card"]` och
 * lade `if (isVisible())` runt allt — även runt "generera med AI", som hade
 * kostat pengar om vakten någonsin släppt igenom. Den här asserterar på
 * dagens treställiga guide och anropar aldrig AI:n.
 */

test.describe('Personligt brev', () => {
  test.beforeEach(async ({ page, auth }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    await auth.login(TEST_USER.email, TEST_USER.password)
    await page.goto('/#/cover-letter')
    await waitForAppReady(page)
  })

  test('sidan har rubrik, två avsnitt och tre steg', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^personligt brev$/i)
    const skena = page.getByRole('navigation', { name: /^personligt brev — avsnitt$/i })
    await expect(skena.getByRole('link', { name: /skriv brev/i })).toBeVisible()
    await expect(skena.getByRole('link', { name: /dina brev/i })).toBeVisible()

    const steg = page.getByRole('navigation', { name: /brevskrivningssteg/i })
    await expect(steg.getByRole('listitem')).toHaveCount(3)
    await expect(steg.getByRole('listitem').first()).toHaveText(/steg 1 av 3/i)
  })

  test('mallvalet är en listbox med fyra alternativ som går att byta', async ({ page }) => {
    const listbox = page.getByRole('listbox', { name: /välj brevmall/i })
    await expect(listbox.getByRole('option')).toHaveCount(4)
    await expect(listbox.getByRole('option', { name: /^professionell/i })).toHaveAttribute('aria-selected', 'true')

    await listbox.getByRole('option', { name: /^modern/i }).click()
    await expect(listbox.getByRole('option', { name: /^modern/i })).toHaveAttribute('aria-selected', 'true')
    await expect(listbox.getByRole('option', { name: /^professionell/i })).toHaveAttribute('aria-selected', 'false')
  })

  test('"Jag fyller i själv" öppnar fält för jobbet', async ({ page }) => {
    await page.getByRole('button', { name: /jag fyller i själv/i }).click()
    const falt = page.getByRole('main').getByRole('textbox')
    await expect(falt.first()).toBeVisible()
    expect(await falt.count()).toBeGreaterThanOrEqual(2)
    for (let i = 0; i < await falt.count(); i++) {
      await expect(falt.nth(i), `textbox ${i} saknar namn`).toHaveAccessibleName(/\S/)
    }
  })

  test('"Dina brev" i skenan byter avsnitt', async ({ page }) => {
    const lank = page.getByRole('navigation', { name: /^personligt brev — avsnitt$/i }).getByRole('link', { name: /dina brev/i })
    await lank.click()
    await expect(lank).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^personligt brev$/i)
  })

  test('rådgivaren ger ett råd, inte en ring i hörnet', async ({ page }) => {
    // DESIGN.md: rådgivarna ligger i en kolumn (complementary), ett råd infogat i arbetet
    await expect(page.getByRole('complementary', { name: /råd från/i }).first()).toBeVisible()
    await expect(page.getByRole('complementary', { name: /råd för den här sidan/i })).toBeVisible()
  })

  test('tangentbord: första Tab landar på hopplänken', async ({ page }) => {
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /hoppa till huvudinnehåll/i })).toBeFocused()
  })
})
