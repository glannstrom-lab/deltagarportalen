import { describe, it, expect, vi, beforeEach } from 'vitest'
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
})

describe('ParticipantsTab — KA1: inbjudningsknappen', () => {
  it('öppnar InviteParticipantDialog när "Bjud in" klickas', async () => {
    renderTab()

    const inviteButton = await screen.findByRole('button', { name: 'Bjud in' })
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
  it('radkryssrutan har role=checkbox, aria-checked och tillgängligt namn', async () => {
    renderTab()
    await screen.findByText('Anna Andersson')

    const checkbox = screen.getByRole('checkbox', { name: 'Välj Anna Andersson' })
    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(checkbox)
    expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })

  it('Välj alla-kryssrutan i tabellen har role=checkbox och ett tillgängligt namn', async () => {
    renderTab()
    await screen.findByText('Anna Andersson')

    // Byt till listvyn där tabellen (med Välj alla i <th>) renderas.
    fireEvent.click(screen.getByRole('button', { name: 'Listvy' }))

    const selectAll = screen.getByRole('checkbox', { name: 'Markera alla' })
    expect(selectAll).toHaveAttribute('aria-checked', 'false')
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

    const searchInput = screen.getByPlaceholderText('Sök efter namn eller email...')
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
