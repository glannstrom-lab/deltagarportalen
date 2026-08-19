/**
 * CoverLetterMyLetters — vad listan får och inte får göra.
 *
 * Varför filen skrevs om 2026-08-19: den gamla versionen hade två tester som
 * båda asserterade en URL. Det ena var grönt medan funktionen bakom var
 * trasig — "Redigera" navigerade till `/cover-letter?edit=<id>`, och testet
 * kontrollerade just den strängen. Skrivvyn läser aldrig `edit`, så knappen
 * öppnade en tom wizard och sparade man därifrån skapades en dubblett.
 * Ett test som låser en URL bevisar att navigationen sker, inte att något
 * händer i andra änden.
 *
 * Mutationskontrollerade 2026-08-19 (bröt koden, såg testet bli rött,
 * återställde):
 *   1. `loadLetters` sväljer felet och sätter `[]`  → "ett hämtningsfel..." RÖD
 *   2. `template` tas bort ur `create()` i handleDuplicate → "kopian behåller..." RÖD
 *   3. bekräftelsedialogen tas bort ur handleDelete → "raderingen frågar..." RÖD
 *   4. åtgärdsfel sätter `listError` i stället för toast → "ett åtgärdsfel..." RÖD
 *   5. `await loadProfile()` tas bort ur handleDownload → "PDF:en väntar in..." RÖD
 *   6. "Redigera"-knappen sätts tillbaka → "listan lovar ingen redigering" RÖD
 *
 * FIXTUREN speglar prod-formen på `cover_letters` (schema-snapshot 2026-08-19):
 * id, user_id, title, job_ad, content, company, job_title, template,
 * ai_generated, created_at, updated_at. Det finns INGEN `status`-kolumn —
 * den gamla fixturen hade ett `status: 'draft'`-fält som inte existerar.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import type { CoverLetter } from '@/services/supabaseApi'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

const getAllMock = vi.fn()
const getByIdMock = vi.fn()
const createMock = vi.fn()
const updateMock = vi.fn()
const deleteMock = vi.fn()
vi.mock('@/services/coverLetterApi', () => ({
  coverLetterApi: {
    getAll: (...a: unknown[]) => getAllMock(...a),
    getById: (...a: unknown[]) => getByIdMock(...a),
    create: (...a: unknown[]) => createMock(...a),
    update: (...a: unknown[]) => updateMock(...a),
    delete: (...a: unknown[]) => deleteMock(...a),
  },
}))

const generatePDFMock = vi.fn()
const downloadPDFMock = vi.fn()
vi.mock('@/services/pdfExportService', () => ({
  generateCoverLetterPDF: (...a: unknown[]) => generatePDFMock(...a),
  downloadPDF: (...a: unknown[]) => downloadPDFMock(...a),
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('@/components/Toast', () => ({
  showToast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}))

/**
 * `profileStore` persistar INTE `profile` (partialize), så den är null vid
 * varje sidladdning medan PDF-knappen redan går att klicka. Mocken speglar
 * den kapplöpningen: profilen finns först efter att loadProfile() körts.
 */
type Profil = { first_name: string; last_name: string; email: string; phone: string; location: string } | null
let profil: Profil = null
/**
 * Hämtningen är AVSIKTLIGT inte klar direkt. Kapplöpningen är hela poängen:
 * knappen går att klicka innan profilen finns, och koden måste vänta in den.
 * `slappFramProfilen()` låter testet bestämma exakt när svaret kommer.
 */
let vantande: Array<() => void> = []
const loadProfileMock = vi.fn(() => new Promise<void>((resolve) => {
  vantande.push(() => {
    profil = { first_name: 'Anna', last_name: 'Ek', email: 'anna@example.se', phone: '070-000 00 00', location: 'Umeå' }
    resolve()
  })
}))
const slappFramProfilen = async () => {
  const kö = vantande
  vantande = []
  kö.forEach((f) => f())
  await Promise.resolve()
}
const storeState = () => ({ profile: profil, loadProfile: loadProfileMock })
vi.mock('@/stores/profileStore', () => ({
  useProfileStore: Object.assign(() => storeState(), { getState: () => storeState() }),
}))

