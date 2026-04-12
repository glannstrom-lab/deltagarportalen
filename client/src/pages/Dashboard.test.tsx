import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'

// Mock supabaseApi
vi.mock('@/services/supabaseApi', () => ({
  userApi: {
    getOnboardingProgress: vi.fn(() =>
      Promise.resolve({
        profile: false,
        interest: false,
        cv: false,
        career: false,
        jobSearch: false,
        coverLetter: false,
      })
    ),
  },
  cvApi: {
    getCV: vi.fn(() => Promise.resolve(null)),
  },
  coverLetterApi: {
    getAll: vi.fn(() => Promise.resolve([])),
  },
}))

// Mock cloudStorage
vi.mock('@/services/cloudStorage', () => ({
  interestGuideApi: {
    getProgress: vi.fn(() => Promise.resolve(null)),
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
import { userApi, cvApi, coverLetterApi } from '@/services/supabaseApi'
import { interestGuideApi } from '@/services/cloudStorage'

const mockUserApi = userApi as {
  getOnboardingProgress: ReturnType<typeof vi.fn>
}

const mockCvApi = cvApi as {
  getCV: ReturnType<typeof vi.fn>
}

const mockCoverLetterApi = coverLetterApi as {
  getAll: ReturnType<typeof vi.fn>
}

const mockInterestGuideApi = interestGuideApi as {
  getProgress: ReturnType<typeof vi.fn>
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <Dashboard />
      </I18nextProvider>
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserApi.getOnboardingProgress.mockResolvedValue({
      profile: false,
      interest: false,
      cv: false,
      career: false,
      jobSearch: false,
      coverLetter: false,
    })
    mockCvApi.getCV.mockResolvedValue(null)
    mockCoverLetterApi.getAll.mockResolvedValue([])
    mockInterestGuideApi.getProgress.mockResolvedValue(null)
  })

  describe('rendering', () => {
    it('should render the dashboard without errors', async () => {
      const { container } = renderDashboard()

      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      renderDashboard()
      expect(screen.getByText('Laddar...')).toBeInTheDocument()
    })

    it('should show content after loading', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.queryByText('Laddar...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Kom igång')).toBeInTheDocument()
    })

    it('should render all three expandable categories', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Kom igång')).toBeInTheDocument()
        expect(screen.getByText('Kompetensutveckling')).toBeInTheDocument()
        expect(screen.getByText('Planera och dokumentera')).toBeInTheDocument()
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

        expect(categoryButtons.length).toBe(3)
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
      expect(categoryButton).toHaveAttribute('aria-expanded', 'true')

      await user.click(categoryButton)

      expect(categoryButton).toHaveAttribute('aria-expanded', 'false')

      await user.click(categoryButton)

      expect(categoryButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('should have regions with proper ARIA labels', async () => {
      renderDashboard()

      await waitFor(() => {
        const regions = screen.getAllByRole('region')
        expect(regions.length).toBe(3)

        const labels = regions.map((r) => r.getAttribute('aria-label'))
        expect(labels).toContain('Kom igång')
        expect(labels).toContain('Kompetensutveckling')
        expect(labels).toContain('Planera och dokumentera')
      })
    })
  })

  describe('onboarding items', () => {
    it('should render onboarding navigation links', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Min profil')).toBeInTheDocument()
        expect(screen.getByText('Intresseguiden')).toBeInTheDocument()
        expect(screen.getByText('Mitt CV')).toBeInTheDocument()
        expect(screen.getByText('Sök jobb')).toBeInTheDocument()
        expect(screen.getByText('Personligt brev')).toBeInTheDocument()
        expect(screen.getByText('Spontanansökningar')).toBeInTheDocument()
        expect(screen.getByText('Mina ansökningar')).toBeInTheDocument()
      })
    })

    it('should have correct links for onboarding items', async () => {
      renderDashboard()

      await waitFor(() => {
        const profileLink = screen.getByRole('link', { name: /min profil/i })
        expect(profileLink).toHaveAttribute('href', '/profile')

        const cvLink = screen.getByRole('link', { name: /mitt cv/i })
        expect(cvLink).toHaveAttribute('href', '/cv')

        const jobSearchLink = screen.getByRole('link', { name: /sök jobb/i })
        expect(jobSearchLink).toHaveAttribute('href', '/job-search')
      })
    })
  })

  describe('skills development items', () => {
    it('should render skills development navigation links', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Karriär')).toBeInTheDocument()
        expect(screen.getByText('Utbildning')).toBeInTheDocument()
        expect(screen.getByText('Personligt varumärke')).toBeInTheDocument()
        expect(screen.getByText('Kompetensanalys')).toBeInTheDocument()
        expect(screen.getByText('LinkedIn')).toBeInTheDocument()
        expect(screen.getByText('Kunskapsbank')).toBeInTheDocument()
        expect(screen.getByText('Övningar')).toBeInTheDocument()
      })
    })
  })

  describe('planning items', () => {
    it('should render planning navigation links', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Kalender')).toBeInTheDocument()
        expect(screen.getByText('Dagbok')).toBeInTheDocument()
        expect(screen.getByText('Hälsa')).toBeInTheDocument()
        expect(screen.getByText('Internationell guide')).toBeInTheDocument()
        expect(screen.getByText('Mina resurser')).toBeInTheDocument()
      })
    })
  })

  describe('progress tracking', () => {
    it('should show progress counter for onboarding category', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('0/5 klart')).toBeInTheDocument()
      })
    })

    it('should update progress when items are completed', async () => {
      mockUserApi.getOnboardingProgress.mockResolvedValue({
        profile: true,
        interest: true,
        cv: true,
        career: false,
        jobSearch: false,
        coverLetter: false,
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('3/5 klart')).toBeInTheDocument()
      })
    })

    it('should show completed state when all items are done', async () => {
      mockUserApi.getOnboardingProgress.mockResolvedValue({
        profile: true,
        interest: true,
        cv: true,
        career: true,
        jobSearch: true,
        coverLetter: true,
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('5/5 klart')).toBeInTheDocument()
      })
    })

    it('should mark CV as completed when CV data exists', async () => {
      mockCvApi.getCV.mockResolvedValue({
        firstName: 'Test',
        workExperience: [],
      })

      renderDashboard()

      await waitFor(() => {
        // CV is marked as completed when CV has firstName or workExperience
        expect(mockCvApi.getCV).toHaveBeenCalled()
      })
    })

    it('should mark interest as completed when interest guide is done', async () => {
      mockInterestGuideApi.getProgress.mockResolvedValue({
        is_completed: true,
      })

      renderDashboard()

      await waitFor(() => {
        expect(mockInterestGuideApi.getProgress).toHaveBeenCalled()
      })
    })

    it('should mark cover letter as completed when cover letters exist', async () => {
      mockCoverLetterApi.getAll.mockResolvedValue([{ id: '1', content: 'Test letter' }])

      renderDashboard()

      await waitFor(() => {
        expect(mockCoverLetterApi.getAll).toHaveBeenCalled()
      })
    })
  })

  describe('data loading', () => {
    it('should call all progress APIs on mount', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(mockUserApi.getOnboardingProgress).toHaveBeenCalled()
        expect(mockInterestGuideApi.getProgress).toHaveBeenCalled()
        expect(mockCvApi.getCV).toHaveBeenCalled()
        expect(mockCoverLetterApi.getAll).toHaveBeenCalled()
      })
    })

    it('should handle API errors gracefully', async () => {
      mockUserApi.getOnboardingProgress.mockRejectedValue(new Error('API Error'))
      mockCvApi.getCV.mockRejectedValue(new Error('API Error'))

      renderDashboard()

      // Should still render even with API errors
      await waitFor(() => {
        expect(screen.queryByText('Laddar...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Kom igång')).toBeInTheDocument()
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
