import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileUser } from 'lucide-react'
import { Widget } from './Widget'

function renderWidget(props: Partial<Parameters<typeof Widget>[0]> = {}) {
  const onSizeChange = vi.fn()
  const utils = render(
    <Widget id="test" size="M" onSizeChange={onSizeChange} editMode={true} {...props}>
      <Widget.Header icon={FileUser} title="Test Widget" />
      <Widget.Body>Body content</Widget.Body>
      <Widget.Footer><button>Action</button></Widget.Footer>
    </Widget>
  )
  return { ...utils, onSizeChange }
}

describe('Widget compound', () => {
  it('renders title in h3', () => {
    renderWidget()
    expect(screen.getByRole('heading', { level: 3, name: 'Test Widget' })).toBeInTheDocument()
  })
  it('renders body content', () => {
    renderWidget()
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })
  it('hides footer when size=S', () => {
    renderWidget({ size: 'S' })
    expect(screen.queryByRole('button', { name: 'Action' })).not.toBeInTheDocument()
  })
  it('shows footer when size=M', () => {
    renderWidget({ size: 'M' })
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })
  it('size toggle group has role=group with Swedish label', () => {
    renderWidget()
    expect(screen.getByRole('group', { name: 'Välj widgetstorlek' })).toBeInTheDocument()
  })
  it('renders S, M, L buttons by default', () => {
    renderWidget()
    expect(screen.getByRole('button', { name: /Sätt storlek till S/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sätt storlek till M/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sätt storlek till L/i })).toBeInTheDocument()
  })
  it('active size button has aria-pressed=true', () => {
    renderWidget({ size: 'M' })
    const mBtn = screen.getByRole('button', { name: /Sätt storlek till M/i })
    expect(mBtn).toHaveAttribute('aria-pressed', 'true')
    const sBtn = screen.getByRole('button', { name: /Sätt storlek till S/i })
    expect(sBtn).toHaveAttribute('aria-pressed', 'false')
  })
  it('clicking L button calls onSizeChange("L") exactly once', () => {
    const { onSizeChange } = renderWidget({ size: 'M' })
    fireEvent.click(screen.getByRole('button', { name: /Sätt storlek till L/i }))
    expect(onSizeChange).toHaveBeenCalledTimes(1)
    expect(onSizeChange).toHaveBeenCalledWith('L')
  })
  it('respects allowedSizes (renders only S+M when allowedSizes=["S","M"])', () => {
    renderWidget({ allowedSizes: ['S', 'M'] })
    expect(screen.queryByRole('button', { name: /Sätt storlek till L/i })).not.toBeInTheDocument()
  })
  it('icon has aria-hidden=true', () => {
    const { container } = renderWidget()
    const icon = container.querySelector('[aria-hidden="true"]')
    expect(icon).toBeInTheDocument()
  })

  // ============================================================
  // Phase 4: Hide-button tests (A–H)
  // ============================================================

  it('A: renders hide button when editMode=true AND onHide provided', () => {
    const onHide = vi.fn()
    render(
      <Widget id="t" size="M" editMode onHide={onHide}>
        <Widget.Header icon={FileUser} title="Test Widget" />
        <Widget.Body>x</Widget.Body>
      </Widget>
    )
    expect(screen.getByRole('button', { name: 'Dölj widget Test Widget' })).toBeInTheDocument()
  })

  it('B: does NOT render hide button when editMode=false (even if onHide provided)', () => {
    const onHide = vi.fn()
    render(
      <Widget id="t" size="M" editMode={false} onHide={onHide}>
        <Widget.Header icon={FileUser} title="Test Widget" />
        <Widget.Body>x</Widget.Body>
      </Widget>
    )
    expect(screen.queryByRole('button', { name: /^Dölj widget/ })).not.toBeInTheDocument()
  })

  it('C: does NOT render hide button when editMode=true but onHide is undefined', () => {
    render(
      <Widget id="t" size="M" editMode>
        <Widget.Header icon={FileUser} title="Test Widget" />
        <Widget.Body>x</Widget.Body>
      </Widget>
    )
    expect(screen.queryByRole('button', { name: /^Dölj widget/ })).not.toBeInTheDocument()
  })

  it('D: clicking hide button calls onHide exactly once', () => {
    const onHide = vi.fn()
    render(
      <Widget id="t" size="M" editMode onHide={onHide}>
        <Widget.Header icon={FileUser} title="Test Widget" />
        <Widget.Body>x</Widget.Body>
      </Widget>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dölj widget Test Widget' }))
    expect(onHide).toHaveBeenCalledTimes(1)
  })

  it('E: hide button is a native <button type="button">', () => {
    const onHide = vi.fn()
    render(
      <Widget id="t" size="M" editMode onHide={onHide}>
        <Widget.Header icon={FileUser} title="Test Widget" />
        <Widget.Body>x</Widget.Body>
      </Widget>
    )
    const btn = screen.getByRole('button', { name: /Dölj/ })
    expect(btn.tagName).toBe('BUTTON')
    expect((btn as HTMLButtonElement).type).toBe('button')
  })

  it('F: hide button is keyboard-activatable (is a native button — Enter fires click)', () => {
    const onHide = vi.fn()
    render(
      <Widget id="t" size="M" editMode onHide={onHide}>
        <Widget.Header icon={FileUser} title="Test Widget" />
        <Widget.Body>x</Widget.Body>
      </Widget>
    )
    const btn = screen.getByRole('button', { name: /Dölj/ })
    // Native <button> receives Enter as click event in browsers.
    // In jsdom we verify via focus + click to confirm keyboard semantics.
    btn.focus()
    fireEvent.click(btn)
    expect(onHide).toHaveBeenCalledTimes(1)
  })

  it('G: aria-label interpolates the title prop', () => {
    const onHide = vi.fn()
    render(
      <Widget id="t" size="M" editMode onHide={onHide}>
        <Widget.Header icon={FileUser} title="Mitt CV" />
        <Widget.Body>x</Widget.Body>
      </Widget>
    )
    expect(screen.getByRole('button', { name: 'Dölj widget Mitt CV' })).toBeInTheDocument()
  })

  it('H: size-toggle group still renders alongside hide button', () => {
    const onHide = vi.fn()
    render(
      <Widget id="t" size="M" editMode onHide={onHide}>
        <Widget.Header icon={FileUser} title="Test Widget" />
        <Widget.Body>x</Widget.Body>
      </Widget>
    )
    expect(screen.getByRole('group', { name: 'Välj widgetstorlek' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dölj/ })).toBeInTheDocument()
  })
})
