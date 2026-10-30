import { describe, it, expect } from 'vitest'
import {
  MAX_RADER, avkodaCsv, delaNamn, granskaDeltagarlista, hittaAvgransare, markeraBefintliga, raknaStatus,
  tokeniseraCsv, tolkaDatum, utfallTillCsv, type Granskning,
} from './deltagarlistaCsv'

function ok(g: Granskning) {
  if (!g.ok) throw new Error('väntade ok, fick: ' + g.fel)
  return g
}

describe('avkodaCsv', () => {
  it('tar bort UTF-8-BOM', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('Namn;E-post')])
    expect(avkodaCsv(bytes)).toEqual({ text: 'Namn;E-post', kodning: 'utf-8' })
  })
  it('läser giltig UTF-8 med å/ä/ö', () => {
    expect(avkodaCsv(new TextEncoder().encode('Östen Åkerlund')).text).toBe('Östen Åkerlund')
  })
  it('faller tillbaka på Windows-1252 när byten inte är UTF-8 (Excel)', () => {
    // "Åsa;Ärende" i Windows-1252: Å=0xC5, Ä=0xC4
    const bytes = new Uint8Array([0xc5, 0x73, 0x61, 0x3b, 0xc4, 0x72, 0x65, 0x6e, 0x64, 0x65])
    expect(avkodaCsv(bytes)).toEqual({ text: 'Åsa;Ärende', kodning: 'windows-1252' })
  })
})

describe('hittaAvgransare', () => {
  it('semikolon (svensk Excel)', () => expect(hittaAvgransare('Namn;E-post\nA;b@c.se')).toBe(';'))
  it('komma', () => expect(hittaAvgransare('Namn,E-post\nA,b@c.se')).toBe(','))
  it('tabb', () => expect(hittaAvgransare('Namn\tE-post\nA\tb@c.se')).toBe('\t'))
  it('ignorerar avgränsare inne i citattecken', () => {
    expect(hittaAvgransare('"Namn, efternamn";E-post\n')).toBe(';')
  })
  it('semikolon vinner vid lika antal med komma', () => expect(hittaAvgransare('a;b,c')).toBe(';'))
  it('en kolumn utan avgränsare ger semikolon', () => expect(hittaAvgransare('E-post\na@b.se')).toBe(';'))
})

describe('tokeniseraCsv', () => {
  it('hanterar citerade fält med avgränsare, dubbla citattecken och radbrytning', () => {
    const r = tokeniseraCsv('a;"b;c";"d ""e"" f";"x\ny"\n1;2;3;4', ';')
    expect(r[0].falt).toEqual(['a', 'b;c', 'd "e" f', 'x\ny'])
    expect(r[1]).toEqual({ rad: 3, falt: ['1', '2', '3', '4'] })
  })
  it('CRLF och sista raden utan radslut', () => {
    const r = tokeniseraCsv('a;b\r\nc;d', ';')
    expect(r.map((x) => x.falt)).toEqual([['a', 'b'], ['c', 'd']])
  })
  it('behåller tomma fält', () => {
    expect(tokeniseraCsv('a;;c', ';')[0].falt).toEqual(['a', '', 'c'])
  })
})

describe('tolkaDatum', () => {
  it.each([
    ['2026-11-03', '2026-11-03'],
    ['2026/11/3', '2026-11-03'],
    ['20261103', '2026-11-03'],
    ['3/11/2026', '2026-11-03'],
    ['03.11.2026', '2026-11-03'],
    ['3-11-2026', '2026-11-03'],
    ['2028-02-29', '2028-02-29'],
  ])('%s → %s', (inn, ut) => expect(tolkaDatum(inn)).toBe(ut))
  it.each(['2026-02-30', '2027-02-29', '2026-13-01', '03.11.26', '46000', 'imorgon', '', '2026-00-10'])(
    'nekar %s', (inn) => expect(tolkaDatum(inn)).toBeNull(),
  )
})

describe('delaNamn', () => {
  it('förnamn + efternamn', () => expect(delaNamn('Anna Svensson')).toEqual({ fornamn: 'Anna', efternamn: 'Svensson' }))
  it('flera förnamn', () => expect(delaNamn('Anna Maria Svensson')).toEqual({ fornamn: 'Anna Maria', efternamn: 'Svensson' }))
  it('Efternamn, Förnamn', () => expect(delaNamn('Svensson, Anna')).toEqual({ fornamn: 'Anna', efternamn: 'Svensson' }))
  it('ett ord', () => expect(delaNamn('Cher')).toEqual({ fornamn: 'Cher', efternamn: '' }))
})

