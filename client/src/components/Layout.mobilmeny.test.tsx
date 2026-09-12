/**
 * TG1 — mobilmenyn låg alltid i fokusordningen, öppen eller stängd.
 *
 * Båda off-canvas-panelerna i `Layout` renderas alltid och flyttas bara ut ur
 * bild med `translate-x-full`. Ett element utanför skärmen är fortfarande
 * fokuserbart. Panelen håller 25 navlänkar (alla tre grupper startar utfällda,
 * medvetet) plus grupp-togglar, stäng, inställningar, hjälp och logga ut —
 * runt 32 stopp. Profilpanelen lägger till fyra till.
 *
 * Konsekvensen för målgruppen: en deltagare med låg ork som tabbar sig fram
 * passerade ~36 osynliga stopp innan hon nådde sidans innehåll. På varje sida
 * i appen — inte bara i Min vardag-området, som planen (F19) antog.
 *
 * Panelen bar dessutom `role="dialog" aria-modal="true"` utan fokusfälla och
 * utan Escape. En dialog som utger sig för att vara modal men inte är det är
 * sämre än ingen märkning: skärmläsaren lovar användaren något appen inte höll.
 *
 * WCAG 2.4.3 (Focus Order), 2.4.7 (Focus Visible), 2.1.2 (No Keyboard Trap).
 *
 * ── Vad som INTE går att testa här ──────────────────────────────────────────
 * jsdom sätter alltid `offsetParent = null`, och `useFocusTrap` filtrerar bort
 * element med `offsetParent === null` som dolda. Fokuscyklingen kan därför
 * aldrig verifieras i den här miljön — ett test som påstod det hade varit
 * grönt oavsett om fällan fungerar. Se lärdomen i CLAUDE.md 2026-08-04.
 *
 * Det som ÄR mätbart i jsdom testas i stället, och det råkar vara själva
 * regressionen: `inert`-attributet och Escape-hanteringen.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MobileMainMenu } from './Layout'
import { useAuthStore } from '@/stores/authStore'

afterEach(cleanup)

function rendera(isOpen: boolean, onClose = vi.fn()) {
  const utils = render(
    <MemoryRouter>
      <MobileMainMenu isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>
  )
  const panel = screen.getByRole('dialog', { hidden: true })
  return { ...utils, panel, onClose }
}

describe('menyn är grupperad efter de fem hubbarna (N3, 2026-09-10)', () => {
  it('visar fem hubbgrupper med hubbens ikon, och inga gamla domängrupper', () => {
    // Fram till N3 itererade menyn `navGroups` — "Översikt / Reflektion /
    // Utåtriktat" — så CV och Personligt brev stod under "Reflektion" medan
    // resten av portalen sa "Söka jobb". Menyn ska vara samma träd som
    // toppnaven och bottennavet.
    const { panel } = rendera(true)
    const grupper = panel.querySelectorAll('[data-testid="mobilmeny-hubb"]')
    expect(grupper.length).toBe(5)
    expect(panel.textContent).not.toMatch(/Reflektion|Utåtriktat/)
    expect(panel.querySelectorAll('[data-testid="mobilmeny-hubb"] img').length).toBe(5)
    // Söka jobbs nio undersidor ligger under sin hubb.
    const hrefs = [...panel.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/jobb')
    expect(hrefs).toContain('/cv')
    expect(hrefs).toContain('/linkedin-optimizer')
  })
})

describe('TG1: stängd meny ligger utanför fokusordningen', () => {
  it('sätter inert när menyn är stängd', () => {
    const { panel } = rendera(false)
    expect(
      panel.hasAttribute('inert'),
      'Stängd panel saknar inert — då är alla ~32 länkar tabbstopp på varje sida'
    ).toBe(true)
  })

  it('tar bort inert när menyn öppnas', () => {
    const { panel } = rendera(true)
    expect(
      panel.hasAttribute('inert'),
      'Öppen panel är inert — då går menyn inte att använda med tangentbord'
    ).toBe(false)
  })

  it('panelen finns kvar i DOM även stängd — inert är det som gör den ofarlig', () => {
    // Fixen får inte tyst ha blivit villkorlig rendering: utglidnings-
    // animationen förutsätter att elementet finns kvar. Om någon ändrar till
    // `{isOpen && <div>}` ska det vara ett medvetet beslut, inte en sidoeffekt.
    const { panel } = rendera(false)
    expect(panel).toBeTruthy()
    expect(panel.className).toContain('translate-x-full')
  })

  it('stängd panel innehåller fortfarande navlänkarna', () => {
    // Bevisar att `inert` verkligen behövs: elementen ÄR där, de är bara
    // neutraliserade. Utan attributet vore de fokuserbara.
    const { panel } = rendera(false)
    const fokuserbara = panel.querySelectorAll('a[href], button')
    expect(
      fokuserbara.length,
      'Färre element än väntat — har menyn byggts om? Räkningen bör då justeras.'
    ).toBeGreaterThan(15)
  })
})

describe('TG1: tangentbordsanvändaren kommer ut', () => {
  it('Escape stänger menyn', () => {
    const onClose = vi.fn()
    rendera(true, onClose)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(
      onClose,
      'Escape gör ingenting — enda vägen ut är att tabba till stäng-knappen'
    ).toHaveBeenCalled()
  })

  it('Escape gör ingenting när menyn redan är stängd', () => {
    const onClose = vi.fn()
    rendera(false, onClose)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('andra tangenter stänger inte menyn', () => {
    const onClose = vi.fn()
    rendera(true, onClose)
    fireEvent.keyDown(document, { key: 'a' })
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('TG1: dialogmärkningen stämmer med beteendet', () => {
  it('panelen är märkt som modal dialog med namn', () => {
    const { panel } = rendera(true)
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(panel.getAttribute('aria-label')).toBeTruthy()
  })
})

// PG20 (2026-09-13): konsulenten fick deltagarens hela hubbmeny med "Konsultportal" sist.
describe('PG20: konsulentens mobilmeny', () => {
  afterEach(() => {
    useAuthStore.setState({ profile: null } as never)
  })

  it('konsulent: egna avsnitt först, hubbarna hopfällda under "Deltagarvyn"', () => {
    useAuthStore.setState({ profile: { id: 'k1', role: 'CONSULTANT', activeRole: 'CONSULTANT' } } as never)
    rendera(true)
    const meny = screen.getByRole('dialog', { name: /meny/i })
    const lankar = Array.from(meny.querySelectorAll('a')).map((a) => a.textContent?.trim())
    const konsult = lankar.findIndex((t) => /konsultportal/i.test(t ?? ''))
    const oversikt = lankar.findIndex((t) => /^översikt$/i.test(t ?? ''))
    expect(konsult).toBeGreaterThanOrEqual(0)
    expect(konsult).toBeLessThan(oversikt)
    expect(screen.getByText('Deltagarvyn')).toBeInTheDocument()
    // Hubbarnas undersidor är hopfällda: ingen CV-länk synlig förrän hubben fälls ut
    expect(meny.querySelectorAll('[data-testid="mobilmeny-hubb"] a').length).toBe(5)
    expect(screen.getAllByRole('button', { name: /visa eller dölj/i })[0]).toHaveAttribute('aria-expanded', 'false')
  })

  it('deltagare: hubbarna utfällda som förut och ingen "Deltagarvyn"-rubrik', () => {
    useAuthStore.setState({ profile: { id: 'd1', role: 'USER', activeRole: 'USER' } } as never)
    rendera(true)
    expect(screen.queryByText('Deltagarvyn')).toBeNull()
    expect(screen.getAllByRole('button', { name: /visa eller dölj/i })[0]).toHaveAttribute('aria-expanded', 'true')
  })
})
