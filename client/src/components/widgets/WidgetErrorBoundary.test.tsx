import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('test error')
  return <div>OK</div>
}

describe('WidgetErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(<WidgetErrorBoundary><div>Healthy</div></WidgetErrorBoundary>)
    expect(screen.getByText('Healthy')).toBeInTheDocument()
  })

  it('renders fallback when child throws', () => {
    render(
      <WidgetErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </WidgetErrorBoundary>
    )
    expect(screen.getByText('Kunde inte ladda')).toBeInTheDocument()
    expect(screen.getByText('Försök igen om en stund')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Försök igen' })).toBeInTheDocument()
  })

  it('fallback has role=alert', () => {
    render(
      <WidgetErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </WidgetErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not show widget title or icon in fallback (clean slate)', () => {
    render(
      <WidgetErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </WidgetErrorBoundary>
    )
    // Fallback uses generic AlertCircle + neutral text only
    expect(screen.queryByRole('heading', { level: 3, name: /Kunde inte ladda/i })).toBeInTheDocument()
    // No level-2 hub heading should bleed in
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('isolates failure: sibling components render normally', () => {
    render(
      <div>
        <WidgetErrorBoundary><ThrowingChild shouldThrow={true} /></WidgetErrorBoundary>
        <WidgetErrorBoundary><div>Sibling OK</div></WidgetErrorBoundary>
      </div>
    )
    expect(screen.getByText('Kunde inte ladda')).toBeInTheDocument()
    expect(screen.getByText('Sibling OK')).toBeInTheDocument()
  })
})
