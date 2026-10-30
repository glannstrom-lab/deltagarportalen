import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const callAI = vi.hoisted(() => vi.fn())
vi.mock('@/services/aiApi', () => ({ callAI: (...a: unknown[]) => callAI(...a) }))

import { Rattstavning } from './Rattstavning'
import { tillampaRattningar } from '@/services/rattstavningApi'

const TEXT = 'Jag är nogrann och söker pa lagret. Jag är nogrann med det.'

describe('tillampaRattningar', () => {
  it('byter bara godkänd bit som finns exakt en gång, resten orört', () => {
    const r = tillampaRattningar(TEXT, [{ fore: 'söker pa lagret', efter: 'söker på lagret' }])
    expect(r.text).toBe('Jag är nogrann och söker på lagret. Jag är nogrann med det.')
    expect(r.tillampade).toBe(1)
  })
  it('hoppar över tvetydiga och försvunna bitar', () => {
    const r = tillampaRattningar(TEXT, [{ fore: 'nogrann', efter: 'noggrann' }, { fore: 'finns inte', efter: 'x' }])
    expect(r.text).toBe(TEXT)
    expect(r.overhoppade).toBe(2)
  })
})

describe('Rattstavning', () => {
  beforeEach(() => { callAI.mockReset() })

  it('ändrar inget förrän personen valt och bekräftat', async () => {
    callAI.mockResolvedValue({ rattning: { andringar: [{ fore: 'söker pa lagret', efter: 'söker på lagret' }, { fore: 'och söker', efter: 'och söker' }] } })
    const onApply = vi.fn()
    render(<Rattstavning text={TEXT} onApply={onApply} />)
    await userEvent.click(screen.getByRole('button', { name: /kolla stavningen/i }))
    const rutor = await screen.findAllByRole('checkbox')
    expect(rutor[0]).not.toBeChecked()
    expect(onApply).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: /gör de valda/i }) as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(rutor[0])
    await userEvent.click(screen.getByRole('button', { name: /gör de valda/i }))
    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith('Jag är nogrann och söker på lagret. Jag är nogrann med det.')
  })

  it('ofördda ändringar tillämpas aldrig', async () => {
    callAI.mockResolvedValue({ rattning: { andringar: [{ fore: 'söker pa lagret', efter: 'söker på lagret' }, { fore: 'med det', efter: 'med detta' }] } })
    const onApply = vi.fn()
    render(<Rattstavning text={TEXT} onApply={onApply} />)
    await userEvent.click(screen.getByRole('button', { name: /kolla stavningen/i }))
    const rutor = await screen.findAllByRole('checkbox')
    await userEvent.click(rutor[1])
    await userEvent.click(screen.getByRole('button', { name: /gör de valda/i }))
    expect(onApply).toHaveBeenCalledWith('Jag är nogrann och söker pa lagret. Jag är nogrann med detta.')
  })

  it('tom lista: säger att inget hittades och rör inte texten', async () => {
    callAI.mockResolvedValue({ rattning: { andringar: [] } })
    const onApply = vi.fn()
    render(<Rattstavning text={TEXT} onApply={onApply} />)
    await userEvent.click(screen.getByRole('button', { name: /kolla stavningen/i }))
    await waitFor(() => expect(screen.getByText(/hittade inget att rätta/i)).toBeTruthy())
    expect(onApply).not.toHaveBeenCalled()
  })

  it('fel i anropet: texten är orörd och felet sägs', async () => {
    callAI.mockImplementation(async () => { throw new Error('nere') })
    const onApply = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<Rattstavning text={TEXT} onApply={onApply} />)
    await userEvent.click(screen.getByRole('button', { name: /kolla stavningen/i }))
    await waitFor(() => expect(screen.getByText(/text är orörd/i)).toBeTruthy())
    expect(onApply).not.toHaveBeenCalled()
  })

  it('skickar bara brevtexten till ratta-stavning', async () => {
    callAI.mockResolvedValue({ rattning: { andringar: [] } })
    render(<Rattstavning text={TEXT} onApply={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /kolla stavningen/i }))
    await waitFor(() => expect(callAI).toHaveBeenCalledWith('ratta-stavning', { text: TEXT }))
  })

  it('knappen är avstängd utan text', () => {
    render(<Rattstavning text="  " onApply={() => {}} />)
    expect((screen.getByRole('button', { name: /kolla stavningen/i }) as HTMLButtonElement).disabled).toBe(true)
  })
})
