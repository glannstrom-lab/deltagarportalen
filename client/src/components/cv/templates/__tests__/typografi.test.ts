import { describe, it, expect } from 'vitest'
import { datumText, periodText, periodDelar, beskrivningsblock, rubrikTaggar } from '../typografi'

describe('datumText', () => {
  it('skriver år-månad som kort svensk månad', () => {
    expect(datumText('2023-03')).toBe('mar 2023')
    expect(datumText('2023-05-17')).toBe('maj 2023')
    expect(datumText('2019-12')).toBe('dec 2019')
  })
  it('lämnar årtal och fritext orörda — hellre användarens ord än en gissning', () => {
    expect(datumText('2019')).toBe('2019')
    expect(datumText('våren 2019')).toBe('våren 2019')
    expect(datumText('2019-13')).toBe('2019-13')
  })
  it('tomt är tomt', () => {
    expect(datumText('')).toBe('')
    expect(datumText(undefined)).toBe('')
    expect(datumText(null)).toBe('')
  })
})

describe('periodText', () => {
  it('pågående får "nu" (eller mallens ord)', () => {
    expect(periodText('2023-03', '', true)).toBe('mar 2023 – nu')
    expect(periodText('2023-03', '', true, 'nuvarande')).toBe('mar 2023 – nuvarande')
  })
  it('avslutad', () => {
    expect(periodText('2020-12', '2025-11', false)).toBe('dec 2020 – nov 2025')
  })
  it('ett ensamt datum får inget hängande streck', () => {
    expect(periodText('2023-03', '', false)).toBe('mar 2023')
    expect(periodText('', '2020-06', false)).toBe('jun 2020')
    expect(periodText('', '', false)).toBe('')
  })
  it('delarna för tvåradiga datumkolumner', () => {
    expect(periodDelar('2023-03', '', true)).toEqual({ fran: 'mar 2023', till: 'nu' })
  })
})

describe('beskrivningsblock', () => {
  it('bevarar stycken, radbrytningar och punktlistor', () => {
    expect(beskrivningsblock('Inledning.\nAndra raden.\n\n- Ett\n• Två\n* Tre\n\nAvslutning')).toEqual([
      { typ: 'stycke', rader: ['Inledning.', 'Andra raden.'] },
      { typ: 'lista', punkter: ['Ett', 'Två', 'Tre'] },
      { typ: 'stycke', rader: ['Avslutning'] },
    ])
  })
  it('en lista direkt efter text utan tomrad', () => {
    expect(beskrivningsblock('Uppgifter:\n- Plock\n- Pack')).toEqual([
      { typ: 'stycke', rader: ['Uppgifter:'] },
      { typ: 'lista', punkter: ['Plock', 'Pack'] },
    ])
  })
  it('ett bindestreck inne i en mening är ingen punkt', () => {
    expect(beskrivningsblock('Lager- och logistikarbete')).toEqual([
      { typ: 'stycke', rader: ['Lager- och logistikarbete'] },
    ])
  })
  it('Windows-radbrytningar och tomt', () => {
    expect(beskrivningsblock('A\r\nB')).toEqual([{ typ: 'stycke', rader: ['A', 'B'] }])
    expect(beskrivningsblock('  ')).toEqual([])
    expect(beskrivningsblock(undefined)).toEqual([])
  })
})

describe('rubrikTaggar', () => {
  it('PDF: namnet är h1', () => {
    expect(rubrikTaggar()).toEqual({ Namn: 'h1', Sektion: 'h2', Post: 'h3' })
  })
  it('förhandsvisningen: allt ett steg ned, ingen h1', () => {
    expect(rubrikTaggar(2)).toEqual({ Namn: 'h2', Sektion: 'h3', Post: 'h4' })
  })
})
