/**
 * Matchningsreglerna för kommandopaletten.
 *
 * Utbrutna ur `CommandPalette.tsx` 2026-08-17. Två skäl, båda goda:
 *
 *  1. `react-refresh/only-export-components` — en komponentfil som också
 *     exporterar funktioner bryter Fast Refresh. Regeln fällde bygget, och
 *     den hade rätt.
 *  2. Samma skäl som `pages/consultant/cohorts.ts`: ren logik som ska testas
 *     hör inte hemma inuti en komponent. Reglerna nedan avgör om paletten
 *     känns begriplig eller nyckfull, och de går att pröva utan DOM.
 */

/** En sak man kan hoppa till. */
export interface PalettMal {
  path: string
  label: string
  /** Kategorin den ligger under — det som gör "var ligger den?" onödigt att veta. */
  grupp: string
  /** Hub-domän för färgpricken. Odefinierad för admin/konsulent. */
  domain?: string
}

/**
 * Normaliserar för sökning: gemener, och å/ä/ö → a/a/o.
 *
 * Skälet till det sista: någon som söker "lonelage" ska hitta "Löneläget".
 * Svenska tangentbord är inte givna på alla enheter, och målgruppen inkluderar
 * personer som är nya i Sverige (fem av K20:s guider handlar om just det).
 */
export function normalisera(s: string): string {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .trim()
}

/**
 * Matchar en sökterm mot ett mål.
 *
 * Regeln: varje ord i söktermen måste finnas som substräng i etiketten eller
 * gruppnamnet. "brev jobb" hittar alltså Personligt brev under Söka jobb, men
 * "brev vardag" hittar ingenting — vilket är rätt svar.
 */
export function matchar(mal: PalettMal, sokterm: string): boolean {
  const q = normalisera(sokterm)
  if (!q) return true
  const hostack = `${normalisera(mal.label)} ${normalisera(mal.grupp)}`
  return q.split(/\s+/).every((ord) => hostack.includes(ord))
}

/**
 * Rangordnar träffar. Etiketten väger tyngre än gruppen, och en träff i början
 * av etiketten tyngre än en i mitten — annars hamnar "Mina dokument" före
 * "Dokument" när man söker "dokument".
 */
export function poang(mal: PalettMal, sokterm: string): number {
  const q = normalisera(sokterm)
  if (!q) return 0
  const label = normalisera(mal.label)
  if (label === q) return 100
  if (label.startsWith(q)) return 80
  if (label.includes(q)) return 60
  if (normalisera(mal.grupp).includes(q)) return 20
  return 10
}
