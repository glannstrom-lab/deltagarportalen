import { describe, it, expect } from 'vitest'
import { tolkaImportDatum, tolkaImportPeriod, hittaKontakt } from './importNormalisering'

describe('SJ2: CV-importens datum', () => {
  it('kända format blir YYYY-MM, ett ensamt år lämnas', () => {
    expect(tolkaImportDatum('2019-03')).toBe('2019-03')
    expect(tolkaImportDatum('2019/3')).toBe('2019-03')
    expect(tolkaImportDatum('03/2019')).toBe('2019-03')
    expect(tolkaImportDatum('mars 2019')).toBe('2019-03')
    expect(tolkaImportDatum('Okt 2021')).toBe('2021-10')
    expect(tolkaImportDatum('2019')).toBe('2019')
    expect(tolkaImportDatum('')).toBe('')
  })
  it('ett intervall i startfältet delas upp', () => {
    expect(tolkaImportPeriod('2019-2024', '', false)).toEqual({ startDate: '2019', endDate: '2024', current: false })
    expect(tolkaImportPeriod('2019–2024', '', false)).toEqual({ startDate: '2019', endDate: '2024', current: false })
    expect(tolkaImportPeriod('mars 2019 - nu', '', false)).toEqual({ startDate: '2019-03', endDate: '', current: true })
    expect(tolkaImportPeriod('2019-03 – 2021-06', '', false)).toEqual({ startDate: '2019-03', endDate: '2021-06', current: false })
  })
  it('år-månad är inget intervall, och ett ifyllt slut respekteras', () => {
    expect(tolkaImportPeriod('2019-03', '', false)).toEqual({ startDate: '2019-03', endDate: '', current: false })
    expect(tolkaImportPeriod('2019-03', '2020-05', false)).toEqual({ startDate: '2019-03', endDate: '2020-05', current: false })
    expect(tolkaImportPeriod('2019', 'Pågående', false)).toEqual({ startDate: '2019', endDate: '', current: true })
  })
})

describe('SJ2: e-post och telefon ur texten i webbläsaren', () => {
  it('hittar e-post och svenskt mobilnummer', () => {
    expect(hittaKontakt('Anna Importsson\nanna.importsson@example.com · 073-123 45 67 · Göteborg')).toEqual({
      email: 'anna.importsson@example.com',
      phone: '073-123 45 67',
    })
  })
  it('tar inte ett personnummer för ett telefonnummer', () => {
    expect(hittaKontakt('Personnummer 19850312-1234').phone).toBeUndefined()
  })
})
