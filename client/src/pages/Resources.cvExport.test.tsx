/**
 * /resources: varje CV-export går via PDFExportButton type="cv" (alltså
 * /api/cv-pdf, samma PDF som CV-byggaren — beslut Mikael 2026-10-11), och en
 * sparad version tar alltid med sitt `versionId`.
 *
 * Förhandsgranskningsrutan tappade `versionId` fram till 2026-10-11: rutans
 * PDF-knapp exporterade dagens CV under versionens filnamn, fast kortets knapp
 * bredvid gjorde rätt. Det här testet öppnar rutan och läser knappens props.
 *
 * Egen fil i stället för Resources.test.tsx: den mockar PDFExportButton som
 * `null`, och just knappens props är det som ska mätas här.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

const getCVMock = vi.fn()
vi.mock('@/services/cvApi', () => ({
  cvApi: {
    getCV: () => getCVMock(),
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
  PDFExportButton: (p: { type: string; versionId?: string; filename?: string; label?: string }) => (
    <span
      data-testid="cv-pdf-knapp"
      data-type={p.type}
      data-version={p.versionId ?? ''}
      data-filnamn={p.filename ?? ''}
    />
  ),
}))

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Resources from './Resources'

const version = {
  id: 'v-1',
  name: 'Lagerjobb',
  created_at: '2026-09-01T10:00:00Z',
  data: { firstName: 'Anna', lastName: 'Berg', template: 'nordic', workExperience: [], education: [], skills: [] },
}

const renderPage = (rutt = '/resources?tab=documents') =>
  render(
    <MemoryRouter initialEntries={[rutt]}>
      <Resources />
    </MemoryRouter>
  )

beforeEach(() => {
  vi.clearAllMocks()
  getAllMock.mockResolvedValue([])
  getBookmarksMock.mockResolvedValue([])
  getVersionsMock.mockResolvedValue([])
  getLettersMock.mockResolvedValue([])
  getInterestMock.mockResolvedValue(null)
  getCVMock.mockResolvedValue(null)
  confirmMock.mockResolvedValue(true)
})

describe('/resources: CV-exporten är CV-byggarens', () => {
  it('versionskortets PDF-knapp är type="cv" med versionens id', async () => {
    getVersionsMock.mockResolvedValue([version])
    renderPage()
    const knappar = await screen.findAllByTestId('cv-pdf-knapp')
    expect(knappar).toHaveLength(1)
    expect(knappar[0].dataset.type).toBe('cv')
    expect(knappar[0].dataset.version).toBe('v-1')
    expect(knappar[0].dataset.filnamn).toBe('CV_Anna_Berg.pdf')
  })

  it('förhandsgranskningsrutan för en version skickar också versionId', async () => {
    getVersionsMock.mockResolvedValue([version])
    renderPage()
    await screen.findAllByTestId('cv-pdf-knapp')
    await userEvent.click(screen.getByRole('button', { name: 'Förhandsgranska Lagerjobb' }))

    const dialog = await screen.findByRole('dialog')
    const knapp = within(dialog).getByTestId('cv-pdf-knapp')
    expect(knapp.dataset.type).toBe('cv')
    expect(knapp.dataset.version).toBe('v-1')
  })

  it('nuvarande CV (inga versioner) exporteras utan versionId — servern läser cvs-raden', async () => {
    getCVMock.mockResolvedValue({ firstName: 'Anna', lastName: 'Berg', template: 'nordic' })
    renderPage()
    const knappar = await screen.findAllByTestId('cv-pdf-knapp')
    expect(knappar).toHaveLength(1)
    expect(knappar[0].dataset.type).toBe('cv')
    expect(knappar[0].dataset.version).toBe('')
  })

  it('sidan ritar aldrig ett CV själv med jsPDF', () => {
    const kod = readFileSync(resolve(__dirname, 'Resources.tsx'), 'utf-8')
    expect(kod).not.toMatch(/generateCVPDF/)
  })
})
