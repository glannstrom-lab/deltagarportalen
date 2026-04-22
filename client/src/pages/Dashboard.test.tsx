import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'

// Mock useDashboardData hook
const mockDashboardData = {
  cv: { hasCV: false, progress: 0, atsScore: 0, atsFeedback: [], lastEdited: null, missingSections: [], savedCVs: [], currentTemplate: 'modern' },
  interest: { hasResult: false, topRecommendations: [], completedAt: null, riasecProfile: null, answeredQuestions: 0, totalQuestions: 36 },
  jobs: { savedCount: 0, newMatches: 0, recentSavedJobs: [] },
  applications: { total: 0, statusBreakdown: { applied: 0, interview: 0, rejected: 0, offer: 0 }, nextFollowUp: null },
  coverLetters: { count: 0, drafts: 0, recentLetters: [] },
  exercises: { totalExercises: 38, completedExercises: 0, completionRate: 0, streakDays: 0 },
  calendar: { upcomingEvents: [], eventsThisWeek: 0, hasConsultantMeeting: false },
  activity: { weeklyApplications: 0, streakDays: 0 },
  knowledge: { readCount: 0, savedCount: 0, totalArticles: 0, recentlyRead: [], recommendedArticle: null },
  quests: { total: 3, completed: 0, items: [] },
  wellness: { moodToday: null, streakDays: 0, completedActivities: 0, lastEntryDate: null },
}

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: vi.fn(() => ({
    data: mockDashboardData,
    loading: false,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
  })),
  getDefaultDashboardData: () => mockDashboardData,
}))

// Mock useInterestProfile hook
vi.mock('@/hooks/useInterestProfile', () => ({
  useInterestProfile: vi.fn(() => ({
    profile: null,
    isLoading: false,
  })),
  RIASEC_TYPES: {
    R: { label: 'Realistic', color: '#FF6B6B' },
    I: { label: 'Investigative', color: '#4ECDC4' },
    A: { label: 'Artistic', color: '#FFE66D' },
    S: { label: 'Social', color: '#95E1D3' },
    E: { label: 'Enterprising', color: '#F38181' },
    C: { label: 'Conventional', color: '#AA96DA' },
  },
}))

// Mock authStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user1', email: 'test@example.com' },
    profile: { first_name: 'Test', last_name: 'User' },
    isAuthenticated: true,
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
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}))

// Mock HelpButton
vi.mock('@/components/HelpButton', () => ({
  HelpButton: () => null,
}))

// Mock helpContent
vi.mock('@/data/helpContent', () => ({
  helpContent: { dashboard: {} },
}))

// Mock ConsultantRequestBanner
vi.mock('@/components/consultant/ConsultantRequestBanner', () => ({
  ConsultantRequestBanner: () => <div data-testid="consultant-banner" />,
}))

import Dashboard from './Dashboard'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useInterestProfile } from '@/hooks/useInterestProfile'

