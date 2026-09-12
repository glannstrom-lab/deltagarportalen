/**
 * Nämndrapporten (F17): räkningen per försörjningshinder och vad som faktiskt
 * hamnar på pappret. PDF-strängar eskaperar parenteser — av-eskapera först
 * (fällan 2026-08-23), annars är ett `toContain('(…)')` alltid falskt.
 */
import { describe, it, expect } from 'vitest'
import type { ActivitySession, Forsorjningshinder } from './aktivitetApi'
import {
  generateNamndrapportBlob,
  kvartalEtikett,
  kvartalsval,
  namndrapportUnderlag,
  tabellRader,
  underlagLamnatIKvartal,
} from './namndrapportPdf'

const plan = (id: string, participant_id: string, forsorjningshinder: Forsorjningshinder | null, extra: Partial<{ start_date: string; end_date: string | null; nedsattning_underlag_lamnat_at: string | null }> = {}) => ({
  id, participant_id, forsorjningshinder,
  start_date: '2026-07-01', end_date: null, nedsattning_underlag_lamnat_at: null, ...extra,
})
const pass = (plan_id: string, date: string, attendance: ActivitySession['attendance'], absence_reported_at: string | null = null) => ({ plan_id, date, attendance, absence_reported_at })

const Q3 = { ar: 2026, kvartal: 3 as const }

describe('kvartalsval och etikett', () => {
  it('föregående kvartal rullar över årsskiftet', () => {
    expect(kvartalsval('2026-02-10')).toEqual({ innevarande: { ar: 2026, kvartal: 1 }, foregaende: { ar: 2025, kvartal: 4 } })
    expect(kvartalsval('2026-09-13').foregaende).toEqual({ ar: 2026, kvartal: 2 })
  })
  it('etiketten bär kvartalets gränser', () => {
    expect(kvartalEtikett(Q3)).toBe('Kvartal 3 2026 (2026-07-01 – 2026-09-30)')
  })
})

describe('namndrapportUnderlag', () => {
  const plans = [
    plan('a', 'p1', 'arbetslos'),
    plan('b', 'p2', 'arbetslos'),
    plan('c', 'p3', 'sprakhinder', { nedsattning_underlag_lamnat_at: '2026-08-15' }),
    plan('d', 'p4', null, { start_date: '2026-03-01', end_date: '2026-05-31' }), // slutade före kvartalet
  ]
  const sessions = [
    pass('a', '2026-08-03', 'present'),
    pass('a', '2026-08-04', 'absent_invalid'),
    pass('a', '2026-08-05', 'absent_invalid', '2026-08-04T18:00:00Z'), // anmäld i förväg → inte oanmäld
    pass('b', '2026-08-03', 'absent_valid'),
    pass('b', '2026-08-04', null), // obedömt — räknas inte som bedömt
    pass('b', '2026-10-01', 'present'), // utanför kvartalet
    pass('c', '2026-09-01', 'external'),
    pass('d', '2026-08-03', 'present'), // planen är inte aktiv i kvartalet
  ]
  const u = namndrapportUnderlag(plans, sessions, Q3)

  it('räknar deltagare med aktiv plan per försörjningshinder och i summan', () => {
    const arb = u.rader.find((r) => r.nyckel === 'arbetslos')!
    expect(arb.deltagare_med_plan).toBe(2)
    expect(u.rader.find((r) => r.nyckel === 'ej_angivet')!.deltagare_med_plan).toBe(0)
    expect(u.summa.deltagare_med_plan).toBe(3)
  })

  it('närvarograd = närvarande ÷ bedömda, obedömda och pass utanför kvartalet räknas inte', () => {
    const arb = u.rader.find((r) => r.nyckel === 'arbetslos')!
    expect(arb.pass_bedomda).toBe(4) // a×3 + b absent_valid; b null och b oktober räknas inte
    expect(arb.narvarograd).toBe(25)
    const spr = u.rader.find((r) => r.nyckel === 'sprakhinder')!
    expect(spr.narvarograd).toBe(100) // external räknas som närvaro
  })

  it('anmäld frånvaro skiljs från oanmäld genom absence_reported_at', () => {
    const arb = u.rader.find((r) => r.nyckel === 'arbetslos')!
    expect(arb.franvaro_anmald).toBe(2) // a 5/8 anmäld + b absent_valid
    expect(arb.franvaro_oanmald).toBe(1) // a 4/8
  })

  it('underlag lämnat räknas ur planens datum inom kvartalet, på ett enda ställe', () => {
    expect(u.rader.find((r) => r.nyckel === 'sprakhinder')!.underlag_lamnat).toBe(1)
    expect(underlagLamnatIKvartal({ nedsattning_underlag_lamnat_at: '2026-06-30' }, { from: '2026-07-01', to: '2026-09-30' })).toBe(false)
  })

  it('ingen bedömning → null, aldrig 0 %', () => {
    const tom = namndrapportUnderlag([plan('x', 'p9', 'annat')], [pass('x', '2026-08-01', null)], Q3)
    expect(tom.rader.find((r) => r.nyckel === 'annat')!.narvarograd).toBeNull()
    expect(tom.summa.narvarograd).toBeNull()
    expect(tabellRader(tom).at(-1)![3]).toBe('—')
  })

  it('tabellen döljer försörjningshinder utan deltagare och slutar med Summa', () => {
    const rader = tabellRader(u)
    expect(rader.map((r) => r[0])).toEqual(['Arbetslös', 'Språkhinder', 'Summa'])
    expect(rader[0]).toEqual(['Arbetslös', '2', '4', '25 %', '2', '1', '0'])
  })
})

describe('PDF:en', () => {
  const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')

  it('bär kvartal, organisation, källrad och strecket med förklaring', async () => {
    const u = namndrapportUnderlag([plan('a', 'p1', 'arbetslos')], [pass('a', '2026-08-03', null)], Q3)
    const blob = await generateNamndrapportBlob(u, { organisation: 'Demokommun (påhittade personer)', konsulentNamn: 'Karin Konsulent', datum: '2026-09-13' })
    // jsdom-Blob saknar arrayBuffer; readAsBinaryString ger byte-för-byte (WinAnsi) — så å/ä/ö och parenteser överlever
    const rå = await new Promise<string>((resolve, reject) => {
      const läsare = new FileReader()
      läsare.onload = () => resolve(String(läsare.result))
      läsare.onerror = () => reject(läsare.error)
      läsare.readAsBinaryString(blob)
    })
    const text = avEskapera(rå)
    expect(text).toContain('Kvartal 3 2026')
    expect(text).toContain('Demokommun (påhittade personer)')
    expect(text).toContain('Källa: ur Jobin, 2026-09-13')
    expect(text).toContain('socialnämnden')
    expect(text).toContain('inga bedömda pass')
    expect(text).not.toContain('Kohortanalys')
  })
})
