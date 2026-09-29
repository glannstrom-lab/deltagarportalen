/**
 * Övningarnas gränssnitt (driftpasset 2026-09-29):
 *  · "Rensa mina svar" gick genom window.confirm() — en webbläsardialog som inte
 *    går att styra och som aldrig följer språket. Nu ConfirmDialog.
 *  · Steg-raden, knapparna och rensa-länken var hårdkodad svenska i engelskt läge.
 *
 * Mutationer:
 *  · sätt tillbaka `confirm(t(...))` (window.confirm) i handleClearProgress → "utan window.confirm" faller
 *  · sätt tillbaka `Steg {currentStep + 1} av …` som bar text → "engelska" faller
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

const raderade: number[] = []

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: () => {
      const kedja: Record<string, unknown> = {}
      kedja.select = () => kedja
      kedja.upsert = () => Promise.resolve({ error: null })
      kedja.delete = () => {
        raderade.push(1)
        return kedja
      }
      kedja.eq = () => kedja
      kedja.then = (res: (v: unknown) => unknown) => res({ data: [], error: null })
      return kedja
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
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'

beforeEach(() => {
  raderade.length = 0
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})
afterEach(() => cleanup())

async function oppnaOvning() {
  render(<MemoryRouter><ConfirmDialogProvider><Exercises /></ConfirmDialogProvider></MemoryRouter>)
  fireEvent.click(await screen.findByText('Dina styrkor'))
  await screen.findByLabelText('Vad är du bra på?')
}

describe('Exercises — rensa svar', () => {
  it('frågar i en egen dialog, inte med window.confirm, och rensar först efter ja', async () => {
    const nativ = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await oppnaOvning()

    fireEvent.click(screen.getByRole('button', { name: 'Rensa mina svar' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Är du säker på att du vill rensa alla dina svar')
    expect(nativ).not.toHaveBeenCalled()
    expect(raderade).toHaveLength(0)

    // Nej: inget raderas.
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(raderade).toHaveLength(0)

    // Ja: raderas.
    fireEvent.click(screen.getByRole('button', { name: 'Rensa mina svar' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Rensa' }))
    await waitFor(() => expect(raderade).toHaveLength(1))
    nativ.mockRestore()
  })
})

describe('Exercises — engelskt läge', () => {
  it('visar steg-raden, knapparna och rensa-länken på engelska', async () => {
    const { default: i18n } = await import('@/i18n/config')
    const { default: en } = await import('@/i18n/locales/en.json')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    // Nycklarna i C1.json slås ihop i en.json av den som äger språkfilerna; tills dess läggs de hit.
    i18n.addResourceBundle('en', 'translation', {
      exercises: {
        stepOf: 'Step {{current}} of {{total}}',
        clearProgress: 'Clear my answers',
        previous: 'Previous',
        finish: 'Finish',
        backToExercises: 'Back to exercises',
        tipLabel: 'Tip:',
      },
    }, true, true)
    await i18n.changeLanguage('en')
    try {
      await oppnaOvning()
      expect(screen.getByText('Step 1 of 1')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Clear my answers' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Finish/ })).toBeInTheDocument()
      expect(screen.queryByText(/Rensa progress/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Steg 1 av 1/)).not.toBeInTheDocument()
      expect(screen.queryByText('Föregående')).not.toBeInTheDocument()
    } finally {
      await i18n.changeLanguage('sv')
    }
  })
})
