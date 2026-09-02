/**
 * TI3 — DropdownMenu-primitiven hade noll aria-attribut (grep "aria-" gav
 * inga träffar). Sex användningsställen ärvde bristen: en skärmläsare hörde
 * "knapp", inget om att en meny fanns eller om den var öppen.
 *
 * Testerna täcker mönstret hämtat från NotificationBell.tsx:
 * aria-haspopup/aria-expanded/aria-controls på triggern, role="menu"/
 * "menuitem" på innehållet, Escape stänger och återför fokus, piltangenter
 * flyttar fokus mellan alternativen.
 *
 * `asChild`-fallet testas mot BÅDE en vanlig `<button>` och den riktiga
 * `Button`-komponenten (components/ui/Button.tsx) — den senare är INTE
 * forwardRef, vilket är precis varför fokusåterföringen i primitiven bygger
 * på `event.currentTarget` i onClick och inte på en ref via cloneElement (se
 * kommentaren i DropdownMenu.tsx). Ett test bara mot en vanlig `<button>`
 * hade inte avslöjat om den lösningen faktiskt behövdes.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './DropdownMenu'
import { Button } from './Button'

afterEach(() => cleanup())

function renderPlainMenu() {
  return render(
    <DropdownMenu>
      <DropdownMenuTrigger>Öppna meny</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => {}}>Alternativ 1</DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>Alternativ 2</DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>Alternativ 3</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function renderAsChildMenu() {
  return render(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Fler åtgärder">Meny</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => {}}>Alternativ 1</DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>Alternativ 2</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe('DropdownMenu — aria-attribut på triggern', () => {
  it('har aria-haspopup="menu" och aria-expanded="false" innan menyn öppnas, utan aria-controls', () => {
    renderPlainMenu()
    const trigger = screen.getByRole('button', { name: 'Öppna meny' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-controls')
  })

  it('sätter aria-expanded="true" och aria-controls mot menyns id när den öppnas', async () => {
    const user = userEvent.setup()
    renderPlainMenu()
    const trigger = screen.getByRole('button', { name: 'Öppna meny' })

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu')
    expect(trigger.getAttribute('aria-controls')).toBe(menu.getAttribute('id'))
  })

  it('samma aria-attribut sätts på ett asChild-barn som INTE är forwardRef (components/ui/Button)', async () => {
    const user = userEvent.setup()
    renderAsChildMenu()
    const trigger = screen.getByRole('button', { name: 'Fler åtgärder' })

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('DropdownMenu — innehåll och menyalternativ', () => {
  it('innehållet har role="menu" och varje alternativ role="menuitem"', async () => {
    const user = userEvent.setup()
    renderPlainMenu()
    await user.click(screen.getByRole('button', { name: 'Öppna meny' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
  })

  it('flyttar fokus till första menyalternativet när menyn öppnas', async () => {
    const user = userEvent.setup()
    renderPlainMenu()
    await user.click(screen.getByRole('button', { name: 'Öppna meny' }))

    expect(screen.getByRole('menuitem', { name: 'Alternativ 1' })).toHaveFocus()
  })
})

describe('DropdownMenu — tangentbord', () => {
  it('Escape stänger menyn och återför fokus till triggerknappen', async () => {
    const user = userEvent.setup()
    renderPlainMenu()
    const trigger = screen.getByRole('button', { name: 'Öppna meny' })
    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('ArrowDown på en stängd trigger öppnar menyn', async () => {
    const user = userEvent.setup()
    renderPlainMenu()
    const trigger = screen.getByRole('button', { name: 'Öppna meny' })
    trigger.focus()

    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('ArrowDown/ArrowUp flyttar fokus mellan menyalternativen och wrappar runt', async () => {
    const user = userEvent.setup()
    renderPlainMenu()
    await user.click(screen.getByRole('button', { name: 'Öppna meny' }))

    expect(screen.getByRole('menuitem', { name: 'Alternativ 1' })).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Alternativ 2' })).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Alternativ 3' })).toHaveFocus()

    // Wrap-around förbi sista alternativet
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Alternativ 1' })).toHaveFocus()

    // Wrap-around bakåt förbi första alternativet
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Alternativ 3' })).toHaveFocus()
  })

  it('att välja ett alternativ stänger menyn och återför fokus till triggerknappen — även för ett asChild-barn utan forwardRef', async () => {
    const user = userEvent.setup()
    renderAsChildMenu()
    const trigger = screen.getByRole('button', { name: 'Fler åtgärder' })

    await user.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: 'Alternativ 1' }))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
