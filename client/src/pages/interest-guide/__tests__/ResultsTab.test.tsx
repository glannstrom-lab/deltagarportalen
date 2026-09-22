/**
 * Intresseguidens resultatflik — dela, historik och stängknapp.
 *
 * Fyra fel som alla gick att se med tangentbord eller skärmläsare:
 *  1. "Dela resultat": `navigator.share` avvisar sitt löfte när användaren
 *     stänger delningsrutan (AbortError). Löftet fångades inte → ohanterad
 *     avvisning varje gång någon ångrade sig.
 *  2. Historikknappen fäller ut en lista men saknade `aria-expanded`.
 *  3. Raderna i historiken var klickbara div:ar — inte nåbara med Tab.
 *  4. Stängknappen på tipset hade texten "x" som enda namn.
 *
 * Mutationer: ta bort `.catch` i delningen → test 1 faller (ohanterad
 * avvisning); ta bort `aria-expanded` → test 2 faller; ta bort
 * `role="button"` på raden → test 3 faller; ta bort aria-label → test 4 faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@/test/utils'
import ResultsTab from '../ResultsTab'

vi.mock('@/components/interest-guide/ResultsView', () => ({ ResultsView: () => null }))
vi.mock('@/components/interest-guide/CareerRecommendationsPanel', () => ({ CareerRecommendationsPanel: () => null }))

const getProgress = vi.fn()
const getHistory = vi.fn()
vi.mock('@/services/cloudStorage', () => ({
  interestGuideApi: {
    getProgress: (...a: unknown[]) => getProgress(...a),
    getHistory: (...a: unknown[]) => getHistory(...a),
    reset: vi.fn(),
  },
}))

const riasec = { R: 40, I: 60, A: 50, S: 70, E: 30, C: 20 }
const historik = [
  { id: 'h1', completed_at: '2026-09-20T10:00:00Z', riasec_profile: riasec, top_occupations: [] },
  { id: 'h2', completed_at: '2026-08-01T10:00:00Z', riasec_profile: riasec, top_occupations: [] },
]

beforeEach(() => {
  getProgress.mockResolvedValue({ is_completed: true, answers: {} })
  getHistory.mockResolvedValue(historik)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  // navigator.share finns inte i jsdom — återställ efter varje test
  delete (navigator as unknown as { share?: unknown }).share
})

describe('ResultsTab', () => {
  it('en avbruten delning ger ingen ohanterad avvisning', async () => {
    const avvisningar: unknown[] = []
    const lyssnare = (e: PromiseRejectionEvent | unknown) => avvisningar.push(e)
    process.on('unhandledRejection', lyssnare)
    // Inte vi.fn(): vitest hänger på en .then på mockens löften (settledResults),
    // vilket gör varje avvisning "hanterad" och testet blint.
    let anrop = 0
    const share = () => {
      anrop++
      return Promise.reject(Object.assign(new Error('avbruten'), { name: 'AbortError' }))
    }
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })

    render(<ResultsTab />)
    fireEvent.click(await screen.findByRole('button', { name: /dela resultat/i }))
    await waitFor(() => expect(anrop).toBe(1))
    await new Promise(r => setTimeout(r, 20))
    process.off('unhandledRejection', lyssnare)
    expect(avvisningar).toHaveLength(0)
  })

  it('historikknappen berättar om den är utfälld', async () => {
    render(<ResultsTab />)
    const knapp = await screen.findByRole('button', { name: /tidigare resultat/i })
    expect(knapp).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(knapp)
    expect(knapp).toHaveAttribute('aria-expanded', 'true')
  })

  it('historikraderna går att nå och öppna med tangentbordet', async () => {
    render(<ResultsTab />)
    fireEvent.click(await screen.findByRole('button', { name: /tidigare resultat/i }))
    const rader = screen.getAllByRole('button').filter(b => b.hasAttribute('aria-expanded') && b.getAttribute('tabindex') === '0')
    expect(rader.length).toBe(2)
    fireEvent.keyDown(rader[1], { key: 'Enter' })
    expect(rader[1]).toHaveAttribute('aria-expanded', 'true')
  })

  it('stängknappen på tipset har ett namn', async () => {
    getHistory.mockResolvedValue([historik[0]])
    render(<ResultsTab />)
    expect(await screen.findByRole('button', { name: /stäng|close/i })).toBeInTheDocument()
  })
})
