import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { PilotVy } from './PilotVy'

const hamta = vi.fn()
vi.mock('@/services/pilotvy', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/pilotvy')>('@/services/pilotvy')
  return { ...faktisk, pilotvyApi: { hamta: (...a: unknown[]) => hamta(...a) } }
})

const org = { id: 'o1', name: 'Hällefors kommun', kind: 'kommun', org_number: null, ai_enabled: true, created_at: '', updated_at: '' }
const rad = {
  orgId: 'o1',
  orgNamn: 'Hällefors kommun',
  personal: 3,
  aktivaKonsulenter: 2,
  kopplade: 12,
  deltagareMedPlan: null,
  loggadePass: null,
  namndunderlag: null,
}

describe('PilotVy', () => {
  beforeEach(() => {
    hamta.mockReset()
  })
  afterEach(() => cleanup())

  it('visar mätta tal och "—" (aldrig 0) för det som inte kan mätas, med en rad om varför', async () => {
    hamta.mockResolvedValue([rad])
    render(<PilotVy orgs={[org] as never} medlemmar={{ o1: [] }} />)
    const rad1 = (await screen.findByRole('rowheader', { name: 'Hällefors kommun' })).closest('tr') as HTMLElement
    const celler = within(rad1).getAllByRole('cell')
    // Personal, Aktiva, Kopplade, Med plan, Pass, Nämndunderlag
    expect(celler[1]).toHaveTextContent('2')
    expect(celler[1]).toHaveTextContent('av 3')
    expect(celler[2]).toHaveTextContent('12')
    for (const i of [3, 4, 5]) {
      expect(celler[i]).toHaveTextContent('—')
      expect(celler[i].textContent).not.toMatch(/(^|\D)0(\D|$)/)
      expect(celler[i]).toHaveTextContent('kan inte mätas')
    }
    expect(screen.getByText(/får inte läsa/)).toBeInTheDocument()
  })

  it('en organisation utan personal visar "—" i stället för 0 aktiva', async () => {
    hamta.mockResolvedValue([{ ...rad, personal: 0, aktivaKonsulenter: null, kopplade: null }])
    render(<PilotVy orgs={[org] as never} medlemmar={{ o1: [] }} />)
    const rad1 = (await screen.findByRole('rowheader', { name: 'Hällefors kommun' })).closest('tr') as HTMLElement
    const celler = within(rad1).getAllByRole('cell')
    expect(celler[1]).toHaveTextContent('—')
    expect(celler[1]).not.toHaveTextContent('av 0')
    expect(celler[2]).toHaveTextContent('—')
  })

  it('ett fel visas som fel, inte som nollor', async () => {
    hamta.mockRejectedValue(new Error('nätverksfel'))
    render(<PilotVy orgs={[org] as never} medlemmar={{ o1: [] }} />)
    expect(await screen.findByText('Pilotvyn kunde inte hämtas')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
