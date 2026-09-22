/**
 * CreateApplicationModal — CV-matchningen läser användarens EGET CV
 * (städpasset 2026-09-22).
 *
 * Buggen: `supabase.from('cvs').select('*').maybeSingle()` saknade filter.
 * RLS på `cvs` släpper även igenom konsulentens aktiva deltagares CV (policyn
 * "KS2b: konsulent läser aktiva deltagares CV"). För ett konto med sådana
 * relationer gav frågan flera rader — maybeSingle() fel, tyst reserväg — eller,
 * utan eget CV och med EN deltagare, deltagarens CV presenterat som "Din
 * matchning".
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockEq = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'anvandare-1' } } }) },
    from: () => ({
      select: () => {
        const q = {
          eq: (kol: string, v: unknown) => { mockEq(kol, v); return q },
          maybeSingle: async () => ({ data: null, error: null }),
        }
        return q
      },
    }),
  },
}))

vi.mock('@/services/workflowApi', () => ({
  workflowApi: { getCVMatchScore: vi.fn(async () => null), createApplication: vi.fn() },
}))
vi.mock('@/services/cvOptimizer', () => ({ analyzeCVForJob: vi.fn() }))
vi.mock('@/components/Toast', () => ({ showToast: { error: vi.fn(), success: vi.fn() } }))

import { CreateApplicationModal } from './CreateApplicationModal'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CreateApplicationModal — CV-uppslaget', () => {
  it('filtrerar på den inloggades user_id', async () => {
    const job = {
      id: 'j1', headline: 'Lagerarbetare', employer: { name: 'Lagret AB' },
      description: { text: 'Truckkort krävs' }, workplace_address: { municipality: 'Örebro' },
    } as unknown as PlatsbankenJob
    render(
      <MemoryRouter>
        <CreateApplicationModal job={job} isOpen onClose={vi.fn()} />
      </MemoryRouter>,
    )
    await waitFor(() => expect(mockEq).toHaveBeenCalledWith('user_id', 'anvandare-1'))
  })
})
