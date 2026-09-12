import { test, expect, TEST_USER, waitForAppReady } from './fixtures'

/**
 * CV-byggaren (/#/cv).
 *
 * Omskriven 2026-09-12 (D28). Den förra versionen letade efter
 * `getByRole('tablist')` och `page.goto('/cv')` (utan hash — landar på
 * Översikt), och lade `if (await x.isVisible())` runt varje steg. Den här
 * asserterar på sidan som den ser ut sedan omläggningen 2026-08-17:
 * sidoskenan med verktygslänkar, stegöversikten via skenSlot, mätaren och
 * knappraden. Testerna skriver inte i CV:t; mallvalet återställs.
 */

test.describe('CV-byggaren', () => {
  test.beforeEach(async ({ page, auth }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    await auth.login(TEST_USER.email, TEST_USER.password)
    await page.goto('/#/cv')
    await waitForAppReady(page)
    // Första besöket i en ny webbläsare visar guiden "Välkommen till CV-byggaren!"
    // (7 steg, modal). Den ligger över knappraden och har en egen "Nästa"-knapp,
    // så den stängs här — guiden är en riktig funktion, inte brus.
    const guide = page.getByRole('dialog', { name: /välkommen till cv-byggaren/i })
    if (await guide.isVisible({ timeout: 2000 }).catch(() => false)) {
      await guide.getByRole('button', { name: /stäng guiden/i }).click()
      await expect(guide).toBeHidden()
    }
  })

  test('sidan har rubrik och verktygslänkarna i sidoskenan', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^cv$/i)
    const skena = page.getByRole('navigation', { name: /^cv — avsnitt$/i })
    for (const lank of [/skapa cv/i, /dina cv/i, /anpassa/i, /ats-analys/i, /cv-tips/i]) {
      await expect(skena.getByRole('link', { name: lank })).toBeVisible()
    }
  })

  test('stegöversikten visar alla sex delar och "Nästa" flyttar fram', async ({ page }) => {
    const steg = page.getByRole('navigation', { name: /innehåll i ditt cv/i })
    await expect(steg).toBeVisible()
    await expect(steg.getByRole('button')).toHaveCount(6)

    const foregaende = page.getByRole('button', { name: /^föregående$/i })
    await expect(foregaende).toBeDisabled()
    await page.getByRole('button', { name: /^nästa$/i }).click()
    await expect(foregaende).toBeEnabled()
  })

  test('mätaren har ett tillgängligt namn och rimliga värden', async ({ page }) => {
    const matare = page.getByRole('progressbar').first()
    await expect(matare).toBeVisible()
    // WCAG 4.1.2: aria-labelledby → "N av 6 delar klara"
    await expect(matare).toHaveAccessibleName(/delar klara/i)
    const nu = Number(await matare.getAttribute('aria-valuenow'))
    const max = Number(await matare.getAttribute('aria-valuemax'))
    expect(max).toBe(6)
    expect(nu).toBeGreaterThanOrEqual(0)
    expect(nu).toBeLessThanOrEqual(max)
  })

  test('knappraden: spara, exportera och förhandsvisning finns', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^spara cv$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^exportera pdf$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^förhandsvisning$/i }).first()).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: /sparat/i })).toBeVisible()
  })

  test('mallvalet: välj en mall, bekräftelsen följer med, återställ', async ({ page }) => {
    const mallar = page.getByRole('button', { name: /^förhandsvisning av mallen/i })
    expect(await mallar.count()).toBeGreaterThanOrEqual(12)

    const fore = (await page.getByText(/^\S+ är vald$/).textContent())?.trim()
    await page.getByRole('button', { name: /^förhandsvisning av mallen centrerad/i }).click()
    await expect(page.getByText(/^centrerad är vald$/i)).toBeVisible()

    // Återställ så nästa körning ser samma utgångsläge
    const ursprunglig = fore?.replace(/ är vald$/, '') ?? 'Sidokolumn'
    await page.getByRole('button', { name: new RegExp(`^förhandsvisning av mallen ${ursprunglig}`, 'i') }).click()
    await expect(page.getByText(new RegExp(`^${ursprunglig} är vald$`, 'i'))).toBeVisible()
  })

  test('"Dina CV" i skenan byter avsnitt', async ({ page }) => {
    const lank = page.getByRole('navigation', { name: /^cv — avsnitt$/i }).getByRole('link', { name: /dina cv/i })
    await lank.click()
    await expect(lank).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^cv$/i)
  })

  test('tangentbord: stegknapparna går att nå med Tab', async ({ page }) => {
    const forsta = page.getByRole('navigation', { name: /innehåll i ditt cv/i }).getByRole('button').first()
    await forsta.focus()
    await expect(forsta).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
  })
})
