/**
 * ConfirmDialog — varje `await confirm()` ska få ett svar.
 *
 * Före 2026-09-22 skrev en andra fråga (medan den första stod öppen) rakt över
 * den första i state. Den första promisen löstes aldrig, och anroparens
 * `await confirm()` blev hängande för alltid — med det som anroparen låst
 * under väntan (en knapp i "arbetar"-läge, en flagga) kvar i det läget.
 *
 * Mutation: ta bort `prev.resolve?.(false)` → första testet faller (timeout
 * ersätts av ett explicit "fortfarande väntande").
 */
import { useEffect } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@/test/utils'
import { ConfirmDialogProvider, useConfirmDialog } from './ConfirmDialog'

afterEach(() => cleanup())

const fraga: { current: ReturnType<typeof useConfirmDialog>['confirm'] | null } = { current: null }
function Fangare() {
  const { confirm } = useConfirmDialog()
  useEffect(() => {
    fraga.current = confirm
  }, [confirm])
  return null
}

function renderaProvider() {
  render(
    <ConfirmDialogProvider>
      <Fangare />
    </ConfirmDialogProvider>
  )
  return fraga.current!
}

describe('ConfirmDialog', () => {
  it('en andra fråga besvarar den första med nej i stället för att lämna den hängande', async () => {
    const confirm = renderaProvider()
    const svar: Array<boolean | 'väntar'> = ['väntar', 'väntar']

    await act(async () => {
      void confirm({ title: 'Första', message: 'a' }).then((v) => { svar[0] = v })
    })
    await act(async () => {
      void confirm({ title: 'Andra', message: 'b' }).then((v) => { svar[1] = v })
    })

    expect(svar[0]).toBe(false)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Andra')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /bekräfta|confirm/i }))
    })
    expect(svar[1]).toBe(true)
  })

  it('Avbryt ger nej och stänger dialogen', async () => {
    const confirm = renderaProvider()
    let svar: boolean | null = null
    await act(async () => {
      void confirm({ title: 'Ta bort?', message: 'x' }).then((v) => { svar = v })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^(avbryt|cancel)$/i }))
    })
    expect(svar).toBe(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
