import { describe, it, expect } from 'vitest'
import { resultatersattning, RESULTAT_MAX } from './rom2Ersattning'

describe('KF2: resultatersättning enligt FFU ROM2 §5.1', () => {
  it('maxbeloppen per nivå står som i FFU 5.1', () => {
    expect(RESULTAT_MAX).toEqual({ A: 20_300, B: 27_700, C: 38_000 })
  })

  it('heltid: 50 % av max per steg', () => {
    const r = resultatersattning({ niva: 'C', placeringstyp: 'permanent', omfattningProcent: 100, utfall: 'kvar' }, '3m')
    expect(r).toMatchObject({ typ: 'belopp', belopp: 19_000, andel: 0.5 })
  })

  it('deltid minst 50 %: 25 % per steg, och flaggar att önskad omfattning kan ge mer', () => {
    const r = resultatersattning({ niva: 'B', placeringstyp: 'temp', omfattningProcent: 60, utfall: 'kvar' }, '6m')
    expect(r).toMatchObject({ typ: 'belopp', belopp: 6_925, andel: 0.25 })
    expect(r.typ === 'belopp' && r.grund).toMatch(/önskad omfattning/)
  })

  it('under 50 % blir aldrig en nolla — det beror på önskad omfattning, som portalen inte vet', () => {
    expect(resultatersattning({ niva: 'A', placeringstyp: 'temp', omfattningProcent: 40, utfall: 'kvar' }, '3m').typ).toBe('okant')
  })

  it('studier: 50 % per steg, även när placeringen var en anställning', () => {
    expect(resultatersattning({ niva: 'A', placeringstyp: 'permanent', omfattningProcent: 100, utfall: 'studier' }, '3m'))
      .toMatchObject({ typ: 'belopp', belopp: 10_150 })
  })

  it('slutat → inget; ej nådd och saknad nivå → okänt, aldrig ett gissat belopp', () => {
    expect(resultatersattning({ niva: 'C', placeringstyp: 'permanent', omfattningProcent: 100, utfall: 'slutat' }, '6m').typ).toBe('inget')
    expect(resultatersattning({ niva: 'C', placeringstyp: 'permanent', omfattningProcent: 100, utfall: 'ej_nadd' }, '6m').typ).toBe('okant')
    expect(resultatersattning({ niva: null, placeringstyp: 'permanent', omfattningProcent: 100, utfall: 'kvar' }, '3m').typ).toBe('okant')
  })

  it('saknad omfattning på en anställning ger okänt, inte heltid', () => {
    expect(resultatersattning({ niva: 'B', placeringstyp: 'permanent', omfattningProcent: null, utfall: 'kvar' }, '3m').typ).toBe('okant')
  })
})
