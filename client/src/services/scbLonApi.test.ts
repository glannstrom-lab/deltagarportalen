import { describe, it, expect } from 'vitest'
import { tolkaLonSvar } from './scbLonApi'

describe('MK2: SCB-lönen tolkas strikt', () => {
  it('giltiga rader blir tal, året följer med', () => {
    const s = tolkaLonSvar({ ar: '2025', rader: [{ ssyk: '5120', median: 32200, p10: 28600, p25: 30200, p75: 34800, p90: 37400 }] })
    expect(s.ar).toBe('2025')
    expect(s.rader.get('5120')).toMatchObject({ median: 32200, p25: 30200, p75: 34800 })
  })

  it('null, 0, text och skräp blir null — aldrig en nolla', () => {
    const s = tolkaLonSvar({ ar: '2025', rader: [{ ssyk: '9999', median: null, p10: 0, p25: '..', p75: 'x', p90: NaN }] })
    expect(s.rader.get('9999')).toEqual({ ssyk: '9999', median: null, p10: null, p25: null, p75: null, p90: null })
  })

  it('felaktiga koder och år kastas bort', () => {
    const s = tolkaLonSvar({ ar: '25', rader: [{ ssyk: '51', median: 1 }, null, 'x'] })
    expect(s.ar).toBeNull()
    expect(s.rader.size).toBe(0)
  })
})
