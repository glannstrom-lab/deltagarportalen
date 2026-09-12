/**
 * PG13 (persona-genomgång 2026-09-12): länken "integritetspolicy" och raden
 * runt den i samtyckesrutan var `text-pink-600 dark:text-pink-400` — 4,13:1 mot
 * rutans bakgrund i mörkt läge (AA kräver 4,5:1). Texten ska bära `--c-text`,
 * den enda token som vänder med temat (fallor-i-mork-tema-tokens).
 *
 * Testet fäller varje `text-pink-*` på TEXT i rutan; ikoner (Heart) får vara rosa.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    profile: { id: 'u1', wellness_consent_at: null },
    isLoading: false,
    refreshProfile: vi.fn(),
    updateProfile: vi.fn(),
  }),
}))
vi.mock('@/services/consentApi', () => ({
  consentApi: { grant: vi.fn(), withdraw: vi.fn() },
  grantConsent: vi.fn(),
}))

import { WellnessConsentGate } from './WellnessConsentGate'

afterEach(cleanup)

function rendera(compact = false) {
  return render(
    <MemoryRouter>
      <WellnessConsentGate compact={compact}>
        <div>innehåll</div>
      </WellnessConsentGate>
    </MemoryRouter>
  )
}

describe('samtyckesrutan: text i temats färgtoken, aldrig rosa (PG13)', () => {
  it('länken till integritetspolicyn och dess rad använder --c-text', () => {
    rendera(false)
    const lank = screen.getByRole('link', { name: /integritetspolicy/i })
    expect(lank.className).not.toMatch(/text-pink-/)
    const rad = lank.closest('p')
    expect(rad).not.toBeNull()
    expect(rad!.className).toContain('text-[var(--c-text)]')
    expect(rad!.className).not.toMatch(/text-pink-/)
  })

  it('kompakta rutans "Hantera"-länk använder --c-text', () => {
    rendera(true)
    const lank = screen.getByRole('link', { name: /hantera/i })
    expect(lank.className).toContain('text-[var(--c-text)]')
    expect(lank.className).not.toMatch(/text-pink-/)
  })

  it('kontrollen kan falla: en rosa textklass upptäcks', () => {
    // Positiv kontroll av matcharen — samma regex som ovan.
    expect('text-xs text-pink-600 dark:text-pink-400').toMatch(/text-pink-/)
  })
})
