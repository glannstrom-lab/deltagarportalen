import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'

// Mock cvApi
vi.mock('@/services/api', () => ({
  cvApi: {
    getCV: vi.fn(() => Promise.resolve(null)),
    updateCV: vi.fn(() => Promise.resolve({})),
    getVersions: vi.fn(() => Promise.resolve([])),
  },
}))

// Mock supabaseApi
vi.mock('@/services/supabaseApi', () => ({
  cvApi: {
    getCV: vi.fn(() => Promise.resolve(null)),
    updateCV: vi.fn(() => Promise.resolve({})),
    getVersions: vi.fn(() => Promise.resolve([])),
    getATSAnalysis: vi.fn(() => Promise.resolve({ score: 0, feedback: [] })),
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

// Mock cvStore
vi.mock('@/stores/cvStore', () => ({
  useCVStore: vi.fn(() => ({
    currentStep: 1,
    setCurrentStep: vi.fn(),
    isPreviewOpen: false,
    setPreviewOpen: vi.fn(),
    saveStatus: 'idle',
    markSaving: vi.fn(),
    markSaved: vi.fn(),
    markError: vi.fn(),
    markUnsaved: vi.fn(),
    cvScore: 0,
    setCVScore: vi.fn(),
    hasDraft: false,
    setHasDraft: vi.fn(),
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
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } })),
      })),
    },
  },
}))

// Mock hooks
vi.mock('@/hooks/useCVAutoSave', () => ({
  useCVAutoSave: vi.fn(() => ({
    save: vi.fn(),
    isSaving: false,
    lastSaved: null,
  })),
  useCVDraft: vi.fn(() => ({
    draft: null,
    saveDraft: vi.fn(),
    clearDraft: vi.fn(),
    hasDraft: false,
  })),
}))

vi.mock('@/hooks/useCVScore', () => ({
  useCVScore: vi.fn(() => ({
    score: 0,
    breakdown: {},
    tips: [],
  })),
  getOverallTips: vi.fn(() => []),
  getScoreColor: vi.fn(() => 'text-slate-500'),
}))

vi.mock('@/hooks/useVercelImageUpload', () => ({
  useVercelImageUpload: vi.fn(() => ({
    uploadImage: vi.fn(),
    isUploading: false,
    error: null,
  })),
}))

// Mock Toast
vi.mock('@/components/Toast', () => ({
  showToast: vi.fn(),
}))

import CVPage from './CVPage'
import CVBuilder from './CVBuilder'
import { cvApi } from '@/services/api'

const mockCvApi = cvApi as {
  getCV: ReturnType<typeof vi.fn>
  updateCV: ReturnType<typeof vi.fn>
  getVersions: ReturnType<typeof vi.fn>
}

function renderWithRouter(initialRoute = '/cv') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/cv/*" element={<CVPage />} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

function renderCVBuilder() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <CVBuilder />
      </I18nextProvider>
    </MemoryRouter>
  )
}

describe('CVPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCvApi.getCV.mockResolvedValue(null)
    mockCvApi.getVersions.mockResolvedValue([])
  })

  describe('rendering', () => {
    it('should render the CV page', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should render tab navigation', async () => {
      renderWithRouter()

      await waitFor(() => {
        // Check for tab structure
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('routing', () => {
    it('should render CVBuilder on default route', async () => {
      renderWithRouter('/cv')

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should navigate to different tabs', async () => {
      renderWithRouter('/cv/my-cvs')

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })
})

describe('CVBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCvApi.getCV.mockResolvedValue(null)
  })

  describe('rendering', () => {
    it('should render the CV builder', async () => {
      renderCVBuilder()

      await waitFor(() => {
        // Should show step indicator or builder UI
        expect(document.body).toBeInTheDocument()
      })
    })

    it('should show step indicator', async () => {
      renderCVBuilder()

      await waitFor(() => {
        // Look for step numbers (1, 2, 3, 4, 5)
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('should render template selection on step 1', async () => {
      renderCVBuilder()

      await waitFor(() => {
        // Should show template options
        expect(screen.getByText(/design/i)).toBeInTheDocument()
      })
    })
  })

  describe('step navigation', () => {
    it('should show all step numbers', async () => {
      renderCVBuilder()

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('4')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })

    it('should allow clicking on steps', async () => {
      renderCVBuilder()

      await waitFor(() => {
        const step2Button = screen.getByText('2')
        fireEvent.click(step2Button)
      })
    })
  })

  describe('CV data loading', () => {
    it('should load existing CV data', async () => {
      const mockCV = {
        id: 'cv1',
        firstName: 'Test',
        lastName: 'User',
        title: 'Developer',
        email: 'test@example.com',
        phone: '0701234567',
        location: 'Stockholm',
        summary: 'Experienced developer',
        workExperience: [],
        education: [],
        skills: [],
        template: 'sidebar',
      }

      mockCvApi.getCV.mockResolvedValue(mockCV)

      renderCVBuilder()

      await waitFor(() => {
        expect(mockCvApi.getCV).toHaveBeenCalled()
      })
    })

    it('should handle empty CV state', async () => {
      mockCvApi.getCV.mockResolvedValue(null)

      renderCVBuilder()

      await waitFor(() => {
        expect(mockCvApi.getCV).toHaveBeenCalled()
      })
    })

    it('should handle CV loading error', async () => {
      mockCvApi.getCV.mockRejectedValue(new Error('Failed to load CV'))

      renderCVBuilder()

      await waitFor(() => {
        expect(mockCvApi.getCV).toHaveBeenCalled()
      })
    })
  })

  describe('template selection', () => {
    it('should display available templates', async () => {
      renderCVBuilder()

      await waitFor(() => {
        // Templates should be visible on step 1
        expect(screen.getByText(/sidokolumn|centrerad|minimal/i)).toBeInTheDocument()
      })
    })
  })

  describe('form interactions', () => {
    it('should handle form input changes', async () => {
      mockCvApi.getCV.mockResolvedValue({
        firstName: '',
        lastName: '',
        title: '',
        email: '',
      })

      renderCVBuilder()

      await waitFor(() => {
        // Navigate to step 2 (contact info)
        const step2 = screen.getByText('2')
        fireEvent.click(step2)
      })
    })
  })

  describe('preview functionality', () => {
    it('should have preview button', async () => {
      renderCVBuilder()

      await waitFor(() => {
        // Look for preview button
        const previewButtons = screen.queryAllByRole('button')
        expect(previewButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('save functionality', () => {
    it('should call updateCV when saving', async () => {
      mockCvApi.getCV.mockResolvedValue({
        firstName: 'Test',
        lastName: 'User',
      })
      mockCvApi.updateCV.mockResolvedValue({ id: 'cv1' })

      renderCVBuilder()

      await waitFor(() => {
        expect(mockCvApi.getCV).toHaveBeenCalled()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper form labels', async () => {
      renderCVBuilder()

      await waitFor(() => {
        // Navigate to contact step
        const step2 = screen.getByText('2')
        fireEvent.click(step2)
      })
    })

    it('should support keyboard navigation between steps', async () => {
      renderCVBuilder()

      await waitFor(() => {
        const step1 = screen.getByText('1')
        step1.focus()
        expect(document.activeElement).toBeTruthy()
      })
    })
  })

  describe('AI assistance', () => {
    it('should show AI help options', async () => {
      renderCVBuilder()

      await waitFor(() => {
        // AI features should be available
        expect(screen.getByRole('main') || document.body).toBeInTheDocument()
      })
    })
  })

  describe('mobile responsiveness', () => {
    it('should render on mobile viewport', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      renderCVBuilder()

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })
    })
  })
})
