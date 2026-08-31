/**
 * Tester för ReportDraftDialog — tillgänglighet (KT1).
 *
 * Dialogen saknade helt role="dialog", aria-modal och Esc-stängning innan
 * migreringen till den delade `Dialog`-primitiven (components/ui/Dialog.tsx).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ReportDraftDialog } from './ReportDraftDialog'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'consultant-1' } } }) },
  },
}))
vi.mock('@/services/aiApi', () => ({
  callAI: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderDialog(overrides: Partial<React.ComponentProps<typeof ReportDraftDialog>> = {}) {
  const onClose = vi.fn()
  const utils = render(
    <ReportDraftDialog isOpen onClose={onClose} participantId="p1" {...overrides} />
  )
  return { ...utils, onClose }
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
