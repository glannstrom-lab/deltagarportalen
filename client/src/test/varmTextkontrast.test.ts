/**
 * Grind (2026-10-10, mobilgenomgången): varma textfärger som inte klarar
 * 4,5:1 mot vit eller nästan vit botten får inte stå på text.
 *
 *   red-500    #fb2c36  3,6:1     amber-500  #fe9a00  2,2:1
 *   amber-600  #e17100  3,1:1     orange-600 #f54900  3,6:1
 *
 * De stod på 39 textställen: felmeddelanden i 12 px under formulärfält,
 * asteriskerna för obligatoriska fält, "Rensa mina svar", statusrader i
 * ansökningsdetaljen. Axe såg bara de som råkade synas på en sidas första vy —
 * resten låg i dialoger och i fel som bara visas när något gått snett.
 * 700-nivån klarar AA (red-700 6,5:1, amber-700 5,0:1, orange-700 5,2:1).
 *
 * Ikoner och dekor (•, →) undantas: icke-text behöver 3:1 (WCAG 1.4.11).
 * Kontrollen ser bara className på samma rad som <p>/<span>/<label>.
 *
 * Mutation: skriv tillbaka text-red-500 på ett felmeddelande i
 * components/ui/Input.tsx → grinden faller och säger var.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative, sep } from 'path'

const SRC = join(__dirname, '..')
const RÖTTER = ['pages', 'components']
// Konsulentvyn har egen granskning och ton (DESIGN.md §2).
const UNDANTAG = ['components/consultant/', 'pages/consultant/']
const LAG_KONTRAST = /<(p|span|label)\b[^>]*className="[^"]*(?<![:\w-])text-(red-500|amber-500|amber-600|orange-600)\b/
const DEKOR = />\s*[•→]\s*</

function filer(dir: string): string[] {
  return readdirSync(dir).flatMap((namn) => {
    const full = join(dir, namn)
    if (statSync(full).isDirectory()) return filer(full)
    return /\.tsx$/.test(namn) && !/\.test\.tsx$/.test(namn) ? [full] : []
  })
}

describe('Varma textfärger klarar AA-kontrast', () => {
  it('ingen text i red-500, amber-500, amber-600 eller orange-600', () => {
    const fynd: string[] = []
    for (const rot of RÖTTER) {
      for (const fil of filer(join(SRC, rot))) {
        const rel = relative(SRC, fil).split(sep).join('/')
        if (UNDANTAG.some((u) => rel.startsWith(u))) continue
        readFileSync(fil, 'utf8').split(/\r?\n/).forEach((rad, i) => {
          const m = rad.match(LAG_KONTRAST)
          if (m && !DEKOR.test(rad)) fynd.push(`${rel}:${i + 1} text-${m[2]}`)
        })
      }
    }
    expect(fynd, `Byt till 700-nivån (med dark:…-400):\n${fynd.join('\n')}`).toEqual([])
  })
})
