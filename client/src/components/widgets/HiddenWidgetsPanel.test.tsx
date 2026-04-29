import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import { HiddenWidgetsPanel } from './HiddenWidgetsPanel'
import type { WidgetLayoutItem } from './types'

// ---------------------------------------------------------------------------
// Helper: render panel directly with props (no provider needed)
// ---------------------------------------------------------------------------
function renderPanel(props: {
  layout?: WidgetLayoutItem[]
  isOpen?: boolean
  onClose?: ReturnType<typeof vi.fn>
  onShowWidget?: ReturnType<typeof vi.fn>
  onResetLayout?: ReturnType<typeof vi.fn>
}) {
  const onClose = props.onClose ?? vi.fn()
  const onShowWidget = props.onShowWidget ?? vi.fn()
  const onResetLayout = props.onResetLayout ?? vi.fn()
  const result = render(
    <ConfirmDialogProvider>
      <HiddenWidgetsPanel
        isOpen={props.isOpen ?? true}
        onClose={onClose}
        layout={props.layout ?? []}
        onShowWidget={onShowWidget}
        onResetLayout={onResetLayout}
      />
    </ConfirmDialogProvider>,
  )
  return { ...result, onClose, onShowWidget, onResetLayout }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HiddenWidgetsPanel — props-based (hub-agnostic)', () => {
  it('Test 1: renders empty state with layout=[] and shows Inga dolda widgets + Återställ button', () => {
    renderPanel({ layout: [] })
    expect(screen.getByText(/Inga dolda widgets/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Återställ standardlayout/i })).toBeInTheDocument()
  })

  it('Test 2: renders one Återvisa button labelled Återvisa widget Mitt CV when cv is hidden', () => {
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: false, size: 'M', order: 0 },
    ]
    renderPanel({ layout })
    expect(screen.getByRole('button', { name: 'Återvisa widget Mitt CV' })).toBeInTheDocument()
  })

  it('Test 3: clicking Återvisa button calls onShowWidget(cv) exactly once', () => {
    const onShowWidget = vi.fn()
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: false, size: 'M', order: 0 },
    ]
    renderPanel({ layout, onShowWidget })
    fireEvent.click(screen.getByRole('button', { name: 'Återvisa widget Mitt CV' }))
    expect(onShowWidget).toHaveBeenCalledTimes(1)
    expect(onShowWidget).toHaveBeenCalledWith('cv')
  })

  it('Test 4: clicking Återställ, confirming dialog, calls onResetLayout and onClose exactly once each', async () => {
    const onResetLayout = vi.fn()
    const onClose = vi.fn()
    renderPanel({ layout: [], onResetLayout, onClose })

    // Click the panel's reset button to open confirm dialog
    await userEvent.click(screen.getByRole('button', { name: /Återställ standardlayout/i }))

    // Wait for the confirm dialog to appear — it renders inside ConfirmDialogProvider
    // The dialog's confirm button has text from confirmText='Återställ'
    // The dialog renders as role="dialog"
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()

    // Find the Återställ confirm button inside the dialog (not the panel's reset button)
    // The panel is hidden when dialog opens (isOpen state doesn't change, but dialog is on top)
    // Click the confirm button in the dialog
    const allBtns = screen.getAllByRole('button', { name: /Återställ/i })
    // The last button with Återställ text is the dialog's confirm button
    await userEvent.click(allBtns[allBtns.length - 1])

    expect(onResetLayout).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Test 5: pressing Escape calls onClose exactly once when isOpen=true', () => {
    const onClose = vi.fn()
    renderPanel({ layout: [], onClose, isOpen: true })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Test 6: HiddenWidgetsPanel.tsx does NOT import useJobsokLayout or selectHiddenWidgets', () => {
    const source = readFileSync(
      join(__dirname, 'HiddenWidgetsPanel.tsx'),
      'utf-8',
    )
    expect(source).not.toContain('useJobsokLayout')
    expect(source).not.toContain('selectHiddenWidgets')
  })
})
