/**
 * AIX16 — vad modellen får se av nämndrapporten, och att en cell under 5 aldrig skickas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAI } from '@/services/aiApi'
import { byggNamndUnderlag, cellvarde, foreslaNamndtext, CELLGRANS } from './namndTextApi'
import type { Namndrapport, NamndRad } from './namndrapportPdf'

vi.mock('@/services/aiApi', () => ({ callAI: vi.fn() }))

const rad = (nyckel: string, o: Partial<NamndRad> = {}): NamndRad => ({
  nyckel: nyckel as NamndRad['nyckel'],
  etikett: nyckel,
  deltagare_med_plan: 20,
  pass_bedomda: 100,
  narvarograd: 80,
  franvaro_anmald: 10,
  franvaro_oanmald: 6,
  sjuk_utan_intyg: 0,
  underlag_lamnat: 7,
  ...o,
})
const rapport = (rader: NamndRad[]): Namndrapport => ({
  ar: 2026, kvartal: 3, from: '2026-07-01', to: '2026-09-30', rader,
  summa: { deltagare_med_plan: 0, pass_bedomda: 0, narvarograd: null, franvaro_anmald: 0, franvaro_oanmald: 0, sjuk_utan_intyg: 0, underlag_lamnat: 0 },
})

describe('cellvarde', () => {
  it.each([[0, 0], [1, null], [4, null], [5, 5], [120, 120]])('%i → %s', (n, forvantat) => {
    expect(cellvarde(n as number)).toBe(forvantat)
  })
  it('cellgränsen är 5', () => { expect(CELLGRANS).toBe(5) })
})

describe('byggNamndUnderlag', () => {
  it('redovisar summor per grupp och inga deltagarrader', () => {
    const u = byggNamndUnderlag(rapport([rad('arbetslos'), rad('sprakhinder', { deltagare_med_plan: 9 })]))
    expect(u).not.toBeNull()
    expect(u!.grupper.map((g) => g.namn)).toEqual(['arbetslos', 'sprakhinder'])
    expect(u!.grupper[0]).toMatchObject({ deltagare: 20, bedomdaPass: 100, narvarograd: 80, anmaldFranvaro: 10 })
    expect(u!.summa).toMatchObject({ deltagare: 29 })
    // Inga id:n, inga namn, inga datum per person.
    expect(JSON.stringify(u)).not.toMatch(/participant|plan_id|user_id/)
  })

  it('en cell på 1-4 i en redovisad grupp blir null', () => {
    const u = byggNamndUnderlag(rapport([rad('arbetslos', { franvaro_oanmald: 3, underlag_lamnat: 1 })]))!
    expect(u.grupper[0].oanmaldFranvaro).toBeNull()
    expect(u.grupper[0].underlagLamnat).toBeNull()
    expect(u.grupper[0].anmaldFranvaro).toBe(10)
  })

  it('en nollcell redovisas som 0', () => {
    expect(byggNamndUnderlag(rapport([rad('arbetslos')]))!.grupper[0].sjukUtanIntyg).toBe(0)
  })

  it('komplementär undertryckning: kolumnen undertrycks också i summan, så cellen inte går att räkna ut', () => {
    const u = byggNamndUnderlag(rapport([rad('arbetslos', { franvaro_oanmald: 3 }), rad('sprakhinder')]))!
    expect(u.grupper[0].oanmaldFranvaro).toBeNull()
    expect(u.grupper[1].oanmaldFranvaro).toBe(6)
    expect(u.summa!.oanmaldFranvaro).toBeNull()
    expect(u.summa!.anmaldFranvaro).toBe(20)
  })

  it('en grupp med färre än 5 deltagare redovisas inte för sig, och de små läggs ihop om de räcker', () => {
    const u = byggNamndUnderlag(rapport([
      rad('arbetslos'),
      rad('sprakhinder', { deltagare_med_plan: 3, pass_bedomda: 20, franvaro_anmald: 5 }),
      rad('halsa', { deltagare_med_plan: 4, pass_bedomda: 30, franvaro_anmald: 5 }),
    ]))!
    expect(u.grupper.map((g) => g.namn)).toEqual(['arbetslos', 'Övriga grupper'])
    expect(u.grupper[1]).toMatchObject({ deltagare: 7, bedomdaPass: 50 })
    expect(u.ovrigaUndertryckta).toBe(false)
  })

  it('små grupper som inte tillsammans når 5 utelämnas helt och sägs vara utelämnade', () => {
    const u = byggNamndUnderlag(rapport([rad('arbetslos'), rad('sprakhinder', { deltagare_med_plan: 2 })]))!
    expect(u.grupper.map((g) => g.namn)).toEqual(['arbetslos'])
    expect(u.ovrigaUndertryckta).toBe(true)
    // Summan är över det som redovisas: den lämnar inget att subtrahera.
    expect(u.summa!.deltagare).toBe(20)
  })

  it('närvarograd skickas inte när färre än 5 pass är bedömda', () => {
    const u = byggNamndUnderlag(rapport([rad('arbetslos', { pass_bedomda: 3, narvarograd: 67 })]))!
    expect(u.grupper[0].narvarograd).toBeNull()
    expect(u.grupper[0].bedomdaPass).toBeNull()
  })

  it('inget att redovisa ger null', () => {
    expect(byggNamndUnderlag(rapport([rad('arbetslos', { deltagare_med_plan: 2 })]))).toBeNull()
    expect(byggNamndUnderlag(rapport([]))).toBeNull()
  })
})

describe('foreslaNamndtext', () => {
  beforeEach(() => { vi.mocked(callAI).mockReset() })

  it('skickar bara det undertryckta underlaget till callAI', async () => {
    vi.mocked(callAI).mockResolvedValueOnce({ namndtext: { text: 'Under kvartalet hade 20 deltagare en plan.', struket: 2 } } as never)
    const r = await foreslaNamndtext(rapport([rad('arbetslos', { franvaro_oanmald: 3 })]))
    expect(r).toEqual({ text: 'Under kvartalet hade 20 deltagare en plan.', struket: 2 })
    const [fn, data] = vi.mocked(callAI).mock.calls[0] as [string, { underlag: { grupper: Array<{ oanmaldFranvaro: number | null }> } }]
    expect(fn).toBe('konsulent-namndtext')
    expect(data.underlag.grupper[0].oanmaldFranvaro).toBeNull()
  })

  it('anropar inte AI när underlaget är för litet', async () => {
    await expect(foreslaNamndtext(rapport([rad('arbetslos', { deltagare_med_plan: 2 })]))).rejects.toThrow(/för litet/)
    expect(callAI).not.toHaveBeenCalled()
  })

  it('försöker en gång till vid AI_INVALID_RESPONSE', async () => {
    const fel = Object.assign(new Error('x'), { kod: 'AI_INVALID_RESPONSE' })
    vi.mocked(callAI).mockRejectedValueOnce(fel).mockResolvedValueOnce({ namndtext: { text: 'Under kvartalet hade 20 deltagare en plan.' } } as never)
    const r = await foreslaNamndtext(rapport([rad('arbetslos')]))
    expect(r.text).toMatch(/Under kvartalet/)
    expect(callAI).toHaveBeenCalledTimes(2)
  })

  it('försöker inte igen vid andra fel', async () => {
    vi.mocked(callAI).mockRejectedValueOnce(new Error('503'))
    await expect(foreslaNamndtext(rapport([rad('arbetslos')]))).rejects.toThrow('503')
    expect(callAI).toHaveBeenCalledTimes(1)
  })

  it('ett svar utan text är ett fel', async () => {
    vi.mocked(callAI).mockResolvedValueOnce({ namndtext: {} } as never)
    await expect(foreslaNamndtext(rapport([rad('arbetslos')]))).rejects.toThrow(/gick inte att läsa/)
  })
})
