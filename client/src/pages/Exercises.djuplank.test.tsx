/**
 * Djuplänken ?id= följer URL:en även när sidan redan är monterad
 * (react-hooks/exhaustive-deps, 2026-09-24).
 *
 * Före: djuplänken lästes i en effekt med tomma beroenden, alltså bara vid
 * första monteringen. /exercises?id=a → /exercises?id=b byter inte rutt och
 * monterar inte om sidan, så övning b öppnades aldrig — deltagaren stod kvar
 * på a (eller listan) trots att adressen sa b.
 *
 * Mutation: läs djuplänken bara vid montering igen → "byter övning" faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: () => {
      const b: Record<string, unknown> = {}
      b.select = () => b
      b.eq = () => Promise.resolve({ data: [], error: null })
      b.upsert = () => Promise.resolve({ error: null })
      return b
    },
  },
}))

const ovning = (id: string, title: string, fraga: string) => ({
  id, title, description: 'd', icon: () => null, category: 'Självkännedom',
  duration: '10 min', difficulty: 'Lätt',
  steps: [{ id: 1, title: 'Steg 1', description: 'd', questions: [{ id: 'q1', text: fraga }] }],
})
vi.mock('@/services/contentApi', () => ({
  contentExerciseApi: {
    getAll: async () => [ovning('a', 'Övning A', 'Fråga i A'), ovning('b', 'Övning B', 'Fråga i B')],
  },
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

function GaTill({ till }: { till: string }) {
  const navigate = useNavigate()
  return <button onClick={() => navigate(till)}>gå vidare</button>
}

afterEach(cleanup)

describe('Exercises — djuplänk ?id=', () => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

  it('öppnar övningen i länken vid första laddningen', async () => {
    render(<MemoryRouter initialEntries={['/exercises?id=a']}><Exercises /></MemoryRouter>)
    expect(await screen.findByLabelText('Fråga i A')).toBeInTheDocument()
  })

  it('byter övning när ?id= ändras utan att sidan monteras om', async () => {
    render(
      <MemoryRouter initialEntries={['/exercises?id=a']}>
        <Exercises />
        <GaTill till="/exercises?id=b" />
      </MemoryRouter>,
    )
    await screen.findByLabelText('Fråga i A')
    fireEvent.click(screen.getByText('gå vidare'))
    expect(await screen.findByLabelText('Fråga i B')).toBeInTheDocument()
  })
})
