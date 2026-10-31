import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const callAI = vi.fn()
vi.mock('@/services/aiApi', () => ({ callAI: (...a: unknown[]) => callAI(...a), callAIStream: (...a: unknown[]) => callAI(...a) }))

import { LuckanICv } from './LuckanICv'
import { LUCKKODER } from './luckformuleringar'

const MED_LUCKA = [
  { startDate: '2018-01', endDate: '2019-12' },
  { startDate: '2021-03', endDate: '2022-01' },
]

async function oppna() {
  await userEvent.click(screen.getByText(/Vad skriver jag om tiden utan jobb/))
}

describe('LuckanICv', () => {
  beforeEach(() => callAI.mockReset())

  it('visas inte utan tidslucka', () => {
    const { container } = render(<LuckanICv poster={[{ startDate: '2020-01', endDate: '2021-01' }]} onAdd={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('visar tre formuleringar när en kod väljs, och ger aldrig ett AI-anrop för någon kod (inkl. sjukdom)', async () => {
    render(<LuckanICv poster={MED_LUCKA} onAdd={vi.fn()} />)
    await oppna()
    expect(LUCKKODER).toContain('sjukdom')
    for (const etikett of [/hemma med barn/, /närstående/, /studerade/, /ställde om/, /återhämta/, /inte ange/]) {
      await userEvent.click(screen.getByRole('radio', { name: etikett }))
      expect(screen.getByText('Som rad i CV:t')).toBeInTheDocument()
      expect(screen.getByText('En mening till brevet')).toBeInTheDocument()
      expect(screen.getByText('Om någon frågar i en intervju')).toBeInTheDocument()
    }
    expect(callAI).not.toHaveBeenCalled()
  })

  it('lägger till en rad med lucka-perioden först efter klick', async () => {
    const onAdd = vi.fn()
    render(<LuckanICv poster={MED_LUCKA} onAdd={onAdd} />)
    await oppna()
    await userEvent.click(screen.getByRole('radio', { name: /studerade/ }))
    expect(onAdd).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /Lägg till som rad/ }))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd.mock.calls[0][0]).toMatchObject({ title: 'Studier', startDate: '2020-01', endDate: '2021-02', company: '' })
  })

  it('sjukdomsvalet hamnar inte i den tillagda raden', async () => {
    const onAdd = vi.fn()
    render(<LuckanICv poster={MED_LUCKA} onAdd={onAdd} />)
    await oppna()
    await userEvent.click(screen.getByRole('radio', { name: /återhämta/ }))
    await userEvent.click(screen.getByRole('button', { name: /Lägg till som rad/ }))
    expect(JSON.stringify(onAdd.mock.calls[0][0])).not.toMatch(/sjuk|hälsa|diagnos/i)
  })
})
