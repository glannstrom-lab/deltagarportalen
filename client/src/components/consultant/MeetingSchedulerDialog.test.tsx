/**
 * Tester för MeetingSchedulerDialog — tillgänglighet (KT1).
 *
 * Dialogen saknade helt role="dialog", aria-modal och Esc-stängning innan
 * migreringen till den delade `Dialog`-primitiven (components/ui/Dialog.tsx).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MeetingSchedulerDialog } from './MeetingSchedulerDialog'

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

function renderDialog(overrides: Partial<React.ComponentProps<typeof MeetingSchedulerDialog>> = {}) {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  const utils = render(
    <MeetingSchedulerDialog isOpen onClose={onClose} onSuccess={onSuccess} {...overrides} />
  )
  return { ...utils, onClose, onSuccess }
}

describe('MeetingSchedulerDialog — tillgänglighet (WCAG 2.1.2)', () => {
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