describe('granskaDeltagarlista', () => {
  it('läser en svensk Excel-export (semikolon, BOM borta, ärende + datum)', () => {
    const g = ok(granskaDeltagarlista(
      'Namn;E-post;Ärendenummer;Startdatum\r\nAnna Svensson;Anna@Example.se;K-2026-001;2026-11-03\r\nOla Nord;ola@example.se;;3/11/2026\r\n',
    ))
    expect(g.avgransare).toBe(';')
    expect(g.rader).toHaveLength(2)
    expect(g.rader[0]).toMatchObject({
      rad: 2, fornamn: 'Anna', efternamn: 'Svensson', epost: 'anna@example.se',
      arendenummer: 'K-2026-001', startdatum: '2026-11-03', status: 'ok', orsak: null,
    })
    expect(g.rader[1]).toMatchObject({ arendenummer: null, startdatum: '2026-11-03', status: 'ok' })
  })

  it('Förnamn + Efternamn i egna kolumner, kommaavgränsat, rubriker i annan ordning', () => {
    const g = ok(granskaDeltagarlista('Email,Efternamn,Förnamn\nx@y.se,Berg,Eva'))
    expect(g.rader[0]).toMatchObject({ fornamn: 'Eva', efternamn: 'Berg', epost: 'x@y.se', status: 'ok' })
  })

  it('markerar dubblett i filen och pekar på första raden (skiftläge och blanksteg ignoreras)', () => {
    const g = ok(granskaDeltagarlista('E-post\na@b.se\nA@B.se \nc@d.se'))
    expect(g.rader.map((r) => r.status)).toEqual(['ok', 'dubblett', 'ok'])
    expect(g.rader[1].orsak).toContain('rad 2')
  })

  it('ogiltig och saknad e-post blir felrader med text, övriga rader påverkas inte', () => {
    const g = ok(granskaDeltagarlista('E-post\nanna@\n\nok@exempel.se\nb c@d.se'))
    expect(g.rader.map((r) => r.status)).toEqual(['fel', 'ok', 'fel'])
    expect(g.rader[0].orsak).toMatch(/E-post/)
  })

  it('en rad med bara blank e-post men namn är ett fel, inte tyst skippad', () => {
    const g = ok(granskaDeltagarlista('Namn;E-post\nAnna;'))
    expect(g.rader[0].status).toBe('fel')
    expect(g.rader[0].orsak).toContain('E-post saknas')
  })

  it('nekar personnummer i ärendenummer och ogiltigt datum, med skäl', () => {
    const g = ok(granskaDeltagarlista('E-post;Ärendenummer;Startdatum\na@b.se;850312-1234;2026-01-01\nc@d.se;K1;31/02/2026'))
    expect(g.rader[0].status).toBe('fel')
    expect(g.rader[0].orsak).toContain('personnummer')
    expect(g.rader[1].status).toBe('fel')
    expect(g.rader[1].orsak).toContain('31/02/2026')
  })

  it('ett fel i en rad stoppar inte raderna efter (rad 2 av 3 felar)', () => {
    const g = ok(granskaDeltagarlista('E-post\na@b.se\nfel\nc@d.se'))
    expect(raknaStatus(g.rader)).toMatchObject({ ok: 2, fel: 1 })
  })

  it('kräver en E-post-rubrik och säger vilka rubriker den hittade', () => {
    const g = granskaDeltagarlista('Namn;Telefon\nAnna;070')
    expect(g.ok).toBe(false)
    if (!g.ok) expect(g.fel).toContain('Namn, Telefon')
  })

  it('tom fil och bara rubriker', () => {
    expect(granskaDeltagarlista('').ok).toBe(false)
    expect(granskaDeltagarlista('\n \n').ok).toBe(false)
    expect(granskaDeltagarlista('E-post').ok).toBe(false)
  })

  it(`över ${MAX_RADER} rader avvisas hela filen, inget klipps tyst`, () => {
    const rader = Array.from({ length: MAX_RADER + 1 }, (_, i) => `u${i}@x.se`).join('\n')
    const g = granskaDeltagarlista('E-post\n' + rader)
    expect(g.ok).toBe(false)
    if (!g.ok) expect(g.fel).toContain(String(MAX_RADER + 1))
    expect(granskaDeltagarlista('E-post\n' + rader.split('\n').slice(0, MAX_RADER).join('\n')).ok).toBe(true)
  })

  it('radnummer följer filen även med radbrytning i citerat fält', () => {
    const g = ok(granskaDeltagarlista('E-post;Namn\na@b.se;"Anna\nSvensson"\nc@d.se;Kalle'))
    expect(g.rader.map((r) => r.rad)).toEqual([2, 4])
  })

  it('rapporterar rubriker som inte används', () => {
    const g = ok(granskaDeltagarlista('E-post;Telefon\na@b.se;070'))
    expect(g.ignoreradeRubriker).toEqual(['Telefon'])
  })
})

describe('markeraBefintliga', () => {
  const g = ok(granskaDeltagarlista('E-post\na@b.se\nc@d.se\ne@f.se\nfel'))
  it('redan kopplad och redan inbjuden får egen status och orsak; felrader rörs inte', () => {
    const ut = markeraBefintliga(g.rader, new Set(['a@b.se']), new Set(['c@d.se']))
    expect(ut.map((r) => r.status)).toEqual(['redan_kopplad', 'redan_inbjuden', 'ok', 'fel'])
    expect(ut[0].orsak).toContain('kopplad')
    expect(ut[1].orsak).toContain('inbjudan')
  })
})

describe('utfallTillCsv', () => {
  it('BOM, semikolon, citerar fält och skyddar mot formelinjektion', () => {
    const csv = utfallTillCsv([
      { rad: 2, epost: 'a@b.se', utfall: 'skickad', meddelande: 'Inbjudan skickad.' },
      { rad: 3, epost: '=x@b.se', utfall: 'fel', meddelande: 'Fel; "citerat"' },
    ])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('Rad;E-post;Utfall;Meddelande')
    expect(csv).toContain("'=x@b.se")
    expect(csv).toContain('"Fel; ""citerat"""')
    expect(csv).toContain('Misslyckades')
  })
})
