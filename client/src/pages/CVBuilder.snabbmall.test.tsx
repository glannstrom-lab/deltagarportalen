/**
 * EG6/EG7/EG8/SV8 (rollspel 2026-09-28): exempeldata-knappen, Snabb-CV-påminnelsen och CV-turen.
 * Mockarna är kopierade ur CVBuilder.mallsteg.test.tsx.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { ConfirmDialogProvider } from '@/components/ui'

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

import CVBuilder from './CVBuilder'
import { cvApi } from '@/services/supabaseApi'
import { generateQuickSummary, generateQuickSkills } from '@/components/cv/quickCvTexter'

const mockGetCV = (cvApi as unknown as { getCV: ReturnType<typeof vi.fn> }).getCV

function renderBuilder() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ConfirmDialogProvider>
            <CVBuilder />
          </ConfirmDialogProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

function cv(over: Record<string, unknown> = {}) {
  return {
    id: 'cv1', firstName: 'Bengt', lastName: 'Lager', title: 'Lagerarbetare', email: '',
    phone: '', location: '', summary: '', workExperience: [], education: [],
    skills: [], template: 'minimal', ...over,
  }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem('jobin_cookie_consent', 'true')
})

describe('EG6: exempeldata-knappen kan inte läsas som en etikett', () => {
  it('heter "Fyll i med exempeldata" och det finns ingen knapp som bara heter "Exempeldata"', async () => {
    mockGetCV.mockResolvedValueOnce(cv())
    renderBuilder()
    expect(await screen.findByRole('button', { name: 'Fyll i med exempeldata' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Exempeldata$/ })).toBeNull()
  })
})

describe('EG8: påminnelse när profil/kompetenser är Snabb-CV-mallens egen text', () => {
  it('visas när profiltexten är mallens oredigerade text', async () => {
    mockGetCV.mockResolvedValueOnce(cv({ summary: generateQuickSummary('Lagerarbetare') }))
    renderBuilder()
    expect(await screen.findByTestId('snabbmall-paminnelse')).toHaveTextContent(/Läs igenom innan du exporterar/)
  })

  it('visas när kompetenserna är mallens oredigerade lista', async () => {
    mockGetCV.mockResolvedValueOnce(cv({ skills: generateQuickSkills('Lagerarbetare') }))
    renderBuilder()
    expect(await screen.findByTestId('snabbmall-paminnelse')).toBeInTheDocument()
  })

  it('visas inte när användaren skrivit egen text', async () => {
    mockGetCV.mockResolvedValueOnce(cv({
      summary: 'Jag har jobbat på lager i tio år.',
      skills: [{ id: 'x', name: 'Ståplockare', level: 4, category: 'technical' }],
    }))
    renderBuilder()
    await screen.findByRole('button', { name: 'Fyll i med exempeldata' })
    expect(screen.queryByTestId('snabbmall-paminnelse')).toBeNull()
  })
})

describe('SV8/EG4: CV-turen', () => {
  it('startar inte medan Snabb-CV-flödet är aktivt', async () => {
    mockGetCV.mockResolvedValueOnce(null)
    renderBuilder()
    await screen.findByText(/Snabb-CV/)
    await new Promise(r => setTimeout(r, 800))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('startar för en användare som inte avfärdat den', async () => {
    mockGetCV.mockResolvedValueOnce(cv())
    renderBuilder()
    expect(await screen.findByRole('dialog', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('startar inte när DEN HÄR användaren avfärdat den (per-användare-nyckel)', async () => {
    localStorage.setItem('jobin_tur_avfardad_cv_user1', '1')
    mockGetCV.mockResolvedValueOnce(cv())
    renderBuilder()
    await screen.findByRole('button', { name: 'Fyll i med exempeldata' })
    await new Promise(r => setTimeout(r, 800))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('startar inte ovanpå Snabb-CV-toasten när Snabb-CV skapats, och minns avfärdandet per användare', async () => {
    mockGetCV.mockResolvedValueOnce(null)
    renderBuilder()
    await screen.findByText(/Snabb-CV/)
    // Låt tur-timern (500 ms) hinna gå medan Snabb-CV-flödet visas.
    await new Promise(r => setTimeout(r, 800))
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Ditt namn'), 'Bengt Lager{Enter}')
    await user.type(await screen.findByPlaceholderText(/t\.ex\. Projektledare/), 'Lagerarbetare{Enter}')
    await user.type(await screen.findByPlaceholderText('din.email@exempel.se'), 'bengt@example.com{Enter}')
    await screen.findByRole('button', { name: 'Fyll i med exempeldata' }, { timeout: 5000 })
    await new Promise(r => setTimeout(r, 300))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(localStorage.getItem('jobin_tur_avfardad_cv_user1')).toBe('1')
  }, 15000)})




