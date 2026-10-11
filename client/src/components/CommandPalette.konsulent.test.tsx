/**
 * Slipningen 2026-10-11 (kommunfynd B3): "Anna" gav 0 träffar i paletten för en
 * konsulent. Egna deltagare är nu mål. Mutation: rendera inte KonsulentDeltagare
 * → första testet faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

let roll = 'CONSULTANT'
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ profile: { role: roll, activeRole: roll } }),
}))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({
  CONSULTANT_PARTICIPANTS_QUERY_KEY: ['consultant-dashboard-participants'],
  fetchCachedConsultantParticipants: vi.fn(async () => [
    { participant_id: 'p1', first_name: 'Anna', last_name: 'Exempel', email: 'anna@example.com' },
  ]),
}))

import CommandPalette from './CommandPalette'

afterEach(() => { cleanup(); roll = 'CONSULTANT' })

function oppna() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter><CommandPalette /></MemoryRouter>
    </QueryClientProvider>,
  )
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'anna' } })
}

describe('kommandopaletten för en konsulent', () => {
  it('hittar en egen deltagare på förnamnet', async () => {
    oppna()
    expect(await screen.findByText('Anna Exempel')).toBeInTheDocument()
    expect(screen.getByText('Dina deltagare')).toBeInTheDocument()
  })

  it('en deltagare (USER) får inga deltagarnamn', async () => {
    roll = 'USER'
    oppna()
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByText('Anna Exempel')).toBeNull()
  })
})
