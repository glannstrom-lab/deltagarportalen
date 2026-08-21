/**
 * Vakter för Intresseguiden efter genomgången 2026-08-21.
 *
 * Poängmodellen testas mot riktiga anrop — den producerar de tal användaren
 * får se, och den var helt otestad. Resten är källkodsvakter, eftersom felen
 * sitter i ETIKETTER, i en skala och i frånvaron av ett tredje tillstånd; ett
 * renderingstest mot tomma mockar hade gått grönt genom hela historien.
 *
 * Vakterna läser KOMMENTARSFRI källkod. Varje rättelse är dokumenterad i en
 * docstring som nämner felet den tog bort, så en naiv `not.toContain` matchar
 * sin egen förklaring — det fällde tio av tolv vakter i Karriär-sviten samma
 * dag.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  allQuestions,
  calculateUserProfile,
  calculateJobMatches,
  arProfilenKomplett,
  obesvaradeFragor,
  occupations,
} from '@/services/interestGuideData'

const ROT = join(__dirname, '..', '..', '..')
const kod = (rel: string) =>
  readFileSync(join(ROT, rel), 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(?<!:)\/\/.*$/gm, '')

const alla = (v: number) => Object.fromEntries(allQuestions.map(q => [q.id, v]))

describe('Poängmodellen — skalorna', () => {
  it('ger ett mittensvar värdet 3 på ICF, inte 2,5', () => {
    /*
      `normalizedValue * 5` gav 2,5 för ett mittensvar, och ICFSection
      klassade < 3 som "Utmanande – anpassningar rekommenderas" i rött.
      Tre verkliga användare har 2.5 lagrat i prod.
    */
    const p = calculateUserProfile(alla(3))
    for (const v of Object.values(p.icf)) expect(v).toBe(3)
  })

  it('håller RIASEC inom 1–5, samma skala som yrkena är kodade i', () => {
    for (const svar of [1, 3, 5]) {
      const p = calculateUserProfile(alla(svar))
      for (const v of Object.values(p.riasec)) {
        expect(v).toBeGreaterThanOrEqual(1)
        expect(v).toBeLessThanOrEqual(5)
      }
    }
    // Lägsta svar gav tidigare 0, medan inget yrke har lägre än 1 — och
    // calculateRiasecMatch antar maxDiff = 6 × 4. Delpoängen kunde bli negativ.
    expect(calculateUserProfile(alla(1)).riasec.R).toBe(1)
  })

  it('räknar BÅDA energifrågorna, inte bara den sista', () => {
    /*
      `icf[category] = ...` var en tilldelning. icf_en_fys ("ork att vara
      fysiskt aktiv") och icf_en_men delar kategori, så orkfrågan påverkade
      ingenting — och det är just icf.energi som styr varningarna för fysiskt
      krävande yrken.
    */
    const svar = { ...alla(3), icf_en_fys: 1, icf_en_men: 5 }
    expect(calculateUserProfile(svar).icf.energi).toBe(3)

    const bara = { ...alla(3), icf_en_fys: 1, icf_en_men: 1 }
    expect(calculateUserProfile(bara).icf.energi).toBe(1)
  })
})

describe('Poängmodellen — täckning', () => {
  it('redovisar hur många svar varje dimension vilar på', () => {
    const p = calculateUserProfile({})
    expect(p.coverage.answered).toBe(0)
    expect(p.coverage.total).toBe(allQuestions.length)
    for (const v of Object.values(p.coverage.icf)) expect(v).toBe(0)

    const full = calculateUserProfile(alla(4))
    expect(full.coverage.answered).toBe(allQuestions.length)
    expect(full.coverage.bigFive.openness).toBeGreaterThan(0)
  })

  it('vet när profilen är komplett och vilka frågor som saknas', () => {
    expect(arProfilenKomplett(alla(3))).toBe(true)
    expect(arProfilenKomplett({})).toBe(false)
    const utan = { ...alla(3) }
    delete (utan as Record<string, number>)[allQuestions[0].id]
    expect(arProfilenKomplett(utan)).toBe(false)
    expect(obesvaradeFragor(utan).map(q => q.id)).toEqual([allQuestions[0].id])
  })
})

describe('Matchningen', () => {
  it('sorterar inte in lågsvararen i fysiskt arbete', () => {
    /*
      Med ICF i poängen fick den som svarade 1 på allt topplistan
      lastbilschaufför, skogsarbetare, trädgårdsmästare, lagerarbetare,
      städare — låga ICF-svar straffade allt kognitivt hårdast, så kvar blev
      just det personen angett att hen inte orkar. ICF ger nu anpassningar,
      inte poängavdrag.
    */
    const lag = calculateJobMatches(calculateUserProfile(alla(1)))
    const hog = calculateJobMatches(calculateUserProfile(alla(5)))
    const topp5 = (m: typeof lag) => m.slice(0, 5).map(x => x.occupation.id)
    expect(topp5(lag)).not.toEqual(topp5(hog))

    // Två profiler som svarar olika ska inte få identisk rangordning …
    expect(lag[0].occupation.id).not.toBe(hog[0].occupation.id)
  })

  it('ger inte samma poäng oavsett svar', () => {
    const neutral = calculateJobMatches(calculateUserProfile(alla(3)))
    const lag = calculateJobMatches(calculateUserProfile(alla(1)))
    const median = (m: typeof lag) =>
      [...m].map(x => x.matchPercentage).sort((a, b) => a - b)[Math.floor(m.length / 2)]
    // Golven gjorde att allt landade 68–80 oavsett. Skillnaden ska vara stor.
    expect(median(neutral) - median(lag)).toBeGreaterThan(25)
  })

  it('låter ingen delpoäng ha ett golv som inte kan nås underifrån', () => {
    /*
      Beteendebaserad, inte strängbaserad. En första version letade efter den
      gamla raden `matchScore = 0.5 + (userInterest * 0.5)` — och överlevde
      mutationsprovet där golvet återinfördes med ett annat tal. Golv syns i
      FÖRDELNINGEN: de lyfter botten. Mätt 2026-08-21 med
      scripts/mat-matchningsfordelning.mjs ligger en helt ointresserad profil
      på min 21 / median 29; ett 0,2-golv i intressetrappan lyfter medianen
      till ~36.
    */
    const tal = calculateJobMatches(calculateUserProfile(alla(1)))
      .map(m => m.matchPercentage)
      .sort((a, b) => a - b)
    expect(tal[0]).toBeLessThan(28)
    expect(tal[Math.floor(tal.length / 2)]).toBeLessThan(33)
    // Ingen enda träff får nå "lämplig" när användaren inte vill något alls.
    expect(tal.filter(x => x >= 65)).toHaveLength(0)
  })

  it('räknar inte in ICF i poängen', () => {
    const kalla = kod('services/interestGuideData.ts')
    expect(kalla).not.toMatch(/totalScore \+= icfResult\.score/)
  })
})

