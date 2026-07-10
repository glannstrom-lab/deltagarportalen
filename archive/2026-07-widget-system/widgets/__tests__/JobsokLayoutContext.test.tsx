import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import {
  JobsokLayoutProvider,
  useJobsokLayout,
  selectHiddenWidgets,
  type JobsokLayoutValue,
} from '../JobsokLayoutContext'
import type { WidgetLayoutItem } from '../types'

// ============================================================
// Harness — minimal stateful wrapper for hook integration tests
// ============================================================

function Harness({ initial }: { initial: WidgetLayoutItem[] }) {
  const [layout, setLayout] = useState(initial)
  const [editMode, setEditMode] = useState(false)

  const value: JobsokLayoutValue = {
    layout,
    editMode,
    setEditMode: (next) => setEditMode(next),
    hideWidget: (id) =>
      setLayout((prev) => prev.map((w) => (w.id === id ? { ...w, visible: false } : w))),
    showWidget: (id) =>
      setLayout((prev) => prev.map((w) => (w.id === id ? { ...w, visible: true } : w))),
    updateSize: (id, size) =>
      setLayout((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w))),
    resetLayout: () => setLayout(initial),
    isLoading: false,
  }

  return (
    <JobsokLayoutProvider value={value}>
      <Reader />
    </JobsokLayoutProvider>
  )
}

function Reader() {
  const ctx = useJobsokLayout()
  return (
    <div>
      <span data-testid="cv-visible">{String(ctx.layout.find((l) => l.id === 'cv')?.visible)}</span>
      <span data-testid="edit-mode">{String(ctx.editMode)}</span>
      <button onClick={() => ctx.hideWidget('cv')}>hide-cv</button>
      <button onClick={() => ctx.showWidget('cv')}>show-cv</button>
      <button onClick={() => ctx.setEditMode(true)}>edit-on</button>
    </div>
  )
}

const INITIAL_LAYOUT: WidgetLayoutItem[] = [
  { id: 'cv', size: 'M', order: 0, visible: true },
  { id: 'cl', size: 'S', order: 1, visible: true },
]

// ============================================================
// Tests
// ============================================================

describe('JobsokLayoutContext', () => {
  it('Test 1: useJobsokLayout returns context value when wrapped in provider', () => {
    render(<Harness initial={INITIAL_LAYOUT} />)
    expect(screen.getByTestId('cv-visible').textContent).toBe('true')
    expect(screen.getByTestId('edit-mode').textContent).toBe('false')
  })

  it('Test 2: useJobsokLayout throws clear error when used outside provider', () => {
    // Silence React error boundary console output
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Reader />)).toThrow(/JobsokLayoutProvider/)
    vi.restoreAllMocks()
  })

  it('Test 3: hideWidget marks layout item visible: false', () => {
    render(<Harness initial={INITIAL_LAYOUT} />)
    expect(screen.getByTestId('cv-visible').textContent).toBe('true')
    fireEvent.click(screen.getByText('hide-cv'))
    expect(screen.getByTestId('cv-visible').textContent).toBe('false')
  })

  it('Test 4: showWidget marks layout item visible: true', () => {
    const hiddenLayout: WidgetLayoutItem[] = [
      { id: 'cv', size: 'M', order: 0, visible: false },
    ]
    render(<Harness initial={hiddenLayout} />)
    expect(screen.getByTestId('cv-visible').textContent).toBe('false')
    fireEvent.click(screen.getByText('show-cv'))
    expect(screen.getByTestId('cv-visible').textContent).toBe('true')
  })

  it('Test 5: setEditMode toggles editMode in context', () => {
    render(<Harness initial={INITIAL_LAYOUT} />)
    expect(screen.getByTestId('edit-mode').textContent).toBe('false')
    fireEvent.click(screen.getByText('edit-on'))
    expect(screen.getByTestId('edit-mode').textContent).toBe('true')
  })

  it('Test 6: selectHiddenWidgets returns only items with visible: false', () => {
    const layout: WidgetLayoutItem[] = [
      { id: 'cv', size: 'M', order: 0, visible: false },
      { id: 'cl', size: 'S', order: 1, visible: true },
    ]
    const hidden = selectHiddenWidgets(layout)
    expect(hidden).toHaveLength(1)
    expect(hidden[0].id).toBe('cv')
  })
})
