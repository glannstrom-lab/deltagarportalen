/**
 * Intervjusimulatorn får inte påstå saker den inte kan belägga.
 *
 * Granskningen 2026-08-19 (fem agenter, kod + prod i Playwright) hittade sex
 * ställen där sidan sa något osant, och alla var av samma familj som
 * lärdomen 2026-08-09 — ett påhittat värde föredrogs framför ett tomt fält:
 *
 *   · Tre nakna `catch {}` gjorde att en reservfråga ur en hårdkodad lista
 *     presenterades i AI:ns kort, med rubriken "Fråga 1", som om en
 *     rekryterare ställt den. Hade deltagaren stängt av AI i sina
 *     inställningar (art. 21) fick hon en full "intervju" utan att någonsin
 *     få veta varför.
 *   · Kategorimenyn lovade "Tekniska frågor" och skickades aldrig vidare.
 *   · `IntervjuSimulatorResultSchema` har alla fält `.optional()`, så ett tomt
 *     `{}` var ett giltigt svar — renderat blev det rubriken
 *     "Helhetsbedömning" plus AI Act-vattenstämpeln, med ingenting emellan.
 *   · "Din övning är sparad så du kan titta på den igen" — `getSimulatorSessions()`
 *     hade noll läsare i hela repot.
 *
 * Varje test här är kört mot en mutation som återinför felet. Ett test som
 * passerar bevisar ingenting förrän man vet att det kan falla.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const callAIMock = vi.fn()
vi.mock('@/services/aiApi', () => ({
  callAI: (fn: string, params: unknown) => callAIMock(fn, params),
}))

const sparaUtkastMock = vi.fn()
const sessionerMock = vi.fn(() => [] as unknown[])
vi.mock('@/services/interviewService', () => ({
  saveSimulatorSession: vi.fn(),
  getSimulatorSessions: () => sessionerMock(),
  sparaSimulatorUtkast: (...a: unknown[]) => sparaUtkastMock(...a),
  lasSimulatorUtkast: () => null,
  rensaSimulatorUtkast: vi.fn(),
}))

vi.mock('@/hooks/knowledge-base/useArticles', () => ({
  useArticles: () => ({ data: [], isLoading: false }),
}))

vi.mock('@/components/FocusModeProvider', () => ({
  useFocusMode: () => ({ isFocusMode: false, leaveWizard: vi.fn() }),
}))

vi.mock('@/hooks/useAchievementTracker', () => ({
  useAchievementTracker: () => ({ trackInterviewCompleted: vi.fn(), trackCVCreated: vi.fn() }),
}))

vi.mock('@/hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    isRecording: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    isSupported: false,
    error: null,
  }),
}))

vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/ConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: () => Promise.resolve(true),
    ConfirmDialogPortal: () => null,
  }),
}))

import InterviewSimulator from './InterviewSimulator'

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <InterviewSimulator />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

async function startaIntervju(container: HTMLElement, kategori?: string) {
  const rollFalt = container.querySelector('input') as HTMLInputElement
  fireEvent.change(rollFalt, { target: { value: 'Lagerarbetare' } })
  if (kategori) {
    const meny = container.querySelector('select') as HTMLSelectElement
    fireEvent.change(meny, { target: { value: kategori } })
  }
  fireEvent.click(screen.getByRole('button', { name: 'Starta intervjun' }))
  await waitFor(() => {
    expect(container.querySelector('textarea')).toBeTruthy()
  })
}

beforeEach(() => {
  callAIMock.mockReset()
  sparaUtkastMock.mockReset()
  sessionerMock.mockReset()
  sessionerMock.mockReturnValue([])
  localStorage.clear()
})

describe('AI-fel syns i stället för att maskeras', () => {
  it('säger ifrån när AI-anropet failar — och märker frågan som vår egen', async () => {
    callAIMock.mockRejectedValueOnce(
      new Error('Du har stängt av AI-funktioner i dina inställningar.')
    )

    const { container } = renderPage()
    await startaIntervju(container)

    // Deltagarens egen orsak, ordagrant från aiApi — inte en tystnad.
    await waitFor(() => {
      expect(container.textContent).toContain('Du har stängt av AI-funktioner i dina inställningar.')
    })
    // Och frågan påstår inte att en rekryterare ställt den.
    expect(container.textContent).toContain('kommer ur vår egen lista')
  })

  it('säger ifrån även när AI:n svarar 200 med tomt innehåll', async () => {
    callAIMock.mockResolvedValueOnce({ resultat: '   ' })

    const { container } = renderPage()
    await startaIntervju(container)

    await waitFor(() => {
      expect(container.textContent).toContain('kommer ur vår egen lista')
    })
  })

  it('märker INTE en riktig AI-fråga som reservfråga', async () => {
    // Negativ kontroll: utan den skulle etiketten kunna sitta på allt.
    callAIMock.mockResolvedValueOnce({ resultat: 'Varför söker du hit?' })

    const { container } = renderPage()
    await startaIntervju(container)

    await waitFor(() => {
      expect(container.textContent).toContain('Varför söker du hit?')
    })
    expect(container.textContent).not.toContain('kommer ur vår egen lista')
  })

  it('ger inte samma reservfråga två gånger i rad', async () => {
    // `antalFragor` lästes innan det ökades, så två fel i rad gav samma fråga.
    callAIMock
      .mockRejectedValueOnce(new Error('Nätverksfel'))
      .mockRejectedValueOnce(new Error('Nätverksfel'))

    const { container } = renderPage()
    await startaIntervju(container)

    // Läs SJÄLVA frågetexten, inte hela kortet. Kortet innehåller också
    // "Fråga 1" respektive "Fråga 2", så en jämförelse av regionen är sann
    // oavsett vilken fråga som visas — mutationen som återinför buggen
    // överlevde precis den varianten av testet.
    const fragetext = () => screen.getByTestId('nuvarande-fraga').textContent
    const forsta = fragetext()

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Mitt svar' } })
    fireEvent.click(await screen.findByRole('button', { name: /Nästa fråga/ }))

    // Vänta på det som faktiskt prövas — inte på något annat som råkar
    // hända ungefär samtidigt.
    //
    // Här stod en `waitFor` på att svaret dykt upp i DOM:en, följd av ett
    // synkront påstående om frågan. Men svarstexten finns i textarean redan
    // när `fireEvent.change` körts, alltså FÖRE klicket — så `waitFor`
    // kunde lösa direkt, medan den avvisade AI-promisen ännu inte hunnit
    // sätta den nya reservfrågan. Utfallet avgjordes av mikrotaskordningen:
    // grönt på en snabb maskin, rött på en lastad CI-runner (CI 2026-08-22,
    // `expected 'Berätta om dig själv och din bakgrund' to not deeply equal`
    // sig själv).
    //
    // Feldetekteringen är oförändrad: återinförs buggen — `antalFragor` läst
    // före ökningen — byts frågan aldrig, och `waitFor` faller på timeout.
    await waitFor(() => {
      expect(fragetext()).not.toEqual(forsta)
    })
    expect(container.textContent).toContain('Mitt svar')
  })
})

describe('kategorimenyn är inte längre en attrapp', () => {
  it('skickar deltagarens valda kategori till AI:n', async () => {
    callAIMock.mockResolvedValueOnce({ resultat: 'En teknisk fråga' })

    const { container } = renderPage()
    await startaIntervju(container, 'Tekniska frågor')

    await waitFor(() => {
      expect(callAIMock).toHaveBeenCalled()
    })
    const [, params] = callAIMock.mock.calls[0]
    expect((params as { kategori?: string }).kategori).toBe('Tekniska frågor')
  })

  it('skickar ingen kategori när deltagaren inte valt någon', async () => {
    callAIMock.mockResolvedValueOnce({ resultat: 'En fråga' })

    const { container } = renderPage()
    await startaIntervju(container)

    await waitFor(() => {
      expect(callAIMock).toHaveBeenCalled()
    })
    const [, params] = callAIMock.mock.calls[0]
    expect((params as { kategori?: string }).kategori).toBeUndefined()
  })
})

describe('utkastet räddar en avbruten övning', () => {
  it('sparar utkast så snart det finns något att förlora', async () => {
    callAIMock.mockResolvedValueOnce({ resultat: 'Berätta om dig själv' })

    const { container } = renderPage()
    await startaIntervju(container)

    // Ingenting att rädda ännu — tomt formulär ska inte skriva utkast.
    expect(sparaUtkastMock).not.toHaveBeenCalled()

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Ett halvskrivet svar' } })

    await waitFor(() => {
      expect(sparaUtkastMock).toHaveBeenCalled()
    })
    const utkast = sparaUtkastMock.mock.calls.at(-1)?.[0] as { anvandarSvar: string; roll: string }
    expect(utkast.anvandarSvar).toBe('Ett halvskrivet svar')
    expect(utkast.roll).toBe('Lagerarbetare')
  })
})

describe('tidigare övningar går faktiskt att titta på', () => {
  it('visar sparade övningar med rätt källa för betyget', async () => {
    sessionerMock.mockReturnValue([
      {
        id: 'sim-1',
        roll: 'Lagerarbetare',
        foretag: 'Lagerbolaget',
        antalFragor: 2,
        avgRating: 4,
        endedAt: '2026-08-18T10:00:00.000Z',
        historik: [
          { fraga: 'Berätta om dig själv', svar: 'Jag har jobbat på lager.', rating: 4, ratingSource: 'ai' },
          { fraga: 'Varför söker du hit?', svar: 'Nära hemmet.', rating: 3, ratingSource: 'user' },
        ],
      },
    ])

    const { container } = renderPage()

    await waitFor(() => {
      expect(container.textContent).toContain('Dina tidigare övningar')
    })

    fireEvent.click(screen.getByRole('button', { name: /Lagerarbetare/ }))

    await waitFor(() => {
      expect(container.textContent).toContain('Jag har jobbat på lager.')
    })

    // Betygets källa skrivs ut. Utan `ratingSource` i den sparade posten hade
    // B12:s hela poäng gått förlorad vid sparning.
    expect(container.textContent).toContain("AI:s bedömning: 4 av 5")
    expect(container.textContent).toContain('Ditt eget betyg: 3 av 5')
  })

  it('visar inget avsnitt alls när det inte finns någon övning', () => {
    const { container } = renderPage()
    expect(container.textContent).not.toContain('Dina tidigare övningar')
  })
})
