/**
 * Hubbens kort och hubbens navigation ska visa samma undersidor.
 *
 * Bakgrund (2026-08-17): den nya toppnavigationens rad 2 listar en hubbs
 * undersidor ur `navHubs[].memberPaths`. Hubblandningens funktionskort byggs
 * i stället för hand i `JobsokHub.tsx` m.fl. Två källor för samma sanning, och
 * de hade redan glidit isär åt båda hållen:
 *
 *   Söka jobb   — 9 länkar i naven, 7 kort. `/linkedin-optimizer` och
 *                 `/international` var färdiga verktyg som inte gick att nå
 *                 från hubben man skickas till.
 *   Min vardag  — 6 kort, 5 länkar. `/profile` hade kort men saknades i
 *                 memberPaths, så `pageToHub` mappade den inte: uppmätt i
 *                 webbläsaren markerades ingen huvudkategori som aktiv på
 *                 /profile och undersidesraden föll från 5 länkar till 3.
 *
 * Ingen av de två upptäcktes av en människa på fyra granskningar. Att laga
 * instanserna utan att laga mekanismen hade bara betytt att de glider isär
 * igen — det här testet är mekaniken.
 *
 * Testet läser korten ur källfilerna med en regex i stället för att rendera
 * hubbarna. Skälet är att komponenterna hämtar data via React Query och
 * authStore; att montera dem hade mätt mockarna, inte listan. `href:` i en
 * `HubFeature` är en literal — den går att läsa direkt, och den kan inte
 * blir grön av att en mock råkar returnera rätt.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { navHubs } from '@/components/layout/navigation'

const HUBBFIL: Record<string, string> = {
  jobb: 'JobsokHub.tsx',
  karriar: 'KarriarHub.tsx',
  resurser: 'ResurserHub.tsx',
  'min-vardag': 'MinVardagHub.tsx',
}

function kortensLankar(fil: string): string[] {
  const kalla = readFileSync(join(__dirname, '..', fil), 'utf8')
  return [...kalla.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1])
}

describe('hubbens kort matchar hubbens navigation', () => {
  for (const [hubbId, fil] of Object.entries(HUBBFIL)) {
    const hubb = navHubs.find((h) => h.id === hubbId)!

    it(`${hubbId}: varje underside i naven har ett kort`, () => {
      const kort = kortensLankar(fil)
      const saknas = hubb.memberPaths.filter((p) => !kort.includes(p))
      expect(saknas, `${fil} saknar kort för: ${saknas.join(', ')}`).toEqual([])
    })

    it(`${hubbId}: varje kort finns i naven`, () => {
      const kort = kortensLankar(fil)
      const overblivna = kort.filter((p) => !hubb.memberPaths.includes(p))
      expect(
        overblivna,
        `${fil} har kort som saknas i memberPaths: ${overblivna.join(', ')}. ` +
          'Utan memberPath mappar pageToHub inte sidan, och naven tappar aktiv hub.'
      ).toEqual([])
    })
  }
})

describe('negativ kontroll — testet kan falla', () => {
  it('upptäcker en underside utan kort', () => {
    const kort = kortensLankar(HUBBFIL.jobb)
    // Samma jämförelse som ovan, men mot en sida som inte har något kort.
    // Går den här igenom är jämförelsen ovan meningslös.
    expect(kort.includes('/en-sida-som-inte-finns')).toBe(false)
    const latsasMedlemmar = [...navHubs[1].memberPaths, '/en-sida-som-inte-finns']
    expect(latsasMedlemmar.filter((p) => !kort.includes(p))).not.toEqual([])
  })
})
