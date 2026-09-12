/**
 * PG10 (2026-09-12): en deltagare som är kopplad till en organisation ska inte
 * erbjudas ett projektval ("Rusta och Matcha" åt en kommundeltagare var brus),
 * och ingen ska läsa "kommer i en kommande uppdatering".
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

const minAiPolicy = vi.fn()
vi.mock('@/services/laslogg', () => ({ laslogg: { minAiPolicy: (...a: unknown[]) => minAiPolicy(...a) } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ profile: { program: null } }) }))
vi.mock('@/services/supabaseApi', () => ({ userApi: { updateProfile: vi.fn() } }))

import { ProgramSelector } from './ProgramSelector'

describe('ProgramSelector (PG10)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('organisationsdeltagare ser organisationen som text — inget val, inget "Rusta och Matcha"', async () => {
    minAiPolicy.mockResolvedValue([{ org_id: 'o1', org_name: 'Testkommun', ai_enabled: true }])
    render(<ProgramSelector />)
    expect(await screen.findByText(/Du deltar genom Testkommun/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rusta/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/kommande uppdatering/i)).not.toBeInTheDocument()
  })

  it('fri deltagare får valet — utan löfte om kommande sidor', async () => {
    minAiPolicy.mockResolvedValue([])
    render(<ProgramSelector />)
    expect(await screen.findByRole('button', { name: /Inget projekt/ })).toBeInTheDocument()
    expect(screen.queryByText(/kommande uppdatering/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Valet sparas direkt/)).toBeInTheDocument()
  })
})
