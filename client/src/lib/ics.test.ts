/**
 * NF1 — kalenderexporten. Varje test är kontrollerat mot en mutation
 * (2026-09-24), se kommentaren vid respektive test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  byggIcs,
  escapaText,
  vikRad,
  stockholmTillUtc,
  utcStampel,
  icsFilnamn,
  laddaNerIcs,
  type IcsHandelse,
} from './ics'

const NU = new Date(Date.UTC(2026, 8, 24, 10, 15, 30))

const pass = (o: Partial<IcsHandelse> = {}): IcsHandelse => ({
  uid: 's-1@jobin.se',
  datum: '2026-09-28',
  start: '09:00',
  slut: '12:00',
  titel: 'Verkstad',
  ...o,
})

const oktetter = (s: string) => new TextEncoder().encode(s).length

/** Vik upp raderna igen (RFC 5545 §3.1: CRLF följt av ett blanksteg tas bort). */
const vecklaUt = (ics: string) => ics.replace(/\r\n /g, '')

describe('escapaText', () => {
  // Mutation: ta bort bakstrecksraden → faller. Flytta den sist → faller
  // (då dubbleras bakstrecken som de andra reglerna just lagt in).
  it('eskaperar bakstreck, semikolon, komma och radbrytning — bakstrecket först', () => {
    expect(escapaText('a\\b')).toBe('a\\\\b')
    expect(escapaText('Rum 3; plan 2')).toBe('Rum 3\\; plan 2')
    expect(escapaText('Malmö, Sverige')).toBe('Malmö\\, Sverige')
    expect(escapaText('rad1\nrad2\r\nrad3')).toBe('rad1\\nrad2\\nrad3')
    expect(escapaText('\\;,')).toBe('\\\\\\;\\,')
  })

  it('lämnar kolon och vanlig text orörda', () => {
    expect(escapaText('Kl 09:00 – språkcafé')).toBe('Kl 09:00 – språkcafé')
  })
})

describe('vikRad', () => {
  it('lämnar en rad på exakt 75 oktetter orörd', () => {
    const rad = 'X'.repeat(75)
    expect(vikRad(rad)).toBe(rad)
  })

  // Mutation: räkna tecken (rad.length) i stället för oktetter → faller,
  // eftersom "å" är två oktetter och raden då blir för lång.
  it('viker på oktetter, inte tecken, och ingen fysisk rad överstiger 75', () => {
    const rad = 'SUMMARY:' + 'å'.repeat(100)
    const vikt = vikRad(rad)
    for (const fysisk of vikt.split('\r\n')) expect(oktetter(fysisk)).toBeLessThanOrEqual(75)
    expect(vecklaUt(vikt)).toBe(rad)
  })

  // Mutation: glöm att blanksteget räknas (grans kvar på 75) → faller.
  it('räknar in fortsättningsradens inledande blanksteg', () => {
    const vikt = vikRad('A'.repeat(200))
    const rader = vikt.split('\r\n')
    expect(rader[0]).toHaveLength(75)
    expect(rader[1]).toBe(' ' + 'A'.repeat(74))
    expect(rader.every((r, i) => i === 0 || r.startsWith(' '))).toBe(true)
  })

  it('klyver aldrig ett flerbytestecken', () => {
    const rad = 'X'.repeat(74) + '€' + 'Y'.repeat(10) // € = 3 oktetter, passar inte på rad 1
    const [forsta, andra] = vikRad(rad).split('\r\n')
    expect(forsta).toBe('X'.repeat(74))
    expect(andra.startsWith(' €')).toBe(true)
  })
})

describe('stockholmTillUtc — sommartid', () => {
  // Mutation: ersätt förskjutningen med en fast timme (+1) → faller på sommaren.
  it('sommartid: 09:00 i juli är 07:00 UTC', () => {
    expect(utcStampel(stockholmTillUtc('2026-07-01', '09:00'))).toBe('20260701T070000Z')
  })

  it('vintertid: 09:00 i januari är 08:00 UTC', () => {
    expect(utcStampel(stockholmTillUtc('2026-01-15', '09:00'))).toBe('20260115T080000Z')
  })

  it('bytesdagen på våren (29 mars 2026): 01:00 är vintertid, 09:00 är sommartid', () => {
    expect(utcStampel(stockholmTillUtc('2026-03-29', '01:00'))).toBe('20260329T000000Z')
    expect(utcStampel(stockholmTillUtc('2026-03-29', '09:00'))).toBe('20260329T070000Z')
  })

  it('bytesdagen på hösten (25 oktober 2026): 09:00 är vintertid igen', () => {
    expect(utcStampel(stockholmTillUtc('2026-10-24', '09:00'))).toBe('20261024T070000Z')
    expect(utcStampel(stockholmTillUtc('2026-10-25', '09:00'))).toBe('20261025T080000Z')
  })

  it('tar HH:MM:SS lika gärna som HH:MM', () => {
    expect(utcStampel(stockholmTillUtc('2026-07-01', '09:30:00'))).toBe('20260701T073000Z')
  })

  it('kastar på ett datum eller en tid i fel form i stället för att gissa', () => {
    expect(() => stockholmTillUtc('28/9 2026', '09:00')).toThrow()
    expect(() => stockholmTillUtc('2026-09-28', '9')).toThrow()
  })
})

