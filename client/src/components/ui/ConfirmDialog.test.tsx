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
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render as rtlRender } from '@testing-library/react'
import { render, screen, cleanup, fireEvent, act, within } from '@/test/utils'
import { ConfirmDialogProvider, useConfirmDialog } from './ConfirmDialog'
import { Dialog } from './Dialog'

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

/**
 * Ovanpå en `Dialog`: den sätter `inert` på `#root` medan den är öppen. Låg
 * bekräftelsen kvar i `#root` gick den varken att klicka på eller nå med
 * tangentbordet. Och eftersom `Dialog`s fokusfälla stänger vid `mousedown`
 * utanför sig själv och lyssnar på Escape på `document`, fick bekräftelsen inte
 * heller släppa igenom de händelserna — då stängdes dialogen under den.
 *
 * Mutationer: ta bort `createPortal` → "ligger utanför #root" faller; ta bort
 * `stopPropagation` i onMouseDown → "stänger inte dialogen under" faller.
 */
describe('ConfirmDialog ovanpå en Dialog', () => {
  let rot: HTMLDivElement
  afterEach(() => {
    cleanup()
    rot?.remove()
  })

  function renderaIRot(onClose: () => void) {
    rot = document.createElement('div')
    rot.id = 'root'
    document.body.appendChild(rot)
    rtlRender(
      <ConfirmDialogProvider>
        <Fangare />
        <Dialog isOpen onClose={onClose} labelledBy="under-titel" className="x">
          <h2 id="under-titel">Under</h2>
          <button type="button">I dialogen</button>
        </Dialog>
      </ConfirmDialogProvider>,
      { container: rot }
    )
    return fraga.current!
  }

  it('ligger utanför #root och går att svara på', async () => {
    const onClose = vi.fn()
    const confirm = renderaIRot(onClose)
    expect(rot).toHaveAttribute('inert')

    let svar: boolean | null = null
    await act(async () => {
      void confirm({ title: 'Ta bort?', message: 'x' }).then((v) => { svar = v })
    })
    const dialog = screen.getByRole('dialog', { name: 'Ta bort?' })
    expect(dialog.closest('[inert]')).toBeNull()

    const ja = within(dialog).getByRole('button', { name: /bekräfta|confirm/i })
    await act(async () => {
      fireEvent.mouseDown(ja)
      fireEvent.click(ja)
    })
    expect(svar).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Escape stänger bara bekräftelsen, inte dialogen under', async () => {
    const onClose = vi.fn()
    const confirm = renderaIRot(onClose)
    let svar: boolean | null = null
    await act(async () => {
      void confirm({ title: 'Ta bort?', message: 'x' }).then((v) => { svar = v })
    })
    const dialog = screen.getByRole('dialog', { name: 'Ta bort?' })
    await act(async () => {
      fireEvent.keyDown(within(dialog).getByRole('button', { name: /bekräfta|confirm/i }), { key: 'Escape' })
    })
    expect(svar).toBe(false)
    expect(onClose).not.toHaveBeenCalled()
  })
})