describe('Testet — sparning och dataförlust', () => {
  const t = kod('pages/interest-guide/TestTab.tsx')

  it('visar "Sparat" bara när det faktiskt sparats', () => {
    // handleStorageError är void-typad och kastar aldrig, så catch var
    // oåtkomlig för databasfel och bocken visades alltid.
    expect(t).toContain('const ok = await interestGuideApi.saveProgress')
    expect(t).toContain('showSaveIndicator && !saveFailed')
  })

  it('blockerar autospar efter ett läsfel', () => {
    expect(t).toContain('setLoadError(true)')
    expect(t).toMatch(/isLoading \|\| loadError\) return/)
  })

  it('kräver alla svar innan testet får markeras klart', () => {
    expect(t).toContain('obesvaradeFragor(answers)')
  })

  it('skickar inte ett defaultvärde till reglaget', () => {
    expect(t).not.toContain('|| 50')
  })

  it('grindar hälsodatan på SKRIVNINGEN, inte bara på renderingen', () => {
    expect(t).toContain('health_consent_at')
    expect(t).toContain('ICF_FRAGE_IDN')
  })
})

describe('Påståenden om användaren', () => {
  it('lovar ingen ICF-bedömning eller Big Five-analys på introskärmen', () => {
    const i = kod('components/interest-guide/IntroScreen.tsx')
    expect(i).not.toMatch(/ICF-bedömning|Big Five-analys/)
    expect(i).toContain('ingen psykologisk testning')
  })

  it('anger yrkesantalet ur datan, inte som "80+"', () => {
    const i = kod('components/interest-guide/IntroScreen.tsx')
    expect(i).not.toContain('80+')
    expect(occupations.length).toBeGreaterThan(100)
  })

  it('stämplar inte ett mittensvar som "Utmanande"', () => {
    const s = kod('components/interest-guide/ICFSection.tsx')
    expect(s).not.toMatch(/Utmanande|Stark förutsättning/)
    expect(s).not.toMatch(/bg-red-500|text-red-700/)
  })

  it('påstår inte vem användaren är utifrån två svar per drag', () => {
    const r = kod('components/interest-guide/ResultsView.tsx')
    expect(r).not.toContain('Din personlighet är mer återhållsam')
    expect(r).not.toContain('Dina främsta personlighetsdrag är att du är')
  })

  it('visar plats i listan, inte en matchningsprocent', () => {
    const o = kod('pages/interest-guide/OccupationsTab.tsx')
    expect(o).toContain('matchningsplats(')
    expect(o).not.toMatch(/\{match\.matchPercentage\}%/)
    expect(o).not.toContain('matchPercentage / 10')
  })
})

describe('Lönestatistiken', () => {
  it('hittar inte på en median för okända yrken', () => {
    const s = kod('services/scbSalaryApi.ts')
    expect(s).not.toMatch(/private estimateSalary/)
    expect(s).not.toMatch(/this\.estimateSalary\(/)
  })
})

describe('Historiken', () => {
  const h = kod('pages/interest-guide/HistoryTab.tsx')

  it('läser historiktabellen, inte den aktuella raden', () => {
    expect(h).toContain('interestGuideApi.getHistory(')
  })

  it('hittar inte på dagens datum som testdatum', () => {
    expect(h).not.toContain("date: new Date().toISOString()")
  })

  it('visar felet i stället för att kalla det tomhet', () => {
    expect(h).toMatch(/if \(error\) \{[\s\S]*?role="alert"/)
  })
})

describe('Skalet', () => {
  it('avmonterar inte flikarna när fokusläget slås på', () => {
    const s = kod('pages/InterestGuide.tsx')
    expect(s).not.toMatch(/if \(isFocusMode\) \{\s*return/)
    expect(s).toContain("isFocusMode ? { display: 'none' } : undefined")
  })

  it('har bara en flikdefinition', () => {
    expect(kod('data/interestGuideTabs.ts')).not.toMatch(/export const interestGuideTabs\b/)
  })

  it('lovar ingen "hoppa över"-knapp som inte finns', () => {
    expect(kod('data/coaches.ts')).not.toContain('hoppa över och kom tillbaka')
  })

  it('kastar inte bort fritexten i fokuslägets guide', () => {
    const w = kod('components/focus/pages/FocusInterestGuideWizard.tsx')
    expect(w).toContain('userApi.updatePreferences')
  })
})
