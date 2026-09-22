/**
 * "Idag" är användarens dag, inte UTC:s — i gränssnittet också.
 *
 * `services/idagLokalt.test.ts` vaktar tjänstelagret. Den här vaktar
 * `components/` och `pages/`, där samma mönster fanns kvar på tio ställen
 * 2026-09-22 kväll:
 *
 *  · pages/career/AdaptationTab.tsx — "begärd"/"beviljad" anpassning fick
 *    gårdagens datum om man bytte status mellan midnatt och 01/02.
 *  · components/cv/ExperienceEditor.tsx — `max` på månadsfältet var UTC-månaden:
 *    natten mot den 1:a gick innevarande månad inte att välja.
 *  · sju filnamn på nedladdningar (intresseguiden, lön, intervju, konsulent-
 *    export m.fl.) fick fel datum samma timmar.
 *
 * Använd `formatLocalDate` (services/aktivitetSchema.ts).
 *
 * Mutation: skriv tillbaka `new Date().toISOString().split('T')[0]` i t.ex.
 * AdaptationTab.tsx → testet faller och pekar ut raden.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROT = join(__dirname, '..')
const KATALOGER = [join(ROT, 'components'), join(ROT, 'pages')]
// components/diary ägs av ett annat spår och vaktas där.
const UNDANTAG = [join('components', 'diary')]

function filer(katalog: string): string[] {
  if (!existsSync(katalog)) return []
  const ut: string[] = []
  for (const e of readdirSync(katalog, { withFileTypes: true })) {
    const p = join(katalog, e.name)
    if (e.isDirectory()) ut.push(...filer(p))
    else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.test\./.test(e.name)) ut.push(p)
  }
  return ut
}

const UTC_DATUM = /toISOString\(\)\s*\.\s*(split\(\s*['"]T['"]\s*\)|slice\(\s*0\s*,\s*(7|10)\s*\)|substring\(\s*0\s*,\s*(7|10)\s*\))/

describe('gränssnittet räknar datum i lokal tid', () => {
  it('ingen toISOString().split("T")/slice(0,10) i components/ eller pages/', () => {
    const alla = KATALOGER.flatMap(filer).filter((f) => !UNDANTAG.some((u) => f.includes(u)))
    expect(alla.length).toBeGreaterThan(300)
    const fynd: string[] = []
    for (const fil of alla) {
      readFileSync(fil, 'utf8').split('\n').forEach((rad, i) => {
        const kod = rad.trim()
        if (kod.startsWith('*') || kod.startsWith('//') || kod.startsWith('/*')) return
        if (UTC_DATUM.test(rad)) fynd.push(`${fil.slice(ROT.length + 1)}:${i + 1}`)
      })
    }
    expect(fynd).toEqual([])
  })
})
