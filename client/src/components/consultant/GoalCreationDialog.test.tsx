/**
 * Tester för GoalCreationDialog — tillgänglighet (KT1).
 *
 * Dialogen saknade helt role="dialog", aria-modal och Esc-stängning innan
 * migreringen till den delade `Dialog`-primitiven (components/ui/Dialog.tsx).
 * Se PlacementDialog.test.tsx för samma mönster på grannmodalen.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { GoalCreationDialog } from './GoalCreationDialog'

const deltagare = [
  { participant_id: 'p1', first_name: 'Anna', last_name: 'Andersson', email: 'anna@example.com' },
]

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'consultant-1' } } }) },
    from: () => ({
      select: () => ({
        eq: async () => ({ data: deltagare }),
      }),
    }),
  },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderDialog(overrides: Partial<React.ComponentProps<typeof GoalCreationDialog>> = {}) {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  const utils = render(
    <GoalCreationDialog isOpen onClose={onClose} onSuccess={onSuccess} {...overrides} />
  )
  return { ...utils, onClose, onSuccess }
}

describe('GoalCreationDialog — tillgänglighet (WCAG 2.1.2)', () => {
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

  it('stängningsknappen (X) har ett tillgängligt namn', async () => {
    renderDialog()
    await screen.findByRole('dialog')
    expect(screen.getByRole('button', { name: 'Stäng' })).toBeInTheDocument()
  })
})

describe('GoalCreationDialog — PG17 (2026-09-12): titel + datum räcker, SMART är valfritt', () => {
  const initialGoal = {
    title: 'Ringa två arbetsgivare', description: '', specific: '', measurable: '',
    achievable: '', relevant: '', timeBound: '', category: 'other', priority: 'MEDIUM' as const,
  }

  it('Skapa mål är avstängd utan deadline och slår på när ett datum fyllts i', async () => {
    renderDialog({ preselectedParticipant: deltagare[0] as never, initialGoal: initialGoal as never })
    const knapp = await screen.findByRole('button', { name: /skapa mål/i })
    const datum = screen.getByLabelText(/deadline/i) as HTMLInputElement
    fireEvent.change(datum, { target: { value: '' } })
    expect(knapp).toBeDisabled()
    fireEvent.change(datum, { target: { value: '2026-10-15' } })
    expect(knapp).not.toBeDisabled()
  })

  it('SMART-fälten ligger i en utfällning som är stängd när mallen inte fyllt dem', async () => {
    renderDialog({ preselectedParticipant: deltagare[0] as never, initialGoal: initialGoal as never })
    await screen.findByRole('button', { name: /skapa mål/i })
    const utfallning = screen.getByText(/göra målet mer konkret/i).closest('details') as HTMLDetailsElement
    expect(utfallning).not.toBeNull()
    expect(utfallning.open).toBe(false)
  })
})
