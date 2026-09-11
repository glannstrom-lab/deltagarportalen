/**
 * OrganisationSektion — utan medlemskap, som chef med kollegor + caseload,
 * och självbetjäningen (KM2 steg 3): formuläret bara för chef/admin,
 * "Lägg till" går till API:t med rätt org/e-post/roll, databasens fel visas
 * som text, och Administratör-alternativet syns bara för admin.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react'
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
      addColleagueByEmail: vi.fn(),
      setColleagueRole: vi.fn(),
      removeColleague: vi.fn(),
    },
  }
})

vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: vi.fn(async () => true) }) }))

const org = { id: 'o1', name: 'Hällefors kommun', kind: 'kommun', org_number: '212000-1942', created_at: '', updated_at: '' }

const kollegor = [
  { id: 'm1', org_id: 'o1', org_name: org.name, org_kind: 'kommun', user_id: 'u1', role: 'chef', created_at: '', first_name: 'Fanny', last_name: 'Forsell', email: 'fanny@example.se' },
  { id: 'm2', org_id: 'o1', org_name: org.name, org_kind: 'kommun', user_id: 'u2', role: 'konsulent', created_at: '', first_name: 'Kim', last_name: 'Karlsson', email: 'kim@example.se' },
]

async function somRoll(role: 'chef' | 'admin' | 'konsulent', userId = role === 'konsulent' ? 'u2' : 'u1') {
  const { orgApi } = await import('@/services/orgApi')
  vi.mocked(orgApi.myMemberships).mockResolvedValue([
    { id: userId === 'u1' ? 'm1' : 'm2', org_id: 'o1', user_id: userId, role, created_at: '', organization: org },
  ] as never)
  vi.mocked(orgApi.colleagues).mockResolvedValue(kollegor as never)
  vi.mocked(orgApi.caseload).mockResolvedValue([] as never)
  return orgApi
}

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
    vi.mocked(orgApi.colleagues).mockResolvedValue(kollegor as never)
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

  it('hämtar inte caseload för en vanlig konsulent, och visar inget formulär', async () => {
    const orgApi = await somRoll('konsulent')
    render(<OrganisationSektion />)
    expect(await screen.findByText('Din roll: Arbetskonsulent')).toBeInTheDocument()
    expect(orgApi.caseload).not.toHaveBeenCalled()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByRole('form', { name: /Lägg till kollega/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Ta bort/ })).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('visar formuläret för en chef, och "Lägg till" går till API:t med rätt org, e-post och roll', async () => {
    const orgApi = await somRoll('chef')
    vi.mocked(orgApi.addColleagueByEmail).mockResolvedValue(undefined)
    render(<OrganisationSektion />)
    const form = await screen.findByRole('form', { name: 'Lägg till kollega i Hällefors kommun' })
    expect(within(form).getByText(/Personen behöver redan ha ett konto på jobin\.se/)).toBeInTheDocument()

    fireEvent.change(within(form).getByLabelText('E-post'), { target: { value: ' ny.kollega@kommun.se ' } })
    fireEvent.change(within(form).getByLabelText('Roll'), { target: { value: 'handlaggare' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Lägg till' }))

    await waitFor(() => expect(orgApi.addColleagueByEmail).toHaveBeenCalledWith('o1', 'ny.kollega@kommun.se', 'handlaggare'))
    expect(await screen.findByRole('status')).toHaveTextContent('ny.kollega@kommun.se är tillagd i Hällefors kommun.')
    // listan laddas om
    expect(orgApi.myMemberships).toHaveBeenCalledTimes(2)
  })

  it('visar databasens felmeddelande som text', async () => {
    const orgApi = await somRoll('chef')
    vi.mocked(orgApi.addColleagueByEmail).mockRejectedValue(
      new Error('Ingen användare med e-posten x@y.se. Personen behöver skapa ett konto på jobin.se först.'),
    )
    render(<OrganisationSektion />)
    const form = await screen.findByRole('form', { name: /Lägg till kollega/ })
    fireEvent.change(within(form).getByLabelText('E-post'), { target: { value: 'x@y.se' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Lägg till' }))
    expect(await within(form).findByRole('alert')).toHaveTextContent('Ingen användare med e-posten x@y.se')
    expect(orgApi.myMemberships).toHaveBeenCalledTimes(1)
  })

  it('erbjuder rollen Administratör bara för en admin', async () => {
    await somRoll('chef')
    const { unmount } = render(<OrganisationSektion />)
    const formChef = await screen.findByRole('form', { name: /Lägg till kollega/ })
    const rollerChef = within(within(formChef).getByLabelText('Roll')).getAllByRole('option').map((o) => o.textContent)
    expect(rollerChef).toEqual(['Handläggare (ekonomiskt bistånd)', 'Arbetskonsulent', 'Chef'])
    unmount()

    vi.clearAllMocks()
    await somRoll('admin')
    render(<OrganisationSektion />)
    const formAdmin = await screen.findByRole('form', { name: /Lägg till kollega/ })
    const rollerAdmin = within(within(formAdmin).getByLabelText('Roll')).getAllByRole('option').map((o) => o.textContent)
    expect(rollerAdmin).toEqual(['Handläggare (ekonomiskt bistånd)', 'Arbetskonsulent', 'Chef', 'Administratör'])
  })

  it('byter roll och tar bort en kollega, men aldrig sig själv', async () => {
    const orgApi = await somRoll('chef')
    vi.mocked(orgApi.setColleagueRole).mockResolvedValue(undefined)
    vi.mocked(orgApi.removeColleague).mockResolvedValue(undefined)
    render(<OrganisationSektion />)
    const lista = await screen.findByRole('list', { name: 'Kollegor i Hällefors kommun' })
    // bara Kim (inte jag, Fanny) har rollväljare och ta bort-knapp
    expect(within(lista).getAllByRole('combobox')).toHaveLength(1)
    expect(within(lista).queryByRole('combobox', { name: 'Roll för Fanny Forsell' })).toBeNull()

    fireEvent.change(within(lista).getByRole('combobox', { name: 'Roll för Kim Karlsson' }), { target: { value: 'chef' } })
    await waitFor(() => expect(orgApi.setColleagueRole).toHaveBeenCalledWith('m2', 'chef'))

    fireEvent.click(within(lista).getByRole('button', { name: 'Ta bort Kim Karlsson' }))
    await waitFor(() => expect(orgApi.removeColleague).toHaveBeenCalledWith('m2'))
  })
})
