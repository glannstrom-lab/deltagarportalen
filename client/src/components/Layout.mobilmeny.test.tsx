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
