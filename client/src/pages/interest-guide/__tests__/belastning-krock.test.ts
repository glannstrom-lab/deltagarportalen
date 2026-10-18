/**
 * Grind: ett yrke vars centrala belastning krockar med "stora besvär" får
 * aldrig rekommenderas (2026-10-14).
 *
 * Felet som rapporterades: den som svarade att ljud och ljus är svåra
 * ("Blir lätt överväldigad") fick Ljudtekniker som nummer 1 av 165 — utan
 * ens en varning. ICF-svaren gav bara anpassningsförslag, och varningen för
 * sinnesintryck krävde `challenges.sensorisk > 3` medan ljudteknikern stod på 3.
 *
 * Grinden täcker båda vägarna som läser `calculateJobMatches`: intresseguidens
 * resultat och jobbmatchningen (Matchningar, Dagens jobb), där yrkesnamnen
 * blir sökord mot Platsbanken.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  allQuestions,
  occupations,
  calculateUserProfile,
  calculateJobMatches,
  uteslutnaYrken,
  BELASTNING_FRAGA,
  type Belastning,
} from '@/services/interestGuideData'

const ROT = join(__dirname, '..', '..', '..')
const kod = (rel: string) =>
  readFileSync(join(ROT, rel), 'utf-8')
    .replace(/(?<!:)\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

const ICF_FRAGOR = allQuestions.filter(q => q.section === 'icf').map(q => q.id)
const BELASTNINGAR = Object.keys(BELASTNING_FRAGA) as Belastning[]

/** Profil som drar mot ljudteknikern: praktisk + skapande, teknik + kultur. */
function ljudprofil(sen: number): Record<string, number> {
  const svar: Record<string, number> = Object.fromEntries(
    allQuestions.map(q => [q.id, q.section === 'icf' ? 4 : 3])
  )
  for (const q of allQuestions) {
    if (q.section === 'riasec' && ['R', 'A'].includes(q.category)) svar[q.id] = 5
    if (q.section === 'strong' && ['teknik_mekanik', 'konst_kultur'].includes(q.category)) svar[q.id] = 5
  }
  svar.icf_sen = sen
  return svar
}

const ids = (svar: Record<string, number>) =>
  calculateJobMatches(calculateUserProfile(svar)).map(m => m.occupation.id)

describe('Belastningsmärkningen i datan', () => {
  it('täcker varje fråga om förutsättningar, och bara dem', () => {
    expect(Object.values(BELASTNING_FRAGA).sort()).toEqual([...ICF_FRAGOR].sort())
  })

  it('finns på varje yrke, med grad 1 eller 2', () => {
    for (const o of occupations) {
      const poster = Object.entries(o.belastning ?? {})
      expect(poster.length, `${o.id} saknar belastning`).toBeGreaterThan(0)
      for (const [k, v] of poster) {
        expect(BELASTNINGAR, `${o.id}: okänd belastning ${k}`).toContain(k)
        expect([1, 2], `${o.id}.${k}`).toContain(v)
      }
    }
  })

  it('märker ljudteknikern med sinnesintryck som centralt', () => {
    expect(occupations.find(o => o.id === 'ljudtekniker')?.belastning.sinnesintryck).toBe(2)
  })
})

