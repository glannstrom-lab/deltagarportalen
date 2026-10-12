import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'

// ---- Supabase-mock (KA1/KA2/KT2: se fällan i CLAUDE.md — mocka aldrig med en
// klient som ljuger om formen; participants-fixturen speglar
// `consultant_dashboard_participants`) --------------------------------------
const { mockGetUser, mockEq } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockEq: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: mockEq,
    })),
  },
}))

// RM3: möteskadensen hämtas separat; utan mock skulle den kedja `.gte().order()`
// som supabase-stubben ovan inte har. Den rena logiken (kadens/kadensText) behålls.
// Typad tom lista — `async () => []` ger `never[]` och fäller strict-taket när ett test skickar riktiga rader.
const { mockHamtaMoten } = vi.hoisted(() => ({ mockHamtaMoten: vi.fn(async (): Promise<Array<{ participant_id: string; scheduled_at: string; meeting_type: string; status: string }>> => []) }))
vi.mock('@/services/moteskadens', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/services/moteskadens')>()
  return { ...orig, hamtaMotenForKonsulent: mockHamtaMoten }
})

// Omtaget 2026-10-11: veckans plan och pass hämtas separat (lib/deltagarlage).
// Den rena logiken (deltagarLage, kontaktText) behålls; bara hämtningen mockas.
const { mockVecka, kundtyp } = vi.hoisted(() => ({
  mockVecka: vi.fn(async (): Promise<{ planer: Array<Record<string, unknown>>; pass: Array<Record<string, unknown>> }> => ({ planer: [], pass: [] })),
  kundtyp: { varde: { visaAvtalskrav: true, visaIvoUnderlag: true } as { visaAvtalskrav: boolean; visaIvoUnderlag: boolean } | null },
}))
vi.mock('@/lib/deltagarlage', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/lib/deltagarlage')>()
  return { ...orig, hamtaVeckansUnderlag: mockVecka }
})
vi.mock('@/components/consultant/useRegelverk', () => ({ useOrgTypVisning: () => kundtyp.varde }))

// KSL17: lämnade underlag hämtas separat (activity_plan_handovers). Bara hämtningen mockas.
const { mockUnderlag } = vi.hoisted(() => ({
  mockUnderlag: vi.fn(async (): Promise<Array<Record<string, unknown>>> => []),
}))
vi.mock('@/services/aktivitetApi', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/services/aktivitetApi')>()
  return { ...orig, underlagApi: { ...orig.underlagApi, listIPeriod: mockUnderlag } }
})

// BulkActionsDialog körs bara när något är markerat — inte relevant för de här
// testerna, men mockas bort så den inte drar in sina egna beroenden.
vi.mock('@/components/consultant/BulkActionsDialog', () => ({
  BulkActionsDialog: () => null,
}))

// InviteParticipantDialog mockas till en enkel markör så testerna bara
// verifierar att ParticipantsTab STYR dialogens isOpen-prop rätt (KA1) — inte
// dialogens egen logik, som hör till en annan fil.
vi.mock('@/components/consultant/InviteParticipantDialog', () => ({
  InviteParticipantDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="invite-dialog">
        Invite dialog
        <button onClick={onClose}>Stäng</button>
      </div>
    ) : null,
}))

import { ParticipantsTab } from './ParticipantsTab'

function makeParticipant(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    participant_id: 'p1',
    email: 'anna@example.com',
    first_name: 'Anna',
    last_name: 'Andersson',
    phone: null,
    avatar_url: null,
    status: 'ACTIVE',
    priority: 0,
    has_cv: true,
    ats_score: 80,
    completed_interest_test: true,
    holland_code: null,
    saved_jobs_count: 3,
    notes_count: 1,
    last_contact_at: null,
    next_meeting_scheduled: null,
    last_login: null,
    tags: null,
    ...overrides,
  }
}

/** Exponerar aktuell URL i DOM:en så testerna kan läsa searchParams (KA2). */
function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-probe">{location.pathname}{location.search}</div>
}

