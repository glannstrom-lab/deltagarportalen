/**
 * Lägena i Kalender-, Tidslinje- och Kontakter-flikarna.
 *
 * Vakten finns för att de tre felen nedan alla var osynliga i prod — båda
 * tabellerna är tomma där, så ingen kunde se att koden var trasig:
 *  1. En påminnelse från i går ritades ingenstans ("Försenad" var död kod).
 *  2. Dagens påminnelse ritades två gånger (UTC-midnatt vs lokal midnatt).
 *  3. Ett trasigt anrop ritades som ett tomtillstånd ("Allt klart för idag!").
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfirmDialogProvider } from '@/components/ui'
import type { Application, ApplicationContact, ApplicationHistoryEntry, ApplicationReminder } from '@/types/application.types'

const paminnelseVarde = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
const uppslagVarde = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('@/hooks/useApplications', () => ({
  useApplicationReminders: () => paminnelseVarde.current,
  useApplicationLookup: () => uppslagVarde.current
}))

const api = vi.hoisted(() => ({
  historik: vi.fn(),
  kontakter: vi.fn()
}))

vi.mock('@/services/applicationsApi', () => ({
  applicationHistoryApi: { getRecent: api.historik },
  applicationContactsApi: {
    getAll: api.kontakter,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    markContacted: vi.fn()
  }
}))

import { ApplicationsCalendar } from './ApplicationsCalendar'
import { ApplicationsTimeline } from './ApplicationsTimeline'
import { ApplicationsContacts } from './ApplicationsContacts'

/** Lokal dygnsnyckel — samma räkning som komponenten gör. */
function nyckel(offsetDagar: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDagar)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function paminnelse(over: Partial<ApplicationReminder> = {}): ApplicationReminder {
  return {
    id: 'r1', applicationId: 'a1', userId: 'u1',
    reminderType: 'follow_up', reminderDate: nyckel(0), reminderTime: null,
    title: 'Ring rekryteraren', description: null,
    isCompleted: false, completedAt: null, createdAt: new Date().toISOString(),
    ...over
  }
}

function ansokan(over: Partial<Application> = {}): Application {
  return {
    id: 'a1', userId: 'u1', status: 'applied', priority: 'medium',
    jobTitle: 'Butikssäljare', companyName: 'Ica Maxi',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...over
  } as Application
}

function uppslag(over: Record<string, unknown> = {}) {
  const applications = (over.applications as Application[]) ?? []
  return {
    applications,
    byId: new Map(applications.map(a => [a.id, a])),
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...over
  }
}

function rita(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConfirmDialogProvider>{ui}</ConfirmDialogProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  paminnelseVarde.current = {
    reminders: [], isLoading: false, isError: false, error: null,
    refetch: vi.fn(), completeReminder: vi.fn()
  }
  uppslagVarde.current = uppslag({ applications: [ansokan()] })
  api.historik.mockResolvedValue([])
  api.kontakter.mockResolvedValue([])
})

