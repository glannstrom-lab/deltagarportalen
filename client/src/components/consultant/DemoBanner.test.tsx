import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DemoBanner } from './DemoBanner'

const myMemberships = vi.fn()
vi.mock('@/services/orgApi', () => ({ orgApi: { myMemberships: (...a: unknown[]) => myMemberships(...a) } }))

let anvandare: { id: string } | null = { id: 'u1' }
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: { user: { id: string } | null }) => unknown) => sel({ user: anvandare }),
}))

describe('DemoBanner (KM12 demo-org)', () => {
  beforeEach(() => {
    myMemberships.mockReset()
    anvandare = { id: 'u1' }
  })

  it('visas när användaren är medlem i en demoorganisation', async () => {
    myMemberships.mockResolvedValue([{ org_id: 'o', role: 'chef', organization: { id: 'o', name: 'Demokommun', is_demo: true } }])
    render(<DemoBanner />)
    await waitFor(() => expect(screen.getByTestId('demo-banner')).toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent(/påhittade personer/i)
  })

  it('visas inte för en riktig organisation', async () => {
    myMemberships.mockResolvedValue([{ org_id: 'o', role: 'konsulent', organization: { id: 'o', name: 'Testkommun', is_demo: false } }])
    render(<DemoBanner />)
    await waitFor(() => expect(myMemberships).toHaveBeenCalled())
    expect(screen.queryByTestId('demo-banner')).toBeNull()
  })

  it('fail closed åt "ingen banner": uppslagsfel blockerar ingen riktig konsulent', async () => {
    myMemberships.mockRejectedValue(new Error('nej'))
    render(<DemoBanner />)
    await waitFor(() => expect(myMemberships).toHaveBeenCalled())
    expect(screen.queryByTestId('demo-banner')).toBeNull()
  })

  it('frågar inte efter medlemskap utan inloggad användare', () => {
    anvandare = null
    render(<DemoBanner />)
    expect(myMemberships).not.toHaveBeenCalled()
    expect(screen.queryByTestId('demo-banner')).toBeNull()
  })
})
