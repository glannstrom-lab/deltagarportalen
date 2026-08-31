/**
 * Tester för InviteParticipantDialog — tillgänglighet (KT1).
 *
 * Dialogen saknade helt role="dialog", aria-modal och Esc-stängning innan
 * migreringen till den delade `Dialog`-primitiven (components/ui/Dialog.tsx).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { InviteParticipantDialog } from './InviteParticipantDialog'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: 'consultant-1' } } }),
      getSession: async () => ({ data: { session: null } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: 'inv-1' }, error: null }),
        }),
      }),
    }),
  },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderDialog(overrides: Partial<React.ComponentProps<typeof InviteParticipantDialog>> = {}) {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  const utils = render(
    <InviteParticipantDialog isOpen onClose={onClose} onSuccess={onSuccess} {...overrides} />
  )
  return { ...utils, onClose, onSuccess }
}

describe('InviteParticipantDialog — tillgänglighet (WCAG 2.1.2)', () => {
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
