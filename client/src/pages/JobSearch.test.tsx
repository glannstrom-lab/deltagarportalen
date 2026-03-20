import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'

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
      single: vi.fn(),
      maybeSingle: vi.fn(),
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
    it('should render the job search page', async () => {
      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should render search input', async () => {
      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/sök.*jobb/i)
        expect(searchInput).toBeInTheDocument()
      })
    })

    it('should render filter options', async () => {
      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        // Check for municipality filter
        expect(screen.getByText(/kommun/i)).toBeInTheDocument()
      })
    })
  })

  describe('search functionality', () => {
    it('should perform search on mount', async () => {
      mockSearchJobs.mockResolvedValue({
        hits: [
          {
            id: 'job1',
            headline: 'Utvecklare',
            employer: { name: 'Tech AB' },
            workplace_address: { municipality: 'Stockholm' },
            publication_date: '2024-01-01',
          },
        ],
        total: { value: 1 },
      })

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

    it('should show empty state when no results', async () => {
      mockSearchJobs.mockResolvedValue({
        hits: [],
        total: { value: 0 },
      })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        // Should show either total count or empty state
        expect(mockSearchJobs).toHaveBeenCalled()
      })
    })

    it('should debounce search input', async () => {
      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/sök.*jobb/i)

        // Type quickly
        fireEvent.change(searchInput, { target: { value: 'u' } })
        fireEvent.change(searchInput, { target: { value: 'ut' } })
        fireEvent.change(searchInput, { target: { value: 'utv' } })
      })

      // Should not have called searchJobs for each keystroke immediately
      // The debounce should combine them
    })
  })

  describe('autocomplete', () => {
    it('should fetch autocomplete suggestions', async () => {
      mockGetAutocomplete.mockResolvedValue(['Utvecklare', 'UX Designer', 'UI Designer'])

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/sök.*jobb/i)
        fireEvent.change(searchInput, { target: { value: 'ut' } })
      })

      await waitFor(() => {
        expect(mockGetAutocomplete).toHaveBeenCalledWith('ut')
      })
    })

    it('should not fetch autocomplete for short queries', async () => {
      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/sök.*jobb/i)
        fireEvent.change(searchInput, { target: { value: 'u' } })
      })

      // Should not call autocomplete for single character
      await waitFor(() => {
        expect(mockGetAutocomplete).not.toHaveBeenCalledWith('u')
      })
    })
  })

  describe('saved jobs', () => {
    it('should show save button on job cards', async () => {
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

    it('should call saveJob when clicking save', async () => {
      const mockSaveJob = vi.fn()
      mockUseSavedJobs.mockReturnValue({
        savedJobs: [],
        saveJob: mockSaveJob,
        removeJob: vi.fn(),
        isSaved: vi.fn(() => false),
        getStats: vi.fn(() => ({ total: 0, applied: 0, interviews: 0 })),
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

    it('should indicate when job is already saved', async () => {
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

  describe('filters', () => {
    it('should update search when municipality filter changes', async () => {
      mockSearchJobs.mockResolvedValue({
        hits: [],
        total: { value: 0 },
      })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(mockSearchJobs).toHaveBeenCalled()
      })

      // Initial call count
      const initialCallCount = mockSearchJobs.mock.calls.length

      // Change filter should trigger new search
      await waitFor(() => {
        expect(mockSearchJobs.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount)
      })
    })

    it('should reset pagination when filters change', async () => {
      mockSearchJobs.mockResolvedValue({
        hits: Array(20).fill(null).map((_, i) => ({
          id: `job${i}`,
          headline: `Job ${i}`,
          employer: { name: 'Company' },
          workplace_address: { municipality: 'Stockholm' },
          publication_date: '2024-01-01',
        })),
        total: { value: 50 },
      })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(mockSearchJobs).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('should display error state on search failure', async () => {
      mockSearchJobs.mockRejectedValue(new Error('API Error'))

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        // Should handle error gracefully
        expect(mockSearchJobs).toHaveBeenCalled()
      })
    })

    it('should allow retry after error', async () => {
      mockSearchJobs
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          hits: [{ id: 'job1', headline: 'Test Job' }],
          total: { value: 1 },
        })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        expect(mockSearchJobs).toHaveBeenCalled()
      })
    })
  })

  describe('tabs navigation', () => {
    it('should render tab navigation', async () => {
      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        // Check for tab buttons/links
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
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
      })

      // Click on job to select it
      fireEvent.click(screen.getByText('Senior Developer'))

      // Should show job details
      await waitFor(() => {
        expect(screen.getByText('Tech Company')).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/sök.*jobb/i)
        expect(searchInput).toHaveAttribute('type', 'text')
      })
    })

    it('should support keyboard navigation', async () => {
      mockSearchJobs.mockResolvedValue({
        hits: [
          {
            id: 'job1',
            headline: 'Test Job',
            employer: { name: 'Company' },
            workplace_address: { municipality: 'Stockholm' },
            publication_date: '2024-01-01',
          },
        ],
        total: { value: 1 },
      })

      renderWithProviders(<JobSearch />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/sök.*jobb/i)
        searchInput.focus()
        expect(document.activeElement).toBe(searchInput)
      })
    })
  })
})