function renderTab(initialEntries: string[] = ['/consultant/participants']) {
  // KK4: ParticipantsTab hämtar nu deltagarna via den delade
  // react-query-hooken — en egen QueryClient per render håller testerna
  // isolerade från varandra (samma mönster som PlatserTab.test.tsx).
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <I18nextProvider i18n={i18n}>
          <ParticipantsTab />
        </I18nextProvider>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'consultant-1' } }, error: null })
  mockEq.mockResolvedValue({ data: [makeParticipant()], error: null })
  mockVecka.mockResolvedValue({ planer: [], pass: [] })
  kundtyp.varde = { visaAvtalskrav: true, visaIvoUnderlag: true }
})

describe('ParticipantsTab — KA1: inbjudningsknappen', () => {
  it('öppnar InviteParticipantDialog när "Bjud in deltagare" klickas', async () => {
    renderTab()

    const inviteButton = await screen.findByRole('button', { name: 'Bjud in deltagare' })
    expect(screen.queryByTestId('invite-dialog')).not.toBeInTheDocument()

    fireEvent.click(inviteButton)

    expect(screen.getByTestId('invite-dialog')).toBeInTheDocument()
  })
})

describe('ParticipantsTab — KA1: tomtillståndet utan deltagare', () => {
  it('visar en tydlig CTA (inte bara text) som öppnar dialogen', async () => {
    mockEq.mockResolvedValue({ data: [], error: null })
    renderTab()

    const cta = await screen.findByRole('button', { name: 'Bjud in din första deltagare' })
    expect(cta.tagName).toBe('BUTTON')

    fireEvent.click(cta)
    expect(screen.getByTestId('invite-dialog')).toBeInTheDocument()
  })
})

describe('ParticipantsTab — KT2: kryssrutornas tillgänglighet', () => {
  it('kryssrutorna syns först efter "Välj flera" — sedan role=checkbox, aria-checked och namn', async () => {
    renderTab()
    await screen.findByText('Anna Andersson')
    expect(screen.queryByRole('checkbox')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Välj flera' }))
    const checkbox = screen.getByRole('checkbox', { name: 'Välj Anna Andersson' })
    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(checkbox)
    expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })

  it('Markera alla har role=checkbox och ett namn; massåtgärderna kräver ett val', async () => {
    renderTab()
    await screen.findByText('Anna Andersson')
    fireEvent.click(screen.getByRole('button', { name: 'Välj flera' }))

    const selectAll = screen.getByRole('checkbox', { name: 'Markera alla' })
    expect(selectAll).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('button', { name: 'Skicka meddelande' })).toBeDisabled()
    fireEvent.click(selectAll)
    expect(screen.getByRole('checkbox', { name: 'Avmarkera alla' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: 'Skicka meddelande' })).toBeEnabled()
  })
})

