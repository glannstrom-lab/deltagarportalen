/**
 * Vakt för de publika verktygssidornas påståenden (KO1, genomgången 2026-08-17).
 *
 * `content/tools.json` är den enda filen i projektet vars innehåll säljs in till
 * okända besökare innan de skapat konto. Dess egen huvudkommentar slog fast att
 * varje påstående var kontrollerat mot koden — och påstod samtidigt "13
 * CV-mallar" medan `TEMPLATES` i `CVBuilder.tsx` hade tolv. Siffran låg på
 * prod-sidan `/verktyg/cv/` i fyra upprepningar under tolv dygn.
 *
 * Det är inte ett stavfel utan en klass: ett påstående skrivs en gång,
 * verifieras en gång, och glider sedan tyst när koden ändras. Kommentaren i
 * filen räcker inte som skydd — den var själv fel.
 *
 * Testet knyter därför de påståenden som ÄR maskinellt kontrollerbara till sin
 * källa i koden. Resten (tonfall, "gratis", vad ett verktyg känns som) kan bara
 * en människa avgöra, och de står kvar oskyddade med flit — hellre ett litet
 * test som håller än ett stort som låtsas.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* eslint-disable @typescript-eslint/no-require-imports */
const tools = require('../../content/tools.json') as {
  _kommentar: string
  verktyg: {
    slug: string
    route: string
    description: string
    lead: string
    steg: [string, string][]
    punkter: string[]
    faq: [string, string][]
  }[]
}
const { validateRoutes } = require('../../scripts/lib/guides.cjs') as {
  validateRoutes: (appTsxPath: string) => number
}
/* eslint-enable @typescript-eslint/no-require-imports */

/** Antalet mallar användaren faktiskt kan välja — inte antalet filer i mappen. */
function antalCvMallar(): number {
  const src = readFileSync(resolve(__dirname, '../pages/CVBuilder.tsx'), 'utf8')
  const start = src.indexOf('const TEMPLATES')
  expect(start, 'TEMPLATES hittades inte i CVBuilder.tsx — har den bytt namn?').toBeGreaterThan(-1)
  // Klipp vid slutet av arrayen så vi inte råkar räkna id:n längre ned i filen.
  const slut = src.indexOf('\n]', start)
  const block = src.slice(start, slut)
  return (block.match(/id:\s*'[a-z0-9-]+'/g) || []).length
}

describe('tools.json påstår inget koden inte håller', () => {
  it('antalet CV-mallar stämmer med TEMPLATES i CVBuilder', () => {
    const faktiskt = antalCvMallar()
    // Positiv kontroll: hittar vi noll har regexen slutat matcha och testet
    // hade blivit grönt av fel skäl.
    expect(faktiskt).toBeGreaterThan(5)

    const cv = tools.verktyg.find((v) => v.slug === 'cv')
    expect(cv, 'cv-verktyget saknas i tools.json').toBeDefined()

    const text = [
      cv!.description,
      cv!.lead,
      ...cv!.steg.flat(),
      ...cv!.punkter,
      ...cv!.faq.flat(),
      tools._kommentar,
    ].join(' ')
    const pastadda = [...text.matchAll(/(\d+)\s*(?:CV-)?mallar/g)].map((m) => Number(m[1]))

    expect(pastadda.length, 'ingen mallsiffra hittad — har formuleringen ändrats?').toBeGreaterThan(0)
    for (const n of pastadda) expect(n).toBe(faktiskt)
  })

  it('varje verktygs route finns i App.tsx', () => {
    // Återanvänder byggets egen grind i stället för att skriva en sämre kopia —
    // en andra routematchare hade kunnat säga något annat än den som faktiskt
    // gatear bygget, och då är den värre än ingen. Skillnaden är bara att den
    // här fäller i testsviten också, inte bara vid `npm run build`.
    expect(() => validateRoutes(resolve(__dirname, '../App.tsx'))).not.toThrow()
  })

  it('inga användarsiffror eller omdömen har smugit in', () => {
    // Filens egen regel, gjord körbar. B19/B20 visade vad som händer annars.
    const allText = JSON.stringify(tools.verktyg)
    expect(allText).not.toMatch(/\d[\d\s]*\+?\s*(användare|deltagare|kunder|personer har)/i)
    expect(allText).not.toMatch(/\d[,.]\d\s*av\s*5|femstjärnig|betyg/i)
  })
})
