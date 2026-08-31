/**
 * UX19 — CV-onboardingens modal ska vara en riktig dialog.
 *
 * Mätt i prod 2026-07-27 innan fixen: role/aria-modal/aria-label = null,
 * Escape stängde inte, klick utanför stängde inte, `document.activeElement`
 * var BODY, och de 14 första tabbstoppen låg utanför modalen — på den
 * mörklagda sidan bakom. Enda utvägen var X-ikonen, som saknade tillgängligt
 * namn (8 namnlösa knappar totalt: X + 7 stegprickar).
 *
 * WCAG: 2.1.2 (ingen tangentbordsfälla), 4.1.2 (namn/roll/värde),
 * 2.4.3 (fokusordning).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CVOnboarding } from './CVOnboarding'

function renderGate() {
  const onComplete = vi.fn()
  const onSkip = vi.fn()
  const view = render(<CVOnboarding onComplete={onComplete} onSkip={onSkip} />)
  return { ...view, onComplete, onSkip }
}

// offsetParent-shimmen (jsdom returnerar annars alltid null, vilket gör
// useFocusTrap blind för fokuserbara element) ligger sedan KT1/TI6 globalt i
// test/setup.ts — flyttad dit ur den här filen så den inte behöver dupliceras
// i varje dialog-/modaltest.
beforeEach(() => {
  // Modalen visas bara för den som inte sett den och som får claim:a sessionen
  localStorage.clear()
  sessionStorage.clear()
  // UX16: guiden väntar på cookiebeslutet. Utgångsläget i testerna är att
  // användaren har svarat — den motsatta vägen har ett eget test nedan.
  localStorage.setItem('jobin_cookie_consent', 'true')
})

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('CVOnboarding — dialogsemantik (UX19)', () => {
  it('renderas som en dialog med aria-modal och tillgängligt namn', () => {
    renderGate()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    // Namnet kommer från rubriken — utan det säger skärmläsaren bara "dialog"
    expect(dialog).toHaveAccessibleName()
  })

  it('flyttar fokus IN i dialogen när den öppnas', async () => {
    const { container } = renderGate()

    await waitFor(() => {
      expect(document.activeElement).not.toBe(document.body)
    })
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog?.contains(document.activeElement)).toBe(true)
  })

  it('stänger med Escape', async () => {
    const { onSkip } = renderGate()

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(onSkip).toHaveBeenCalled())
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('stänger vid klick utanför, men inte vid klick inuti', async () => {
    const { onSkip, container } = renderGate()

    // Klick inuti panelen får inte stänga
    fireEvent.click(screen.getByRole('dialog'))
    expect(onSkip).not.toHaveBeenCalled()

    // Klick på överlägget stänger
    const overlay = container.firstElementChild as HTMLElement
    fireEvent.click(overlay)
    await waitFor(() => expect(onSkip).toHaveBeenCalled())
  })
})

describe('CVOnboarding — alla kontroller har namn (UX19)', () => {
  it('inga namnlösa knappar finns kvar', () => {
    renderGate()

    const utanNamn = screen
      .getAllByRole('button')
      .filter(b => !(b.getAttribute('aria-label') || b.textContent || '').trim())

    expect(utanNamn).toHaveLength(0)
  })

  it('stängknappen har ett namn', () => {
    renderGate()
    expect(screen.getByRole('button', { name: /stäng guiden/i })).toBeInTheDocument()
  })

  it('stegprickarna säger vilket steg de leder till, och vilket som är aktivt', () => {
    renderGate()

    const prickar = screen.getAllByRole('button', { name: /gå till steg/i })
    expect(prickar.length).toBeGreaterThan(1)
    expect(prickar.filter(p => p.getAttribute('aria-current') === 'step')).toHaveLength(1)
  })
})

describe('CVOnboarding — visas bara när den ska', () => {
  it('visas inte för den som redan sett den', () => {
    localStorage.setItem('cv-onboarding-completed', 'true')
    renderGate()

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('väntar på cookiebeslutet och visas när det är taget (UX16)', async () => {
    // Cookiekortet (z-50, fixerat i botten) låg annars ovanpå modalen (z-50)
    // vid förstagångsbesök, så guidens egna knappar inte gick att trycka.
    localStorage.removeItem('jobin_cookie_consent')
    renderGate()

    expect(screen.queryByRole('dialog')).toBeNull()

    localStorage.setItem('jobin_cookie_consent', 'true')
    fireEvent(window, new CustomEvent('cookie-consent-updated'))

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
  })

  it('visas inte när en annan onboarding redan claimat sessionen', () => {
    sessionStorage.setItem('jobin-onboarding-session-claimed', 'profile-welcome')
    renderGate()

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
