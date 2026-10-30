import { describe, it, expect } from 'vitest'
import {
  arTom,
  byggLasmig,
  byggZip,
  exportFilnamn,
  filtreraJournal,
  radTillCsv,
  FILNAMN,
  type EnhetsData,
} from './enhetsExport'

const dec = new TextDecoder()
const NU = new Date('2026-10-30T12:00:00')

/** Namnen i zipens centrala katalog. */
function zipNamn(zip: Uint8Array): string[] {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
  const eocd = zip.length - 22
  let pos = v.getUint32(eocd + 16, true)
  const ut: string[] = []
  for (let i = 0; i < v.getUint16(eocd + 10, true); i++) {
    const len = v.getUint16(pos + 28, true)
    ut.push(dec.decode(zip.slice(pos + 46, pos + 46 + len)))
    pos += 46 + len
  }
  return ut
}

const data: EnhetsData = {
  planer: [{ id: 'p1', participant_id: 'd1', status: 'active', plan_text: 'Åsa; "citat"' }],
  pass: [{ id: 's1', plan_id: 'p1', attendance: 'present', date: '2026-10-01' }],
  underlag: [{ id: 'h1', summary: { pass: 4 } }],
  overforingar: [],
  journal: null,
}

describe('filtreraJournal', () => {
  const rader = [
    { id: 'j1', category: 'MEETING', content: 'möte' },
    { id: 'j2', category: 'CONCERN', content: 'oro' },
  ]
  it('utan aktivt val tas ingen journal med, vad som än hämtats', () => {
    expect(filtreraJournal(rader, { journal: false, oro: true })).toEqual([])
  })
  it('med journalval men utan oroval faller orosanteckningarna bort', () => {
    expect(filtreraJournal(rader, { journal: true, oro: false }).map((r) => r.id)).toEqual(['j1'])
  })
  it('med båda valen ingår orosanteckningarna', () => {
    expect(filtreraJournal(rader, { journal: true, oro: true }).map((r) => r.id)).toEqual(['j1', 'j2'])
  })
})

describe('radTillCsv', () => {
  it('semikolon, BOM och CRLF; citerar fält med semikolon och citattecken; objekt som JSON', () => {
    const csv = radTillCsv([...data.planer, ...data.underlag])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('\r\n')
    expect(csv.split('\r\n')[0]).toBe('﻿id;participant_id;status;plan_text;summary')
    expect(csv).toContain('"Åsa; ""citat"""')
    expect(csv).toContain('"{""pass"":4}"')
  })
  it('tom lista blir en fil med besked, inte en helt tom fil', () => {
    expect(radTillCsv([])).toContain('(inga rader)')
  })
})

describe('arTom', () => {
  it('är sann bara när allt är tomt — då laddas ingen fil ned', () => {
    expect(arTom({ planer: [], pass: [], underlag: [], overforingar: [], journal: null })).toBe(true)
    expect(arTom(data)).toBe(false)
  })
})

describe('byggZip', () => {
  it('journal.csv ingår inte utan aktivt val', () => {
    const namn = zipNamn(byggZip('Hällefors kommun', data, { journal: false, oro: false }, NU))
    expect(namn).not.toContain(FILNAMN.journal)
    expect(namn).toContain(FILNAMN.lasmig)
    expect(namn).toContain(FILNAMN.planer)
  })
  it('journal.csv ingår när journalen hämtats efter ett aktivt val', () => {
    const namn = zipNamn(byggZip('X', { ...data, journal: [{ id: 'j1' }] }, { journal: true, oro: false }, NU))
    expect(namn).toContain(FILNAMN.journal)
  })
})

describe('byggLasmig', () => {
  it('säger rakt ut att journalen inte togs med, och hur många rader som ingår', () => {
    const t = byggLasmig('Hällefors kommun', data, { journal: false, oro: false }, NU)
    expect(t).toContain('ej med')
    expect(t).toContain(`${FILNAMN.planer}: 1`)
    expect(t).toContain('Inget har raderats')
  })
  it('anger att orosanteckningar saknas respektive ingår', () => {
    const med = { ...data, journal: [{ id: 'j1' }] }
    expect(byggLasmig('X', med, { journal: true, oro: false }, NU)).toContain('utan orosanteckningar')
    expect(byggLasmig('X', med, { journal: true, oro: true }, NU)).toContain('inklusive orosanteckningar')
  })
})

describe('exportFilnamn', () => {
  it('gör ett filnamnssäkert namn av organisationen', () => {
    expect(exportFilnamn('Hällefors kommun', NU)).toBe('jobin-enhetsdata-hallefors-kommun-2026-10-30.zip')
  })
})
