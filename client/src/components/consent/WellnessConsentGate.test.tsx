/**
 * RD21 (rollspelet 2026-09-27): Hälsa bad om samtycke till "Humör, Energi,
 * Sömn, Dagboksanteckningar, Tacksamhetsnoteringar" i ett svep och sa att
 * samtycket behövdes "för att använda dagboken". Listan ska säga det samtycket
 * faktiskt gäller: kolumnerna i mood_logs (humör, energi, sömn, stress,
 * anteckning) OCH dagboken.
 *
 * Rättat 2026-10-09: RD21 påstod att dagboken var öppen utan samtycke. Prod
 * säger annat — diary_entries har check_wellness_consent på INSERT och UPDATE
 * (MV2, pg_policies). Texten "Dagboken … behöver inget samtycke" var alltså
 * fel, och deltagaren skrev anteckningar som databasen sedan nekade. Bara
 * tacksamheten (gratitude_entries) är öppen.
 *
 * Dagbokens undertitel "Din personliga dagbok och kalender" beskrev en
 * kalender som bor på en annan sida.
 *
 * Mutation: ta bort item.diary ur listan → testet faller.
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
  it('listar det som loggas och dagboken, men inte tacksamheten', () => {
    render(<MemoryRouter><WellnessConsentGate><p>skyddat</p></WellnessConsentGate></MemoryRouter>)
    expect(screen.queryByText('skyddat')).toBeNull()
    for (const rad of ['Humör och känslor', 'Energinivåer', 'Sömnkvalitet', 'Stress', 'Anteckningen du skriver till loggen', 'Det du skriver i dagboken']) {
      expect(screen.getByText(rad)).toBeInTheDocument()
    }
    expect(screen.queryByText(/Tacksamhetsnoteringar/)).toBeNull()
    expect(document.body.textContent).not.toMatch(/För att använda dagboken/)
    expect(screen.getByText('Tacksamheten behöver inget samtycke.')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Dagboken och tacksamheten/)
  })

  it('Dagbokens undertitel lovar ingen kalender', () => {
    expect(sv.diary.description).not.toMatch(/kalender/i)
  })
})
