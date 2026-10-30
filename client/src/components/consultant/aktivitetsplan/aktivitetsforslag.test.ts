/**
 * AIX21 — förslag ur katalogen: bara id:n som finns, bara aktiva poster, inget skapas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAI } from '@/services/aiApi'
import type { CatalogItem } from '@/services/aktivitetskatalogApi'
import { aliasPoster, foreslaAktiviteter, forslagTillPass, naestaDatumForVeckodag } from './aktivitetsforslag'

vi.mock('@/services/aiApi', () => ({ callAI: vi.fn() }))

const post = (id: string, o: Partial<CatalogItem> = {}): CatalogItem => ({
  id, org_id: 'org-1', owner_id: 'u1', title: `Post ${id}`, activity_type: 'jobsearch', description: null, location: null,
  weekday: null, start_time: null, end_time: null, capacity: null, contact: null, is_active: true, created_at: '', updated_at: '', ...o,
})
const KATALOG = [
  post('uuid-1', { title: 'Jobbklubb', location: 'Biblioteket', weekday: 2, start_time: '09:00', end_time: '12:00' }),
  post('uuid-2', { title: 'Språkkafé', activity_type: 'language' }),
  post('uuid-3', { title: 'Nedlagd', is_active: false }),
]

describe('aliasPoster', () => {
  it('ger bara aktiva poster korta alias i ordning — riktiga id:n lämnar aldrig klienten', () => {
    expect(aliasPoster(KATALOG).map((a) => [a.alias, a.post.id])).toEqual([['a1', 'uuid-1'], ['a2', 'uuid-2']])
  })
})

describe('foreslaAktiviteter', () => {
  beforeEach(() => { vi.mocked(callAI).mockReset() })

  it('skickar målet och katalogen under alias, och mappar tillbaka till posterna', async () => {
    vi.mocked(callAI).mockResolvedValueOnce({ aktivitetsforslag: { forslag: [{ id: 'a2', motivering: 'Tränar svenska.' }, { id: 'a1', motivering: 'Hjälper att söka jobb.' }] } } as never)
    const r = await foreslaAktiviteter('vill träna svenska och söka jobb', KATALOG)
    expect(r.map((f) => f.post.id)).toEqual(['uuid-2', 'uuid-1'])
    const [fn, data] = vi.mocked(callAI).mock.calls[0] as [string, { mal: string; katalog: Array<{ id: string; namn: string; tid: string }> }]
    expect(fn).toBe('konsulent-aktivitetsforslag')
    expect(data.katalog.map((k) => k.id)).toEqual(['a1', 'a2'])
    expect(JSON.stringify(data)).not.toContain('uuid-')
    expect(data.katalog[0].tid).toBe('Tisdag 09:00–12:00')
  })

  it('SLÄPPER varje id som inte finns i katalogen, även om servern släppt igenom det', async () => {
    vi.mocked(callAI).mockResolvedValueOnce({ aktivitetsforslag: { forslag: [{ id: 'a9', motivering: 'Påhittad.' }, { id: 'uuid-1', motivering: 'Riktigt id, men inte ett alias.' }, { id: 'a1', motivering: 'Riktig.' }, { id: 'a3', motivering: 'Avstängd post.' }] } } as never)
    const r = await foreslaAktiviteter('mål', KATALOG)
    expect(r.map((f) => f.post.id)).toEqual(['uuid-1'])
  })

  it('en avstängd post kan inte föreslås ens under ett giltigt alias', async () => {
    vi.mocked(callAI).mockResolvedValueOnce({ aktivitetsforslag: { forslag: [{ id: 'a3', motivering: 'x' }] } } as never)
    expect(await foreslaAktiviteter('mål', KATALOG)).toEqual([])
  })

  it('anropar inte AI utan mål eller utan aktiva poster', async () => {
    await expect(foreslaAktiviteter('   ', KATALOG)).rejects.toThrow(/Skriv först/)
    await expect(foreslaAktiviteter('mål', [post('x', { is_active: false })])).rejects.toThrow(/inga aktiva/)
    expect(callAI).not.toHaveBeenCalled()
  })

  it('försöker en gång till vid AI_INVALID_RESPONSE', async () => {
    const fel = Object.assign(new Error('x'), { kod: 'AI_INVALID_RESPONSE' })
    vi.mocked(callAI).mockRejectedValueOnce(fel).mockResolvedValueOnce({ aktivitetsforslag: { forslag: [{ id: 'a1', motivering: 'Bra.' }] } } as never)
    expect(await foreslaAktiviteter('mål', KATALOG)).toHaveLength(1)
    expect(callAI).toHaveBeenCalledTimes(2)
  })

  it('tar högst fyra förslag', async () => {
    const stor = Array.from({ length: 6 }, (_, i) => post(`u${i}`))
    vi.mocked(callAI).mockResolvedValueOnce({ aktivitetsforslag: { forslag: stor.map((_, i) => ({ id: `a${i + 1}`, motivering: 'Passar.' })) } } as never)
    expect(await foreslaAktiviteter('mål', stor)).toHaveLength(4)
  })
})

describe('forslagTillPass', () => {
  it('fyller i rubrik, typ, plats och tid — och flyttar datumet till nästa veckodag', () => {
    // 2026-11-02 är en måndag; posten ligger på tisdagar.
    expect(forslagTillPass(KATALOG[0], '2026-11-02')).toEqual({
      date: '2026-11-03', start_time: '09:00', end_time: '12:00', title: 'Jobbklubb', activity_type: 'jobsearch', location: 'Biblioteket',
    })
  })
  it('lämnar datum och tid orörda när posten saknar dem', () => {
    expect(forslagTillPass(KATALOG[1], '2026-11-02')).toEqual({ title: 'Språkkafé', activity_type: 'language', location: '' })
  })
  it('samma veckodag räknas som idag', () => {
    expect(naestaDatumForVeckodag('2026-11-03', 2)).toBe('2026-11-03')
    expect(naestaDatumForVeckodag('2026-11-04', 2)).toBe('2026-11-10')
  })
})
