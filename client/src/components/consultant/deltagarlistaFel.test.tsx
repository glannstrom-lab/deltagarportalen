/**
 * Deltagarväljarna i konsulentens dialoger: ett hämtfel är inte en tom lista
 * (städpasset 2026-09-22).
 *
 * Fyra dialoger hämtar konsulentens deltagare ur
 * `consultant_dashboard_participants` på samma sätt, och alla fyra svalde
 * felet: `const { data } = …; if (data) setParticipants(data)` eller en catch
 * som bara loggade. Vid ett utgånget JWT eller ett nätverksfel stod det
 * "Inga deltagare hittades" — ett påstående om konsulentens caseload som
 * inte stämmer. Tre lägen: laddar / fel / klart.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'konsulent-1' } } }) },
    from: () => ({ select: () => ({ eq: async () => ({ data: null, error: { message: 'JWT expired' } }) }) }),
  },
}))
vi.mock('@/services/consultantService', () => ({ consultantService: { recordPlacement: vi.fn() } }))
vi.mock('@/lib/toast', () => ({ notifications: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

import { PlacementDialog } from './PlacementDialog'
import { GroupMessageDialog } from './GroupMessageDialog'
import { MeetingSchedulerDialog } from './MeetingSchedulerDialog'
import { GoalCreationDialog } from './GoalCreationDialog'

afterEach(() => cleanup())

const FEL = /Deltagarlistan kunde inte hämtas/

describe('hämtfel i deltagarväljaren', () => {
  it('PlacementDialog', async () => {
    render(<PlacementDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(await screen.findByText(FEL)).toBeInTheDocument()
    expect(screen.queryByText(/Inga deltagare hittades/)).not.toBeInTheDocument()
  })

  it('GroupMessageDialog', async () => {
    render(<GroupMessageDialog isOpen onClose={vi.fn()} />)
    expect(await screen.findByText(FEL)).toBeInTheDocument()
    expect(screen.queryByText(/Inga deltagare hittades/)).not.toBeInTheDocument()
  })

  it('MeetingSchedulerDialog', async () => {
    render(<MeetingSchedulerDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(await screen.findByText(FEL)).toBeInTheDocument()
    expect(screen.queryByText(/Inga deltagare hittades/)).not.toBeInTheDocument()
  })

  it('GoalCreationDialog', async () => {
    render(<GoalCreationDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(await screen.findByText(FEL)).toBeInTheDocument()
  })
})
