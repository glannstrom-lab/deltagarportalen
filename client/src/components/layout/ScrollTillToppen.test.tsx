import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom'
import { ScrollTillToppen } from './ScrollTillToppen'

function Styr() {
  const navigera = useNavigate()
  const sattParams = useSearchParams()[1]
  return (
    <>
      <button onClick={() => navigera('/cv')}>cv</button>
      <button onClick={() => navigera(-1)}>bakåt</button>
      <button onClick={() => sattParams({ tab: 'dagbok' })}>flik</button>
    </>
  )
}
const tryck = (namn: string) => fireEvent.click(screen.getByRole('button', { name: namn }))

function rita() {
  return render(
    <MemoryRouter initialEntries={['/oversikt']}>
      <ScrollTillToppen />
      <Styr />
    </MemoryRouter>
  )
}

describe('ScrollTillToppen', () => {
  const scrollTo = vi.fn()
  beforeEach(() => {
    scrollTo.mockClear()
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  })

  it('rör inte fönstret vid första laddningen', () => {
    rita()
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('scrollar till toppen när sökvägen byts', () => {
    rita()
    tryck('cv')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo.mock.calls[0][0]).toMatchObject({ top: 0 })
  })

  it('låter sidan stå kvar vid flikbyte via ?tab=', () => {
    rita()
    tryck('flik')
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('låter bakåt/framåt stå kvar där man var', () => {
    rita()
    tryck('cv')
    scrollTo.mockClear()
    tryck('bakåt')
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
