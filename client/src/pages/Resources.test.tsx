/**
 * Vakter för `/resources`.
 *
 * Ersätter `Resources.savedJobsCount.test.tsx` (B32-vakten, 2026-08-12), vars
 * tre tester ligger kvar oförändrade i första describe-blocket nedan. Skälet
 * att slå ihop: den gamla filens `PageLayout`-mock **kastade `sidoflikar`**, så
 * hela flikmekaniken var oskyddad. Ett mutationsstickprov 2026-08-22 visade
 * det: att låta `?tab=jobs` rendera dokumentfliken gick grönt genom 2 371
 * tester. Mocken här renderar flikarna som knappar i stället.
 *
 * Fyra av sju mutationer överlevde den gamla uppsättningen. De som saknade
 * vakt helt — och som nu har en — var:
 *
 *   · statusetiketten renderad som rå i18n-nyckel (`resources.status.saved`)
 *   · `?tab=` som inte styr vilken sektion som visas
 *   · en datakälla som kastar
 *   · papperskorgen på ett bokmärke
 *
 * Fixturen använder rå radform, exakt som `toSavedJobRow` (jobsApi.ts)
 * levererar den: VERSALA statusvärden ur hela `ApplicationStatus`-enumen, inte
 * bara de fem som den gamla `SavedJob`-typen råkade deklarera.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const getAllMock = vi.fn()
const getBookmarksMock = vi.fn()
const removeBookmarkMock = vi.fn()
const getVersionsMock = vi.fn()
const getLettersMock = vi.fn()
const getInterestMock = vi.fn()
const confirmMock = vi.fn()

vi.mock('@/services/jobsApi', () => ({
  savedJobsApi: {
    getAll: () => getAllMock(),
    delete: vi.fn(async () => undefined),
  },
}))

vi.mock('@/services/cloudStorage', () => ({
  articleBookmarksApi: {
    getBookmarks: () => getBookmarksMock(),
    remove: (id: string) => removeBookmarkMock(id),
  },
}))

vi.mock('@/services/cvApi', () => ({
  cvApi: {
    getCV: async () => null,
    getVersions: () => getVersionsMock(),
  },
}))

vi.mock('@/services/coverLetterApi', () => ({
  coverLetterApi: { getAll: () => getLettersMock() },
}))

vi.mock('@/services/interestApi', () => ({
  interestApi: { getResult: () => getInterestMock() },
}))

vi.mock('@/components/FocusModeProvider', () => ({
  useFocusMode: () => ({ isFocusMode: false, leaveWizard: vi.fn() }),
}))

vi.mock('@/components/ui/ConfirmDialog', () => ({
  useConfirmDialog: () => ({ confirm: confirmMock }),
}))

vi.mock('@/components/Toast', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/stores/profileStore', () => {
  const store = () => ({ profile: null, loadProfile: vi.fn(async () => undefined) })
  store.getState = () => ({ profile: null })
  return { useProfileStore: (sel: (s: unknown) => unknown) => sel(store()) }
})

vi.mock('@/services/cvWordExport', () => ({ generateCVWord: vi.fn(async () => undefined) }))
vi.mock('@/services/coverLetterWordExport', () => ({
  generateCoverLetterWord: vi.fn(async () => undefined),
}))
vi.mock('@/services/pdfExportService', () => ({
  generateCoverLetterPDF: vi.fn(async () => new Blob()),
  downloadPDF: vi.fn(),
}))

vi.mock('@/components/radgivare/RadgivarPanel', () => ({ RadgivarTips: () => null }))

/**
 * Mocken renderar `stats` OCH `sidoflikar`.
 *
 * 2026-08-17 flyttade nyckeltalen från ett kort i sidans innehåll till
 * PageLayouts `stats`-prop (hjälten ersattes av en sidoskena), och flikarna
 * flyttade till `sidoflikar`. Kastar mocken propen mäter testet inte längre
 * det den vaktar — och en hel funktion (flikbytet) står oskyddad utan att
 * någon märker det.
 */
