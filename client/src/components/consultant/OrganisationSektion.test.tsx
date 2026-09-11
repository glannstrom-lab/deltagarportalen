/**
 * OrganisationSektion — utan medlemskap, och som chef med kollegor + caseload (KM2).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { OrganisationSektion } from './OrganisationSektion'

vi.mock('@/services/orgApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/orgApi')>('@/services/orgApi')
  return {
    ...faktisk,
    orgApi: {
      myMemberships: vi.fn(),
      colleagues: vi.fn(),
      caseload: vi.fn(),
      isChef: vi.fn(),
    },
  }
})

const org = { id: 'o1', name: 'Hällefors kommun', kind: 'kommun', org_number: '212000-1942', created_at: '', updated_at: '' }

describe('OrganisationSektion', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('säger ärligt att man inte tillhör någon organisation', async () => {
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(orgApi.myMemberships).mockResolvedValue([])
    render(<OrganisationSektion />)
    expect(await screen.findByText(/Du tillhör ingen organisation än/)).toBeInTheDocument()
    expect(orgApi.colleagues).not.toHaveBeenCalled()
    expect(orgApi.caseload).not.toHaveBeenCalled()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('visar kollegor och caseload för en chef', async () => {
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(orgApi.myMemberships).mockResolvedValue([
      { id: 'm1', org_id: 'o1', user_id: 'u1', role: 'chef', created_at: '', organization: org },
    ] as never)
    vi.mocked(orgApi.colleagues).mockResolvedValue([
      { id: 'm1', org_id: 'o1', org_name: org.name, org_kind: 'kommun', user_id: 'u1', role: 'chef', created_at: '', first_name: 'Fanny', last_name: 'Forsell', email: 'fanny@example.se' },
      { id: 'm2', org_id: 'o1', org_name: org.name, org_kind: 'kommun', user_id: 'u2', role: 'konsulent', created_at: '', first_name: 'Kim', last_name: 'Karlsson', email: 'kim@example.se' },
    ] as never)
    vi.mocked(orgApi.caseload).mockResolvedValue([
      { org_id: 'o1', org_name: org.name, consultant_id: 'u2', role: 'konsulent', first_name: 'Kim', last_name: 'Karlsson', antal_deltagare: 12, antal_aktiva_planer: 7, ogiltig_franvaro_30d: 2 },
      { org_id: 'o1', org_name: org.name, consultant_id: 'u1', role: 'chef', first_name: 'Fanny', last_name: 'Forsell', antal_deltagare: 0, antal_aktiva_planer: 0, ogiltig_franvaro_30d: 0 },
    ] as never)

    render(<OrganisationSektion />)
    expect(await screen.findByText('Hällefors kommun')).toBeInTheDocument()
    expect(screen.getByText('Din roll: Chef')).toBeInTheDocument()

    const lista = screen.getByRole('list', { name: 'Kollegor i Hällefors kommun' })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2)
    expect(within(lista).getByRole('link', { name: 'kim@example.se' })).toHaveAttribute('href', 'mailto:kim@example.se')

    const tabell = screen.getByRole('table')
    const rader = within(tabell).getAllByRole('row')
    expect(rader).toHaveLength(3) // rubrik + två konsulenter
    expect(within(rader[1]).getByText('12')).toBeInTheDocument()
    expect(within(rader[1]).getByText('7')).toBeInTheDocument()
    expect(within(rader[1]).getByText('2')).toBeInTheDocument()
    // 0 deltagare visas som invit, 0 ogiltig frånvaro som riktig nolla
    expect(within(rader[2]).getByText('Inga deltagare än')).toBeInTheDocument()
    expect(within(rader[2]).getAllByText('0')).toHaveLength(2)
    expect(screen.getByText(/Bara tal\. Namn på deltagare, journal och mående syns inte här\./)).toBeInTheDocument()
  })

  it('hämtar inte caseload för en vanlig konsulent', async () => {
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(orgApi.myMemberships).mockResolvedValue([
      { id: 'm2', org_id: 'o1', user_id: 'u2', role: 'konsulent', created_at: '', organization: org },
    ] as never)
    vi.mocked(orgApi.colleagues).mockResolvedValue([] as never)
    render(<OrganisationSektion />)
    expect(await screen.findByText('Din roll: Arbetskonsulent')).toBeInTheDocument()
    expect(orgApi.caseload).not.toHaveBeenCalled()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
