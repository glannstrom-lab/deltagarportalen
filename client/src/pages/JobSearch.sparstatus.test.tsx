import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'

// Mock the API module
vi.mock('@/services/arbetsformedlingenApi', () => ({
  searchJobs: vi.fn(),
  getJobDetails: vi.fn(),
  getAutocomplete: vi.fn(),
  SWEDISH_MUNICIPALITIES: [
    { code: '0180', name: 'Stockholm' },
    { code: '1480', name: 'Göteborg' },
    { code: '1280', name: 'Malmö' },
  ],
}))

// Mock useSavedJobs hook
vi.mock('@/hooks/useSavedJobs', () => ({
  useSavedJobs: vi.fn(() => ({
    savedJobs: [],
    saveJob: vi.fn(),
    removeJob: vi.fn(),
    isSaved: vi.fn(() => false),
    getStats: vi.fn(() => ({ total: 0, applied: 0, interviews: 0 })),
  })),
}))

// AT2: bevakningen går genom useJobAlerts — samma väg som Bevakningar-fliken
const createAlert = vi.fn()
const befintligaBevakningar: Array<Record<string, unknown>> = []
vi.mock('@/hooks/useJobAlerts', () => ({
  useJobAlerts: () => ({ alerts: befintligaBevakningar, createAlert: (...a: unknown[]) => createAlert(...a) }),
}))

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user1' } }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}))

import JobSearch from './JobSearch'
import { searchJobs, getAutocomplete, getJobDetails } from '@/services/arbetsformedlingenApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'


const mockSearchJobs = searchJobs as ReturnType<typeof vi.fn>
const mockGetAutocomplete = getAutocomplete as ReturnType<typeof vi.fn>
const mockUseSavedJobs = useSavedJobs as ReturnType<typeof vi.fn>
void getJobDetails

const saveJob = vi.fn()

function visa() {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <JobSearch />
      </I18nextProvider>
    </BrowserRouter>,
  )
}

describe('JobSearch: statusrad och rubriknivåer (SV10, SV11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    saveJob.mockResolvedValue(true)
    mockUseSavedJobs.mockReturnValue({
      savedJobs: [],
      saveJob,
      removeJob: vi.fn(),
      isSaved: vi.fn(() => false),
      refresh: vi.fn(),
    })
    mockGetAutocomplete.mockResolvedValue([])
    mockSearchJobs.mockResolvedValue({
      hits: [{
        id: 'j1', headline: 'Lagerarbetare', employer: { name: 'Nordfrakt' },
        workplace_address: { municipality: 'Malmö' }, publication_date: '2026-09-01',
      }],
      total: { value: 1 },
    })
  })

  it('SV10: Spara annonseras i en role="status"-rad, inte bara genom knappens namn', async () => {
    visa()
    await screen.findByText('Lagerarbetare')
    const knapp = screen.getAllByRole('button', { name: /^spara$/i })[0]
    fireEvent.click(knapp)
    await waitFor(() => {
      const rader = screen.getAllByRole('status').map(e => e.textContent ?? '')
      expect(rader.some(r => r.includes('Jobbet är sparat') && r.includes('Lagerarbetare'))).toBe(true)
    })
  })

  it('SV10: ett misslyckat sparande säger det i stället för att tiga', async () => {
    saveJob.mockResolvedValue(false)
    visa()
    await screen.findByText('Lagerarbetare')
    fireEvent.click(screen.getAllByRole('button', { name: /^spara$/i })[0])
    await waitFor(() => {
      const rader = screen.getAllByRole('status').map(e => e.textContent ?? '')
      expect(rader.some(r => r.includes('Det gick inte att spara jobbet'))).toBe(true)
    })
  })

  it('SV11: en h2 ligger mellan filtersektionen och annonsrubrikerna (ingen h2 → h3-lucka)', async () => {
    visa()
    await screen.findByText('Lagerarbetare')
    // Ordningen i dokumentet: filtret (h2) → Sökresultat (h2) → annonserna (h3)
    const nivaer = screen.getAllByRole('heading').map(h => h.tagName).filter(n => n === 'H2' || n === 'H3')
    expect(nivaer.indexOf('H3')).toBeGreaterThan(nivaer.lastIndexOf('H2', nivaer.indexOf('H3')) )
    expect(nivaer.slice(0, nivaer.indexOf('H3')).every(n => n === 'H2')).toBe(true)
    expect(screen.getByRole('heading', { level: 2, name: 'Sökresultat' })).toBeInTheDocument()
  })
})
