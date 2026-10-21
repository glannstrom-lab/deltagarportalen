/**
 * CH8: chefsvyn på Översikt. Chef/admin ser deltagare per konsulent mot taket
 * och det som kräver uppmärksamhet; konsulent och handläggare ser ingenting
 * och hämtar inte caseloaden. Siffran är samma som i Inställningar.
 *
 * Motprov: (1) ta bort `enabled: arChef` → konsulenttestet faller (caseload
 * anropas). (2) byt `arLedning` så konsulent räknas → konsulenttestet faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { chefOversikt } from './caseloadKapacitet'
import { antalMotTaket } from './deltagarStatus'

vi.mock('@/services/orgApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/orgApi')>('@/services/orgApi')
  return { ...faktisk, orgApi: { myMemberships: vi.fn(), caseload: vi.fn() } }
})

import { orgApi } from '@/services/orgApi'
import { ChefsVy } from './ChefsVy'

const rad = (o: Record<string, unknown>) => ({
  org_id: 'o1', org_name: 'Demoleverantör', consultant_id: 'u2', role: 'konsulent', first_name: 'Kim', last_name: 'Karlsson',
  antal_deltagare: 12, antal_aktiva_planer: 7, ogiltig_franvaro_30d: 0, ...o,
})

function medlem(role: string, kind: 'kommun' | 'leverantor' = 'leverantor') {
  vi.mocked(orgApi.myMemberships).mockResolvedValue([
    { id: 'm1', org_id: 'o1', user_id: 'u1', role, created_at: '', organization: { id: 'o1', name: 'Org', kind, org_number: null, ai_enabled: true, created_at: '', updated_at: '' } },
  ] as never)
}

function visa() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><ChefsVy /></MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => { vi.mocked(orgApi.caseload).mockReset(); vi.mocked(orgApi.myMemberships).mockReset() })
afterEach(cleanup)

describe('ChefsVy (CH8)', () => {
  it('chef ser konsulenter mot taket, och den som är över taket står först under uppmärksamhet', async () => {
    medlem('chef')
    vi.mocked(orgApi.caseload).mockResolvedValue([
      rad({ consultant_id: 'a', first_name: 'Anna', last_name: 'A', antal_deltagare: 20 }),
      rad({ consultant_id: 'b', first_name: 'Bo', last_name: 'B', antal_deltagare: 55, antal_uppfoljning: 3 }),
      rad({ consultant_id: 'c', first_name: 'Cia', last_name: 'C', antal_deltagare: 52, antal_uppfoljning: 1 }),
    ] as never)
    visa()
    const vy = await screen.findByTestId('chefsvy')
    const upp = within(await screen.findByTestId('chefsvy-uppmarksamhet'))
    // Bo: 55 − 3 = 52 räknas, Cia: 51 — båda över 50.
    expect(upp.getByText(/Bo B/)).toBeTruthy()
    expect(upp.getByText(/2 över taket \(52 av 50\)/)).toBeTruthy()
    expect(upp.queryByText(/Anna A/)).toBeNull()
    expect(within(vy).getAllByTestId('chefsvy-antal').map((e) => e.textContent)).toContain('20 av 50 (heltid)')
  })

  it('konsulent ser ingen chefsvy och caseloaden hämtas inte', async () => {
    medlem('konsulent')
    visa()
    await waitFor(() => expect(orgApi.myMemberships).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByTestId('chefsvy')).toBeNull()
    expect(orgApi.caseload).not.toHaveBeenCalled()
  })

  it('handläggare ser ingen chefsvy', async () => {
    medlem('handlaggare')
    visa()
    await waitFor(() => expect(orgApi.myMemberships).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByTestId('chefsvy')).toBeNull()
  })

  it('administratör ser vyn; ett hämtfel blir en rad om felet, inte "inget kräver uppmärksamhet"', async () => {
    medlem('admin')
    vi.mocked(orgApi.caseload).mockRejectedValue(new Error('nej'))
    visa()
    expect((await screen.findByRole('alert')).textContent).toMatch(/kunde inte hämtas/)
    expect(screen.queryByText(/Inget kräver/)).toBeNull()
  })

  it('kommunen får antalet utan tak', async () => {
    medlem('chef', 'kommun')
    vi.mocked(orgApi.caseload).mockResolvedValue([rad({ antal_deltagare: 80, ogiltig_franvaro_30d: 2 })] as never)
    visa()
    expect((await screen.findAllByTestId('chefsvy-antal'))[0].textContent).toBe('80 deltagare')
    expect(screen.getByTestId('chefsvy-uppmarksamhet').textContent).toMatch(/2 pass med ogiltig frånvaro/)
    expect(screen.queryByText(/över taket/)).toBeNull()
  })
})

describe('chefOversikt delar siffran med Inställningar', () => {
  it('antal = antalMotTaket (uppföljning räknas inte)', () => {
    const r = rad({ antal_deltagare: 52, antal_uppfoljning: 4 })
    const [k] = chefOversikt([r as never], 'leverantor')
    expect(k.antal).toBe(antalMotTaket(r as never))
    expect(k.antal).toBe(48)
  })

  it('exakt 50 är inte över taket men nära; 45 är nära (90 %)', () => {
    const [a, b] = chefOversikt([
      rad({ consultant_id: 'x', antal_deltagare: 50 }) as never,
      rad({ consultant_id: 'y', first_name: 'Zed', antal_deltagare: 45 }) as never,
    ], 'leverantor')
    expect(a.uppmarksamhet[0].slag).toBe('nara')
    expect(b.uppmarksamhet[0].slag).toBe('nara')
  })
})

describe('KC13: statuskorten i chefsvyn', () => {
  it('visar organisationens tre tal och raden per konsulent', async () => {
    medlem('chef', 'kommun')
    vi.mocked(orgApi.caseload).mockResolvedValue([
      rad({ consultant_id: 'a', antal_deltagare: 5, antal_aktiva_planer: 4, antal_veckomal_underlag: 3, antal_veckomal_nadda: 2, antal_dokumentation_klar: 1 }),
    ] as never)
    visa()
    expect((await screen.findByTestId('statuskort-plan')).textContent).toBe('4 av 5')
    expect(screen.getByTestId('statuskort-veckomal').textContent).toBe('2 av 3')
    expect(screen.getByTestId('statuskort-dokumentation').textContent).toBe('1 av 4')
    expect(screen.getByTestId('chefsvy-konsulentstatus').textContent).toBe('plan 4 av 5 · veckomål 2 av 3 · dokumentation 1 av 4')
  })

  it('före migrationen: "—" med ett varför, aldrig 0', async () => {
    medlem('chef', 'kommun')
    vi.mocked(orgApi.caseload).mockResolvedValue([rad({ antal_deltagare: 5, antal_aktiva_planer: 4 })] as never)
    visa()
    expect((await screen.findByTestId('statuskort-veckomal')).textContent).toBe('—')
    expect(screen.getByTestId('chefsvy-statuskort').textContent).toMatch(/databasen saknar/)
    expect(screen.getByTestId('chefsvy-statuskort').textContent).not.toMatch(/\b0 av\b|0 %/)
  })
})
