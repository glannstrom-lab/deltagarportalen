/**
 * Regression (2026-09-22): `groundingTechniques` (byggd från
 * `groundingTechniqueDefs`) hade inget `id`-fält, men `GroundingGuide`
 * grenar sina instruktionssteg på `technique.id === 0 | 1 | else`. Utan
 * `id` var värdet alltid `undefined`, så ALLA tre grundningsövningar
 * (5-4-3-2-1, kallt vatten, aktivt lyssnande) visade exakt samma steg —
 * den sista teknikens, oavsett vilken deltagaren faktiskt klickade på.
 *
 * Det här är en krisstödssida: att visa fel instruktioner till någon i
 * affekt är ett allvarligt fel, inte bara en kosmetisk bugg.
 */
import { describe, it, expect, afterEach } from 'vitest'
import en from '@/i18n/locales/en.json'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/config'
import CrisisTab from './CrisisTab'

function renderTab() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <CrisisTab />
      </MemoryRouter>
    </I18nextProvider>
  )
}

function klickaGrundningskort(index: number) {
  const kort = screen.getAllByRole('button').filter(b =>
    b.className.includes('rounded-xl') && b.className.includes('items-start')
  )
  expect(kort.length).toBeGreaterThan(index)
  fireEvent.click(kort[index])
}

describe('CrisisTab — grundningsövningarna visar rätt steg för respektive teknik', () => {
  it('5-4-3-2-1-tekniken (första kortet) visar sensoriska steg, inte lyssnande-stegen', () => {
    const { container } = renderTab()
    klickaGrundningskort(0)

    expect(container.textContent).toContain('Hitta 5 saker du kan se')
    expect(container.textContent).not.toContain('Sätt på en lugn röst eller lugn musik')
  })

  it('kallt-vatten-tekniken (andra kortet) visar sina egna steg, inte 5-4-3-2-1 eller lyssnande', () => {
    const { container } = renderTab()
    klickaGrundningskort(1)

    expect(container.textContent).toContain('Gå till en kran med kallt vatten')
    expect(container.textContent).not.toContain('Hitta 5 saker du kan se')
    expect(container.textContent).not.toContain('Sätt på en lugn röst eller lugn musik')
  })

  it('aktivt lyssnande (tredje kortet) visar sina egna steg', () => {
    const { container } = renderTab()
    klickaGrundningskort(2)

    expect(container.textContent).toContain('Sätt på en lugn röst eller lugn musik')
  })
})

/**
 * Två döda knappar på krissidan (2026-09-22):
 *  - "Starta chatt nu" satte ett tillstånd som ingenting läste, under en
 *    text som lovade "våra tränade volontärer … dygnet runt". Portalen har
 *    inga volontärer och ingen chatt. Kortet är borttaget.
 *  - "Skicka meddelande till konsulent" saknade onClick. Nu en länk till
 *    Min konsulent, där meddelandena finns.
 * Mutation: lägg tillbaka chattkortet → första testet faller; gör länken
 * till en <Button> utan onClick igen → andra testet faller.
 */
describe('CrisisTab — inga löften utan verkan', () => {
  it('lovar ingen chatt med volontärer som inte finns', () => {
    const { container } = renderTab()
    expect(container.textContent).not.toMatch(/volontär/i)
    expect(screen.queryByRole('button', { name: /starta chatt/i })).not.toBeInTheDocument()
  })

  it('knappen till konsulenten leder någonstans', () => {
    renderTab()
    const lank = screen.getByRole('link', { name: /konsulent/i })
    expect(lank).toHaveAttribute('href', '/my-consultant')
  })
})

/**
 * Krissidan på engelska (driftgenomgången 2026-09-22): andningsövningen,
 * grundningsstegen, konsulentkortet och påminnelsen var hårdkodad svenska —
 * på den sida där en nyanländ i kris minst av allt ska behöva gissa. Stegen var
 * dessutom klickbara div:ar som inte gick att nå med tangentbordet.
 * Mutation: sätt tillbaka en hårdkodad svensk sträng → första testet faller;
 * gör stegen till div igen → andra testet faller.
 */
describe('CrisisTab — engelska och tangentbord', () => {
  afterEach(async () => {
    await i18n.changeLanguage('sv')
  })

  it('visar ingen svensk text i engelskt läge', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    const { container } = renderTab()
    klickaGrundningskort(0)
    const text = container.textContent ?? ''
    expect(text).toContain('Find 5 things you can see')
    expect(text).toContain('Call 112')
    expect(text).not.toMatch(/[åäöÅÄÖ]/)
  })

  it('grundningsstegen är knappar som går att nå med tangentbordet', () => {
    renderTab()
    klickaGrundningskort(1)
    const steg = screen.getByRole('button', { name: /Andas långsamt/ })
    expect(steg.tagName).toBe('BUTTON')
    fireEvent.click(steg)
    expect(steg).toHaveAttribute('aria-current', 'step')
  })
})
