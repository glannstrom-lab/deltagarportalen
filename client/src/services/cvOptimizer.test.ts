/**
 * UX14 — CV-matchningen mot jobbannons.
 *
 * Buggen: `extractKeywords` byggde `new RegExp('\\b' + term + '\\b')` av en
 * **hårdkodad** termlista som innehåller `'c++'`. `/\bc++\b/` är ogiltigt
 * ("Nothing to repeat"), så konstruktorn kastade. Loopen går igenom alla termer
 * oavsett annonsens innehåll → `analyzeCVForJob` kastade vid VARJE anrop, och
 * anroparna svarade med ett hårdkodat `50` som presenterades som
 * "Din matchning — God match, kan förbättras".
 *
 * Felrapporten trodde att det gällde användare med C++ i sitt CV. Det gällde
 * alla. Testerna nedan låser båda halvorna: analysen får inte kasta, och
 * siffran ska vara räknad — inte gissad.
 */
import { describe, it, expect } from 'vitest'
import { analyzeCVForJob } from './cvOptimizer'
import type { CVData } from './supabaseApi'

/**
 * Fixturen speglar PRODUKTIONENS form, inte den bekvämaste.
 * Verifierat 2026-08-03: `cvs.skills` är en array av objekt
 * (`{id, name, level, category}`) i 16 av 16 CV:n som har kompetenser.
 * En fixtur med `skills: ['React']` hade gjort testerna gröna på data som
 * inte finns — och missat att `s.toLowerCase()` kastar på riktiga poster.
 */
const CV: CVData = {
  title: 'Systemutvecklare',
  summary: 'Erfaren utvecklare med React och TypeScript. Har även jobbat i C++ och C#.',
  skills: [
    { id: '1', name: 'React', level: 4, category: 'technical' },
    { id: '2', name: 'TypeScript', level: 4, category: 'technical' },
    { id: '3', name: 'Docker', level: 3, category: 'tool' },
  ],
  work_experience: [
    {
      id: 'w1',
      title: 'Utvecklare',
      company: 'Acme',
      startDate: '2020-01',
      description: 'Byggde webbappar i React och Node.js',
    },
  ],
  education: [{ id: 'e1', degree: 'Civilingenjör', school: 'KTH', startDate: '2014-08' }],
}

describe('analyzeCVForJob — kastar inte (UX14)', () => {
  it('klarar en helt vanlig annons utan att kasta', () => {
    // Det här anropet kastade "Invalid regular expression: /\bc++\b/gi"
    // innan fixen — oavsett annonsens och CV:ts innehåll.
    expect(() =>
      analyzeCVForJob(CV, 'Vi söker en lagerarbetare till vårt lager i Solna.')
    ).not.toThrow()
  })

  it('klarar annonser som nämner C++, C#, .NET och F#', () => {
    const ad = 'Vi söker utvecklare inom C++, C#, .NET och F# till vårt team.'
    expect(() => analyzeCVForJob(CV, ad)).not.toThrow()
  })

  it('klarar regex-metatecken i annonstexten', () => {
    const ad = 'Krav: erfarenhet av (a|b)* och [x-y]? samt ^start och slut$ — plus 5+ år.'
    expect(() => analyzeCVForJob(CV, ad)).not.toThrow()
  })

  it('klarar tom annons och tomt CV', () => {
    expect(() => analyzeCVForJob({} as CVData, '')).not.toThrow()
  })
})

