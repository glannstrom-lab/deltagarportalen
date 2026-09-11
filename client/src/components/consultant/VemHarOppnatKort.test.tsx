import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { VemHarOppnatKort } from './VemHarOppnatKort'

vi.mock('@/services/laslogg', () => ({
  laslogg: { minaVisningar: vi.fn() },
}))

describe('VemHarOppnatKort', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('visar en rad per visning med datum och tid', async () => {
    const { laslogg } = await import('@/services/laslogg')
    vi.mocked(laslogg.minaVisningar).mockResolvedValue([
      { id: 'a', user_id: 'k', action: 'VIEWED_PARTICIPANT_DATA', resource_type: 'participant', resource_id: 'd', participant_id: 'd', created_at: '2026-09-11T15:53:00Z' },
      { id: 'b', user_id: 'k', action: 'VIEWED_PARTICIPANT_DATA', resource_type: 'participant', resource_id: 'd', participant_id: 'd', created_at: '2026-09-10T07:05:00Z' },
    ])
    render(<VemHarOppnatKort />)
    const rader = await screen.findAllByText(/Din konsulent öppnade dina uppgifter/)
    expect(rader).toHaveLength(2)
    expect(rader[0].textContent).toMatch(/11 sep/)
  })

  it('visar inviten när loggen är tom — aldrig en nolla', async () => {
    const { laslogg } = await import('@/services/laslogg')
    vi.mocked(laslogg.minaVisningar).mockResolvedValue([])
    render(<VemHarOppnatKort />)
    expect(await screen.findByText(/Ingen har öppnat dina uppgifter än/)).toBeInTheDocument()
    expect(screen.queryByText(/^0/)).not.toBeInTheDocument()
  })

  it('visar ett fel i stället för en tom lista när hämtningen faller', async () => {
    const { laslogg } = await import('@/services/laslogg')
    vi.mocked(laslogg.minaVisningar).mockRejectedValue(new Error('nere'))
    render(<VemHarOppnatKort />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/kunde inte hämta loggen/)
    expect(screen.queryByText(/Ingen har öppnat/)).not.toBeInTheDocument()
  })
})