describe('byggIcs', () => {
  // Mutation: join('\n') i stället för CRLF → faller.
  it('använder CRLF genomgående och slutar med CRLF', () => {
    const ics = byggIcs([pass()], { nu: NU })
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('har kalenderns obligatoriska delar och en VEVENT per pass', () => {
    const ics = byggIcs([pass(), pass({ uid: 's-2@jobin.se' })], { nu: NU })
    const rader = ics.split('\r\n')
    expect(rader[0]).toBe('BEGIN:VCALENDAR')
    expect(rader).toContain('VERSION:2.0')
    expect(rader.some((r) => r.startsWith('PRODID:'))).toBe(true)
    expect(rader.filter((r) => r === 'BEGIN:VEVENT')).toHaveLength(2)
    expect(rader.filter((r) => r === 'END:VEVENT')).toHaveLength(2)
    expect(rader[rader.length - 2]).toBe('END:VCALENDAR')
  })

  // Mutation: släpp DTSTAMP eller UID → faller.
  it('har UID och DTSTAMP i UTC på varje händelse', () => {
    const ics = byggIcs([pass()], { nu: NU })
    expect(ics).toContain('UID:s-1@jobin.se\r\n')
    expect(ics).toContain('DTSTAMP:20260924T101530Z\r\n')
  })

  it('skriver start och slut i UTC, med sommartid inräknad', () => {
    const ics = byggIcs([pass({ datum: '2026-09-28', start: '09:00', slut: '12:00' })], { nu: NU })
    expect(ics).toContain('DTSTART:20260928T070000Z\r\n')
    expect(ics).toContain('DTEND:20260928T100000Z\r\n')
    const vinter = byggIcs([pass({ datum: '2026-11-02', start: '09:00', slut: '12:00' })], { nu: NU })
    expect(vinter).toContain('DTSTART:20261102T080000Z\r\n')
  })

  it('ett pass som slutar efter midnatt slutar nästa dag', () => {
    const ics = byggIcs([pass({ datum: '2026-09-28', start: '22:00', slut: '01:00' })], { nu: NU })
    expect(ics).toContain('DTSTART:20260928T200000Z')
    expect(ics).toContain('DTEND:20260928T230000Z')
  })

  // Mutation: skriv SUMMARY/LOCATION utan escapaText → faller.
  it('eskaperar titel, plats och beskrivning', () => {
    const ics = vecklaUt(
      byggIcs(
        [pass({ titel: 'CV, brev; intervju', plats: 'Storgatan 1, Malmö', beskrivning: 'Ta med\nlegitimation \\ pass' })],
        { nu: NU },
      ),
    )
    expect(ics).toContain('SUMMARY:CV\\, brev\\; intervju\r\n')
    expect(ics).toContain('LOCATION:Storgatan 1\\, Malmö\r\n')
    expect(ics).toContain('DESCRIPTION:Ta med\\nlegitimation \\\\ pass\r\n')
  })

  it('utelämnar tom plats och beskrivning i stället för att skriva tomma fält', () => {
    const ics = byggIcs([pass({ plats: null, beskrivning: '  ' })], { nu: NU })
    expect(ics).not.toContain('LOCATION')
    expect(ics).not.toContain('DESCRIPTION')
  })

  // Mutation: returnera textRad utan vikRad → faller.
  it('viker långa rader så att ingen fysisk rad överstiger 75 oktetter', () => {
    const lang = 'Språkcafé och samtal om arbetsmarknaden i Västra Götalandsregionen, del två av tre'
    const ics = byggIcs([pass({ titel: lang, plats: lang, beskrivning: lang })], { nu: NU })
    for (const rad of ics.split('\r\n')) expect(oktetter(rad)).toBeLessThanOrEqual(75)
    expect(vecklaUt(ics)).toContain(`SUMMARY:${escapaText(lang)}\r\n`)
  })

  it('DTSTAMP beror inte på datorns klocka när nu anges', () => {
    expect(byggIcs([pass()], { nu: NU })).toBe(byggIcs([pass()], { nu: NU }))
  })
})

describe('icsFilnamn', () => {
  it('tar bort tecken som filsystemen inte tål och lägger på .ics', () => {
    expect(icsFilnamn('Verkstad: CV/brev 2026-09-28')).toBe('Verkstad CV brev 2026-09-28.ics')
    expect(icsFilnamn('   ')).toBe('kalender.ics')
  })
})

describe('laddaNerIcs', () => {
  const { createObjectURL, revokeObjectURL } = URL
  afterEach(() => {
    vi.restoreAllMocks()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
  })

  it('laddar ner via en Blob-länk med download-attribut, utan att öppna ett fönster', async () => {
    const skapa = vi.fn(() => 'blob:x')
    const aterkalla = vi.fn()
    Object.assign(URL, { createObjectURL: skapa, revokeObjectURL: aterkalla })
    const oppna = vi.spyOn(window, 'open').mockImplementation(() => null)
    const klick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    laddaNerIcs('BEGIN:VCALENDAR\r\n', 'pass.ics')
    const blob = (skapa.mock.calls[0] as unknown as [Blob])[0]
    expect(blob.type).toBe('text/calendar;charset=utf-8')
    expect(klick).toHaveBeenCalledTimes(1)
    const klickad = klick.mock.contexts[0] as HTMLAnchorElement
    expect(klickad.download).toBe('pass.ics')
    expect(klickad.getAttribute('href')).toBe('blob:x')
    expect(oppna).not.toHaveBeenCalled()
    // Blob-URL:en släpps i en setTimeout(0). Vänta in den INNAN afterEach
    // återställer URL — annars anropas jsdoms saknade revokeObjectURL efter
    // testet och vitest rapporterar ett ohanterat fel.
    await new Promise((r) => setTimeout(r, 0))
    expect(aterkalla).toHaveBeenCalledWith('blob:x')
  })
})
