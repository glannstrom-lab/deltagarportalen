/**
 * Rollspelet 2026-09-27 — deltagarsidan i konsulentvyn.
 *  RK14: "Senaste kontakt: 3" var ett tal utan enhet som inte rörde sig efter
 *        en journalanteckning.
 *  RR6:  placeringen syntes inte på deltagaren (anställd Amina stod som "Aktiv").
 *  RR5:  uppföljningen registreras härifrån, med datum/utfall/underlag.
 *  RR11: ett passerat inbokat möte gick inte att markera som hållet, och ett
 *        bokat fysiskt möte syntes ingenstans.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import type { DeltagarMote } from '@/services/moteskadens'
import type { Placement } from '@/services/consultantService'

const dagarFran = (n: number, h = 10) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d }
const iso = (n: number) => dagarFran(n).toISOString()
const ymd = (n: number) => { const d = dagarFran(n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

let deltagare: Record<string, unknown>
let moten: DeltagarMote[] = []
let placeringar: Placement[] = []

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'k1' } } }) },
    from: (table: string) => {
      const b: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'order', 'limit', 'single', 'gte', 'lte', 'maybeSingle']) b[m] = () => b
      b.then = (ok: (v: unknown) => unknown) => Promise.resolve(
        table === 'consultant_dashboard_participants' ? { data: deltagare, error: null } : { data: [], error: null },
      ).then(ok)
      return b
    },
  },
}))

vi.mock('@/services/moteskadens', async (orig) => ({
  ...(await orig<typeof import('@/services/moteskadens')>()),
  hamtaMotenForDeltagare: vi.fn(async () => moten),
}))

vi.mock('@/services/consultantService', async (orig) => {
  const o = await orig<typeof import('@/services/consultantService')>()
  return {
    ...o,
    consultantService: {
      ...o.consultantService,
      getPlacementsForParticipant: vi.fn(async () => placeringar),
      getSenasteMeddelande: vi.fn(async () => null),
    },
  }
})

vi.mock('@/services/orgApi', () => ({ orgApi: { colleagues: async () => [], myMemberships: async () => [] } }))

import { ParticipantDetailPage } from './ParticipantDetailPage'

function rendera() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <ConfirmDialogProvider>
          <MemoryRouter initialEntries={['/consultant/participants/p1']}>
            <Routes>
              <Route path="/consultant/participants/:participantId" element={<ParticipantDetailPage />} />
            </Routes>
          </MemoryRouter>
        </ConfirmDialogProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  deltagare = {
    participant_id: 'p1', email: 'amina@example.com', first_name: 'Amina', last_name: 'Demo', phone: null, avatar_url: null,
    status: 'ACTIVE', priority: 1, has_cv: false, ats_score: null, completed_interest_test: false, holland_code: null,
    saved_jobs_count: 0, notes_count: 1, last_contact_at: iso(-3), last_note_date: null, next_meeting_scheduled: null, last_login: null,
  }
  moten = []
  placeringar = []
})

describe('RK14 — senaste kontakt', () => {
  it('har en enhet och följer den senaste journalanteckningen', async () => {
    deltagare.last_note_date = iso(0)
    rendera()
    await screen.findByText('Amina Demo')
    expect(await screen.findByText('i dag')).toBeInTheDocument()
    expect(screen.getByText('journalanteckning')).toBeInTheDocument()
  })
  it('utan nyare kontakt: "3 dagar sedan", inte bara 3', async () => {
    rendera()
    expect(await screen.findByText('3 dagar sedan')).toBeInTheDocument()
  })
})

describe('RR6/RR5 — placeringen syns och följs upp härifrån', () => {
  it('rubriken säger att deltagaren är anställd, och uppföljningen kan registreras', async () => {
    placeringar = [{
      id: 'pl1', participant_id: 'p1', consultant_id: 'k1', employer_name: 'Demolager AB', job_title: 'Lagerarbetare',
      start_date: ymd(-100), placement_type: 'permanent', followup_3m: false, followup_6m: false, created_at: iso(-100),
    }]
    rendera()
    const status = await screen.findByTestId('placering-status')
    expect(status).toHaveTextContent('Anställd hos Demolager AB sedan')
    fireEvent.click(await screen.findByRole('button', { name: 'Registrera 3-mån' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: '3-månadersuppföljning' })).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Utfall')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Underlag')).toBeInTheDocument()
    // 6 mån före 3 mån går inte.
    expect(screen.queryByRole('button', { name: 'Registrera 6-mån' })).toBeNull()
  })
})

describe('RR11 — möten', () => {
  it('ett passerat inbokat möte kan markeras som hållet, och ett bokat fysiskt syns', async () => {
    moten = [
      { id: 'm1', participant_id: 'p1', scheduled_at: iso(-2), meeting_type: 'video', status: 'scheduled', duration_minutes: 30, location: null },
      { id: 'm2', participant_id: 'p1', scheduled_at: iso(3), meeting_type: 'physical', status: 'scheduled', duration_minutes: 30, location: 'Kontoret' },
    ]
    rendera()
    expect(await screen.findByRole('button', { name: 'Hölls' })).toBeInTheDocument()
    expect(screen.getByText(/Bokat: Fysiskt/)).toBeInTheDocument()
    expect(screen.getByTestId('motes-kadens')).toHaveTextContent('fysiskt möte bokat')
  })
})
