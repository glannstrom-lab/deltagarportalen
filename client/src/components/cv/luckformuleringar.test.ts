import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LUCKKODER, luckformuleringar, manadsText, periodText } from './luckformuleringar'
import { hittaTidsluckor, harTidslucka } from './tidsluckor'

const KALLOR = ['luckformuleringar.ts', 'LuckanICv.tsx']

describe('hittaTidsluckor (AIX3)', () => {
  it('ger perioden månaden efter förra slutet till månaden före nästa start', () => {
    const l = hittaTidsluckor([
      { startDate: '2018-01', endDate: '2019-12' },
      { startDate: '2021-03', endDate: '2022-01' },
    ])
    expect(l).toEqual([{ fran: '2020-01', till: '2021-02', manader: 14 }])
  })
  it('hittar ingen lucka vid 3 månader eller mindre, eller vid pågående post', () => {
    expect(hittaTidsluckor([{ startDate: '2020-01', endDate: '2020-06' }, { startDate: '2020-09', endDate: '2021-01' }])).toEqual([])
    expect(hittaTidsluckor([{ startDate: '2018-01', current: true }, { startDate: '2022-01', endDate: '2022-06' }])).toEqual([])
  })
  it('harTidslucka följer samma regel', () => {
    expect(harTidslucka([{ startDate: '2018-01', endDate: '2018-12' }, { startDate: '2020-01', endDate: '2020-06' }])).toBe(true)
  })
  it('tål skräp', () => {
    expect(hittaTidsluckor(undefined)).toEqual([])
    expect(hittaTidsluckor([null, {}])).toEqual([])
  })
})

describe('luckformuleringar (AIX3)', () => {
  it('ger tre texter med perioden för varje kod', () => {
    for (const kod of LUCKKODER) {
      const f = luckformuleringar(kod, '2020-01', '2021-02')!
      expect(f.cvRad.length).toBeGreaterThan(3)
      expect(f.brev).toContain('januari 2020 till februari 2021')
      expect(f.intervju).toContain('januari 2020 till februari 2021')
    }
  })
  it('sjukdomskoden nämner aldrig sjukdom, diagnos eller hälsa i texten', () => {
    const f = luckformuleringar('sjukdom', '2020-01', '2021-02')!
    expect(JSON.stringify(f)).not.toMatch(/sjuk|diagnos|hälsa|depress|ångest|utbränd|cancer|psyk/i)
  })
  it('formuleringarna innehåller inga siffror utöver perioden', () => {
    for (const kod of LUCKKODER) {
      const f = luckformuleringar(kod, '2020-01', '2021-02')!
      for (const t of [f.cvRad, f.brev, f.intervju]) {
        expect(t.replace(/(januari|februari) (2020|2021)/g, '')).not.toMatch(/\d/)
      }
    }
  })
  it('okänd kod eller ogiltig period ger null', () => {
    expect(luckformuleringar('diagnos: depression', '2020-01', '2021-02')).toBeNull()
    expect(luckformuleringar('barn', '2020', '2021-02')).toBeNull()
    expect(luckformuleringar(undefined, '2020-01', '2021-02')).toBeNull()
  })
  it('månadstext och en-månadersperiod', () => {
    expect(manadsText('2021-03')).toBe('mars 2021')
    expect(manadsText('2021-13')).toBe('')
    expect(periodText('2021-03', '2021-03')).toBe('mars 2021')
  })
  it('modulerna importerar aldrig AI- eller nätverkslagret och loggar inte', () => {
    for (const fil of KALLOR) {
      const kalla = readFileSync(join(__dirname, fil), 'utf-8')
      expect(kalla, fil).not.toMatch(/aiApi|callAI|fetch\(|console\.|supabase|sentry/i)
    }
  })
})