describe('ParticipantsTab — KS7: felläge skilt från tomtillstånden', () => {
  it('visar ett eget felläge med orsak och "Försök igen" — inte samma vy som "inga deltagare"', async () => {
    mockEq.mockResolvedValueOnce({ data: null, error: { message: 'network down' } })
    renderTab()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/kunde inte hämtas/i)

    // Felet får inte se ut som EmptyState-grenen för "inga deltagare".
    expect(screen.queryByText('Inga deltagare ännu')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bjud in din första deltagare' })).not.toBeInTheDocument()

    // Nästa försök (mockEq faller tillbaka på beforeEach:s lyckade svar)
    // ska visa listan och ta bort felläget.
    fireEvent.click(screen.getByRole('button', { name: /försök igen/i }))

    await screen.findByText('Anna Andersson')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('ParticipantsTab — KA2: sök/sortering/vy i URL:en', () => {
  it('en skriven sökning speglas i searchParams (överlever en simulerad återgång)', async () => {
    renderTab()
    await screen.findByText('Anna Andersson')

    const searchInput = screen.getByPlaceholderText('Sök på namn eller e-post')
    fireEvent.change(searchInput, { target: { value: 'anna' } })

    await waitFor(() => {
      expect(screen.getByTestId('location-probe').textContent).toContain('q=anna')
    })
  })
})

describe('ParticipantsTab — RM3: möteskadens per deltagare', () => {
  it('visar chipen med dagar sedan senaste möte och flaggar över 14 dagar', async () => {
    const forDagarSedan = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12, 0, 0, 0); return d.toISOString() }
    mockEq.mockResolvedValue({ data: [makeParticipant()], error: null })
    mockHamtaMoten.mockResolvedValueOnce([
      { participant_id: makeParticipant().participant_id as string, scheduled_at: forDagarSedan(20), meeting_type: 'physical', status: 'completed' },
    ])
    renderTab()
    await screen.findByText('Anna Andersson')
    const chip = await screen.findByTestId('kadens-chip')
    expect(chip).toHaveTextContent('Senaste möte 20 dagar sedan')
    expect(chip).toHaveTextContent('fysiskt 2 v sedan')
    expect(chip).toHaveAttribute('data-lage', 'over')
  })

  it('säger "Inget möte än" — aldrig 0 — när deltagaren saknar möten', async () => {
    mockEq.mockResolvedValue({ data: [makeParticipant()], error: null })
    mockHamtaMoten.mockResolvedValueOnce([])
    renderTab()
    await screen.findByText('Anna Andersson')
    const chip = await screen.findByTestId('kadens-chip')
    expect(chip).toHaveTextContent('Inget möte än')
    expect(chip).not.toHaveTextContent('0')
  })

  it('visar en felrad ovanför listan när mötena inte kan hämtas, men listan renderas', async () => {
    mockEq.mockResolvedValue({ data: [makeParticipant()], error: null })
    mockHamtaMoten.mockRejectedValueOnce(new Error('nätverk'))
    renderTab()
    await screen.findByText('Anna Andersson')
    expect(await screen.findByRole('alert')).toHaveTextContent('Mötesdatum kunde inte hämtas')
    expect(screen.queryByTestId('kadens-chip')).toBeNull()
  })
})

describe('ParticipantsTab — senaste kontakt räknas i kalenderdagar (2026-09-24)', () => {
  // Förr: Math.floor((Date.now() - kontakt) / 24 h) under renderingen
  // (react-hooks/purity). En kontakt i går kväll 20:00, läst i dag 08:00, är
  // 12 timmar gammal → 0 → "Idag". Konsulenten fick veta att hon talat med
  // deltagaren i dag när det var i går.
  // Mutation: räkna tillbaka i 24-timmarsblock → testet faller.
  it('en kontakt i går kväll visas som "i går", inte "i dag", en morgon', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const nu = new Date(); nu.setHours(8, 0, 0, 0)
      vi.setSystemTime(nu)
      const igarKvall = new Date(nu); igarKvall.setDate(igarKvall.getDate() - 1); igarKvall.setHours(20, 0, 0, 0)
      mockEq.mockResolvedValue({ data: [makeParticipant({ last_contact_at: igarKvall.toISOString() })], error: null })
      renderTab()
      await screen.findByText('Anna Andersson')
      expect(screen.getAllByText(/Senaste kontakt i går/).length).toBeGreaterThan(0)
      expect(screen.queryByText(/Senaste kontakt i dag/)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('ParticipantsTab — RK14: senaste kontakt följer journalen', () => {
  it('en journalanteckning i dag räknas som kontakt, fast last_contact_at saknas', async () => {
    mockEq.mockResolvedValue({ data: [makeParticipant({ last_contact_at: null, last_note_date: new Date().toISOString() })], error: null })
    mockHamtaMoten.mockResolvedValueOnce([])
    renderTab()
    await screen.findByText('Anna Andersson')
    expect(screen.queryByText(/Ingen kontakt registrerad/)).toBeNull()
    expect(screen.getAllByText(/Senaste kontakt i dag/).length).toBeGreaterThan(0)
  })
})

describe('ParticipantsTab — omtaget: en rad per människa med Läget och veckan', () => {
  // Onsdag 14 oktober 2026, 10:00. Veckan är mån 12 – fre 16.
  const ONSDAG = new Date(2026, 9, 14, 10, 0, 0)
  const pass = (o: Record<string, unknown>) => ({
    id: String(Math.random()), participant_id: 'p1', plan_id: 'pl1', date: '2026-10-12', start_time: '13:00:00', end_time: '14:00:00',
    title: 'Gruppträff', activity_type: 'jobsearch', attendance: null, attendance_note: null, self_checkin_at: null, absence_reason: null, ...o,
  })

  it('Läget är en mening ur veckans pass, med statuschip och veckoremsa', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(ONSDAG)
      mockVecka.mockResolvedValue({
        planer: [{ id: 'pl1', participant_id: 'p1', weekly_hours_target: 10, status: 'active' }],
        pass: [
          pass({ date: '2026-10-12', attendance: 'present' }),
          pass({ date: '2026-10-13', attendance: 'absent_invalid' }),
          pass({ date: '2026-10-15', start_time: '09:00:00', end_time: '12:00:00', title: 'Språkcafé' }),
        ],
      })
      renderTab()
      const rad = (await screen.findByText('Ogiltig frånvaro i går (Gruppträff)')).closest('li') as HTMLElement
      expect(rad).toHaveTextContent('Ingen anteckning om varför än')
      expect(rad).toHaveTextContent('Plan 10 h/vecka')
      expect(rad.querySelector('[data-status="ogiltig"]')).not.toBeNull()
      const vecka = screen.getByRole('list', { name: 'Anna Anderssons vecka' })
      const dagar = Array.from(vecka.querySelectorAll('li')).map((li) => li.getAttribute('data-status'))
      expect(dagar).toEqual(['narvarande', 'ogiltig', 'ingen', 'planerat', 'ingen'])
      expect(rad).toHaveTextContent('I morgon 09:00 · Språkcafé')
    } finally {
      vi.useRealTimers()
    }
  })

  it('snabbfiltren "Utan plan" och "Frånvaro i veckan" filtrerar på veckans underlag', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(ONSDAG)
      mockEq.mockResolvedValue({
        data: [
          makeParticipant(),
          makeParticipant({ participant_id: 'p2', first_name: 'Bo', last_name: 'Berg', email: 'bo@example.com' }),
        ],
        error: null,
      })
      mockVecka.mockResolvedValue({
        planer: [{ id: 'pl1', participant_id: 'p1', weekly_hours_target: 10, status: 'active' }],
        pass: [pass({ date: '2026-10-13', attendance: 'sick_certified' })],
      })
      renderTab()
      await screen.findByText('Sjuk i går')
      expect(screen.getByText('Ingen aktivitetsplan')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /Utan plan/ }))
      expect(screen.getByRole('button', { name: /Utan plan/ })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.queryByText('Anna Andersson')).toBeNull()
      expect(screen.getByText('Bo Berg')).toBeInTheDocument()
      await waitFor(() => expect(screen.getByTestId('location-probe').textContent).toContain('filter=utan-plan'))

      fireEvent.click(screen.getByRole('button', { name: /Frånvaro i veckan/ }))
      expect(screen.getByText('Anna Andersson')).toBeInTheDocument()
      expect(screen.queryByText('Bo Berg')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('läsfel på veckan sägs rakt ut — läget faller tillbaka på kontakten, aldrig "allt väl"', async () => {
    mockVecka.mockRejectedValue(new Error('nätverk'))
    renderTab()
    await screen.findByText('Anna Andersson')
    expect(await screen.findByText(/Veckans pass kunde inte hämtas/)).toBeInTheDocument()
    expect(screen.getAllByText(/Ingen kontakt registrerad/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Har varit på alla pass/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Utan plan/ })).toBeNull()
  })

  it('kommunen ser ingen möteskadens — Rusta och matcha-regeln visas bara för leverantörer', async () => {
    kundtyp.varde = { visaAvtalskrav: false, visaIvoUnderlag: true }
    renderTab()
    await screen.findByText('Anna Andersson')
    await waitFor(() => expect(mockVecka).toHaveBeenCalled())
    expect(screen.queryByTestId('kadens-chip')).toBeNull()
    expect(mockHamtaMoten).not.toHaveBeenCalled()
  })
})

describe('ParticipantsTab — KSL17: snabbfilter för ogiltig frånvaro och underlag', () => {
  const ONSDAG = new Date(2026, 9, 14, 10, 0, 0)
  const pass = (o: Record<string, unknown>) => ({
    id: String(Math.random()), participant_id: 'p1', plan_id: 'pl1', date: '2026-10-13', start_time: '13:00:00', end_time: '14:00:00',
    title: 'Gruppträff', activity_type: 'jobsearch', attendance: null, attendance_note: null, self_checkin_at: null, absence_reason: null, ...o,
  })
  const tva = () => mockEq.mockResolvedValue({
    data: [makeParticipant(), makeParticipant({ participant_id: 'p2', first_name: 'Bo', last_name: 'Berg', email: 'bo@example.com' })],
    error: null,
  })
  const planer = [
    { id: 'pl1', participant_id: 'p1', weekly_hours_target: 10, status: 'active' },
    { id: 'pl2', participant_id: 'p2', weekly_hours_target: 10, status: 'active' },
  ]

  beforeEach(() => {
    kundtyp.varde = { visaAvtalskrav: false, visaIvoUnderlag: true }
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(ONSDAG)
    tva()
  })
  afterEach(() => vi.useRealTimers())

  it('"Ogiltig frånvaro i veckan" tar bara dem med absent_invalid — inte giltig frånvaro eller sjukdom', async () => {
    mockVecka.mockResolvedValue({ planer, pass: [pass({ attendance: 'absent_invalid' }), pass({ participant_id: 'p2', attendance: 'absent_valid' })] })
    renderTab()
    await screen.findByText('Bo Berg')
    fireEvent.click(await screen.findByRole('button', { name: /Ogiltig frånvaro i veckan/ }))
    expect(screen.getByText('Anna Andersson')).toBeInTheDocument()
    expect(screen.queryByText('Bo Berg')).toBeNull()
    await waitFor(() => expect(screen.getByTestId('location-probe').textContent).toContain('filter=ogiltig'))
  })

  it('hos en leverantör är det fakta, inte en giltighetsbedömning', async () => {
    kundtyp.varde = { visaAvtalskrav: true, visaIvoUnderlag: false }
    mockVecka.mockResolvedValue({ planer, pass: [pass({ attendance: 'absent_invalid' })] })
    renderTab()
    await screen.findByText('Anna Andersson')
    expect(await screen.findByRole('button', { name: /Frånvarande, inte anmäld i veckan/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ogiltig frånvaro i veckan/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Underlag ej lämnat/ })).toBeNull()
  })

  it('"Underlag ej lämnat" tar aktiva planer utan ett underlag i månaden — ett ångrat underlag räknas inte', async () => {
    mockVecka.mockResolvedValue({ planer, pass: [] })
    mockUnderlag.mockResolvedValue([
      { participant_id: 'p1', handed_over_at: new Date(2026, 9, 5, 12).toISOString(), withdrawn_at: null },
      { participant_id: 'p2', handed_over_at: new Date(2026, 9, 6, 12).toISOString(), withdrawn_at: new Date(2026, 9, 6, 13).toISOString() },
    ])
    renderTab()
    await screen.findByText('Bo Berg')
    fireEvent.click(await screen.findByRole('button', { name: /Underlag ej lämnat/ }))
    expect(screen.getByText('Bo Berg')).toBeInTheDocument()
    expect(screen.queryByText('Anna Andersson')).toBeNull()
  })

  it('direktlänk till ?filter=utan-underlag hos en ren leverantör ger hela listan och en förklaring, inte en tom lista', async () => {
    kundtyp.varde = { visaAvtalskrav: true, visaIvoUnderlag: false }
    mockVecka.mockResolvedValue({ planer, pass: [] })
    renderTab(['/consultant/participants?filter=utan-underlag'])
    expect(await screen.findByText('Anna Andersson')).toBeInTheDocument()
    expect(screen.getByText('Bo Berg')).toBeInTheDocument()
    expect(await screen.findByText(/gäller bara kommun/)).toBeInTheDocument()
  })

  it('kan underlagen inte hämtas sägs det, och filtret visas inte', async () => {
    mockVecka.mockResolvedValue({ planer, pass: [] })
    mockUnderlag.mockRejectedValue(new Error('nätverk'))
    renderTab()
    await screen.findByText('Anna Andersson')
    expect(await screen.findByText(/Lämnade underlag kunde inte hämtas/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Underlag ej lämnat/ })).toBeNull()
  })
})
