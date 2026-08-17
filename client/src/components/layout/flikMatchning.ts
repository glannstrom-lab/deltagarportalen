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