vi.mock('@/components/layout/index', () => ({
  PageLayout: ({
    children,
    stats,
    sidoflikar,
  }: {
    children?: React.ReactNode
    stats?: Array<{ label: string; value: string | number }>
    sidoflikar?: {
      poster: Array<{ id: string; etikett: string }>
      aktiv: string
      vidVal: (id: string) => void
    }
  }) => (
    <div>
      {stats?.map((st) => (
        <div key={st.label} data-testid={`stat-${st.label}`}>
          {st.value}
        </div>
      ))}
      {sidoflikar && (
        <div data-testid="sidoflikar">
          {sidoflikar.poster.map((p) => (
            <button
              key={p.id}
              data-testid={`flik-${p.id}`}
              aria-current={sidoflikar.aktiv === p.id}
              onClick={() => sidoflikar.vidVal(p.id)}
            >
              {p.etikett}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  ),
}))

vi.mock('@/components/pdf/PDFExportButton', () => ({
  PDFExportButton: () => null,
}))

import Resources from './Resources'

/** Rå radform, exakt så som `toSavedJobRow` (jobsApi.ts) levererar den. */
const jobbFixtur = [
  { id: '1', job_id: 'j1', job_data: { headline: 'Snickare' }, status: 'SAVED', created_at: '2026-08-01' },
  { id: '2', job_id: 'j2', job_data: { headline: 'Målare' }, status: 'INTERESTED', created_at: '2026-08-02' },
  { id: '3', job_id: 'j3', job_data: { headline: 'Elektriker' }, status: 'APPLIED', created_at: '2026-08-03' },
  { id: '4', job_id: 'j4', job_data: { headline: 'Rörmokare' }, status: 'INTERVIEW', created_at: '2026-08-04' },
]

const bokmarkeFixtur = [
  // `category` är kategorinyckeln ur `articles.category_key`, inte ett namn.
  { id: 'nya-i-sverige', title: 'Ny i Sverige', category: 'digital-presence', readingTime: 6 },
]

const renderPage = (rutt = '/resources') =>
  render(
    <MemoryRouter initialEntries={[rutt]}>
      <Resources />
    </MemoryRouter>
  )

beforeEach(() => {
  vi.clearAllMocks()
  getAllMock.mockResolvedValue(jobbFixtur)
  getBookmarksMock.mockResolvedValue([])
  getVersionsMock.mockResolvedValue([])
  getLettersMock.mockResolvedValue([])
  getInterestMock.mockResolvedValue(null)
  confirmMock.mockResolvedValue(true)
})

// ---------------------------------------------------------------------------

describe('B32: /resources räknar bara faktiskt sparade jobb som "Sparade jobb"', () => {
  it('KPI-kortet visar 2 (SAVED+INTERESTED), inte 4 (hela pipelinen)', async () => {
    renderPage()
    await waitFor(() => expect(getAllMock).toHaveBeenCalled())

    const value = await screen.findByTestId('stat-Sparade jobb')
    expect(value).toHaveTextContent('2')
    expect(value).not.toHaveTextContent('4')
  })

  it('negativ kontroll: vakten fäller om räkningen tar hela pipelinen', async () => {
    renderPage()
    const value = await screen.findByTestId('stat-Sparade jobb')
    expect(jobbFixtur).toHaveLength(4)
    expect(jobbFixtur.filter((r) => ['SAVED', 'INTERESTED'].includes(r.status))).toHaveLength(2)
    expect(value.textContent).toBe('2')
  })

  it('listar bara de faktiskt sparade jobben, inte skickade ansökningar', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Snickare')).toBeInTheDocument())
    expect(screen.getByText('Målare')).toBeInTheDocument()
    expect(screen.queryByText('Elektriker')).not.toBeInTheDocument()
    expect(screen.queryByText('Rörmokare')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------

describe('talen på sidan säger samma sak', () => {
  it('fliken "Jobb" och listrubriken visar samma antal', async () => {
    // Prod 2026-08-22: fliken sa 26, listan 23, nyckeltalet 23 — tre tal för
    // samma sak, alla synliga samtidigt.
    renderPage()
    const flik = await screen.findByTestId('flik-jobs')
    expect(flik).toHaveTextContent('Jobb (2)')

    const rubrik = await screen.findByRole('heading', { name: /Sparade jobb/ })
    expect(rubrik).toHaveTextContent('(2)')
  })

  it('fliken "Dokument" räknar de kort som faktiskt renderas', async () => {
    // Gamla formeln räknade N CV-versioner som 1 och hoppade över
    // intresseguiden: 4 i skenan mot 7 kort på skärmen.
    getVersionsMock.mockResolvedValue([
      { id: 'v1', name: 'Version 1', created_at: '2026-08-01', data: {} },
      { id: 'v2', name: 'Version 2', created_at: '2026-08-02', data: {} },
      { id: 'v3', name: 'Version 3', created_at: '2026-08-03', data: {} },
    ])
    getLettersMock.mockResolvedValue([
      { id: 'b1', title: 'Brev ett', content: 'text', created_at: '2026-08-01', ai_generated: false },
      { id: 'b2', title: 'Brev två', content: 'text', created_at: '2026-08-02', ai_generated: true },
    ])
    getInterestMock.mockResolvedValue({ completed_at: '2026-08-05', recommended_jobs: ['a'] })

    renderPage()
    const flik = await screen.findByTestId('flik-documents')
    // 3 versioner + 2 brev + 1 intresseresultat = 6
    expect(flik).toHaveTextContent('Dokument (6)')
    expect(await screen.findByTestId('stat-Dokument')).toHaveTextContent('6')
  })
})

// ---------------------------------------------------------------------------

describe('statusbrickan', () => {
  it('INTERESTED får en etikett med text — inte en tom bricka', async () => {
    // Prod 2026-08-22: tre rader renderade
    // `class="... undefined undefined"` med tom text, eftersom den lokala
    // statuslistan saknade INTERESTED.
    renderPage('/resources?tab=jobs')
    const rad = await screen.findByText('Målare')
    const kort = rad.closest('div.p-3')!
    expect(within(kort as HTMLElement).getByText('Intresserad')).toBeInTheDocument()
  })

  it('ingen statusbricka bär "undefined" i sitt klassattribut', async () => {
    const { container } = renderPage('/resources?tab=jobs')
    await screen.findByText('Målare')
    const medUndefined = Array.from(container.querySelectorAll('[class*="undefined"]'))
    expect(medUndefined.map((el) => el.className)).toEqual([])
  })

  it('etiketterna är översatta, inte råa i18n-nycklar', async () => {
    const { container } = renderPage('/resources?tab=jobs')
    await screen.findByText('Snickare')
    expect(container.textContent).not.toMatch(/resources\.status\./)
    expect(container.textContent).not.toMatch(/applications\.status\./)
    expect(screen.getByText('Sparad')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------

describe('flikarna styr vad som visas', () => {
  it('?tab=jobs visar jobbsektionen och inte dokumentsektionen', async () => {
    getLettersMock.mockResolvedValue([
      { id: 'b1', title: 'Brev ett', content: 'text', created_at: '2026-08-01', ai_generated: false },
    ])
    renderPage('/resources?tab=jobs')
    await screen.findByText('Snickare')
    expect(screen.queryByText('Brev ett')).not.toBeInTheDocument()
  })

  it('?tab=documents visar dokumentsektionen och inte jobblistan', async () => {
    getLettersMock.mockResolvedValue([
      { id: 'b1', title: 'Brev ett', content: 'text', created_at: '2026-08-01', ai_generated: false },
    ])
    renderPage('/resources?tab=documents')
    await screen.findByText('Brev ett')
    expect(screen.queryByText('Snickare')).not.toBeInTheDocument()
  })

  it('en tom flik visar ett tomtillstånd i stället för ingenting alls', async () => {
    // Prod 2026-08-22: fliken "Artiklar" renderade en helt tom yta.
    renderPage('/resources?tab=articles')
    expect(
      await screen.findByText('Du har inte bokmärkt någon artikel än')
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------

describe('bokmärken', () => {
  it('papperskorgen anropar articleBookmarksApi.remove', async () => {
    // `removeBookmark` finns inte i API:t. Anropet kastade TypeError vid varje
    // klick och knappen gjorde absolut ingenting — utan felmeddelande.
    getBookmarksMock.mockResolvedValue(bokmarkeFixtur)
    renderPage('/resources?tab=articles')
    await screen.findByText('Ny i Sverige')

    const knapp = screen.getByRole('button', { name: /Ta bort bokmärket för Ny i Sverige/ })
    await userEvent.click(knapp)

    await waitFor(() => expect(removeBookmarkMock).toHaveBeenCalledWith('nya-i-sverige'))
    await waitFor(() => expect(screen.queryByText('Ny i Sverige')).not.toBeInTheDocument())
  })

  it('kategorin visas som namn, inte som engelsk slug', async () => {
    getBookmarksMock.mockResolvedValue(bokmarkeFixtur)
    const { container } = renderPage('/resources?tab=articles')
    await screen.findByText('Ny i Sverige')
    expect(container.textContent).not.toMatch(/digital-presence/)
    expect(screen.getByText('Digital närvaro')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------

describe('en trasig datakälla tömmer inte sidan', () => {
  it('jobben visas även när bokmärkena inte går att hämta', async () => {
    // `Promise.all` med ett gemensamt catch gav en användare med tolv sparade
    // saker texten "Inga sparade resurser ännu" så snart ETT anrop föll.
    getBookmarksMock.mockRejectedValue(new Error('nätverksfel'))
    renderPage()
    await screen.findByText('Snickare')
    expect(screen.queryByText('Här samlas det du sparar')).not.toBeInTheDocument()
  })

  it('felet namnges i stället för att se ut som tomhet', async () => {
    getBookmarksMock.mockRejectedValue(new Error('nätverksfel'))
    renderPage()
    const ruta = await screen.findByRole('alert')
    expect(ruta).toHaveTextContent('En del kunde inte hämtas just nu')
    expect(ruta).toHaveTextContent('bokmärkta artiklar')
  })

  it('ett tomt konto får tomtillståndet, inte felrutan', async () => {
    getAllMock.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('Här samlas det du sparar')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