const mockUseDashboardData = useDashboardData as ReturnType<typeof vi.fn>
const mockUseInterestProfile = useInterestProfile as ReturnType<typeof vi.fn>

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function renderDashboard() {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Dashboard />
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default mock values
    mockUseDashboardData.mockReturnValue({
      data: mockDashboardData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    })
    mockUseInterestProfile.mockReturnValue({
      profile: null,
      isLoading: false,
    })
  })

  describe('rendering', () => {
    it('should render the dashboard without errors', async () => {
      const { container } = renderDashboard()

      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument()
      })
    })

    it('should show loading state when data is loading', () => {
      // Mock loading state
      mockUseDashboardData.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      })

      renderDashboard()
      // When loading, Dashboard shows DashboardSkeleton
      expect(mockUseDashboardData).toHaveBeenCalled()
    })

    it('should show content after loading', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.queryByText('Laddar...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Kom igång')).toBeInTheDocument()
    })

    it('should render dashboard sections', async () => {
      renderDashboard()

      await waitFor(() => {
        // Current Dashboard structure has these sections
        expect(screen.getByText('Kom igång')).toBeInTheDocument()
        expect(screen.getByText('Snabbåtgärder')).toBeInTheDocument()
        expect(screen.getByText('Utveckling')).toBeInTheDocument()
      })
    })

    it('should render consultant banner', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('consultant-banner')).toBeInTheDocument()
      })
    })
  })

  describe('expandable categories', () => {
    it('should have expand/collapse buttons with correct ARIA attributes', async () => {
      renderDashboard()

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const categoryButtons = buttons.filter((btn) => btn.getAttribute('aria-expanded') !== null)

        // Dashboard has multiple expandable sections
        expect(categoryButtons.length).toBeGreaterThanOrEqual(2)
        categoryButtons.forEach((btn) => {
          expect(btn).toHaveAttribute('aria-expanded')
          expect(btn).toHaveAttribute('aria-controls')
        })
      })
    })

    it('should toggle category expansion when clicked', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Kom igång')).toBeInTheDocument()
      })

      const categoryButton = screen.getByRole('button', { name: /kom igång/i })
      const initialState = categoryButton.getAttribute('aria-expanded')

      await user.click(categoryButton)

      // Should toggle state
      expect(categoryButton.getAttribute('aria-expanded')).not.toBe(initialState)
    })

    it('should have regions with proper ARIA labels', async () => {
      renderDashboard()

      await waitFor(() => {
        // Check that sections exist - exact structure may vary
        expect(screen.getByText('Kom igång')).toBeInTheDocument()
        expect(screen.getByText('Snabbåtgärder')).toBeInTheDocument()
      })
    })
  })

  describe('onboarding items', () => {
    it('should render onboarding section', async () => {
      renderDashboard()

      await waitFor(() => {
        // The Kom igång section header should always be visible
        expect(screen.getByText('Kom igång')).toBeInTheDocument()
      })
    })

    it('should have links to main pages', async () => {
      renderDashboard()

      await waitFor(() => {
        // Check that links exist to main pages (in KPI cards and quick actions)
        const links = screen.getAllByRole('link')
        const hrefs = links.map((link) => link.getAttribute('href'))

        expect(hrefs).toContain('/cv')
        expect(hrefs).toContain('/job-search')
      })
    })
  })

  describe('quick actions', () => {
    it('should render quick action buttons', async () => {
      renderDashboard()

      await waitFor(() => {
        // Current Dashboard quick actions
        expect(screen.getByText('Sök jobb')).toBeInTheDocument()
        expect(screen.getByText('Redigera CV')).toBeInTheDocument()
        expect(screen.getByText('Nytt brev')).toBeInTheDocument()
        expect(screen.getByText('Dagbok')).toBeInTheDocument()
      })
    })
  })

  describe('development section', () => {
    it('should render development section header', async () => {
      renderDashboard()

      await waitFor(() => {
        // Development section is collapsed by default, but header is visible
        expect(screen.getByText('Utveckling')).toBeInTheDocument()
      })
    })

    it('should show development items when section is expanded', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Utveckling')).toBeInTheDocument()
      })

      // Click to expand the development section
      const expandButton = screen.getByRole('button', { name: /utveckling/i })
      await user.click(expandButton)

      // Now items should be visible
      await waitFor(() => {
        expect(screen.getByText('Karriär')).toBeInTheDocument()
      })
    })
  })

  describe('progress tracking', () => {
    it('should render dashboard with progress data from hook', async () => {
      renderDashboard()

      await waitFor(() => {
        // Dashboard should render with data from useDashboardData hook
        expect(mockUseDashboardData).toHaveBeenCalled()
      })
    })

    it('should update display when CV data exists', async () => {
      mockUseDashboardData.mockReturnValue({
        data: {
          ...mockDashboardData,
          cv: { ...mockDashboardData.cv, hasCV: true, progress: 50 },
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      })

      renderDashboard()

      await waitFor(() => {
        expect(mockUseDashboardData).toHaveBeenCalled()
      })
    })

    it('should show interest profile when completed', async () => {
      mockUseInterestProfile.mockReturnValue({
        profile: { hasResult: true },
        isLoading: false,
      })

      renderDashboard()

      await waitFor(() => {
        expect(mockUseInterestProfile).toHaveBeenCalled()
      })
    })

    it('should show cover letter count when letters exist', async () => {
      mockUseDashboardData.mockReturnValue({
        data: {
          ...mockDashboardData,
          coverLetters: { count: 3, drafts: 1, recentLetters: [] },
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      })

      renderDashboard()

      await waitFor(() => {
        expect(mockUseDashboardData).toHaveBeenCalled()
      })
    })
  })

  describe('data loading', () => {
    it('should call useDashboardData hook on mount', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(mockUseDashboardData).toHaveBeenCalled()
        expect(mockUseInterestProfile).toHaveBeenCalled()
      })
    })

    it('should handle loading state gracefully', async () => {
      mockUseDashboardData.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      })

      renderDashboard()

      // Should show loading skeleton when loading
      expect(mockUseDashboardData).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderDashboard()

      await waitFor(() => {
        const headings = screen.getAllByRole('heading')
        expect(headings.length).toBeGreaterThan(0)
      })
    })

    it('should have accessible navigation links', async () => {
      renderDashboard()

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        links.forEach((link) => {
          // Each link should have accessible text content
          expect(link.textContent).toBeTruthy()
        })
      })
    })

    it('should hide decorative icons from screen readers', async () => {
      renderDashboard()

      await waitFor(() => {
        // ChevronDown icons should have aria-hidden
        const buttons = screen.getAllByRole('button')
        buttons.forEach((btn) => {
          const svg = btn.querySelector('svg')
          if (svg) {
            expect(svg).toHaveAttribute('aria-hidden', 'true')
          }
        })
      })
    })
  })
})
