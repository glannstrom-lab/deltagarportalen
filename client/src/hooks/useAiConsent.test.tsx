/**
 * useAiConsent + AiConsentGate — samtyckets två fält (art. 6.1.a och art. 21).
 *
 * Tillagt 2026-09-24 efter ett mutationsstickprov: `aiEnabled` byttes mot
 * `true` (art. 21-brytaren utan verkan) och HELA sviten förblev grön —
 * hooken hade inget test, och grinden som använder den hade inget heller.
 *
 * Profilformen speglar prod-kolumnerna: `ai_consent_at` är en tidsstämpel
 * eller null, `ai_enabled` är boolean med default TRUE (null/saknas = på).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

type Profil = { ai_consent_at: string | null; ai_enabled?: boolean | null } | null
let tillstand: { profile: Profil; isLoading: boolean } = { profile: null, isLoading: false }

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => tillstand),
}))
vi.mock('@/services/consentApi', () => ({
  beviljaSamtycke: vi.fn(),
}))

import { useAiConsent } from './useAiConsent'
import { AiConsentGate } from '@/components/ai/AiConsentGate'

const TIDPUNKT = '2026-08-01T10:00:00+00:00'

function hook(profile: Profil, isLoading = false) {
  tillstand = { profile, isLoading }
  return renderHook(() => useAiConsent()).result.current
}

describe('useAiConsent', () => {
  beforeEach(() => {
    tillstand = { profile: null, isLoading: false }
  })

  it('ingen profil → inget samtycke, inte på, inte invänt', () => {
    expect(hook(null)).toEqual({
      hasConsent: false,
      isEnabled: false,
      isOptedOut: false,
      consentedAt: null,
      isLoading: false,
    })
  })

  it('samtycke utan ai_enabled-värde → på (kolumnens default är TRUE)', () => {
    const s = hook({ ai_consent_at: TIDPUNKT })
    expect(s.hasConsent).toBe(true)
    expect(s.isEnabled).toBe(true)
    expect(s.isOptedOut).toBe(false)
    expect(s.consentedAt).toBe(TIDPUNKT)
  })

  it('samtycke + ai_enabled=null → på (null är inte en invändning)', () => {
    expect(hook({ ai_consent_at: TIDPUNKT, ai_enabled: null }).isEnabled).toBe(true)
  })

  it('samtycke + ai_enabled=false → AV och invänt (art. 21)', () => {
    const s = hook({ ai_consent_at: TIDPUNKT, ai_enabled: false })
    expect(s.hasConsent).toBe(true)
    expect(s.isEnabled).toBe(false)
    expect(s.isOptedOut).toBe(true)
  })

  it('ai_enabled=true utan samtycke → AV (brytaren ersätter inte samtycket)', () => {
    const s = hook({ ai_consent_at: null, ai_enabled: true })
    expect(s.hasConsent).toBe(false)
    expect(s.isEnabled).toBe(false)
    expect(s.isOptedOut).toBe(false)
  })

  it('för vidare laddningsläget från auth-storen', () => {
    expect(hook(null, true).isLoading).toBe(true)
  })
})

describe('AiConsentGate', () => {
  function rendera() {
    return render(
      <MemoryRouter>
        <AiConsentGate>
          <p>AI-innehållet</p>
        </AiConsentGate>
      </MemoryRouter>,
    )
  }

  it('utan samtycke visas samtyckesfrågan, inte AI-innehållet', () => {
    tillstand = { profile: { ai_consent_at: null }, isLoading: false }
    rendera()
    expect(screen.queryByText('AI-innehållet')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /inställningar|settings/i })).toHaveAttribute('href', '/settings')
  })

  it('med samtycke visas AI-innehållet', () => {
    tillstand = { profile: { ai_consent_at: TIDPUNKT }, isLoading: false }
    rendera()
    expect(screen.getByText('AI-innehållet')).toBeInTheDocument()
  })

  it('medan profilen laddar visas varken innehåll eller fråga', () => {
    tillstand = { profile: null, isLoading: true }
    rendera()
    expect(screen.queryByText('AI-innehållet')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
