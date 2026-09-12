/**
 * PlaceringCard — KS2 b (2026-09-12): företrädarens platser visas med
 * "Registrerad av" och utan Redigera/Ta bort; egna platser oförändrade.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlaceringCard } from './PlaceringCard'
import type { Placering } from '@/services/placeringarApi'

vi.mock('@/services/placeringarApi', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/services/placeringarApi')>()
  return { ...mod, placeringarApi: { ...mod.placeringarApi, harHandledningsobalans: () => false } }
})

const plats: Placering = {
  id: 'w1',
  consultant_id: 'k-forr',
  participant_id: 'p1',
  company_account_id: null,
  placement_type: 'praktik',
  status: 'planerad',
  company_name: 'Provbolaget',
  org_number: null,
  occupation: null,
  industry: null,
  contact_name: null,
  contact_phone: null,
  contact_email: null,
  address: null,
  start_date: null,
  end_date: null,
  hours_per_week: null,
  schedule_days: null,
  can_ramp_up: false,
  ramp_up_plan: null,
} as unknown as Placering

const noop = () => {}

describe('PlaceringCard — läsrätt efter överlämning (KS2 b)', () => {
  it('egen plats: Redigera och Ta bort finns, ingen "Registrerad av"', () => {
    render(<PlaceringCard placering={plats} deltagarNamn="Anna" onEdit={noop} onUppfoljning={noop} onDelete={noop} />)
    expect(screen.getByRole('button', { name: /redigera/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ta bort/i })).toBeInTheDocument()
    expect(screen.queryByText(/registrerad av/i)).not.toBeInTheDocument()
  })

  it('företrädarens plats: namnet visas, Redigera och Ta bort saknas, Uppföljning finns kvar', () => {
    render(
      <PlaceringCard
        placering={plats}
        deltagarNamn="Anna"
        readOnly
        registreradAv="Kalle Konsulent"
        onEdit={noop}
        onUppfoljning={noop}
        onDelete={noop}
      />
    )
    expect(screen.getByText(/registrerad av/i)).toHaveTextContent('Kalle Konsulent')
    expect(screen.queryByRole('button', { name: /redigera/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ta bort/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /uppföljning/i })).toBeInTheDocument()
  })

  it('företrädare utan känt namn (t.ex. raderat konto, BL4): "en tidigare konsulent"', () => {
    render(<PlaceringCard placering={plats} deltagarNamn="Anna" readOnly onEdit={noop} onUppfoljning={noop} onDelete={noop} />)
    expect(screen.getByText(/registrerad av/i)).toHaveTextContent(/en tidigare konsulent/i)
  })
})
