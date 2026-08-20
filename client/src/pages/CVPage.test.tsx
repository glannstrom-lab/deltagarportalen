import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { ConfirmDialogProvider } from '@/components/ui'

// Mock cvApi
vi.mock('@/services/api', () => ({
  cvApi: {
    getCV: vi.fn(() => Promise.resolve(null)),
    updateCV: vi.fn(() => Promise.resolve({})),
    getVersions: vi.fn(() => Promise.resolve([])),
    saveVersion: vi.fn(() => Promise.resolve({})),
  },
}))

// Mock supabaseApi
vi.mock('@/services/supabaseApi', () => ({
  cvApi: {
    getCV: vi.fn(() => Promise.resolve(null)),
    updateCV: vi.fn(() => Promise.resolve({})),
    getVersions: vi.fn(() => Promise.resolve([])),
    getATSAnalysis: vi.fn(() => Promise.resolve({ score: 0, feedback: [] })),
    saveVersion: vi.fn(() => Promise.resolve({})),
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
    // `order` och `limit` tillagda 2026-07-27: MyCVs → cvApi.getVersions kedjar
    // .select().eq().order(), och en mock utan `order` kastade
    // "order is not a function" EFTER att testet redan gått klart. Det blev en
    // ohanterad rejection som ibland — men inte alltid — gav sviten exit 1.
    // En grind som failar slumpvis är värre än ingen grind.
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
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
// B24: shapen måste matcha den riktiga hooken (hasUnsavedChanges/triggerSave/
// hasRemoteChanges) — CVBuilder.tsx anropar `triggerSaveRef.current(data)`
// när `data` ändras efter första laddningen, och ett odefinierat triggerSave
// kastar "not a function" så fort ett test faktiskt ändrar CV-data (t.ex.
// exempeldata-testerna nedan). Den gamla mocken (save/isSaving/lastSaved)
// matchade ett annat hook-kontrakt och gömde det tills nu.
vi.mock('@/hooks/useCVAutoSave', () => ({
  useCVAutoSave: vi.fn(() => ({
    saveStatus: 'idle',
    lastSavedAt: null,
    hasUnsavedChanges: false,
    triggerSave: vi.fn(),
    pendingCount: 0,
    isOnline: true,
    hasRemoteChanges: false,
  })),
  // CB1 (2026-08-21): mocken speglade en hook som inte finns. Den returnerade
  // `draft`, `saveDraft` och `hasDraft`; den riktiga `useCVDraft` returnerar
  // `{ restoreDraft, clearDraft }` och har gjort det hela tiden. Så länge
  // ingen anropade hooken spelade det ingen roll — mocken kunde ljuga fritt.
  // Första gången `CVBuilder` faktiskt använde `restoreDraft()` fällde två
  // tester med "restoreDraft is not a function".
  //
  // Samma familj som lärdomen 2026-08-04 om localStorage-mocken utan backing
  // store: en mock som inte speglar sin källa bevisar ingenting, den döljer.
  // Formen nedan är kopierad ur `useCVAutoSave.ts:324`.
  useCVDraft: vi.fn(() => ({
    restoreDraft: vi.fn(() => null),
    clearDraft: vi.fn(),
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
import { cvApi } from '@/services/supabaseApi'

const mockCvApi = cvApi as {
  getCV: ReturnType<typeof vi.fn>
  updateCV: ReturnType<typeof vi.fn>
  getVersions: ReturnType<typeof vi.fn>
  saveVersion: ReturnType<typeof vi.fn>
}

// CV-sidan ligger i appen alltid inuti QueryClientProvider (main.tsx).
// Harnessen saknade den, vilket inte märktes förrän CVBuilder började
// invalidera den delade nyckeln ['cv-versions'] efter en sparning — en
// saknad provider i testet är inte samma sak som ett fel i komponenten.
// `retry: false` så ett misslyckat anrop inte drar ut på testet.
function medProviders(barn: React.ReactNode, initialRoute?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <MemoryRouter initialEntries={initialRoute ? [initialRoute] : undefined}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ConfirmDialogProvider>
            {barn}
          </ConfirmDialogProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

function renderWithRouter(initialRoute = '/cv') {
  return render(
    medProviders(
      <Routes>
        <Route path="/cv/*" element={<CVPage />} />
      </Routes>,
      initialRoute
    )
  )
}

function renderCVBuilder() {
  return render(medProviders(<CVBuilder />))
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

  // B24: "Exempeldata" skrev tidigare över deltagarens RIKTIGA CV utan
  // varning eller ångra, autosparat mot molnet — den texten hamnade sedan i
  // ett skarpt AI-brev (B21). loadDemoData() ska nu bara fylla tomma fält
  // och alltid säkerhetskopiera det befintliga CV:t först.
  describe('Exempeldata skriver inte över ifyllda fält (B24)', () => {
    const filledCV = {
      id: 'cv1',
      firstName: 'Erik',
      lastName: 'Svensson',
      title: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      // Prod-formen: cvs.skills är objekt, inte strängar (lärdomen 2026-08-03).
      skills: [{ id: 's1', name: 'Excel', level: 3, category: 'technical' }],
      workExperience: [],
      education: [],
      template: 'sidebar',
    }

    it('rör aldrig ett fält som redan har innehåll, fyller bara tomma fält', async () => {
      mockCvApi.getCV.mockResolvedValue(filledCV)
      mockCvApi.getVersions.mockResolvedValue([])

      renderCVBuilder()

      const demoButton = await screen.findByRole('button', { name: /Exempeldata/i })
      fireEvent.click(demoButton)

      // Bekräftelsedialogen är riktig (ConfirmDialogProvider, ej mockad).
      const confirmButton = await screen.findByRole('button', { name: 'Fyll i' })
      fireEvent.click(confirmButton)

      // Navigera till "Om dig" (steg 2) för att se de ifyllda fälten.
      const step2Button = await screen.findByRole('button', { name: 'Gå till steg 2: Om dig' })
      fireEvent.click(step2Button)

      // Redan ifyllt innehåll ska INTE bytas ut mot exempeldata.
      await waitFor(() => {
        expect(screen.getByDisplayValue('Erik')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Svensson')).toBeInTheDocument()
      })
      expect(screen.queryByDisplayValue('Anna')).not.toBeInTheDocument()
      expect(screen.queryByDisplayValue('Andersson')).not.toBeInTheDocument()

      // Tomma fält (t.ex. e-post) ska fyllas i med exempeldata.
      expect(screen.getByDisplayValue('anna@example.com')).toBeInTheDocument()
    })

    it('sparar en säkerhetskopia av det riktiga CV:t innan exempeldata läggs till', async () => {
      mockCvApi.getCV.mockResolvedValue(filledCV)
      mockCvApi.getVersions.mockResolvedValue([])

      renderCVBuilder()

      const demoButton = await screen.findByRole('button', { name: /Exempeldata/i })
      fireEvent.click(demoButton)
      const confirmButton = await screen.findByRole('button', { name: 'Fyll i' })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockCvApi.saveVersion).toHaveBeenCalledTimes(1)
      })
      // Säkerhetskopian ska innehålla det RIKTIGA innehållet, inte demo-datan.
      const [, backedUpData] = mockCvApi.saveVersion.mock.calls[0]
      expect(backedUpData.firstName).toBe('Erik')
    })
  })
})
