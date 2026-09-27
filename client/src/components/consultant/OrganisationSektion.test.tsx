/**
 * OrganisationSektion — utan medlemskap, som chef med kollegor + caseload,
 * och självbetjäningen (KM2 steg 3): formuläret bara för chef/admin,
 * "Lägg till" går till API:t med rätt org/e-post/roll, databasens fel visas
 * som text, och Administratör-alternativet syns bara för admin.
 * Överlämning (KM2 steg 4): knappen bara för chef och bara på rader med
 * deltagare, mottagarlistan utan avsändaren, handover med rätt org/från/till,
 * databasens fel som text.
 * Kolleginbjudan (2026-09-27): saknar adressen konto erbjuds en inbjudan via
 * mejl; statusen är ärlig ("skickad" bara vid bekräftat utskick, annars
 * "sparad men …"); databasens nej visas; obesvarade inbjudningar listas.
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
      inviteColleagueByEmail: vi.fn(),
      pendingColleagueInvites: vi.fn(),
      setColleagueRole: vi.fn(),
      removeColleague: vi.fn(),
      handover: vi.fn(),
      setOrgAiEnabled: vi.fn(),
    },
  }
})

vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: vi.fn(async () => true) }) }))

const org = { id: 'o1', name: 'Hällefors kommun', kind: 'kommun', org_number: '212000-1942', ai_enabled: true, created_at: '', updated_at: '' }

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
  beforeEach(async () => {
    vi.clearAllMocks()
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(orgApi.pendingColleagueInvites).mockResolvedValue([])
  })
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
    expect(within(form).getByText(/Annars kan du skicka en inbjudan via mejl/)).toBeInTheDocument()

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
    vi.mocked(orgApi.addColleagueByEmail).mockRejectedValue(new Error('Personen är redan medlem i organisationen'))
    render(<OrganisationSektion />)
    const form = await screen.findByRole('form', { name: /Lägg till kollega/ })
    fireEvent.change(within(form).getByLabelText('E-post'), { target: { value: 'x@y.se' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Lägg till' }))
    expect(await within(form).findByRole('alert')).toHaveTextContent('Personen är redan medlem i organisationen')
    expect(within(form).queryByRole('button', { name: 'Skicka inbjudan via mejl' })).toBeNull()
    expect(orgApi.myMemberships).toHaveBeenCalledTimes(1)
  })

  describe('kolleginbjudan via mejl', () => {
    const saknas = new Error('Ingen användare med e-posten x@example.com. Personen behöver skapa ett konto på jobin.se först.')

    async function tillErbjudan(roll = 'chef') {
      const orgApi = await somRoll('chef')
      vi.mocked(orgApi.addColleagueByEmail).mockRejectedValue(saknas)
      render(<OrganisationSektion />)
      const form = await screen.findByRole('form', { name: /Lägg till kollega/ })
      fireEvent.change(within(form).getByLabelText('E-post'), { target: { value: ' x@example.com ' } })
      fireEvent.change(within(form).getByLabelText('Roll'), { target: { value: roll } })
      fireEvent.click(within(form).getByRole('button', { name: 'Lägg till' }))
      await within(form).findByRole('button', { name: 'Skicka inbjudan via mejl' })
      return { orgApi, form }
    }

    it('saknar adressen konto erbjuds en inbjudan — inget felmeddelande, och inget skickas förrän chefen väljer det', async () => {
      const { orgApi, form } = await tillErbjudan()
      expect(within(form).queryByRole('alert')).toBeNull()
      expect(within(form).getByText(/har inget konto på Jobin än/)).toHaveTextContent(
        'x@example.com har inget konto på Jobin än. Vill du skicka en inbjudan via mejl? När personen skapat kontot via länken blir hen chef i Hällefors kommun och får konsulentvyn.',
      )
      expect(orgApi.inviteColleagueByEmail).not.toHaveBeenCalled()
    })

    it('"Skicka inbjudan via mejl" går till API:t med org, adress och roll — och "skickad" visas bara vid bekräftat utskick', async () => {
      const { orgApi, form } = await tillErbjudan('handlaggare')
      vi.mocked(orgApi.inviteColleagueByEmail).mockResolvedValue({ id: 'i1', email: 'x@example.com', mejl: 'skickat' })
      fireEvent.click(within(form).getByRole('button', { name: 'Skicka inbjudan via mejl' }))
      await waitFor(() => expect(orgApi.inviteColleagueByEmail).toHaveBeenCalledWith('o1', 'x@example.com', 'handlaggare'))
      expect(await within(form).findByRole('status')).toHaveTextContent('Inbjudan är skickad till x@example.com.')
      expect(within(form).queryByRole('button', { name: 'Skicka inbjudan via mejl' })).toBeNull()
      // listan över obesvarade hämtas om
      await waitFor(() => expect(orgApi.pendingColleagueInvites).toHaveBeenCalledTimes(2))
    })

    it('mejlet kunde inte skickas → "sparad men mejlet kunde inte skickas", aldrig "skickad"', async () => {
      const { orgApi, form } = await tillErbjudan()
      vi.mocked(orgApi.inviteColleagueByEmail).mockResolvedValue({ id: 'i1', email: 'x@example.com', mejl: 'ej_skickat', detalj: 'HTTP 500' })
      fireEvent.click(within(form).getByRole('button', { name: 'Skicka inbjudan via mejl' }))
      const alert = await within(form).findByRole('alert')
      expect(alert).toHaveTextContent('Inbjudan till x@example.com är sparad, men mejlet kunde inte skickas (HTTP 500).')
      expect(within(form).queryByText(/är skickad/)).toBeNull()
    })

    it('obekräftat utskick → säger att det inte kan bekräftas, aldrig "skickad"', async () => {
      const { orgApi, form } = await tillErbjudan()
      vi.mocked(orgApi.inviteColleagueByEmail).mockResolvedValue({ id: 'i1', email: 'x@example.com', mejl: 'obekraftat' })
      fireEvent.click(within(form).getByRole('button', { name: 'Skicka inbjudan via mejl' }))
      expect(await within(form).findByRole('alert')).toHaveTextContent('men vi kan inte bekräfta att mejlet gick iväg')
      expect(within(form).queryByText(/är skickad/)).toBeNull()
    })

    it('databasens nej visas som fel, utan statusrad', async () => {
      const { orgApi, form } = await tillErbjudan()
      vi.mocked(orgApi.inviteColleagueByEmail).mockRejectedValue(new Error('Demokontot kan inte bjuda in. Personerna i demot är påhittade.'))
      fireEvent.click(within(form).getByRole('button', { name: 'Skicka inbjudan via mejl' }))
      expect(await within(form).findByRole('alert')).toHaveTextContent('Demokontot kan inte bjuda in.')
      expect(within(form).queryByRole('status')).toBeNull()
    })

    it('Avbryt stänger erbjudandet utan att något skickas', async () => {
      const { orgApi, form } = await tillErbjudan()
      fireEvent.click(within(form).getByRole('button', { name: 'Avbryt' }))
      expect(within(form).queryByRole('button', { name: 'Skicka inbjudan via mejl' })).toBeNull()
      expect(orgApi.inviteColleagueByEmail).not.toHaveBeenCalled()
    })

    it('listar obesvarade inbjudningar med ärlig mejlstatus', async () => {
      const orgApi = await somRoll('chef')
      vi.mocked(orgApi.pendingColleagueInvites).mockResolvedValue([
        { id: 'a', email: 'skickad@example.com', email_sent: true, expires_at: '2999-01-01T00:00:00Z', created_at: '', org_role: 'konsulent' },
        { id: 'b', email: 'inte@example.com', email_sent: false, expires_at: '2000-01-01T00:00:00Z', created_at: '', org_role: 'chef' },
      ])
      render(<OrganisationSektion />)
      const lista = await screen.findByRole('list', { name: 'Obesvarade inbjudningar' })
      const rader = within(lista).getAllByRole('listitem')
      expect(rader[0]).toHaveTextContent('skickad@example.com')
      expect(rader[0]).toHaveTextContent('Mejlet skickat')
      expect(rader[1]).toHaveTextContent('Mejlet inte skickat')
      expect(rader[1]).toHaveTextContent('Länken har gått ut')
      expect(orgApi.pendingColleagueInvites).toHaveBeenCalledWith('o1')
    })

    it('en vanlig konsulent ser varken formuläret eller inbjudningarna', async () => {
      const orgApi = await somRoll('konsulent')
      render(<OrganisationSektion />)
      await screen.findByText('Din roll: Arbetskonsulent')
      expect(orgApi.pendingColleagueInvites).not.toHaveBeenCalled()
    })
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

  // ---- Överlämning (KM2 steg 4) ----

  const caseloadTvaKonsulenter = [
    { org_id: 'o1', org_name: org.name, consultant_id: 'u2', role: 'konsulent', first_name: 'Kim', last_name: 'Karlsson', antal_deltagare: 12, antal_aktiva_planer: 7, ogiltig_franvaro_30d: 2 },
    { org_id: 'o1', org_name: org.name, consultant_id: 'u3', role: 'konsulent', first_name: 'Nour', last_name: 'Nilsson', antal_deltagare: 0, antal_aktiva_planer: 0, ogiltig_franvaro_30d: 0 },
  ]
  const kollegorTre = [
    ...kollegor,
    { id: 'm3', org_id: 'o1', org_name: org.name, org_kind: 'kommun', user_id: 'u3', role: 'konsulent', created_at: '', first_name: 'Nour', last_name: 'Nilsson', email: 'nour@example.se' },
    { id: 'm4', org_id: 'o1', org_name: org.name, org_kind: 'kommun', user_id: 'u4', role: 'handlaggare', created_at: '', first_name: 'Hanna', last_name: 'Handläggare', email: 'hanna@example.se' },
  ]

  async function somChefMedCaseload() {
    const orgApi = await somRoll('chef')
    vi.mocked(orgApi.colleagues).mockResolvedValue(kollegorTre as never)
    vi.mocked(orgApi.caseload).mockResolvedValue(caseloadTvaKonsulenter as never)
    return orgApi
  }

  it('visar "Överlämna deltagare…" bara för chef och bara på rader med deltagare', async () => {
    await somChefMedCaseload()
    const { unmount } = render(<OrganisationSektion />)
    const tabell = await screen.findByRole('table')
    const rader = within(tabell).getAllByRole('row')
    expect(within(rader[1]).getByRole('button', { name: /Överlämna deltagare/ })).toBeInTheDocument()
    expect(within(rader[2]).queryByRole('button', { name: /Överlämna deltagare/ })).toBeNull()
    unmount()

    vi.clearAllMocks()
    const orgApi = await somRoll('konsulent')
    vi.mocked(orgApi.colleagues).mockResolvedValue(kollegorTre as never)
    render(<OrganisationSektion />)
    await screen.findByText('Din roll: Arbetskonsulent')
    expect(screen.queryByRole('button', { name: /Överlämna deltagare/ })).toBeNull()
  })

  it('mottagarlistan har kollegorna i organisationen utom avsändaren och handläggare', async () => {
    await somChefMedCaseload()
    render(<OrganisationSektion />)
    const tabell = await screen.findByRole('table')
    const knapp = within(tabell).getByRole('button', { name: /Överlämna deltagare/ })
    fireEvent.click(knapp)
    expect(knapp).toHaveAttribute('aria-expanded', 'true')
    const val = within(tabell).getByLabelText('Lämna över till')
    const alternativ = within(val).getAllByRole('option').map((o) => o.textContent)
    expect(alternativ).toEqual(['Välj kollega', 'Fanny Forsell · Chef', 'Nour Nilsson · Arbetskonsulent'])
    expect(alternativ.some((a) => a?.includes('Kim Karlsson'))).toBe(false)
    expect(alternativ.some((a) => a?.includes('Hanna'))).toBe(false)
  })

  it('välj mottagare + bekräfta anropar handover med rätt org, från och till, och visar beskedet', async () => {
    const orgApi = await somChefMedCaseload()
    vi.mocked(orgApi.handover).mockResolvedValue(12)
    render(<OrganisationSektion />)
    const tabell = await screen.findByRole('table')
    fireEvent.click(within(tabell).getByRole('button', { name: /Överlämna deltagare/ }))
    const bekrafta = within(tabell).getByRole('button', { name: 'Överlämna 12 deltagare' })
    expect(bekrafta).toBeDisabled()
    fireEvent.change(within(tabell).getByLabelText('Lämna över till'), { target: { value: 'u3' } })
    expect(within(tabell).getByText(/Alla 12 deltagare flyttas till Nour Nilsson\./)).toBeInTheDocument()
    expect(within(tabell).getByText(/Journal, mål och möten stannar hos den tidigare konsulenten/)).toBeInTheDocument()
    expect(bekrafta).toBeEnabled()
    fireEvent.click(bekrafta)

    await waitFor(() => expect(orgApi.handover).toHaveBeenCalledWith('o1', 'u2', 'u3'))
    expect(await screen.findByRole('status')).toHaveTextContent('12 deltagare överlämnade till Nour Nilsson.')
    // caseload laddas om tyst
    expect(orgApi.caseload).toHaveBeenCalledTimes(2)
  })

  it('visar databasens felmeddelande vid överlämning', async () => {
    const orgApi = await somChefMedCaseload()
    vi.mocked(orgApi.handover).mockRejectedValue(new Error('Mottagaren måste vara arbetskonsulent, chef eller administratör i organisationen'))
    render(<OrganisationSektion />)
    const tabell = await screen.findByRole('table')
    fireEvent.click(within(tabell).getByRole('button', { name: /Överlämna deltagare/ }))
    fireEvent.change(within(tabell).getByLabelText('Lämna över till'), { target: { value: 'u3' } })
    fireEvent.click(within(tabell).getByRole('button', { name: 'Överlämna 12 deltagare' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Mottagaren måste vara arbetskonsulent')
    expect(orgApi.caseload).toHaveBeenCalledTimes(1)
  })
})

// PG19 / F13 (2026-09-13): chefens AI-brytare för organisationen.
describe('AI-brytaren (PG19)', () => {
  it('chefen ser brytaren och kan stänga av AI efter bekräftelse', async () => {
    const orgApi = await somRoll('chef')
    vi.mocked(orgApi.setOrgAiEnabled).mockResolvedValue({ ...org, ai_enabled: false } as never)
    render(<OrganisationSektion />)
    const knapp = await screen.findByRole('button', { name: /stäng av ai för hällefors kommun/i })
    expect(knapp).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/på — deltagare kopplade/i)).toBeInTheDocument()
    fireEvent.click(knapp)
    await waitFor(() => expect(orgApi.setOrgAiEnabled).toHaveBeenCalledWith('o1', false))
  })

  it('konsulenten ser ingen brytare', async () => {
    await somRoll('konsulent')
    render(<OrganisationSektion />)
    await screen.findByText(/kollegor/i)
    expect(screen.queryByRole('button', { name: /ai för hällefors kommun/i })).toBeNull()
  })

  it('ett misslyckat byte visas som fel, inte som sparat', async () => {
    const orgApi = await somRoll('chef')
    vi.mocked(orgApi.setOrgAiEnabled).mockRejectedValue(new Error('Ändringen sparades inte — du behöver vara chef eller administratör i organisationen.'))
    render(<OrganisationSektion />)
    fireEvent.click(await screen.findByRole('button', { name: /stäng av ai för hällefors kommun/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/sparades inte/i)
  })

  // RR9 (rollspelet 2026-09-27): leverantören erbjöds "Handläggare (ekonomiskt
  // bistånd)" och platshållaren @kommun.se. Motprov: ta bort rollerForOrg i
  // formuläret → testet faller på rollvalet.
  it('en Rusta och matcha-leverantör erbjuds inte kommunens handläggarroll eller @kommun.se', async () => {
    const { orgApi } = await import('@/services/orgApi')
    const lev = { ...org, id: 'o2', name: 'Demoleverantör', kind: 'leverantor' }
    vi.mocked(orgApi.myMemberships).mockResolvedValue([
      { id: 'm1', org_id: 'o2', user_id: 'u1', role: 'chef', created_at: '', organization: lev },
    ] as never)
    vi.mocked(orgApi.colleagues).mockResolvedValue(kollegor.map((k) => ({ ...k, org_id: 'o2', org_name: lev.name, org_kind: 'leverantor' })) as never)
    vi.mocked(orgApi.caseload).mockResolvedValue([] as never)
    render(<OrganisationSektion />)
    const form = await screen.findByRole('form', { name: 'Lägg till kollega i Demoleverantör' })
    const roll = within(form).getByLabelText('Roll') as HTMLSelectElement
    expect([...roll.options].map((o) => o.textContent)).not.toContain('Handläggare (ekonomiskt bistånd)')
    expect(within(form).getByLabelText('E-post')).not.toHaveAttribute('placeholder', expect.stringMatching(/kommun/))
    // Kollegans rollväljare i listan — samma regel
    const kimsRoll = screen.getByRole('combobox', { name: 'Roll för Kim Karlsson' }) as HTMLSelectElement
    expect([...kimsRoll.options].map((o) => o.textContent)).not.toContain('Handläggare (ekonomiskt bistånd)')
  })
})
