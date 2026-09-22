/**
 * SÄK1 (2026-09-22) — `ai-career-assistant` saknade `sanitizeForPrompt`.
 *
 * BAKGRUND. De fem Perplexity-edge-funktionerna (`_shared/aiGate.ts`) delar
 * mönstret att ALL användarstyrd text ska genom `sanitizeForPrompt` (kapar
 * längd, tar bort vinkelparenteser/styrtecken) innan den interpoleras i en
 * prompt — se motiveringen i `aiGate.ts` om `maxResults`-injektionen i
 * `ai-company-search`. Fyra av fem gjorde det (`ai-commute-planner`,
 * `ai-industry-radar`, `ai-company-analysis`, `ai-company-search`).
 * `ai-career-assistant` importerade aldrig `sanitizeForPrompt` och skickade
 * `companyName`, `jobDescription`, `occupation`, `userBackground`,
 * `targetOccupation` m.fl. rakt från `req.body` in i fyra olika
 * systemprompter — en klassisk prompt-injection- och
 * token-overflow-öppning (en `jobDescription` på flera MB text hade gått
 * rakt igenom).
 *
 * VARFÖR EN KÄLLKODSVAKT. Filen kör `Deno.serve(...)` vid modulnivå och drar
 * in `https://esm.sh/...`-importer — att importera den i vitest prövar
 * ingenting utan en full Deno-runtime. Samma grepp som
 * `ai-sanningsregel.test.ts` och `api-rate-limit-fallback.test.ts`: läs
 * källkoden och kräv att mönstret finns, i stället för att köra den.
 *
 * Mutationsprövat manuellt: tar man bort en `sanitizeForPrompt(params.X, …)`-
 * rad och interpolerar `params.X` direkt i stället, faller motsvarande
 * assertion nedan.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const KALLA = readFileSync(
  resolve(__dirname, '../../../supabase/functions/ai-career-assistant/index.ts'),
  'utf-8',
)

/** Extraherar en namngiven funktions källtext (från `function namn(` till nästa `\nfunction `). */
function funktionskropp(kalla: string, namn: string): string {
  const start = kalla.indexOf(`function ${namn}(`)
  if (start === -1) throw new Error(`Hittade inte function ${namn}`)
  const resten = kalla.slice(start)
  const nastaFunktion = resten.indexOf('\nfunction ', 1)
  return nastaFunktion === -1 ? resten : resten.slice(0, nastaFunktion)
}

describe('ai-career-assistant saniterar allt användarstyrt innan prompten byggs', () => {
  it('importerar sanitizeForPrompt från den delade AI-grinden', () => {
    expect(KALLA).toMatch(/sanitizeForPrompt/)
    // Måste komma från aiGate.ts — inte en lokal, egen kopia.
    const importBlock = KALLA.slice(0, KALLA.indexOf('const OPENROUTER_API_URL'))
    expect(importBlock).toMatch(/from ['"]\.\.\/_shared\/aiGate\.ts['"]/)
    expect(importBlock).toMatch(/sanitizeForPrompt/)
  })

  it.each([
    ['buildInterviewPrepPrompt', ['companyName', 'orgNumber', 'jobTitle', 'jobDescription']],
    ['buildSalaryCompassPrompt', ['occupation', 'region', 'experienceYears']],
    ['buildNetworkingHelpPrompt', ['contactName', 'contactTitle', 'contactCompany', 'userGoal', 'userBackground', 'platform']],
    ['buildEducationGuidePrompt', ['targetOccupation', 'budget', 'timeAvailable', 'location']],
  ])('%s saniterar varje fält den interpolerar i prompten', (namn, falt) => {
    const kropp = funktionskropp(KALLA, namn as string)

    // Varje fält ska saneras (direkt via sanitizeForPrompt eller, för listor,
    // via sanitizeLista — som i sin tur anropar sanitizeForPrompt per post).
    for (const f of falt as string[]) {
      const saneratDirekt = kropp.includes(`sanitizeForPrompt(params.${f}`)
      expect(
        saneratDirekt,
        `${namn}: fältet "${f}" saneras inte med sanitizeForPrompt innan det interpoleras`,
      ).toBe(true)
    }

    // Interpolationen i själva mallen ska använda den saniterade LOKALA
    // variabeln, inte gå direkt på `params.<fält>` — annars är
    // `sanitizeForPrompt`-anropet en dekoration utan effekt.
    for (const f of falt as string[]) {
      const templateDel = kropp.slice(kropp.indexOf('return `'))
      expect(
        templateDel.includes(`params.${f}`),
        `${namn}: prompten interpolerar params.${f} direkt i stället för den saniterade lokala variabeln`,
      ).toBe(false)
    }
  })

  it('array-fälten (skills/currentSkills) går genom sanitizeLista, inte ett rått .join()', () => {
    const salary = funktionskropp(KALLA, 'buildSalaryCompassPrompt')
    const edu = funktionskropp(KALLA, 'buildEducationGuidePrompt')
    expect(salary).toMatch(/sanitizeLista\(params\.skills/)
    expect(edu).toMatch(/sanitizeLista\(params\.currentSkills/)
    // Den gamla buggen: `(skills as string[]).join(', ')` rakt på klientdata.
    expect(salary).not.toMatch(/\(skills as string\[\]\)\.join/)
    expect(edu).not.toMatch(/\(currentSkills as string\[\]\)\.join/)
  })
})
