/**
 * RR29 (rollspelet 2026-09-27): kapacitetsmätare i Caseload — deltagare per
 * handledare mot taket i Rusta och matcha (50 per heltid, FFU §4.5.2). Bara
 * för leverantörer; kommunen ser antalet utan tak.
 *
 * Motprov (körda): (1) visa mätaren oavsett organisationens slag → kommun-
 * testet faller. (2) byt `antal > FFU_TAK_HELTID` mot `>=` → 50-av-50-testet faller.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { kapacitet, FFU_TAK_HELTID } from './caseloadKapacitet'

vi.mock('@/services/orgApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/orgApi')>('@/services/orgApi')
  return {
    ...faktisk,
    orgApi: {
      myMemberships: vi.fn(), colleagues: vi.fn(), caseload: vi.fn(), pendingColleagueInvites: vi.fn(async () => []),
      addColleagueByEmail: vi.fn(), inviteColleagueByEmail: vi.fn(), setColleagueRole: vi.fn(), removeColleague: vi.fn(),
      handover: vi.fn(), setOrgAiEnabled: vi.fn(), isChef: vi.fn(),
    },
  }
})
vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: vi.fn(async () => true) }) }))

import { OrganisationSektion } from './OrganisationSektion'

const rad = (o: Record<string, unknown>) => ({
  org_id: 'o1', org_name: 'Org', consultant_id: 'u2', role: 'konsulent', first_name: 'Kim', last_name: 'Karlsson',
  antal_deltagare: 12, antal_aktiva_planer: 7, ogiltig_franvaro_30d: 0, ...o,
})

async function somChef(kind: 'kommun' | 'leverantor', caseload: ReturnType<typeof rad>[]) {
  const { orgApi } = await import('@/services/orgApi')
  const org = { id: 'o1', name: kind === 'kommun' ? 'Hällefors kommun' : 'Demoleverantör', kind, org_number: null, ai_enabled: true, created_at: '', updated_at: '' }
  vi.mocked(orgApi.myMemberships).mockResolvedValue([{ id: 'm1', org_id: 'o1', user_id: 'u1', role: 'chef', created_at: '', organization: org }] as never)
  vi.mocked(orgApi.colleagues).mockResolvedValue([] as never)
  vi.mocked(orgApi.caseload).mockResolvedValue(caseload as never)
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => cleanup())

describe('kapacitet — regeln', () => {
  it('bara leverantörer har ett tak', () => {
    expect(kapacitet(80, 'kommun')).toEqual({ visas: false })
    expect(kapacitet(80, null)).toEqual({ visas: false })
    expect(kapacitet(12, 'leverantor')).toMatchObject({ visas: true, tak: 50, lage: 'ok', text: '12 av 50 (heltid)' })
  })

  it('nära från 90 %, över först när taket passerats', () => {
    expect(kapacitet(44, 'leverantor')).toMatchObject({ lage: 'ok' })
    expect(kapacitet(45, 'leverantor')).toMatchObject({ lage: 'nara' })
    expect(kapacitet(FFU_TAK_HELTID, 'leverantor')).toMatchObject({ lage: 'nara', text: '50 av 50 (heltid)' })
    expect(kapacitet(53, 'leverantor')).toMatchObject({ lage: 'over', text: '53 av 50 — 3 över taket för heltid' })
  })
})

describe('Caseload — mätaren', () => {
  it('en leverantör ser deltagare mot taket per konsulent, och regeln för deltid', async () => {
    await somChef('leverantor', [rad({}), rad({ consultant_id: 'u3', first_name: 'Sam', last_name: 'Svensson', antal_deltagare: 53 })])
    render(<OrganisationSektion />)
    const tabell = await screen.findByRole('table')
    expect(within(tabell).getByRole('columnheader', { name: 'Mot taket' })).toBeInTheDocument()
    const kim = within(tabell).getByRole('meter', { name: 'Deltagare hos Kim Karlsson mot taket' })
    expect(kim).toHaveAttribute('aria-valuenow', '12')
    expect(kim).toHaveAttribute('aria-valuemax', '50')
    expect(within(tabell).getByText('53 av 50 — 3 över taket för heltid')).toBeInTheDocument()
    expect(screen.getByText(/sänks i proportion vid deltid/)).toBeInTheDocument()
  })

  it('en kommun ser bara antalet — ingen mätare, ingen takkolumn', async () => {
    await somChef('kommun', [rad({ antal_deltagare: 80 })])
    render(<OrganisationSektion />)
    const tabell = await screen.findByRole('table')
    expect(within(tabell).getByText('80')).toBeInTheDocument()
    expect(within(tabell).queryByRole('meter')).not.toBeInTheDocument()
    expect(within(tabell).queryByRole('columnheader', { name: 'Mot taket' })).not.toBeInTheDocument()
    expect(screen.queryByText(/FFU §4.5.2/)).not.toBeInTheDocument()
  })
})
