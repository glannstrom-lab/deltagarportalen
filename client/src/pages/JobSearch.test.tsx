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
import { searchJobs, getAutocomplete } from '@/services/arbetsformedlingenApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'

const mockSearchJobs = searchJobs as ReturnType<typeof vi.fn>
const mockGetAutocomplete = getAutocomplete as ReturnType<typeof vi.fn>
const mockUseSavedJobs = useSavedJobs as ReturnType<typeof vi.fn>

// Test wrapper
function renderWithProviders(component: React.ReactNode) {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  )
}

describe('JobSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchJobs.mockResolvedValue({
      hits: [],
      total: { value: 0 },
    })
    mockGetAutocomplete.mockResolvedValue([])
  })

  describe('rendering', () => {
    it('should render the job search page without errors', async () => {
      const { container } = renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument()
      })
    })

    it('should render search input after expanding the filter panel', async () => {
      // matchMedia mockas till matches: false i test-setup → "mobil" →
      // filterpanelen är kollapsad som default. Expandera först.
      renderWithProviders(<JobSearch />)

      const toggle = await screen.findByRole('button', { name: /sök & filtrera/i })
      fireEvent.click(toggle)

      await waitFor(() => {
        // Look for any text input
        const textInputs = document.querySelectorAll('input[type="text"]')
        expect(textInputs.length).toBeGreaterThan(0)
      })
    })
  })

  describe('search functionality', () => {
    it('should call searchJobs on mount', async () => {
      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(mockSearchJobs).toHaveBeenCalled()
      })
    })

    it('should display search results', async () => {
      const mockJobs = [
        {
          id: 'job1',
          headline: 'Frontend Utvecklare',
          employer: { name: 'Startup AB' },
          workplace_address: { municipality: 'Stockholm' },
          publication_date: '2024-01-15',
        },
        {
          id: 'job2',
          headline: 'Backend Utvecklare',
          employer: { name: 'Enterprise Corp' },
          workplace_address: { municipality: 'Göteborg' },
          publication_date: '2024-01-14',
        },
      ]

      mockSearchJobs.mockResolvedValue({
        hits: mockJobs,
        total: { value: 2 },
      })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(screen.getByText('Frontend Utvecklare')).toBeInTheDocument()
        expect(screen.getByText('Backend Utvecklare')).toBeInTheDocument()
      })
    })

    it('should handle empty results', async () => {
      mockSearchJobs.mockResolvedValue({
        hits: [],
        total: { value: 0 },
      })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(mockSearchJobs).toHaveBeenCalled()
      })
    })
  })

  describe('saved jobs', () => {
    it('should display job cards from search results', async () => {
      mockSearchJobs.mockResolvedValue({
        hits: [
          {
            id: 'job1',
            headline: 'Test Job',
            employer: { name: 'Test Company' },
            workplace_address: { municipality: 'Stockholm' },
            publication_date: '2024-01-01',
          },
        ],
        total: { value: 1 },
      })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(screen.getByText('Test Job')).toBeInTheDocument()
      })
    })

    it('should handle saved jobs state', async () => {
      mockUseSavedJobs.mockReturnValue({
        savedJobs: [{ id: 'job1', headline: 'Test Job' }],
        saveJob: vi.fn(),
        removeJob: vi.fn(),
        isSaved: vi.fn((id) => id === 'job1'),
        getStats: vi.fn(() => ({ total: 1, applied: 0, interviews: 0 })),
      })

      mockSearchJobs.mockResolvedValue({
        hits: [
          {
            id: 'job1',
            headline: 'Test Job',
            employer: { name: 'Test Company' },
            workplace_address: { municipality: 'Stockholm' },
            publication_date: '2024-01-01',
          },
        ],
        total: { value: 1 },
      })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(screen.getByText('Test Job')).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    // 2026-09-24: testet asserterade tidigare bara att containern inte var
    // tom — det gick grönt även om ett AF-avbrott visats som "inga jobb", vilket
    // är exakt det fel som rättades 2026-08-18 (searchJobs kastar numera).
    it('visar ett fel med försök-igen när sökningen misslyckas — inte "inga jobb"', async () => {
      mockSearchJobs.mockRejectedValue(new Error('API Error'))

      renderWithProviders(<JobSearch />)

      expect(await screen.findByText('Kunde inte söka jobb. Försök igen.')).toBeInTheDocument()
      expect(screen.getByText('Något gick fel')).toBeInTheDocument()
      expect(screen.queryByText(/Inga jobb/i)).not.toBeInTheDocument()
    })
  })

  describe('job details', () => {
    it('should show job details when job is selected', async () => {
      const mockJob = {
        id: 'job1',
        headline: 'Senior Developer',
        employer: { name: 'Tech Company' },
        workplace_address: { municipality: 'Stockholm' },
        publication_date: '2024-01-01',
        description: { text: 'Job description here' },
      }

      mockSearchJobs.mockResolvedValue({
        hits: [mockJob],
        total: { value: 1 },
      })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(screen.getByText('Senior Developer')).toBeInTheDocument()
        expect(screen.getByText('Tech Company')).toBeInTheDocument()
      })
    })
  })

  /**
   * Yrkesfiltret hade hårdkodad svenska ("Yrken", "Lägg till yrke",
   * "Hämta från profil", "Strukturerad matchning mot Arbetsförmedlingens
   * taxonomi…") och syntes på svenska i engelskt läge (2026-09-24).
   */
  describe('yrkesfiltret på engelska', () => {
    it('visar yrkesfiltrets texter på engelska, med Arbetsförmedlingen kvar som namn', async () => {
      const { default: en } = await import('@/i18n/locales/en.json')
      i18n.addResourceBundle('en', 'translation', en, true, true)
      await i18n.changeLanguage('en')
      try {
        renderWithProviders(<JobSearch />)
        fireEvent.click(await screen.findByRole('button', { name: new RegExp(en.jobSearch.searchAndFilter, 'i') }))

        expect(await screen.findByText(en.jobSearch.occupationHint)).toBeInTheDocument()
        expect(en.jobSearch.occupationHint).toContain('Arbetsförmedlingen')
        expect(screen.getByText(en.jobSearch.occupationsLegend)).toBeInTheDocument()
        expect(screen.queryByText(/Strukturerad matchning/)).not.toBeInTheDocument()
        expect(screen.queryByText(/Lägg till yrke/)).not.toBeInTheDocument()
        expect(screen.queryByText(/^Yrken$/)).not.toBeInTheDocument()
      } finally {
        await i18n.changeLanguage('sv')
      }
    })
  })
})
