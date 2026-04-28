import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import { HiddenWidgetsPanel } from './HiddenWidgetsPanel'
import { JobsokLayoutProvider, type JobsokLayoutValue } from './JobsokLayoutContext'
import type { WidgetLayoutItem } from './types'

// ---------------------------------------------------------------------------
// Mock useConfirmDialog so tests control resolution per test
// ---------------------------------------------------------------------------
const mockConfirm = vi.fn()
vi.mock('@/components/ui/ConfirmDialog', async (orig) => {
  const actual = await orig() as Record<string, unknown>
  return {
    ...actual,
    useConfirmDialog: () => ({ confirm: mockConfirm }),
  }
})

// ---------------------------------------------------------------------------
// Helper: render panel with controlled layout + callbacks
// ---------------------------------------------------------------------------
function renderPanel(opts: {
  layout: WidgetLayoutItem[]
  isOpen?: boolean
  onClose?: () => void
  showWidget?: (id: string) => void
  resetLayout?: () => void
}) {
  const value: JobsokLayoutValue = {
    layout: opts.layout,
    editMode: true,
    setEditMode: vi.fn(),
    hideWidget: vi.fn(),
    showWidget: opts.showWidget ?? vi.fn(),
    updateSize: vi.fn(),
    resetLayout: opts.resetLayout ?? vi.fn(),
    isLoading: false,
  }
  return render(
    <ConfirmDialogProvider>
      <JobsokLayoutProvider value={value}>
        <HiddenWidgetsPanel
          isOpen={opts.isOpen ?? true}
          onClose={opts.onClose ?? vi.fn()}
        />
      </JobsokLayoutProvider>
    </ConfirmDialogProvider>,
  )
}

beforeEach(() => {
  mockConfirm.mockReset()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HiddenWidgetsPanel', () => {
  it('Test 1: lists every layout item with visible:false using its WIDGET_LABELS name', () => {
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: false, size: 'L', order: 0 },
      { id: 'salary', visible: true, size: 'M', order: 1 },
      { id: 'interview', visible: false, size: 'M', order: 2 },
    ]
    renderPanel({ layout })
    expect(screen.getByText('Mitt CV')).toBeInTheDocument()
    expect(screen.getByText('Intervjuträning')).toBeInTheDocument()
    expect(screen.queryByText('Lön & förhandling')).toBeNull()
  })

  it("Test 2: renders 'Inga dolda widgets' empty state when no hidden widgets", () => {
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
      { id: 'salary', visible: true, size: 'M', order: 1 },
    ]
    renderPanel({ layout })
    expect(screen.getByText(/Inga dolda widgets/i)).toBeInTheDocument()
  })

  it("Test 3: each row has a 'Återvisa'-button with aria-label='Återvisa widget {name}'", () => {
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: false, size: 'L', order: 0 },
    ]
    renderPanel({ layout })
    expect(screen.getByRole('button', { name: 'Återvisa widget Mitt CV' })).toBeInTheDocument()
  })

  it("Test 4: clicking 'Återvisa' on a row calls showWidget(id) with that widget's id", () => {
    const showWidget = vi.fn()
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: false, size: 'L', order: 0 },
    ]
    renderPanel({ layout, showWidget })
    fireEvent.click(screen.getByRole('button', { name: 'Återvisa widget Mitt CV' }))
    expect(showWidget).toHaveBeenCalledTimes(1)
    expect(showWidget).toHaveBeenCalledWith('cv')
  })

  it("Test 5: panel renders Reset button at bottom with text matching 'Återställ standardlayout'", () => {
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
    ]
    renderPanel({ layout })
    expect(screen.getByRole('button', { name: /Återställ standardlayout/i })).toBeInTheDocument()
  })

  it('Test 6: clicking Reset opens ConfirmDialog with locked Swedish copy', async () => {
    mockConfirm.mockResolvedValue(false)
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
    ]
    renderPanel({ layout })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Återställ standardlayout/i }))
    })
    expect(mockConfirm).toHaveBeenCalledTimes(1)
    expect(mockConfirm.mock.calls[0][0]).toEqual({
      title: 'Återställ layout?',
      message: 'Är du säker? Detta tar bort alla anpassningar för denna hub.',
      confirmText: 'Återställ',
      cancelText: 'Avbryt',
      variant: 'warning',
    })
  })

  it('Test 7: on confirm:true, resetLayout() is called', async () => {
    mockConfirm.mockResolvedValue(true)
    const resetLayout = vi.fn()
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
    ]
    renderPanel({ layout, resetLayout })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Återställ standardlayout/i }))
      await Promise.resolve()
    })
    expect(resetLayout).toHaveBeenCalledTimes(1)
  })

  it('Test 8: on confirm:false (cancel), resetLayout NOT called', async () => {
    mockConfirm.mockResolvedValue(false)
    const resetLayout = vi.fn()
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
    ]
    renderPanel({ layout, resetLayout })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Återställ standardlayout/i }))
      await Promise.resolve()
    })
    expect(resetLayout).not.toHaveBeenCalled()
  })

  it('Test 9: panel closes on Escape key (calls onClose prop)', () => {
    const onClose = vi.fn()
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
    ]
    renderPanel({ layout, onClose })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Test 10: panel closes on click outside the panel container (onClose called)', () => {
    const onClose = vi.fn()
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
    ]
    renderPanel({ layout, onClose })
    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Test 11: panel does NOT call onClose when clicking inside the panel', () => {
    const onClose = vi.fn()
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
    ]
    renderPanel({ layout, onClose })
    const panel = screen.getByRole('region', { name: 'Dolda widgets' })
    fireEvent.mouseDown(panel)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Test 12: panel does NOT render when isOpen=false', () => {
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
    ]
    renderPanel({ layout, isOpen: false })
    expect(screen.queryByRole('region', { name: /dolda widgets/i })).toBeNull()
  })

  it("Test 13: panel container has role='region' and aria-label='Dolda widgets'", () => {
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', visible: true, size: 'L', order: 0 },
    ]
    renderPanel({ layout })
    expect(screen.getByRole('region', { name: 'Dolda widgets' })).toBeInTheDocument()
  })
})