describe('ApplicationsCalendar — dygnsgränser', () => {
  it('visar en påminnelse från i går, märkt som passerad', async () => {
    paminnelseVarde.current = {
      ...paminnelseVarde.current,
      reminders: [paminnelse({ reminderDate: nyckel(-1), title: 'Skicka referenser' })]
    }
    rita(<ApplicationsCalendar />)

    expect(await screen.findByText('Det här har passerat')).toBeInTheDocument()
    expect(screen.getAllByText('Skicka referenser').length).toBeGreaterThan(0)
  })

  it('ritar dagens påminnelse exakt en gång', async () => {
    paminnelseVarde.current = {
      ...paminnelseVarde.current,
      reminders: [paminnelse({ title: 'Ring rekryteraren' })]
    }
    rita(<ApplicationsCalendar />)

    expect(await screen.findAllByText('Ring rekryteraren')).toHaveLength(1)
  })

  it('säger att något gick fel i stället för att påstå att allt är klart', async () => {
    paminnelseVarde.current = { ...paminnelseVarde.current, isError: true }
    rita(<ApplicationsCalendar />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText(/Allt klart/)).not.toBeInTheDocument()
  })

  it('kopplar påminnelsen till ansökan den gäller', async () => {
    paminnelseVarde.current = { ...paminnelseVarde.current, reminders: [paminnelse()] }
    rita(<ApplicationsCalendar />)

    expect(await screen.findByText('Butikssäljare · Ica Maxi')).toBeInTheDocument()
  })

  it('visar intervjudatum från ansökningarna', async () => {
    uppslagVarde.current = uppslag({
      applications: [ansokan({ interviewDate: `${nyckel(3)}T13:00:00.000Z` })]
    })
    rita(<ApplicationsCalendar />)

    expect(await screen.findByText('Närmast framåt')).toBeInTheDocument()
  })

  it('har ett rutnät med månadsnavigering', async () => {
    rita(<ApplicationsCalendar />)

    expect(await screen.findByRole('grid')).toBeInTheDocument()
    expect(screen.getByLabelText('Visa nästa månad')).toBeInTheDocument()
    expect(screen.getByLabelText('Visa föregående månad')).toBeInTheDocument()
  })
})

describe('ApplicationsTimeline', () => {
  const post = (over: Partial<ApplicationHistoryEntry> = {}): ApplicationHistoryEntry => ({
    id: 'h1', applicationId: 'a1', userId: 'u1',
    eventType: 'note_added', oldValue: null, newValue: null, note: null,
    createdAt: new Date().toISOString(),
    ...over
  })

  it('visar anteckningens text, som triggern skriver till new_value', async () => {
    api.historik.mockResolvedValue([post({ newValue: 'Ringde och fick napp' })])
    rita(<ApplicationsTimeline />)

    expect(await screen.findByText(/Ringde och fick napp/)).toBeInTheDocument()
  })

  it('säger vad som skapades i stället för bara "Skapad"', async () => {
    api.historik.mockResolvedValue([post({ eventType: 'created', newValue: 'applied' })])
    rita(<ApplicationsTimeline />)

    expect(await screen.findByText(/Lades till som/)).toBeInTheDocument()
  })

  it('visar ett fel som ett fel, inte som tom historik', async () => {
    api.historik.mockRejectedValue(new Error('nätverket'))
    rita(<ApplicationsTimeline />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})

describe('ApplicationsContacts', () => {
  const kontakt = (over: Partial<ApplicationContact> = {}): ApplicationContact => ({
    id: 'k1', applicationId: 'a1', userId: 'u1', name: 'Anna Andersson',
    isPrimary: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...over
  })

  it('ger tomtillståndet en väg framåt och skriver aldrig ut en nolla', async () => {
    rita(<ApplicationsContacts />)

    expect(await screen.findByRole('button', { name: 'Lägg till din första kontakt' })).toBeInTheDocument()
    expect(screen.queryByText(/0 kontakter/)).not.toBeInTheDocument()
  })

  it('pekar mot ansökningarna när det inte finns någon att koppla kontakten till', async () => {
    uppslagVarde.current = uppslag({ applications: [] })
    rita(<ApplicationsContacts />)

    expect(await screen.findByRole('button', { name: 'Öppna dina ansökningar' })).toBeInTheDocument()
  })

  it('visar ett fel som ett fel, inte som tom lista', async () => {
    api.kontakter.mockRejectedValue(new Error('nätverket'))
    rita(<ApplicationsContacts />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('Inga kontakter än')).not.toBeInTheDocument()
  })

  it('visar vilken ansökan kontakten hör till', async () => {
    api.kontakter.mockResolvedValue([kontakt()])
    rita(<ApplicationsContacts />)

    expect(await screen.findByText('Butikssäljare · Ica Maxi')).toBeInTheDocument()
  })
})
