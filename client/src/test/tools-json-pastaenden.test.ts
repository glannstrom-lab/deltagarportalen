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
import { allQuestions, occupations } from '@/services/interestGuideData'
import { YRKESOMRADEN, LONEREGIONER, ERFARENHETSNIVAER } from '@/data/lonedata'
import { APPLICATION_STATUS_CONFIG } from '@/types/application.types'
import { wellnessTabDefs } from '@/data/wellnessTabs'

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

/** Hittar alla heltal i en text som föregår ett givet ord (svensk pluralform). */
function talFore(text: string, ord: string): number[] {
  const re = new RegExp(`(\\d[\\d\\s]*)\\s*${ord}`, 'g')
  return [...text.matchAll(re)].map((m) => Number(m[1].replace(/\s/g, '')))
}

function alltextFor(slug: string): string {
  const t = tools.verktyg.find((v) => v.slug === slug)
  expect(t, `${slug}-verktyget saknas i tools.json`).toBeDefined()
  return [t!.description, t!.lead, ...t!.steg.flat(), ...t!.punkter, ...t!.faq.flat()].join(' ')
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

  it('yrkestestets frågor och yrken stämmer med services/interestGuideData.ts', () => {
    // Positiv kontroll: en tom lista hade gjort matchningen meningslös.
    expect(allQuestions.length).toBeGreaterThan(10)
    expect(occupations.length).toBeGreaterThan(100)

    const text = alltextFor('yrkestest')
    const fragor = talFore(text, 'frågor')
    const yrken = talFore(text, 'yrken')
    expect(fragor.length, 'ingen frågesiffra hittad — har formuleringen ändrats?').toBeGreaterThan(0)
    expect(yrken.length, 'ingen yrkessiffra hittad — har formuleringen ändrats?').toBeGreaterThan(0)
    for (const n of fragor) expect(n).toBe(allQuestions.length)
    for (const n of yrken) expect(n).toBe(occupations.length)
  })

  it('LinkedIn-teckengränserna stämmer med TECKENGRANS i LinkedInOptimizer.tsx', () => {
    const src = readFileSync(resolve(__dirname, '../pages/LinkedInOptimizer.tsx'), 'utf8')
    const start = src.indexOf('const TECKENGRANS')
    expect(start, 'TECKENGRANS hittades inte — har den bytt namn?').toBeGreaterThan(-1)
    const block = src.slice(start, src.indexOf('}', start) + 1)
    const grans = Object.fromEntries(
      [...block.matchAll(/(\w+):\s*(\d+)/g)].map((m) => [m[1], Number(m[2])])
    )
    expect(Object.keys(grans)).toHaveLength(4)

    const text = alltextFor('linkedin')
    // Tusentalsavgränsaren skrivs som ett vanligt mellanslag i texten ("2 600
    // tecken") — normalisera bort den innan jämförelsen i stället för att
    // förlita sig på att toLocaleString('sv-SE') råkar använda samma
    // blanksteg (den använder i själva verket en icke-brytande, U+00A0).
    const utanTusentalsmellanslag = text.replace(/(\d)[\s\u00a0\u202f](\d{3})\b/g, '$1$2')
    for (const tal of [grans.headline, grans.about, grans.post, grans.connection]) {
      expect(utanTusentalsmellanslag).toMatch(new RegExp(`\\b${tal}\\s*tecken`))
    }

    const start2 = src.indexOf('const PROFILDELAR')
    const slut2 = src.indexOf('\n] as const', start2)
    const antalDelar = (src.slice(start2, slut2).match(/nyckel:\s*'/g) || []).length
    expect(antalDelar).toBeGreaterThan(0)
    expect(talFore(text, 'delar')).toContain(antalDelar)
  })

  it('spontanansökans statusantal stämmer med SPONTANEOUS_STATUSES', () => {
    const src = readFileSync(resolve(__dirname, '../pages/spontaneous/spontaneousStatus.tsx'), 'utf8')
    const deklaration = 'SPONTANEOUS_STATUSES: SpontaneousStatus[] = ['
    const start = src.indexOf(deklaration)
    expect(start, 'SPONTANEOUS_STATUSES hittades inte — har den bytt namn?').toBeGreaterThan(-1)
    // Börja EFTER "SpontaneousStatus[]" — den tomma typannoteringen har redan
    // en "[]" som annars gör att den första ']' hittas för tidigt.
    const arrayStart = start + deklaration.length
    const slut = src.indexOf(']', arrayStart)
    const antal = (src.slice(arrayStart, slut).match(/'[a-z_]+'/g) || []).length
    expect(antal).toBeGreaterThan(3)

    const text = alltextFor('spontanansokan')
    expect(talFore(text, 'statusar')).toContain(antal)
  })

  it('lönesidans branschantal stämmer med data/lonedata.ts', () => {
    // Bara ANTALET kategorier — aldrig ett belopp eller en skattesats, se
    // filhuvudets regel: de ändras, och en siffra i en publik landningssida
    // uppdateras inte i takt med data-filen.
    expect(YRKESOMRADEN.length).toBeGreaterThan(5)
    expect(LONEREGIONER.length).toBeGreaterThan(3)
    expect(ERFARENHETSNIVAER.length).toBeGreaterThan(2)

    const text = alltextFor('lon')
    expect(talFore(text, 'branscher')).toContain(YRKESOMRADEN.length)
    expect(talFore(text, 'regioner')).toContain(LONEREGIONER.length)
    expect(talFore(text, 'erfarenhetsnivåer')).toContain(ERFARENHETSNIVAER.length)

    // Ingen krona och ingen procentsats får förekomma — de finns i verktyget
    // och ändras utan att den här filen gör det.
    expect(text).not.toMatch(/\d[\d\s]*\s*kr\b/)
    expect(text).not.toMatch(/\d+([.,]\d+)?\s*%/)
  })

  it('ansökningarnas statusantal stämmer med APPLICATION_STATUS_CONFIG', () => {
    // Positiv kontroll: ett tomt objekt hade gjort jämförelsen meningslös.
    const antal = Object.keys(APPLICATION_STATUS_CONFIG).length
    expect(antal).toBeGreaterThan(3)

    const text = alltextFor('ansokningar')
    expect(talFore(text, 'statusar')).toContain(antal)
  })

  it('personligt varumärkes delantal stämmer med RAD_INDEX i PersonalBrand.tsx', () => {
    const src = readFileSync(resolve(__dirname, '../pages/PersonalBrand.tsx'), 'utf8')
    const deklaration = 'const RAD_INDEX: Record<string, number> = {'
    const start = src.indexOf(deklaration)
    expect(start, 'RAD_INDEX hittades inte — har den bytt namn?').toBeGreaterThan(-1)
    const slut = src.indexOf('\n}', start)
    const antal = (src.slice(start, slut).match(/^\s*'\/personal-brand/gm) || []).length
    // Positiv kontroll: en regex som slutat matcha hade gett 0, och 0 är inte
    // ett tal någon skriver "4 delar" om av misstag.
    expect(antal).toBeGreaterThan(1)

    const text = alltextFor('personligt-varumarke')
    expect(talFore(text, 'delar')).toContain(antal)
  })

  it('AI-coachens agentantal stämmer med agents i AgentSelector.tsx', () => {
    const src = readFileSync(resolve(__dirname, '../components/ai-team/AgentSelector.tsx'), 'utf8')
    const deklaration = 'export const agents: Agent[] = ['
    const start = src.indexOf(deklaration)
    expect(start, 'agents hittades inte i AgentSelector.tsx — har den bytt namn?').toBeGreaterThan(-1)
    const slut = src.indexOf('\nexport function getAgentById', start)
    expect(slut, 'getAgentById hittades inte — har filen strukturerats om?').toBeGreaterThan(-1)
    const block = src.slice(start, slut)
    // Varje agent har ett eget "id: '...'" direkt följt av "nameKey:" på nästa
    // rad — ett mönster som INTE matchar quickActions-listornas "id: '...'"
    // (de följs av "labelKey:", inte "nameKey:"), så räkningen stannar på
    // agentnivå och räknar inte snabbåtgärder.
    const antal = (block.match(/id:\s*'[a-z0-9-]+',\s*\n\s*nameKey:/g) || []).length
    // Positiv kontroll: en regex som slutat matcha hade gett 0.
    expect(antal).toBeGreaterThan(1)

    // Strikt, inte bara toContain: `ai-coach`-texten nämner "5 agenter" på
    // fler än ett ställe (steg och punkter), och en toContain-kontroll hade
    // missat om ETT av dem glider medan det andra fortfarande råkar stämma.
    const text = alltextFor('ai-coach')
    const funna = talFore(text, 'agenter')
    expect(funna.length, 'ingen agentsiffra hittad — har formuleringen ändrats?').toBeGreaterThan(0)
    for (const n of funna) expect(n).toBe(antal)
  })

  it('måendets flikantal stämmer med wellnessTabDefs i data/wellnessTabs.ts', () => {
    // Positiv kontroll: en tom lista hade gjort jämförelsen meningslös.
    expect(wellnessTabDefs.length).toBeGreaterThan(1)

    const text = alltextFor('maende')
    const funna = talFore(text, 'delar')
    expect(funna.length, 'ingen delsiffra hittad — har formuleringen ändrats?').toBeGreaterThan(0)
    for (const n of funna) expect(n).toBe(wellnessTabDefs.length)
  })

  it('övningarnas antal och kategoriantal stämmer med data/exercises.ts', () => {
    const src = readFileSync(resolve(__dirname, '../data/exercises.ts'), 'utf8')
    const deklaration = 'export const exercises: Exercise[] = ['
    const start = src.indexOf(deklaration)
    expect(start, 'exercises hittades inte i data/exercises.ts — har den bytt namn?').toBeGreaterThan(-1)
    const kategorier = [...src.slice(start).matchAll(/category: '([^']+)'/g)].map((m) => m[1])
    // Positiv kontroll: en regex som slutat matcha hade gett 0 på båda.
    expect(kategorier.length).toBeGreaterThan(10)
    const antalKategorier = new Set(kategorier).size
    expect(antalKategorier).toBeGreaterThan(3)

    // Strikt loop av samma skäl som agentkontrollen ovan — texten nämner
    // både övnings- och kategoriantalet på fler än ett ställe.
    const text = alltextFor('ovningar')
    const ovningsSiffror = talFore(text, 'övningar')
    expect(ovningsSiffror.length, 'ingen övningssiffra hittad — har formuleringen ändrats?').toBeGreaterThan(0)
    for (const n of ovningsSiffror) expect(n).toBe(kategorier.length)

    const kategoriSiffror = talFore(text, 'kategorier')
    expect(kategoriSiffror.length, 'ingen kategorisiffra hittad — har formuleringen ändrats?').toBeGreaterThan(0)
    for (const n of kategoriSiffror) expect(n).toBe(antalKategorier)
  })
})
