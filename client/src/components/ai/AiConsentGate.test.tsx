/**
 * AiConsentGate grindade på `hasConsent` ensamt (hittat i mutationsstickprovet
 * 2026-09-24): den som gett samtycke men stängt av AI (art. 21) fick ändå
 * AI-komponenterna, och serverns grind nekade sedan varje anrop.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const samtycke = vi.hoisted(() => ({
  hasConsent: false,
  isEnabled: false,
  isOptedOut: false,
  consentedAt: null as string | null,
  isLoading: false,
}))

vi.mock('@/hooks/useAiConsent', () => ({ useAiConsent: () => samtycke }))
vi.mock('@/services/consentApi', () => ({ beviljaSamtycke: vi.fn() }))

import { AiConsentGate } from './AiConsentGate'

function rendera() {
  return render(
    <MemoryRouter>
      <AiConsentGate compact featureName="Test">
        <p>AI-innehåll</p>
      </AiConsentGate>
    </MemoryRouter>,
  )
}

describe('AiConsentGate', () => {
  beforeEach(() => {
    Object.assign(samtycke, { hasConsent: false, isEnabled: false, isOptedOut: false })
  })

  it('visar AI-innehållet när samtycke finns och AI är påslaget', () => {
    Object.assign(samtycke, { hasConsent: true, isEnabled: true })
    rendera()
    expect(screen.getByText('AI-innehåll')).toBeInTheDocument()
  })

  it('visar INTE AI-innehållet när samtycket finns men AI är avstängt (art. 21)', () => {
    Object.assign(samtycke, { hasConsent: true, isOptedOut: true })
    rendera()
    expect(screen.queryByText('AI-innehåll')).not.toBeInTheDocument()
    expect(screen.getByText('AI-funktionerna är avstängda')).toBeInTheDocument()
    // Frågar inte om samtycke igen — pekar på brytaren.
    expect(screen.queryByRole('button', { name: /samtycke/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/settings?section=privacy')
  })

  it('frågar om samtycke när det saknas', () => {
    rendera()
    expect(screen.queryByText('AI-innehåll')).not.toBeInTheDocument()
    expect(screen.getByText('AI-samtycke krävs')).toBeInTheDocument()
  })
})
