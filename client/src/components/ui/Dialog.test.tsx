/**
 * Tester för Dialog (KT1) — den delade primitiven som ersätter sju
 * handkopierade modal-overlayer i components/consultant/ som inte gick att
 * stänga med Esc, saknade fokusfälla och läckte tangentbordsfokus rakt
 * igenom till sidan bakom.
 *
 * offsetParent-shimmen (jsdom returnerar annars alltid null, vilket gör
 * useFocusTrap blind för fokuserbara element) ligger globalt i
 * test/setup.ts sedan den här uppgiften — ingen lokal shim behövs här.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { Dialog } from './Dialog'

afterEach(() => {
  cleanup()
  document.getElementById('root')?.remove()
})

/** Harness med en trigger-knapp utanför dialogen — för fokusåterställning. */
function Harness({ onCloseSpy }: { onCloseSpy?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div id="root">
      <button onClick={() => setOpen(true)}>Öppna dialog</button>
      <Dialog
        isOpen={open}
        onClose={() => {
          setOpen(false)
          onCloseSpy?.()
        }}
        labelledBy="test-dialog-title"
      >
        <h2 id="test-dialog-title">Testdialog</h2>
        <button>Första knappen</button>
        <input aria-label="Ett fält" />
        <button>Sista knappen</button>
      </Dialog>
    </div>
  )
}

describe('Dialog — grundsemantik', () => {
  it('renderas inte alls när isOpen är false', () => {
    render(<Dialog isOpen={false} onClose={vi.fn()} labelledBy="x">Innehåll</Dialog>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('role="dialog", aria-modal och aria-labelledby är satta', async () => {
    render(
      <Dialog isOpen onClose={vi.fn()} labelledBy="my-title">
        <h2 id="my-title">Min dialog</h2>
      </Dialog>
    )
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'my-title')
  })
})

describe('Dialog — Escape stänger (WCAG 2.1.2)', () => {
  it('Escape anropar onClose', async () => {
    const onClose = vi.fn()
    render(
      <Dialog isOpen onClose={onClose} labelledBy="t">
        <h2 id="t">T</h2>
        <button>Knapp</button>
      </Dialog>
    )
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('Dialog — fokusfälla', () => {
  it('Tab från sista fokuserbara elementet hoppar till det första (cyklar inom dialogen)', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Öppna dialog'))
    const dialog = await screen.findByRole('dialog')
    const first = screen.getByRole('button', { name: 'Första knappen' })
    const last = screen.getByRole('button', { name: 'Sista knappen' })

    // Vänta in autoFocus (schemalagd via requestAnimationFrame i useFocusTrap).
    await waitFor(() => expect(document.activeElement).toBe(first))

    last.focus()
    expect(document.activeElement).toBe(last)
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(document.activeElement).toBe(first)
  })

  it('Shift+Tab från första elementet hoppar till det sista', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Öppna dialog'))
    const dialog = await screen.findByRole('dialog')
    const first = screen.getByRole('button', { name: 'Första knappen' })
    const last = screen.getByRole('button', { name: 'Sista knappen' })

    await waitFor(() => expect(document.activeElement).toBe(first))

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })
})

describe('Dialog — fokusåterställning', () => {
  it('fokus flyttas till dialogen vid öppning och tillbaka till triggern vid stängning', async () => {
    render(<Harness />)
    const trigger = screen.getByText('Öppna dialog')
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    fireEvent.click(trigger)
    const first = await screen.findByRole('button', { name: 'Första knappen' })
    await waitFor(() => expect(document.activeElement).toBe(first))

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})

describe('Dialog — bakgrunden görs otillgänglig (inert)', () => {
  it('sätter inert på #root medan dialogen är öppen och tar bort det vid stängning', async () => {
    render(<Harness />)
    const root = document.getElementById('root') as HTMLElement
    expect(root.hasAttribute('inert')).toBe(false)

    fireEvent.click(screen.getByText('Öppna dialog'))
    await screen.findByRole('dialog')
    expect(root.hasAttribute('inert')).toBe(true)

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(root.hasAttribute('inert')).toBe(false))
  })

  it('två samtidigt öppna dialoger: den innersta stänger utan att göra bakgrunden nåbar för tidigt', async () => {
    function DoubleHarness() {
      const [outerOpen, setOuterOpen] = useState(true)
      const [innerOpen, setInnerOpen] = useState(true)
      return (
        <div id="root">
          <Dialog isOpen={outerOpen} onClose={() => setOuterOpen(false)} labelledBy="outer-t">
            <h2 id="outer-t">Yttre</h2>
            <Dialog isOpen={innerOpen} onClose={() => setInnerOpen(false)} labelledBy="inner-t">
              <h2 id="inner-t">Inre</h2>
              <button onClick={() => setInnerOpen(false)}>Stäng inre</button>
            </Dialog>
          </Dialog>
        </div>
      )
    }
    render(<DoubleHarness />)
    const root = document.getElementById('root') as HTMLElement
    expect(root.hasAttribute('inert')).toBe(true)

    fireEvent.click(screen.getByText('Stäng inre'))
    // Den yttre dialogen är fortfarande öppen — bakgrunden ska förbli inert.
    expect(root.hasAttribute('inert')).toBe(true)
  })
})