describe('Rapporterade fallet: stora besvär av ljud och ljus', () => {
  it('rekommenderar inte ljudtekniker', () => {
    expect(ids(ljudprofil(1))).not.toContain('ljudtekniker')
  })

  it('positiv kontroll: samma profil utan besvär har ljudteknikern i topp', () => {
    // Utan den här kontrollen hade grinden gått grönt om yrket råkat ligga lågt.
    expect(ids(ljudprofil(4)).slice(0, 3)).toContain('ljudtekniker')
  })

  it('redovisar varför yrket utelämnats', () => {
    const ute = uteslutnaYrken(calculateUserProfile(ljudprofil(1)))
    const ljud = ute.find(u => u.occupation.id === 'ljudtekniker')
    expect(ljud?.krockar.map(k => k.belastning)).toEqual(['sinnesintryck'])
  })

  it('viktar ned och varnar vid måttliga besvär, utan att utesluta', () => {
    const traff = (sen: number) =>
      calculateJobMatches(calculateUserProfile(ljudprofil(sen))).find(m => m.occupation.id === 'ljudtekniker')!
    const mattlig = traff(2)
    expect(mattlig).toBeDefined()
    expect(mattlig.matchPercentage).toBeLessThan(traff(4).matchPercentage)
    expect(mattlig.warnings?.[0]).toMatch(/ljud, ljus/)
  })

  it('utesluter även när profilen saknar råsvar (faller tillbaka på domänvärdet)', () => {
    const profil = calculateUserProfile(ljudprofil(1))
    delete profil.icfSvar
    expect(calculateJobMatches(profil).map(m => m.occupation.id)).not.toContain('ljudtekniker')
  })
})

describe('Generellt: ingen central belastning mot stora besvär', () => {
  const basprofiler: Record<string, number>[] = [
    Object.fromEntries(allQuestions.map(q => [q.id, 3])),
    Object.fromEntries(allQuestions.map(q => [q.id, 5])),
    ljudprofil(4),
  ]

  for (const b of BELASTNINGAR) {
    it(`stora besvär med ${b} → inget yrke där det är centralt`, () => {
      let utelamnade = 0
      for (const bas of basprofiler) {
        const svar = { ...bas, [BELASTNING_FRAGA[b]]: 1 }
        const traffar = calculateJobMatches(calculateUserProfile(svar))
        const fel = traffar.filter(m => m.occupation.belastning[b] === 2).map(m => m.occupation.id)
        expect(fel, `${b}: rekommenderade ändå`).toEqual([])
        utelamnade += uteslutnaYrken(calculateUserProfile(svar)).length
      }
      // Annars kunde testet passera för att märkningen saknas helt.
      expect(utelamnade).toBeGreaterThan(0)
    })
  }

  it('stora besvär med allt → inget kvarvarande yrke har något centralt', () => {
    const traffar = calculateJobMatches(calculateUserProfile(Object.fromEntries(allQuestions.map(q => [q.id, 1]))))
    for (const m of traffar) {
      expect(Object.values(m.occupation.belastning), m.occupation.id).not.toContain(2)
    }
  })
})

describe('Jobbmatchningen (Matchningar, Dagens jobb)', () => {
  it('använder inte ett uteslutet yrke som sökord', () => {
    // Samma kedja som MatchningTab.tsx och DailyJobTab.tsx kör.
    const sokord = calculateJobMatches(calculateUserProfile(ljudprofil(1)))
      .filter(m => m.matchPercentage >= 50)
      .slice(0, 15)
      .map(m => m.occupation.name)
    expect(sokord).not.toContain('Ljudtekniker')
    // Positiv kontroll: utan besvär är den med.
    const utan = calculateJobMatches(calculateUserProfile(ljudprofil(4)))
      .filter(m => m.matchPercentage >= 50)
      .slice(0, 15)
      .map(m => m.occupation.name)
    expect(utan).toContain('Ljudtekniker')
  })

  it('hämtar yrkena via calculateJobMatches, inte direkt ur yrkeslistan', () => {
    // MatchesTab.tsx ersattes 2026-10-18 av MatchningTab.tsx (en matchning, valbara faktorer).
    for (const fil of ['components/jobs/MatchningTab.tsx', 'components/jobs/DailyJobTab.tsx']) {
      const k = kod(fil)
      expect(k, fil).toMatch(/calculateJobMatches\(/)
      expect(k, `${fil} läser yrkeslistan förbi filtret`).not.toMatch(/import[^;]*\boccupations\b[^;]*interestGuideData/)
    }
  })
})
