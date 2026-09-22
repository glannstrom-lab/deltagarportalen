/**
 * workflowApi.getCVMatchScore — reservvägen för "Din matchning" i
 * CreateApplicationModal.
 *
 * 2026-09-22, fyra fel:
 *  1. Frågan mot `cvs` saknade user-filter. RLS (KS2b) släpper igenom aktiva
 *     deltagares CV för en konsulent → konsulenten fick en deltagares CV som
 *     sin egen matchning.
 *  2. Utan CV returnerades 0 — visades som "0 % match", fast inget räknats.
 *  3. `cvs.skills` är objekt i prod — de blev "[object Object]" i texten.
 *  4. Arbetslivserfarenheten spreds som en STRÄNG (`...x.join(' ')`), alltså
 *     tecken för tecken, och kunde aldrig matcha ett ord.
 *
 * Mutationer (kontrollerade): ta bort `.eq('user_id', …)` → test 1 faller;
 * `if (!cv) return 0` → test 2 faller; återställ `...(cv.skills || [])` →
 * test 3 faller; återställ spridningen av `.join(' ')` → test 4 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const eqAnrop: Array<[string, unknown]> = []
let cvRad: Record<string, unknown> | null

vi.mock('@/lib/supabase', () => {
  const builder: Record<string, unknown> = {}
  builder.select = () => builder
  builder.eq = (k: string, v: unknown) => { eqAnrop.push([k, v]); return builder }
  builder.maybeSingle = async () => ({ data: cvRad, error: null })
  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: { id: 'konsulent-1' } } }) },
      from: () => builder,
    },
  }
})

import { workflowApi } from './workflowApi'

const jobb = (headline: string, description: string) => ({
  jobId: 'j1', headline, employer: 'Firma', description, url: '',
})

beforeEach(() => {
  eqAnrop.length = 0
  cvRad = null
})

describe('getCVMatchScore', () => {
  it('läser bara den inloggades eget CV', async () => {
    cvRad = { title: 'Lagerarbetare', summary: '', skills: [], work_experience: [] }
    await workflowApi.getCVMatchScore(jobb('Lagerarbetare', 'truckkort'))
    expect(eqAnrop).toContainEqual(['user_id', 'konsulent-1'])
  })

  it('utan CV: null (ingen siffra), inte 0', async () => {
    cvRad = null
    await expect(workflowApi.getCVMatchScore(jobb('Lagerarbetare', 'truckkort'))).resolves.toBeNull()
  })

  it('kompetenser i prods objektform räknas', async () => {
    cvRad = {
      title: '', summary: '',
      skills: [{ id: 's1', name: 'Truckkort', level: 3, category: 'x' }],
      work_experience: [],
    }
    await expect(workflowApi.getCVMatchScore(jobb('truckkort', ''))).resolves.toBe(95)
  })

  it('arbetslivserfarenheten räknas som ord, inte som tecken', async () => {
    cvRad = {
      title: '', summary: '', skills: [],
      work_experience: [{ title: 'Lagerarbetare', description: 'Plockning' }],
    }
    await expect(workflowApi.getCVMatchScore(jobb('lagerarbetare', ''))).resolves.toBe(95)
  })
})
