import { describe, it, expect, vi, beforeEach } from 'vitest'

const assurans = vi.fn()
const rpc = vi.fn()
const from = vi.fn()
vi.mock('@/services/mfaApi', () => ({ mfaApi: { assurans: (...a: unknown[]) => assurans(...a) } }))
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a), from: (...a: unknown[]) => from(...a) } }))

import {
  andelText,
  avslutUrPlaner,
  byggUtfall,
  enhetensUtfallApi,
  ENHETENS_UTFALL_RPC_FINNS,
  arEnhetsroll,
  utfallTextrader,
  STRECK,
  type UtfallRpcRad,
} from './enhetensUtfall'

const rpcRad = (o: Partial<UtfallRpcRad> = {}): UtfallRpcRad => ({
  deltagare_totalt: 20,
  i_arbete_eller_studier: 8,
  avslutade_deltagare: 5,
  tid_till_plan_dagar: 12,
  tid_till_plan_n: 10,
  ...o,
})
const planer = (n: number, status: string) => Array.from({ length: n }, (_, i) => ({ participant_id: `${status}${i}`, status }))

describe('andelText (cellgräns 5)', () => {
  it('redovisar andel vid 5 eller fler', () => {
    expect(andelText(8, 20)).toEqual({ text: '8 av 20 (40 %)' })
    expect(andelText(5, 5)).toEqual({ text: '5 av 5 (100 %)' })
  })
  it('undertrycker 1-4 i täljaren och nämnare under 5', () => {
    expect(andelText(4, 20).text).toBe(STRECK)
    expect(andelText(1, 20).varfor).toMatch(/under 5/)
    expect(andelText(2, 4).text).toBe(STRECK)
  })
  it('0 av tillräckligt många är ett riktigt noll, inte undertryckt', () => {
    expect(andelText(0, 20)).toEqual({ text: '0 av 20 (0 %)' })
  })
  it('tom nämnare är streck med orsak, aldrig 0 %', () => {
    const r = andelText(0, 0)
    expect(r.text).toBe(STRECK)
    expect(r.varfor).toBeTruthy()
  })
  it('null (undertryckt i databasen) blir streck', () => {
    expect(andelText(null, 20).text).toBe(STRECK)
    expect(andelText(3, null).text).toBe(STRECK)
  })
})

describe('avslutUrPlaner', () => {
  it('räknar en deltagare som avslutad bara när alla planer är avslutade', () => {
    const r = avslutUrPlaner([
      { participant_id: 'a', status: 'ended' },
      { participant_id: 'a', status: 'active' },
      { participant_id: 'b', status: 'ended' },
    ])
    expect(r).toEqual({ avslutade: 1, totalt: 2 })
  })
})

describe('byggUtfall', () => {
  it('med funktionssvar: alla tre raderna redovisas', () => {
    const r = byggUtfall({ rpc: rpcRad(), planer: null })
    expect(r.map((x) => x.text)).toEqual(['8 av 20 (40 %)', '5 av 20 (25 %)', '12 dagar i snitt (10 deltagare)'])
    expect(r.every((x) => x.visas)).toBe(true)
  })
  it('tid till plan under 5 deltagare undertrycks', () => {
    const t = byggUtfall({ rpc: rpcRad({ tid_till_plan_n: 4 }), planer: null })[2]
    expect(t.visas).toBe(false)
    expect(t.text).toBe(STRECK)
  })
  it('utan underlag för tid: streck med orsak', () => {
    const t = byggUtfall({ rpc: rpcRad({ tid_till_plan_dagar: null, tid_till_plan_n: 0 }), planer: null })[2]
    expect(t.text).toBe(STRECK)
    expect(t.varfor).toMatch(/kopplingsdatum/)
  })
  it('utan funktionen: arbete/studier och tid är streck med orsak, avslut ur planerna', () => {
    const r = byggUtfall({ rpc: null, planer: [...planer(6, 'ended'), ...planer(4, 'active')] })
    expect(r[0].text).toBe(STRECK)
    expect(r[0].varfor).toMatch(/enhetens_utfall/)
    expect(r[2].text).toBe(STRECK)
    expect(r[1].text).toBe('6 av 10 (60 %) har avslutad plan')
  })
  it('utan funktionen och med färre än 5 deltagare med plan undertrycks avslut', () => {
    const r = byggUtfall({ rpc: null, planer: planer(3, 'ended') })
    expect(r[1].visas).toBe(false)
  })
  it('planer som inte kunde läsas är streck, inte 0', () => {
    expect(byggUtfall({ rpc: null, planer: null })[1].varfor).toMatch(/kunde inte läsas/)
  })
  it('aldrig en nolla där underlag saknas', () => {
    for (const x of byggUtfall({ rpc: null, planer: [] })) expect(x.text).not.toMatch(/^0/)
  })
})

describe('utfallTextrader', () => {
  it('tar bara med rader som får visas', () => {
    const rader = byggUtfall({ rpc: rpcRad({ tid_till_plan_n: 2 }), planer: null })
    const t = utfallTextrader(rader)
    expect(t).toHaveLength(2)
    expect(t.join(' ')).not.toContain(STRECK)
  })
})

describe('arEnhetsroll', () => {
  it('bara chef och admin', () => {
    expect(arEnhetsroll('chef')).toBe(true)
    expect(arEnhetsroll('admin')).toBe(true)
    expect(arEnhetsroll('konsulent')).toBe(false)
    expect(arEnhetsroll('handlaggare')).toBe(false)
    expect(arEnhetsroll('arbetsgivare')).toBe(false)
  })
})

describe('flaggan och aal2', () => {
  beforeEach(() => {
    assurans.mockReset()
    rpc.mockReset()
    from.mockReset()
  })
  it('funktionen är avstängd som standard', () => {
    expect(ENHETENS_UTFALL_RPC_FINNS).toBe(false)
  })
  it('anropar aldrig rpc medan flaggan är false, utan läser planerna', async () => {
    assurans.mockResolvedValue({ nuvarande: 'aal2', nasta: 'aal2' })
    const eq = vi.fn().mockResolvedValue({ data: planer(6, 'ended'), error: null })
    from.mockReturnValue({ select: () => ({ eq }) })
    const lage = await enhetensUtfallApi.hamta('org1', false)
    expect(rpc).not.toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('org_id', 'org1')
    expect(lage.status).toBe('klart')
  })
  it('utan aal2 läses ingenting', async () => {
    assurans.mockResolvedValue({ nuvarande: 'aal1', nasta: 'aal2' })
    const lage = await enhetensUtfallApi.hamta('org1', false)
    expect(lage).toEqual({ status: 'kraver_aal2' })
    expect(from).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })
  it('demoorganisation undantas från aal2', async () => {
    const eq = vi.fn().mockResolvedValue({ data: [], error: null })
    from.mockReturnValue({ select: () => ({ eq }) })
    const lage = await enhetensUtfallApi.hamta('demo', true)
    expect(assurans).not.toHaveBeenCalled()
    expect(lage.status).toBe('klart')
  })
})
