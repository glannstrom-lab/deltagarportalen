/**
 * Svenska namn som aldrig ska översättas bort — EN källa (FN19).
 *
 * Läses av tre ställen: `sprakparitet.test.ts` (engelskan får inte tappa dem),
 * `ArticleContent.tsx` (markerar dem `translate="no"` så Google Översätt lämnar
 * dem) och `scripts/lib/guide-template.cjs` (samma sak på de prerenderade
 * guidesidorna). Datan bor i `skyddadeNamn.json` just för att bygg-skriptet
 * är CommonJS och inte kan importera TypeScript.
 *
 * Googles översättare översatte "Arbetsförmedlingen" i arabiska, somaliska och
 * tigrinja. `translate="no"` respekteras av Google Översätt och av Chromes
 * inbyggda översättning.
 */

import data from './skyddadeNamn.json'

export const SKYDDADE_NAMN: readonly string[] = data.namn
export const SKYDDADE_BOJNINGAR: readonly string[] = data.bojningar

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Namnet, ev. böjt (-s, -n, -ns, -en, -ens, -et, -ets) eller ett listat
 * böjningsord. Ord INUTI andra ord träffas inte: tecknet före och efter får
 * inte vara en bokstav eller siffra ("ta-kassa", "CSNxyz").
 */
export function skyddadeNamnRegex(): RegExp {
  const former = [
    ...SKYDDADE_NAMN.map((n) => `${esc(n)}(?:s|n|ns|en|ens|et|ets)?`),
    ...SKYDDADE_BOJNINGAR.map(esc),
  ]
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${former.join('|')})(?![\\p{L}\\p{N}])`, 'giu')
}

export interface NamnBit {
  text: string
  /** true = ett skyddat namn som ska få translate="no" */
  skyddad: boolean
}

/** Delar en ren text i bitar; skyddade namn blir egna bitar. */
export function delaPaSkyddadeNamn(text: string): NamnBit[] {
  const re = skyddadeNamnRegex()
  const bitar: NamnBit[] = []
  let senast = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > senast) bitar.push({ text: text.slice(senast, m.index), skyddad: false })
    bitar.push({ text: m[0], skyddad: true })
    senast = m.index + m[0].length
  }
  if (senast < text.length) bitar.push({ text: text.slice(senast), skyddad: false })
  return bitar
}
