/**
 * Intresseguidens innehåll på användarens språk.
 *
 * Guidens text — frågor, sektionsnamn, yrkesbeskrivningar, ICF-anpassningar —
 * ligger i `interestGuideData.ts` på svenska. Engelskan är en overlay (se
 * `data/oversattningar/`). De här hookarna är den enda vägen komponenterna
 * ska läsa innehållet, så att ingen sida kan glömma att översätta.
 *
 * Varför hookar och inte en engångsmutation av modulkonstanterna: en
 * mutation hade lämnat kvar gamla objekt i `useState` och `useMemo` hos
 * komponenter som redan renderat, så ett språkbyte mitt i guiden hade slagit
 * igenom på vissa ytor men inte andra. Hookarna räknar om när språket ändras.
 *
 * Frågorna är ett mätinstrument: `id` och `section` är nycklar som styr
 * poängberäkningen och rörs aldrig — bara `text`, `subtext` och skaletiketter
 * byts ut. Se `FALT_SOM_AR_NYCKLAR` i `lib/innehallsOversattning.ts`.
 */
import { useMemo } from 'react'
import { useInnehall } from '@/data/oversattningar'
import {
  allQuestions,
  sections,
  occupations,
  icfAdaptations,
  riasecNames,
  bigFiveNames,
  calculateJobMatches,
  type Occupation,
  type Question,
  type Section,
  type ICFAdaptation,
  type JobMatch,
  type UserProfile,
} from './interestGuideData'

/** Alla frågor, översatta. Ordning och id oförändrade. */
export function useFragor(): Question[] {
  return useInnehall('interestGuide', allQuestions, 'allQuestions')
}

/** Guidens fyra sektioner, översatta. */
export function useSektioner(): Section[] {
  return useInnehall('interestGuide', sections, 'sections')
}

/** Yrkeslistan, översatt. */
export function useYrken(): Occupation[] {
  return useInnehall('interestGuide', occupations, 'occupations')
}

/** ICF-anpassningarna, översatta. */
export function useIcfAnpassningar(): Record<string, ICFAdaptation> {
  return useInnehall('interestGuide', icfAdaptations, 'icfAdaptations')
}

/** RIASEC-typernas namn och beskrivningar, översatta. */
export function useRiasecNamn(): Record<string, string> {
  return useInnehall('interestGuide', riasecNames, 'riasecNames')
}

/** Big Five-dragens namn och beskrivningar, översatta. */
export function useBigFiveNamn(): Record<string, { name: string; description: string }> {
  return useInnehall('interestGuide', bigFiveNames, 'bigFiveNames')
}

/**
 * Jobbmatchningarna, beräknade mot den ÖVERSATTA yrkeslistan.
 *
 * Matchningen bär med sig hela yrkesobjektet ut i gränssnittet, så det räcker
 * inte att översätta yrkeslistan på sidan — beräkningen måste utgå från den.
 */
export function useJobbmatchningar(
  profile: UserProfile | null | undefined,
  filterUniversity?: boolean | null
): JobMatch[] {
  const yrken = useYrken()
  return useMemo(
    () => (profile ? calculateJobMatches(profile, filterUniversity, yrken) : []),
    [profile, filterUniversity, yrken]
  )
}
