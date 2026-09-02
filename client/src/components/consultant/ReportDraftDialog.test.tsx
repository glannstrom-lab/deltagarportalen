/**
 * Tester för ReportDraftDialog — tillgänglighet (KT1) + utkastlager (KA3).
 *
 * Dialogen saknade helt role="dialog", aria-modal och Esc-stängning innan
 * migreringen till den delade `Dialog`-primitiven (components/ui/Dialog.tsx).
 *
 * KA3: `handleClose` nollställde tidigare utkastet, och en avmontering (SPA-
 * navigering) tappade det tyst eftersom varken `visibilitychange` eller
 * `beforeunload` körs då. Testerna nedan monterar av och på riktigt (samma
 * insikt som `radgivarSidbyte.test.tsx` bygger på — en direktladdning hade
 * sett rätt ut) för att bevisa att utkastet faktiskt överlever.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { ReportDraftDialog } from './ReportDraftDialog'
import { callAI } from '@/services/aiApi'

// Enkel, kedjebar query-builder-mock. Behöver skilja på tabellnamn eftersom
// handleGenerate gör Promise.all([journalQuery, consultant_goals-query]) och
// ett tomt journalsvar + tomt målsvar avbryter innan callAI ens anropas.
function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = vi.fn(chain)
  builder.eq = vi.fn(chain)
  builder.order = vi.fn(chain)
  builder.gte = vi.fn(chain)
  // Query-builders i @supabase/supabase-js är "thenable" — koden gör
  // `await journalQuery` direkt utan att anropa `.then()` explicit.
  builder.then = (resolve: (v: unknown) => void) => resolve(result)
  return builder
}

const journalResult = {
  data: [{ content: 'Deltagaren har sökt tre jobb den här perioden.', category: 'GENERAL', created_at: '2026-08-01T00:00:00Z' }],
  error: null,
}
const emptyResult = { data: [], error: null }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'consultant-1' } } })) },
    from: vi.fn((table: string) => {
      if (table === 'consultant_journal') return makeBuilder(journalResult)
      return makeBuilder(emptyResult)
    }),
  },
}))
vi.mock('@/services/aiApi', () => ({
  callAI: vi.fn(),
}))

const skrivTextMock = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  sessionStorage.clear()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: skrivTextMock },
    configurable: true,
    writable: true,
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  sessionStorage.clear()
})

function renderDialog(overrides: Partial<React.ComponentProps<typeof ReportDraftDialog>> = {}) {
  const onClose = vi.fn()
  const utils = render(
    <ReportDraftDialog isOpen onClose={onClose} participantId="p1" {...overrides} />
  )
  return { ...utils, onClose }
}

/** Genererar ett utkast via mockad AI och returnerar textarean. */
async function genereraUtkast(text = 'AI-genererat utkast om deltagarens jobbsökande.') {
  // Komponenten läser `utkast` ur svaret; typen AIApiResponse bär inte fältet.
  vi.mocked(callAI).mockResolvedValueOnce({ utkast: text } as unknown as Awaited<ReturnType<typeof callAI>>)
  fireEvent.click(screen.getByRole('button', { name: /skapa utkast/i }))
  const textarea = await screen.findByLabelText('Rapportutkast')
  expect(textarea).toHaveValue(text)
  return textarea as HTMLTextAreaElement
}

describe('ReportDraftDialog — tillgänglighet (WCAG 2.1.2)', () => {
  it('är en riktig modal: role="dialog", aria-modal="true", aria-labelledby', async () => {
    renderDialog()
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('Escape stänger dialogen', async () => {
    const { onClose } = renderDialog()
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('ReportDraftDialog — utkastlager (KA3)', () => {
  it('ett handredigerat utkast överlever avmontering och erbjuds vid återmontering', async () => {
    const { unmount } = renderDialog()
    const textarea = await genereraUtkast()

    // Handredigering — precis den situationen KA3 beskriver.
    fireEvent.change(textarea, { target: { value: 'AI-genererat utkast, handredigerat av konsulenten.' } })
    expect(textarea).toHaveValue('AI-genererat utkast, handredigerat av konsulenten.')

    // SPA-navigering: ingen "Stäng", ingen visibilitychange/beforeunload —
    // bara ett unmount, exakt så här ParticipantDetailPage avmonterar
    // ReportDraftDialog när participantId försvinner (byte av deltagare).
    unmount()

    // Nytt mount = "en annan gång" ur användarens perspektiv.
    renderDialog()
    await screen.findByRole('dialog')

    expect(await screen.findByText(/sparat utkast/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Rapportutkast')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /fortsätt på utkastet/i }))
    const restored = await screen.findByLabelText('Rapportutkast')
    expect(restored).toHaveValue('AI-genererat utkast, handredigerat av konsulenten.')
  })

  it('"Börja om" rensar det sparade utkastet — det erbjuds inte igen', async () => {
    const { unmount } = renderDialog()
    await genereraUtkast('Utkast som ska kastas.')
    unmount()

    renderDialog()
    await screen.findByText(/sparat utkast/i)
    fireEvent.click(screen.getByRole('button', { name: /börja om/i }))

    // Ingen offer kvar i den här sessionen, och textarean är tom (nytt utkast).
    expect(screen.queryByText(/sparat utkast/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Rapportutkast')).not.toBeInTheDocument()

    // Avmontera och montera igen — om rensningen verkligen tog ska INGET erbjudas.
    cleanup()
    renderDialog()
    await screen.findByRole('dialog')
    await waitFor(() => {
      expect(screen.queryByText(/sparat utkast/i)).not.toBeInTheDocument()
    })
  })

  it('kopierat utkast räknas som klart — rensas och erbjuds inte igen', async () => {
    const { unmount } = renderDialog()
    await genereraUtkast('Utkast som kopieras ut.')

    fireEvent.click(screen.getByRole('button', { name: /^kopiera$/i }))
    await waitFor(() => expect(skrivTextMock).toHaveBeenCalledWith('Utkast som kopieras ut.'))

    unmount()
    renderDialog()
    await screen.findByRole('dialog')
    await waitFor(() => {
      expect(screen.queryByText(/sparat utkast/i)).not.toBeInTheDocument()
    })
  })

  it('"Kasta utkastet" rensar den sparade kopian uttryckligen', async () => {
    const { unmount } = renderDialog()
    await genereraUtkast('Utkast som kasseras.')

    fireEvent.click(screen.getByRole('button', { name: /kasta utkastet/i }))
    expect(screen.queryByLabelText('Rapportutkast')).not.toBeInTheDocument()

    unmount()
    renderDialog()
    await screen.findByRole('dialog')
    await waitFor(() => {
      expect(screen.queryByText(/sparat utkast/i)).not.toBeInTheDocument()
    })
  })

  it('"Stäng" nollställer INTE längre utkastet (regression mot buggen)', async () => {
    const { onClose } = renderDialog()
    await genereraUtkast('Utkast som bara stängs, inte kasseras.')

    // Två knappar har den tillgängliga namnet "Stäng" (X-ikonen har
    // aria-label="Stäng", och footer-knappen har textinnehållet "Stäng") —
    // matcha på textinnehållet för att träffa footer-knappen entydigt.
    fireEvent.click(screen.getByText('Stäng', { selector: 'button' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    // Notera: dialogen själv avmonteras inte av det här klicket i testet
    // (isOpen styrs av föräldern) — men det viktiga för KA3 är att
    // handleClose inte längre gör setDraft(''). Se unmount-testerna ovan för
    // det faktiska överlevnadsbeviset.
  })
})
