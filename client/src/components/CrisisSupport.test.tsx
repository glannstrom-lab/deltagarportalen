/**
 * UX30 — krisstödet stal fokus vid varje sidladdning.
 *
 * Effekten "återställ fokus när modalen stängs" saknade skillnad mellan
 * "aldrig öppnad" och "just stängd": den körde även på mount, eftersom
 * `isOpen` redan är `false` då. Komponenten monteras i TopBar, BottomBar och
 * Layout — alltså på varje sida — så varje navigering flyttade fokus till
 * krisstödsknappen.
 *
 * Uppmätt konsekvens 2026-08-04: skip-länkarna hamnade bakom fokuspunkten
 * (tabbstopp 22–24 av 25) och blev i praktiken onåbara för tangentbords-
 * användare, och skärmläsare läste upp "för dig som mår dåligt…" oombedd vid
 * varje sidbyte. För en portal vars målgrupp uttryckligen inkluderar personer
 * med psykisk ohälsa är det senare inte en petitess.
 *
 * WCAG 2.4.3 (Focus Order) och 3.2.1 (On Focus).
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import CrisisSupport from './CrisisSupport'

describe('UX30: CrisisSupport flyttar inte fokus vid montering', () => {
  it('lämnar fokus orört när komponenten monteras', () => {
    const aktivtFore = document.activeElement
    render(<CrisisSupport variant="inline" />)

    expect(
      document.activeElement,
      'Fokus flyttades vid montering — skip-länkarna hamnar då bakom fokuspunkten'
    ).toBe(aktivtFore)
  })

  it('stjäl inte fokus från ett fält som redan har det', () => {
    // Efterliknar en sida där något annat äger fokus när krisstödet monteras.
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    expect(document.activeElement).toBe(input)

    render(<CrisisSupport variant="inline" />)

    expect(document.activeElement, 'Krisstödet tog fokus från ett annat element').toBe(input)

    cleanup()
    input.remove()
  })

  it('återlämnar fokus till öppningsknappen när modalen HAR varit öppen', () => {
    render(<CrisisSupport variant="inline" />)
    const oppnaKnapp = screen.getByRole('button', { expanded: false })

    fireEvent.click(oppnaKnapp)
    expect(screen.getByRole('button', { expanded: true })).toBeTruthy()

    // Escape stänger modalen — då SKA fokus tillbaka till knappen.
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(
      document.activeElement,
      'Fokus återlämnades inte efter stängning — då tappas tangentbordsanvändaren'
    ).toBe(oppnaKnapp)
  })
})
