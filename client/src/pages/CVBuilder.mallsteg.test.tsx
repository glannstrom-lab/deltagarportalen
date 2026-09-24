/**
 * LS3 (2026-09-24): CV-byggarens mallsteg visar fem rekommenderade mallar
 * direkt och resten bakom "Visa fler mallar". Tolv kort samtidigt bröt mot
 * DESIGN.md ("hellre 5 saker väl än 15 saker tätt").
 *
 * Mockarna är kopierade ur CVPage.test.tsx, som renderar samma komponent.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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
import { REKOMMENDERADE_MALLAR, MALLFORMER } from '@/data/cvMallar'

const mockGetCV = (cvApi as unknown as { getCV: ReturnType<typeof vi.fn> }).getCV

function cvMedMall(template: string) {
  return {
    id: 'cv1', firstName: 'Erik', lastName: 'Svensson', title: '', email: '',
    phone: '', location: '', summary: '', workExperience: [], education: [],
    skills: [{ id: 's1', name: 'Excel', level: 3, category: 'technical' }],
    template,
  }
}

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

/** Mallkorten i galleriet — ett kort = en bild med mallens förhandsvisning. */
async function mallkort() {
  const galleri = await waitForGalleri()
  return within(galleri).getAllByRole('img', { name: /Förhandsvisning av mallen/ })
}

async function waitForGalleri() {
  const knapp = await screen.findByRole('button', { name: /Visa (fler|färre) mallar/ })
  const id = knapp.getAttribute('aria-controls')
  expect(id).toBeTruthy()
  const galleri = document.getElementById(id!)
  expect(galleri).not.toBeNull()
  return galleri as HTMLElement
}

describe('LS3: mallsteget visar ett urval och fäller ut resten', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('visar bara de rekommenderade från början, med en knapp som säger att det finns fler', async () => {
    mockGetCV.mockResolvedValue(cvMedMall('sidebar'))
    renderBuilder()

    const knapp = await screen.findByRole('button', { name: /Visa fler mallar/ })
    expect(knapp).toHaveAttribute('aria-expanded', 'false')
    expect(await mallkort()).toHaveLength(REKOMMENDERADE_MALLAR.length)
  })

  it('knappen fäller ut alla tolv och sätter aria-expanded', async () => {
    const user = userEvent.setup()
    mockGetCV.mockResolvedValue(cvMedMall('sidebar'))
    renderBuilder()

    await user.click(await screen.findByRole('button', { name: /Visa fler mallar/ }))
    const knapp = screen.getByRole('button', { name: /Visa färre mallar/ })
    expect(knapp).toHaveAttribute('aria-expanded', 'true')
    expect(await mallkort()).toHaveLength(MALLFORMER.length)
  })

  it('en vald mall utanför urvalet syns utan att man fäller ut', async () => {
    mockGetCV.mockResolvedValue(cvMedMall('berlin'))
    renderBuilder()

    // Vänta tills det sparade CV:t är inläst och Berlin är vald.
    await screen.findByText(/Berlin är vald/)
    const kort = await mallkort()
    expect(kort).toHaveLength(REKOMMENDERADE_MALLAR.length + 1)
    expect(kort.some((img) => /Berlin/.test(img.getAttribute('alt') ?? ''))).toBe(true)
  })
})
