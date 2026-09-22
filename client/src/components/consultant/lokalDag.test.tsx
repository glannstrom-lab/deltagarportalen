/**
 * "I dag" i konsulentvyn är den svenska kalenderdagen — inte UTC-dagen.
 *
 * Buggen (städpasset 2026-09-22): fem ställen räknade dagens datum med
 * `new Date().toISOString().slice(0, 10)`. Mellan 00:00 och 02:00 svensk
 * sommartid (01:00 vintertid) är UTC-dagen fortfarande GÅRDAGEN. En konsulent
 * som registrerade en placering, en uppföljning eller ett förslag strax efter
 * midnatt fick gårdagens datum förifyllt, och trådens tidsstämpel sa
 * "2026-09-21 00:30" om ett meddelande skickat 00:30 den 22:a — datum ur UTC,
 * klockslag ur lokal tid.
 *
 * Testet kör i Europe/Stockholm med klockan satt till 00:30 lokal tid. I en
 * UTC-miljö (CI) vore felet osynligt — därför sätts TZ uttryckligen här.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'konsulent-1' } }, error: null }) },
    from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }),
  },
}))

vi.mock('@/services/consultantService', () => ({ consultantService: { recordPlacement: vi.fn() } }))

vi.mock('@/services/delningsforslagApi', async (orig) => {
  const riktig = await orig<typeof import('@/services/delningsforslagApi')>()
  return {
    ...riktig,
    foretagsTradApi: {
      lista: vi.fn(async () => [
        { id: 'm1', proposal_id: 'f1', sender_kind: 'foretag', content: 'Hej', created_at: '2026-09-21T22:30:00Z' },
      ]),
      markeraLasta: vi.fn(async () => undefined),
      skicka: vi.fn(),
    },
  }
})

import { PlacementDialog } from './PlacementDialog'
import { PlaceringUppfoljningModal } from './PlaceringUppfoljningModal'
import { ForeslaDialog } from './ForeslaDialog'
import { GoalCreationDialog } from './GoalCreationDialog'
import { ForetagsTrad } from './ForetagsTrad'
import type { Placering } from '@/services/placeringarApi'
import type { Delningsforslag } from '@/services/delningsforslagApi'

// 2026-09-22 00:30 svensk sommartid = 2026-09-21 22:30 UTC.
const STRAX_EFTER_MIDNATT = new Date('2026-09-21T22:30:00Z')

beforeAll(() => vi.stubEnv('TZ', 'Europe/Stockholm'))
afterAll(() => vi.unstubAllEnvs())

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(STRAX_EFTER_MIDNATT)
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

// Dialog-primitiven renderar i en portal — sök i hela dokumentet.
function datumfalt(): HTMLInputElement {
  const falt = document.body.querySelector('input[type="date"]') as HTMLInputElement | null
  if (!falt) throw new Error('inget datumfält')
  return falt
}

const deltagare = { participant_id: 'p1', first_name: 'Anna', last_name: 'A', email: 'a@example.com' }

describe('förifyllt datum är den lokala dagen, inte UTC-dagen', () => {
  it('förutsättning: miljön ser 00:30 den 22:a lokalt men den 21:a i UTC', () => {
    expect(new Date().getDate()).toBe(22)
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-09-21')
  })

  it('PlacementDialog: startdatum är i dag', () => {
    render(
      <PlacementDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={deltagare} />,
    )
    expect(datumfalt().value).toBe('2026-09-22')
  })

  it('PlaceringUppfoljningModal: uppföljningsdatum är i dag', () => {
    render(
      <PlaceringUppfoljningModal open placementId="pl-1" nextWeekNumber={1} onSave={vi.fn()} onClose={vi.fn()} />,
    )
    expect(datumfalt().value).toBe('2026-09-22')
  })

  it('ForeslaDialog: "gäller till" är i dag + 14 dagar', () => {
    const plats = { id: 'w1', participant_id: 'p1', company_name: 'Provbolaget' } as unknown as Placering
    render(
      <ForeslaDialog open placering={plats} deltagarNamn="Anna" onClose={vi.fn()} onSkapad={vi.fn()} />,
    )
    expect(datumfalt().value).toBe('2026-10-06')
  })

  it('GoalCreationDialog: deadline i dag + 14 och inget datum före i dag spärras bort', () => {
    const initialGoal = {
      title: 'Ringa två arbetsgivare', description: '', specific: '', measurable: '',
      achievable: '', relevant: '', timeBound: '', category: 'other', priority: 'MEDIUM' as const,
    }
    render(
      <GoalCreationDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()}
        preselectedParticipant={deltagare as never} initialGoal={initialGoal as never} />,
    )
    const falt = datumfalt()
    expect(falt.value).toBe('2026-10-06')
    expect(falt.min).toBe('2026-09-22')
  })
})

describe('ForetagsTrad: tidsstämpelns datum och klockslag kommer ur samma tidszon', () => {
  it('ett meddelande skickat 00:30 den 22:a visas som 2026-09-22 00:30', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const forslag = { id: 'f1' } as unknown as Delningsforslag
    render(
      <QueryClientProvider client={qc}>
        <ForetagsTrad open forslag={forslag} foretagsnamn="Provbolaget" onClose={vi.fn()} />
      </QueryClientProvider>,
    )
    await screen.findByText('Hej')
    expect(screen.getByText(/^Provbolaget · /)).toHaveTextContent('Provbolaget · 2026-09-22 00:30')
  })
})
