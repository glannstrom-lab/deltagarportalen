/**
 * Vakt mot DUBBLETTNYCKLAR i språkfilerna.
 *
 * Varför den behövs, med ett skarpt exempel: 2026-08-19 lade jag in
 * `coverLetter.write.templateBody` en andra gång i samma block. JSON tillåter
 * det — den sista vinner tyst — så `JSON.parse` gav inget fel, alla
 * paritetskontroller var gröna, och testsviten var grön. Men mallväljarens
 * beskrivning ("Utseendet syns i förhandsvisningen…") hade ersatts av en text
 * som interpolerar `{{count}}`, och användaren fick se den råa platshållaren
 * `{{count}}` i gränssnittet i produktion.
 *
 * Ingen befintlig kontroll kunde se det, eftersom alla arbetar på det
 * PARSADE objektet — där dubbletten redan är borta. Den här läser råtexten.
 *
 * Kontrollen är medvetet strukturell (spårar indrag och block) i stället för
 * att bara räkna förekomster av en sträng: `"title"` får finnas i hundra
 * olika block, men inte två gånger i samma.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const SPRAKFILER = ['sv.json', 'en.json'] as const

/**
 * Hittar nycklar som förekommer mer än en gång inom samma objekt.
 * Returnerar den fulla sökvägen, så felet går att hitta direkt.
 */
function hittaDubbletter(rå: string): string[] {
  const dubbletter: string[] = []
  // En stack av Set:ar — en per öppet objekt.
  const stack: Array<{ nycklar: Set<string>; namn: string }> = [{ nycklar: new Set(), namn: '' }]

  for (const rad of rå.split('\n')) {
    const trimmad = rad.trim()

    // Nyckel med objektvärde: `"namn": {`
    const objekt = trimmad.match(/^"([^"]+)"\s*:\s*\{$/)
    // Nyckel med skalärt värde: `"namn": <något>`
    const skalar = trimmad.match(/^"([^"]+)"\s*:\s*(?!\{$)/)

    if (objekt) {
      const nyckel = objekt[1]
      const topp = stack[stack.length - 1]
      const sokvag = topp.namn ? `${topp.namn}.${nyckel}` : nyckel
      if (topp.nycklar.has(nyckel)) dubbletter.push(sokvag)
      topp.nycklar.add(nyckel)
      stack.push({ nycklar: new Set(), namn: sokvag })
      continue
    }

    if (skalar) {
      const nyckel = skalar[1]
      const topp = stack[stack.length - 1]
      if (topp.nycklar.has(nyckel)) {
        dubbletter.push(topp.namn ? `${topp.namn}.${nyckel}` : nyckel)
      }
      topp.nycklar.add(nyckel)
      // En rad kan både öppna och stänga (`"a": { "b": 1 },`) — men filerna är
      // radbrutna per nyckel, så det fallet finns inte här.
      continue
    }

    // Stängd klammer på egen rad: lämna nuvarande objekt.
    if (trimmad.startsWith('}') && stack.length > 1) {
      stack.pop()
    }
  }

  return dubbletter
}

describe('språkfilerna har inga dubblettnycklar', () => {
  for (const fil of SPRAKFILER) {
    it(`${fil} — varje nyckel förekommer högst en gång per block`, () => {
      const rå = readFileSync(join(__dirname, 'locales', fil), 'utf8')
      const dubbletter = hittaDubbletter(rå)
      // Felmeddelandet ska peka rakt på nyckeln — det tog en produktionsbugg
      // och en timmes felsökning att hitta den förra gången.
      expect(dubbletter, `Dubbletter i ${fil}: ${dubbletter.join(', ')}`).toEqual([])
    })
  }
})

describe('hittaDubbletter — kontrollen kan faktiskt falla', () => {
  it('hittar en dubblett i samma block', () => {
    const rå = ['{', '  "a": {', '    "x": "1",', '    "x": "2"', '  }', '}'].join('\n')
    expect(hittaDubbletter(rå)).toEqual(['a.x'])
  })

  it('godtar samma nyckelnamn i OLIKA block', () => {
    const rå = ['{', '  "a": {', '    "x": "1"', '  },', '  "b": {', '    "x": "2"', '  }', '}'].join('\n')
    expect(hittaDubbletter(rå)).toEqual([])
  })

  it('hittar en dubblett även när värdet är ett objekt', () => {
    const rå = ['{', '  "a": {', '    "x": {', '      "y": "1"', '    },', '    "x": {', '      "y": "2"', '    }', '  }', '}'].join('\n')
    expect(hittaDubbletter(rå)).toEqual(['a.x'])
  })
})
