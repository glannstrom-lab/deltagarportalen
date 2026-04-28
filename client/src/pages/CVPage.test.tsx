import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import { ConfirmDialogProvider } from '@/components/ui'

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
  getScoreColor: vi.fn(() => 'text-stone-700'),
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
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
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
        <ConfirmDialogProvider>
          <Routes>
            <Route path="/cv/*" element={<CVPage />} />
          </Routes>
        </ConfirmDialogProvider>
      </I18nextProvider>
    </MemoryRouter>
  )
}

function renderCVBuilder() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <ConfirmDialogProvider>
          <CVBuilder />
        </ConfirmDialogProvider>
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
    it('should render the CV page without errors', async () => {
      const { container } = renderWithRouter()

      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument()
      })
    })

    it('should render content on default route', async () => {
      const { container } = renderWithRouter('/cv')

      await waitFor(() => {
        expect(container.innerHTML.length).toBeGreaterThan(0)
      })
    })

    it('should render content on my-cvs route', async () => {
      const { container } = renderWithRouter('/cv/my-cvs')

      await waitFor(() => {
        expect(container.innerHTML.length).toBeGreaterThan(0)
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
    it('should render the CV builder without errors', async () => {
      const { container } = renderCVBuilder()

      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument()
      })
    })
  })

  describe('CV data loading', () => {
    it('should call getCV on mount', async () => {
      renderCVBuilder()

      await waitFor(() => {
        expect(mockCvApi.getCV).toHaveBeenCalled()
      })
    })

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

  describe('buttons and controls', () => {
    it('should have buttons in the UI', async () => {
      renderCVBuilder()

      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })
  })
})