import { CoverLetterMyLetters } from './CoverLetterMyLetters'

// ============================================================================
// Fixtur i prod-form
// ============================================================================
const brev = (over: Partial<CoverLetter> = {}): CoverLetter => ({
  id: 'brev-1',
  user_id: 'user-1',
  title: 'Snickare hos Acme',
  job_ad: null,
  content: 'Hej!\n\nJag söker tjänsten som snickare.',
  company: 'Acme AB',
  job_title: 'Snickare',
  template: 'executive',
  ai_generated: false,
  created_at: '2026-08-01T10:00:00Z',
  updated_at: '2026-08-01T10:00:00Z',
  ...over,
})

const rita = (ui: ReactElement = <CoverLetterMyLetters />) =>
  render(
    <MemoryRouter initialEntries={['/cover-letter/my-letters']}>
      <ConfirmDialogProvider>{ui}</ConfirmDialogProvider>
    </MemoryRouter>
  )

/** Väntar in listan (titeln renderas i två varianter: mobil + desktop). */
const vantaPaListan = () =>
  waitFor(() => expect(screen.getAllByText('Snickare hos Acme').length).toBeGreaterThan(0))

const skrivTextMock = vi.fn(async () => {})

beforeEach(() => {
  vi.clearAllMocks()
  profil = null
  vantande = []
  getAllMock.mockResolvedValue([brev()])
  getByIdMock.mockResolvedValue(brev())
  createMock.mockResolvedValue(brev({ id: 'brev-2' }))
  deleteMock.mockResolvedValue(true)
  generatePDFMock.mockResolvedValue(new Blob(['pdf']))
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: skrivTextMock },
    configurable: true,
    writable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

// ============================================================================
// 1. Ett fel är inte tomhet
// ============================================================================
describe('CoverLetterMyLetters — de tre lägena vid inladdning', () => {
  it('ett hämtningsfel visas som fel, inte som "du har inga brev"', async () => {
    getAllMock.mockRejectedValue(new Error('Nätverket svarade inte'))
    rita()

    const larm = await screen.findByRole('alert')
    expect(larm).toHaveTextContent('Nätverket svarade inte')

    // Det får ALDRIG se ut som att användaren saknar brev.
    expect(screen.queryByText(/samlas här/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Skriv ditt första brev/i)).not.toBeInTheDocument()

    // Och det ska gå att försöka igen.
    fireEvent.click(screen.getByRole('button', { name: /Försök igen/i }))
    await waitFor(() => expect(getAllMock).toHaveBeenCalledTimes(2))
  })

  it('tomtillståndet har EN CTA, och den går till /cover-letter', async () => {
    getAllMock.mockResolvedValue([])
    rita()

    const cta = await screen.findByRole('button', { name: 'Skriv ditt första brev' })
    fireEvent.click(cta)
    expect(navigateMock).toHaveBeenCalledWith('/cover-letter')

    // DESIGN.md §7: ett tomtillstånd har EN tydlig CTA. Här fanns två, och
    // båda gick till samma route — det andra valet var alltså inget val.
    const knappar = screen.getAllByRole('button')
    expect(knappar).toHaveLength(1)
    expect(navigateMock.mock.calls.every(([to]) => !String(to).startsWith('/dashboard'))).toBe(true)
  })
})

// ============================================================================
// 2. Inget löfte utan täckning
// ============================================================================
describe('CoverLetterMyLetters — lovar inget som inte går att hålla', () => {
  it('listan lovar ingen redigering — skrivvyn kan inte redigera ett sparat brev', async () => {
    rita()
    await vantaPaListan()

    // `coverLetterApi.update()` har noll produktionsanropare och
    // CoverLetterWrite läser aldrig `?edit=`. En knapp som hette "Redigera"
    // öppnade en tom wizard och sparade en DUBBLETT vid spara.
    expect(screen.queryByRole('button', { name: /Redigera/i })).not.toBeInTheDocument()
    expect(navigateMock.mock.calls.some(([to]) => String(to).includes('edit='))).toBe(false)
  })

  it('visar ingen påhittad status och ingen Skicka-knapp', async () => {
    rita()
    await vantaPaListan()

    // `cover_letters` har ingen status-kolumn i prod. "Utkast" var hårdkodat.
    expect(screen.queryByText('Utkast')).not.toBeInTheDocument()
    expect(screen.queryByText('Skickad')).not.toBeInTheDocument()
    expect(screen.queryByText('Mall')).not.toBeInTheDocument()

    // "Skicka" pekade på /cover-letter/applications — en route som inte finns.
    expect(screen.queryByRole('button', { name: /^Skicka$/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(navigateMock.mock.calls.some(([to]) => String(to).includes('/cover-letter/applications'))).toBe(false)
  })

  it('kopierar brevets text — vägen som faktiskt fungerar när man vill återanvända', async () => {
    rita()
    await vantaPaListan()

    fireEvent.click(screen.getAllByRole('button', { name: /Kopiera text/i })[0])

    await waitFor(() => expect(skrivTextMock).toHaveBeenCalledWith('Hej!\n\nJag söker tjänsten som snickare.'))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
  })
})

// ============================================================================
// 3. Kopian ska likna originalet
// ============================================================================
describe('CoverLetterMyLetters — duplicering', () => {
  it('kopian behåller mallen, företaget och jobbtiteln', async () => {
    rita()
    await vantaPaListan()

    fireEvent.click(screen.getAllByRole('button', { name: /Fler alternativ/i })[0])
    fireEvent.click(await screen.findByRole('menuitem', { name: /Gör en kopia/i }))

    await waitFor(() => expect(createMock).toHaveBeenCalled())
    const skickat = createMock.mock.calls[0][0]

    // `template` glömdes bort här; kolumnen är satt på 5 av 5 brev i prod, så
    // varje kopia föll tillbaka på "professional" och fick fel PDF-utseende.
    expect(skickat.template).toBe('executive')
    expect(skickat.company).toBe('Acme AB')
    expect(skickat.job_title).toBe('Snickare')
    expect(skickat.content).toBe('Hej!\n\nJag söker tjänsten som snickare.')
    expect(skickat.title).toContain('kopia')

    // Listan hämtas om så kopian syns direkt.
    await waitFor(() => expect(getAllMock).toHaveBeenCalledTimes(2))
  })
})

// ============================================================================
// 4. Radering: bekräftelse med namn, och återkoppling efteråt
// ============================================================================
describe('CoverLetterMyLetters — radering', () => {
  it('raderingen frågar först, och bekräftelsen namnger brevet', async () => {
    rita()
    await vantaPaListan()

    fireEvent.click(screen.getAllByRole('button', { name: /Fler alternativ/i })[0])
    fireEvent.click(await screen.findByRole('menuitem', { name: /Ta bort/i }))

    // Dialogen är projektets egen (ConfirmDialogProvider), inte window.confirm.
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Snickare hos Acme')

    // Inget är raderat förrän man svarat ja.
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it('avbryter man raderas ingenting', async () => {
    rita()
    await vantaPaListan()

    fireEvent.click(screen.getAllByRole('button', { name: /Fler alternativ/i })[0])
    fireEvent.click(await screen.findByRole('menuitem', { name: /Ta bort/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Avbryt' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(deleteMock).not.toHaveBeenCalled()
    expect(screen.getAllByText('Snickare hos Acme').length).toBeGreaterThan(0)
  })

  it('bekräftar man raderas brevet och man får veta att det gick', async () => {
    rita()
    await vantaPaListan()

    fireEvent.click(screen.getAllByRole('button', { name: /Fler alternativ/i })[0])
    fireEvent.click(await screen.findByRole('menuitem', { name: /Ta bort/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ta bort' }))

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('brev-1'))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('Snickare hos Acme')).not.toBeInTheDocument())
  })
})

// ============================================================================
// 5. Åtgärdsfel ≠ listfel
// ============================================================================
describe('CoverLetterMyLetters — fel i en åtgärd river inte listan', () => {
  it('ett åtgärdsfel behåller listan och lägger felet i en toast', async () => {
    deleteMock.mockRejectedValue(new Error('Servern svarade 500'))
    rita()
    await vantaPaListan()

    fireEvent.click(screen.getAllByRole('button', { name: /Fler alternativ/i })[0])
    fireEvent.click(await screen.findByRole('menuitem', { name: /Ta bort/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ta bort' }))

    await waitFor(() => expect(toastError).toHaveBeenCalled())

    // Hela listan ersattes tidigare av felskärmen, och fokus föll till body.
    expect(screen.getAllByText('Snickare hos Acme').length).toBeGreaterThan(0)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Försök igen/i })).not.toBeInTheDocument()
  })

  it('ett PDF-fel behåller också listan', async () => {
    generatePDFMock.mockRejectedValue(new Error('Kunde inte rendera'))
    rita()
    await vantaPaListan()

    fireEvent.click(screen.getAllByRole('button', { name: /Ladda ner PDF/i })[0])
    await slappFramProfilen()

    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(screen.getAllByText('Snickare hos Acme').length).toBeGreaterThan(0)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ============================================================================
// 6. PDF: vänta in profilen, gissa aldrig ett namn
// ============================================================================
describe('CoverLetterMyLetters — PDF-nedladdning', () => {
  it('väntar in profilen innan PDF:en skapas, så brevet får rätt avsändare', async () => {
    // profil === null vid montering — precis som vid en riktig sidladdning.
    rita()
    await vantaPaListan()

    fireEvent.click(screen.getAllByRole('button', { name: /Ladda ner PDF/i })[0])
    // Svaret på profilhämtningen kommer FÖRST här — efter klicket.
    await slappFramProfilen()

    await waitFor(() => expect(generatePDFMock).toHaveBeenCalled())
    const arg = generatePDFMock.mock.calls[0][0]
    expect(arg.firstName).toBe('Anna')
    expect(arg.lastName).toBe('Ek')
    expect(arg.phone).toBe('070-000 00 00')

    // Mallen följer med — annars får den nedladdade filen fel utseende.
    expect(arg.template).toBe('executive')
    expect(arg.createdAt).toBe('2026-08-01T10:00:00Z')
    await waitFor(() => expect(downloadPDFMock).toHaveBeenCalled())
  })
})

// ============================================================================
// 7. Sökning
// ============================================================================
describe('CoverLetterMyLetters — sökning', () => {
  it('ett tomt sökresultat bjuder in i stället för att visa "0 brev"', async () => {
    rita()
    await vantaPaListan()

    fireEvent.change(screen.getByLabelText('Sök bland dina brev'), { target: { value: 'zzzz' } })

    expect(await screen.findByText(/Inget brev matchade sökningen/i)).toBeInTheDocument()
    expect(screen.queryByText('0 brev')).not.toBeInTheDocument()

    // Och man kommer tillbaka till alla brev.
    fireEvent.click(screen.getByRole('button', { name: /Visa alla brev igen/i }))
    await vantaPaListan()
  })

  it('filtrerar på både brevets namn och företaget', async () => {
    getAllMock.mockResolvedValue([
      brev(),
      brev({ id: 'brev-9', title: 'Lokalvårdare hos Betaservice', company: 'Betaservice AB', job_title: 'Lokalvårdare' }),
    ])
    rita()
    await vantaPaListan()

    fireEvent.change(screen.getByLabelText('Sök bland dina brev'), { target: { value: 'betaservice' } })

    await waitFor(() => expect(screen.queryByText('Snickare hos Acme')).not.toBeInTheDocument())
    expect(screen.getAllByText('Lokalvårdare hos Betaservice').length).toBeGreaterThan(0)
  })
})

// ============================================================================
// 8. Tangentbord (bevarat beteende)
// ============================================================================
describe('CoverLetterMyLetters — tangentbord', () => {
  it('Escape stänger menyn och lämnar tillbaka fokus till knappen', async () => {
    rita()
    await vantaPaListan()

    const menyknapp = screen.getAllByRole('button', { name: /Fler alternativ/i })[0]
    fireEvent.click(menyknapp)
    expect(await screen.findByRole('menu')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(document.activeElement).toBe(menyknapp)
  })
})
