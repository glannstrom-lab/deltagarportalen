/**
 * RD21 (rollspelet 2026-09-27): Hälsa bad om samtycke till "Humör, Energi,
 * Sömn, Dagboksanteckningar, Tacksamhetsnoteringar" i ett svep och sa att
 * samtycket behövdes "för att använda dagboken". Dagboken och tacksamheten
 * är öppna utan samtycke — grinden omsluter bara humörloggen (Hälsa-fliken och
 * Mående i Dagboken). Listan ska säga det samtycket faktiskt gäller:
 * kolumnerna i mood_logs (humör, energi, sömn, stress, anteckning).
 *
 * Dagbokens undertitel "Din personliga dagbok och kalender" beskrev en
 * kalender som bor på en annan sida.
 *
 * Mutation: lägg tillbaka item.diary i listan → testet faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import sv from '@/i18n/locales/sv.json'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ profile: { id: 'u1', wellness_consent_at: null }, isLoading: false }),
}))
vi.mock('@/services/consentApi', () => ({ beviljaSamtycke: vi.fn() }))

import { WellnessConsentGate } from './WellnessConsentGate'

afterEach(cleanup)

describe('Samtycket till måendeloggen säger vad det gäller (RD21)', () => {
  it('listar det som loggas, inte dagboken och tacksamheten', () => {
    render(<MemoryRouter><WellnessConsentGate><p>skyddat</p></WellnessConsentGate></MemoryRouter>)
    expect(screen.queryByText('skyddat')).toBeNull()
    for (const rad of ['Humör och känslor', 'Energinivåer', 'Sömnkvalitet', 'Stress', 'Anteckningen du skriver till loggen']) {
      expect(screen.getByText(rad)).toBeInTheDocument()
    }
    expect(screen.queryByText(/Dagboksanteckningar|Tacksamhetsnoteringar/)).toBeNull()
    expect(document.body.textContent).not.toMatch(/För att använda dagboken/)
    expect(screen.getByText(/Dagboken och tacksamheten behöver inget samtycke/)).toBeInTheDocument()
  })

  it('Dagbokens undertitel lovar ingen kalender', () => {
    expect(sv.diary.description).not.toMatch(/kalender/i)
  })
})
