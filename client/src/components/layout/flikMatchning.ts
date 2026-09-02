/**
 * Vilken flik är aktiv?
 *
 * Egen fil av samma skäl som `lib/palettMatchning.ts`, `cohorts.ts` och
 * `radgivarData.ts`: `react-refresh/only-export-components` tillåter inte att
 * en komponentfil också exporterar funktioner. Regeln har fällt mig fyra
 * gånger den 17 augusti — vid det här laget är slutsatsen att ren logik ska
 * ligga i egen fil FRÅN BÖRJAN, inte flyttas dit efter att linten sagt ifrån.
 */

import type { Tab } from './PageTabs'

/**
 * Flikarnas `path` kan bära en query (`/resources?tab=jobs`), så en ren
 * pathname-jämförelse räcker inte — den hade markerat alla fyra
 * resursflikarna samtidigt.
 */
export function arAktivFlik(tab: Tab, pathname: string, sok: URLSearchParams): boolean {
  const [tabPath, tabQuery] = tab.path.split('?')
  if (tabQuery) {
    const [nyckel, varde] = tabQuery.split('=')
    return pathname === tabPath && sok.get(nyckel) === varde
  }
  // Utan query: exakt match, eller undersökväg. Men en flik utan query ska
  // INTE vara aktiv när en systerflik med query är det.
  const harAktivSyskonQuery = sok.toString().length > 0
  if (harAktivSyskonQuery && pathname === tabPath) return false
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`)
}

/**
 * Vilken av flikarna är aktiv — givet att bara EN kan vara det.
 *
 * `arAktivFlik` svarar per flik, och undersökvägsregeln gör att en förälder
 * matchar sina barn: `/job-search` är prefix till `/job-search/matches`. På
 * Söka jobb betydde det att "Sök" var markerad samtidigt som "Matchningar",
 * och eftersom "Sök" står först var det den mobilraden rullade fram och den
 * skärmläsaren läste som `aria-current="page"`. Sidan sa alltså "du står på
 * Sök" medan innehållet var Matchningar. Uppmätt 2026-08-18 på /job-search/
 * matches och /job-search/alerts.
 *
 * Regeln: den mest specifika träffen vinner — längst `path` bland dem som
 * matchar. Exakt match slår därmed alltid prefixmatch.
 */
export function aktivFlikId(
  tabs: Tab[],
  pathname: string,
  sok: URLSearchParams,
): string | null {
  const traffar = tabs.filter((t) => arAktivFlik(t, pathname, sok))
  if (traffar.length === 0) return null
  return traffar.reduce((bast, t) =>
    t.path.split('?')[0].length > bast.path.split('?')[0].length ? t : bast,
  ).id
}

/**
 * Etiketten för en sidoflik-post, given dess id. Egen liten funktion så
 * annonseringen i SidRail.tsx (TI4) är testbar utan att rendera React.
 */
export function etikettForFlik(
  poster: Array<{ id: string; etikett: string }>,
  id: string | null | undefined,
): string | undefined {
  return poster.find((p) => p.id === id)?.etikett
}