describe('analyzeCVForJob — siffran är räknad, inte gissad', () => {
  it('ger en poäng inom 0–100', () => {
    const result = analyzeCVForJob(CV, 'Vi söker en utvecklare med React och TypeScript.')

    expect(result.matchScore).toBeGreaterThanOrEqual(0)
    expect(result.matchScore).toBeLessThanOrEqual(100)
  })

  it('hittar nyckelord som faktiskt står i CV:t', () => {
    const result = analyzeCVForJob(CV, 'Vi söker en utvecklare med React, TypeScript och Docker.')

    expect(result.matchedKeywords).toBeGreaterThan(0)
  })

  it('ger HÖGRE poäng för en annons som matchar CV:t än för en som inte gör det', () => {
    // Det verkliga beviset på att analysen räknar: två olika annonser ska ge
    // olika svar. Med den gamla koden gav båda samma påhittade 50.
    const träff = analyzeCVForJob(CV, 'Vi söker en utvecklare med React, TypeScript, Docker och Node.js.')
    const miss = analyzeCVForJob(CV, 'Vi söker en undersköterska till nattpasset inom äldreomsorgen.')

    expect(träff.matchScore).not.toBeNull()
    expect(miss.matchScore).not.toBeNull()
    expect(träff.matchScore as number).toBeGreaterThan(miss.matchScore as number)
    expect(träff.matchScore).not.toBe(50)
  })

  /**
   * KÄND BEGRÄNSNING, dokumenterad i stället för dold (fynd 2026-08-03).
   *
   * `extractKeywords` rensar annonstexten med `/[^\w\sÅÄÖåäö]/g → ' '` INNAN
   * termerna söks. Alla termer med skiljetecken — `c#`, `c++`, `.net`,
   * `node.js`, `ci/cd`, `asp.net`, `next.js`, `material-ui` — kan därför aldrig
   * matcha, hur ofta de än står i annonsen. Escapningen i UX14 gör att de inte
   * längre KRASCHAR; att få dem att matcha kräver att textrensningen görs om,
   * vilket ändrar poängen för alla annonser och behöver mätas separat.
   *
   * Testet låser dagens beteende så att en framtida ändring syns här i stället
   * för att smyga förbi.
   */
  it('extraherar inte termer med skiljetecken — känd begränsning i textrensningen', () => {
    const cv: CVData = { ...CV, summary: 'Jag har jobbat med Node.js i fem år.', skills: [] }
    const result = analyzeCVForJob(cv, 'Vi söker någon med node.js-erfarenhet och c#.')

    const nämnda = [...result.missingKeywords.map(k => k.word)]
    expect(nämnda).not.toContain('node.js')
    expect(nämnda).not.toContain('c#')
    // Men analysen går igenom — det var det som var trasigt.
    expect(result.matchScore === null || result.matchScore >= 0).toBe(true)
  })

  it('läser kompetenser i produktionens objektform utan att kasta', () => {
    // `s.toLowerCase()` på en Skill-post kastade TypeError. Alla 16 CV:n i prod
    // som har kompetenser har objektform — de drabbades varje gång.
    const result = analyzeCVForJob(CV, 'Vi söker en utvecklare med Docker-erfarenhet.')

    expect(result.matchedKeywords).toBeGreaterThan(0)
  })

  it('klarar även äldre kompetenser lagrade som rena strängar', () => {
    const cv = { ...CV, skills: ['docker', 'react'] } as unknown as CVData
    expect(() => analyzeCVForJob(cv, 'Vi söker en utvecklare med Docker.')).not.toThrow()
  })

  /**
   * Tredje fyndet 2026-08-03, hittat av testerna ovan: när annonsen inte gav
   * ETT ENDA sökbart nyckelord blev nämnaren noll och poängen **NaN**.
   * `NaN%` renderades i modalen och föll igenom alla trösklar till
   * "Lägg till mer relevant erfarenhet" — ett omdöme utan underlag.
   */
  it('ger null i stället för NaN när annonsen saknar sökbara nyckelord', () => {
    // Tom annonstext är det renaste fallet, men samma sak händer i drift för
    // en kort annons utan ett enda ord ur termlistan.
    const result = analyzeCVForJob(CV, '')

    expect(result.totalKeywords).toBe(0)
    expect(result.matchScore).toBeNull()
    expect(Number.isNaN(result.matchScore as number)).toBe(false)
  })
})
