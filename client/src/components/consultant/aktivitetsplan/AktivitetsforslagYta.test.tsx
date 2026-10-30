/**
 * AIX21 — i dialogen "Lägg till pass".
 *
 *  - spärr A2: förslagsytan finns inte i drift (standardläget)
 *  - ett förslag fyller bara i formuläret; ingenting sparas av förslaget
 *  - ett okänt id från servern syns aldrig
 *  - AI avstängd = ingen knapp
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NyttPassDialog } from './NyttPassDialog'
import { A2_BESVARAD } from '../a2Sparr'
import { callAI } from '@/services/aiApi'
import { aktivitetskatalogApi, type CatalogItem } from '@/services/aktivitetskatalogApi'
import { aktivitetsplanApi } from '@/services/aktivitetApi'

vi.mock('@/services/aiApi', () => {
  class AiConsentRequiredError extends Error {}
  return { callAI: vi.fn(), AiConsentRequiredError }
})
vi.mock('@/services/aktivitetskatalogApi', () => ({ aktivitetskatalogApi: { list: vi.fn() } }))
vi.mock('@/services/aktivitetApi', async (orig) => {
  const verklig = await orig<typeof import('@/services/aktivitetApi')>()
  return { ...verklig, aktivitetsplanApi: { addSession: vi.fn(), addWeeklySessions: vi.fn() } }
})
const orgSparr = vi.hoisted(() => ({ varde: null as unknown }))
vi.mock('@/hooks/useOrgAiSparr', () => ({ useOrgAiSparr: () => orgSparr.varde }))
const egenAiAv = vi.hoisted(() => ({ varde: false }))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ profile: { ai_enabled: !egenAiAv.varde } }),
}))

const post = (id: string, o: Partial<CatalogItem> = {}): CatalogItem => ({
  id, org_id: 'org-1', owner_id: 'u1', title: `Post ${id}`, activity_type: 'jobsearch', description: null, location: null,
  weekday: null, start_time: null, end_time: null, capacity: null, contact: null, is_active: true, created_at: '', updated_at: '', ...o,
})

function visa(aktivitetsforslag?: boolean) {
  const onCreated = vi.fn()
  render(
    <NyttPassDialog
      isOpen
      onClose={vi.fn()}
      planId="plan-1"
      participantId="p-1"
      defaultDate="2026-11-02"
      planSlut={null}
      onCreated={onCreated}
      aktivitetsforslag={aktivitetsforslag}
    />,
  )
  return { onCreated }
}

describe('AIX21 — aktivitetsförslag i Lägg till pass', () => {
  beforeEach(() => {
    vi.mocked(callAI).mockReset()
    vi.mocked(aktivitetskatalogApi.list).mockReset()
    vi.mocked(aktivitetsplanApi.addSession).mockReset()
    orgSparr.varde = null
    egenAiAv.varde = false
  })

  it('spärr A2: förslagsytan finns inte i drift förrän juristfrågan är besvarad', () => {
    expect(A2_BESVARAD).toBe(false)
    visa(undefined)
    expect(screen.queryByTestId('aktivitetsforslag')).toBeNull()
    expect(screen.queryByRole('button', { name: /Föreslå ur katalogen/ })).toBeNull()
    expect(screen.getByLabelText('Rubrik')).toBeInTheDocument()
  })

  it('ett förslag fyller i formuläret men sparar ingenting', async () => {
    vi.mocked(aktivitetskatalogApi.list).mockResolvedValue([
      post('uuid-1', { title: 'Jobbklubb', location: 'Biblioteket', weekday: 2, start_time: '13:00', end_time: '15:00' }),
    ])
    vi.mocked(callAI).mockResolvedValue({ aktivitetsforslag: { forslag: [{ id: 'a1', motivering: 'Hjälper till att söka jobb.' }] } } as never)
    visa(true)

    fireEvent.change(screen.getByLabelText(/Deltagarens mål/), { target: { value: 'vill söka jobb' } })
    fireEvent.click(screen.getByRole('button', { name: /Föreslå ur katalogen/ }))

    expect(await screen.findByText('Hjälper till att söka jobb.')).toBeInTheDocument()
    expect(aktivitetsplanApi.addSession).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Fyll i passet/ }))
    expect(screen.getByLabelText('Rubrik')).toHaveValue('Jobbklubb')
    expect(screen.getByLabelText('Plats')).toHaveValue('Biblioteket')
    expect(screen.getByLabelText('Datum')).toHaveValue('2026-11-03')
    expect(screen.getByLabelText('Start')).toHaveValue('13:00')
    // Ännu inget sparat: det gör konsulenten med "Lägg till".
    expect(aktivitetsplanApi.addSession).not.toHaveBeenCalled()
  })

  it('ett id som inte finns i katalogen visas aldrig', async () => {
    vi.mocked(aktivitetskatalogApi.list).mockResolvedValue([post('uuid-1', { title: 'Jobbklubb' })])
    vi.mocked(callAI).mockResolvedValue({ aktivitetsforslag: { forslag: [{ id: 'a7', motivering: 'Påhittad yogakurs.' }] } } as never)
    visa(true)

    fireEvent.change(screen.getByLabelText(/Deltagarens mål/), { target: { value: 'mål' } })
    fireEvent.click(screen.getByRole('button', { name: /Föreslå ur katalogen/ }))

    expect(await screen.findByText(/Inget i katalogen passar/)).toBeInTheDocument()
    expect(screen.queryByText(/yogakurs/)).toBeNull()
  })

  it('AI avstängd: ingen knapp, ett lugnt besked, inget anrop', () => {
    egenAiAv.varde = true
    visa(true)
    expect(screen.queryByRole('button', { name: /Föreslå ur katalogen/ })).toBeNull()
    expect(screen.getByTestId('aktivitetsforslag')).toHaveTextContent(/AI är avstängd/)
    expect(callAI).not.toHaveBeenCalled()
  })

  it('ett AI-fel lämnar formuläret orört och säger det', async () => {
    vi.mocked(aktivitetskatalogApi.list).mockResolvedValue([post('uuid-1')])
    vi.mocked(callAI).mockRejectedValue(new Error('503'))
    visa(true)

    fireEvent.change(screen.getByLabelText(/Deltagarens mål/), { target: { value: 'mål' } })
    fireEvent.click(screen.getByRole('button', { name: /Föreslå ur katalogen/ }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/kunde inte hämtas/))
    expect(screen.getByLabelText('Rubrik')).toHaveValue('')
  })
})
