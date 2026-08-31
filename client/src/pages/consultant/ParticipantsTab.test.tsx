import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
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
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <I18nextProvider i18n={i18n}>
        <ParticipantsTab />
      </I18nextProvider>
      <LocationProbe />
    </MemoryRouter>
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
