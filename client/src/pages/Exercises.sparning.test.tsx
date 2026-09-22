/**
 * Övningarnas svar sparas — men inte vid varje tangenttryckning, och aldrig
 * i fel ordning (kvalitetsgenomgången 2026-09-22).
 *
 * Före: `handleAnswerChange` gjorde en upsert per tangenttryckning (11 765
 * skrivningar för 20 rader i prod). Anropen gick parallellt, så en äldre
 * skrivning som kom fram sist vann — texten i databasen blev en gammal version.
 *
 * Mutationer:
 *  · spara direkt i handleAnswerChange igen → "väntar tills man slutat skriva" faller
 *  · ta bort promise-kedjan (anropa sparaRef direkt) → "i tur och ordning" faller
 *  · ta bort avmonteringseffekten → "skriver det som väntar när sidan lämnas" faller
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

type Upsert = { answers: Record<string, string> }
const upserts: Upsert[] = []
let upsertSvar: Array<() => void> = []
let fordrojd = false

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: () => {
      const b: Record<string, unknown> = {}
      b.select = () => b
      b.eq = () => Promise.resolve({ data: [], error: null })
      b.upsert = (rad: Upsert) => {
        upserts.push(rad)
        if (!fordrojd) return Promise.resolve({ error: null })
        return new Promise((res) => upsertSvar.push(() => res({ error: null })))
      }
      return b
    },
  },
}))

const OVNING = {
  id: 'styrkor', title: 'Dina styrkor', description: 'd', icon: () => null, category: 'Självkännedom',
  duration: '10 min', difficulty: 'Lätt',
  steps: [{ id: 1, title: 'Steg 1', description: 'd', questions: [{ id: 'q1', text: 'Vad är du bra på?' }] }],
}
vi.mock('@/services/contentApi', () => ({
  contentExerciseApi: { getAll: async () => [OVNING] },
  contentArticleApi: { getByCategory: async () => [] },
}))
vi.mock('@/services/articleData', () => ({ exerciseToArticleCategoryMap: {} }))
vi.mock('@/components/ai', () => ({ AIAssistant: () => null }))
vi.mock('@/components/radgivare/RadgivarPanel', () => ({ RadgivarTips: () => null }))
vi.mock('@/components/layout/index', () => ({ PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/components/focus/shell/FokusVaxel', () => ({ FokusVaxel: ({ children }: { children: ReactNode }) => <>{children}</> }))
vi.mock('@/components/focus/pages/FocusExercisesWizard', () => ({ FocusExercisesWizard: () => null }))
vi.mock('@/components/FocusModeProvider', () => ({ useFocusMode: () => ({ leaveWizard: vi.fn() }) }))

import Exercises from './Exercises'

beforeEach(() => {
  upserts.length = 0
  upsertSvar = []
  fordrojd = false
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

async function oppnaOvning() {
  const utils = render(<MemoryRouter><Exercises /></MemoryRouter>)
  fireEvent.click(await screen.findByText('Dina styrkor'))
  const falt = await screen.findByLabelText('Vad är du bra på?')
  vi.useFakeTimers()
  return { ...utils, falt }
}

function skriv(falt: HTMLElement, text: string) {
  fireEvent.change(falt, { target: { value: text } })
}

describe('Exercises — sparning av svar', () => {
  it('väntar tills man slutat skriva och sparar bara senaste texten', async () => {
    const { falt } = await oppnaOvning()
    for (const text of ['J', 'Ja', 'Jag', 'Jag ä', 'Jag är noggrann']) skriv(falt, text)
    expect(upserts).toHaveLength(0)
    await act(async () => { vi.advanceTimersByTime(800) })
    expect(upserts).toHaveLength(1)
    expect(upserts[0].answers).toEqual({ q1: 'Jag är noggrann' })
  })

  it('skriver i tur och ordning — en äldre skrivning kan inte landa efter en nyare', async () => {
    const { falt } = await oppnaOvning()
    fordrojd = true
    skriv(falt, 'gammal')
    await act(async () => { vi.advanceTimersByTime(800) })
    expect(upserts).toHaveLength(1)
    skriv(falt, 'ny')
    await act(async () => { vi.advanceTimersByTime(800) })
    // Den första är inte klar — den andra får inte ha startat.
    expect(upserts).toHaveLength(1)
    await act(async () => { upsertSvar[0]() })
    expect(upserts).toHaveLength(2)
    expect(upserts[1].answers).toEqual({ q1: 'ny' })
  })

  it('skriver det som väntar när sidan lämnas', async () => {
    const { falt, unmount } = await oppnaOvning()
    skriv(falt, 'osparat')
    expect(upserts).toHaveLength(0)
    await act(async () => { unmount() })
    await act(async () => { await Promise.resolve() })
    expect(upserts).toHaveLength(1)
    expect(upserts[0].answers).toEqual({ q1: 'osparat' })
  })
})

describe('Exercises — filterraden på engelska (drift 2026-09-22)', () => {
  // Kortens kategori översattes, filterknapparna visade den svenska nyckeln rått.
  // Mutation: sätt tillbaka `{cat}` i filterknappen → testet faller.
  it('visar översatt kategori på filterknappen', async () => {
    const { default: i18n } = await import('@/i18n/config')
    const { default: en } = await import('@/i18n/locales/en.json')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    try {
      render(<MemoryRouter><Exercises /></MemoryRouter>)
      await screen.findByText('Dina styrkor')
      const namn = (en as unknown as { exercises: { categories: Record<string, string> } }).exercises.categories['Självkännedom']
      const knapp = screen.getAllByRole('button', { name: namn }).find((b) => b.hasAttribute('aria-pressed'))
      expect(knapp).toBeDefined()
      expect(screen.queryByRole('button', { name: 'Självkännedom' })).toBeNull()
    } finally {
      await i18n.changeLanguage('sv')
    }
  })
})
