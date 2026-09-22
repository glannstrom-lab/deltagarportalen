/**
 * Datadelningen med konsulenten — sidan får inte påstå något om delningen
 * som den inte vet.
 *
 * Före 2026-09-22 loggades ett läsfel mot `participant_data_sharing` bara med
 * console.error, och sidan visade två avslagna omkopplare: "ingenting delas".
 * Var delningen i själva verket på stod deltagaren med en osann bild — och ett
 * tryck på Spara skrev "av" över den riktiga inställningen utan att hen visste
 * att den någonsin varit på.
 *
 * Omkopplarna var dessutom `<button>` utan roll, tillstånd eller namn — en
 * skärmläsare hörde "knapp, På".
 *
 * Mutationer: ta bort `throw sharingError` → första testet faller. Ta bort
 * `role="switch"` → andra testet faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@/test/utils'

const single = vi.fn()
const upsert = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => single() }) }) }),
      upsert: (...a: unknown[]) => upsert(...a),
    }),
  },
}))
vi.mock('@/services/myConsultantApi', () => ({ getMyConsultantName: async () => 'Karin Konsulent' }))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ profile: { id: 'p1', consultant_id: 'k1' } }),
}))

import { DataSharingSettings } from './DataSharingSettings'

beforeEach(() => {
  cleanup()
  single.mockReset()
  upsert.mockReset()
})

describe('DataSharingSettings', () => {
  it('ett läsfel visar ett fel — inte två avslagna omkopplare och en Spara-knapp', async () => {
    single.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } })
    render(<DataSharingSettings />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /spara|save/i })).not.toBeInTheDocument()
  })

  it('omkopplarna är switchar med namn och tillstånd ur databasen', async () => {
    single.mockResolvedValue({ data: { share_health_data: true, share_wellness_data: false }, error: null })
    render(<DataSharingSettings />)

    const switchar = await screen.findAllByRole('switch')
    expect(switchar).toHaveLength(2)
    const [halsa, valmaende] = switchar
    expect(halsa).toHaveAttribute('aria-checked', 'true')
    expect(halsa).toHaveAccessibleName(/hälsodata|health/i)
    expect(valmaende).toHaveAttribute('aria-checked', 'false')
  })

  it('varningen "kan nu se" följer det sparade läget, inte en osparad omkopplare', async () => {
    single.mockResolvedValue({ data: { share_health_data: false, share_wellness_data: false }, error: null })
    render(<DataSharingSettings />)

    const [halsa] = await screen.findAllByRole('switch')
    fireEvent.click(halsa)
    expect(halsa).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByText(/kan nu se|can now see/i)).not.toBeInTheDocument()
  })
})
