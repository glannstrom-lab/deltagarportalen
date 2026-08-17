/**
 * Avkodar en sökväg innan den jämförs med en literal i koden.
 *
 * Bakgrund (uppmätt i webbläsaren 2026-08-17): två av portalens rutter har
 * svenska tecken — `/spontanansökan` och `/nätverk`. React Router ger deras
 * `location.pathname` i procentkodad form (`/spontanans%C3%B6kan`), medan
 * varje jämförelse i koden är skriven med `ö`. Strängarna är alltså aldrig
 * lika, och allt som hänger på likhet slutar tyst att fungera:
 *
 *   - undersidesraden markerade ingen aktiv sida på de två rutterna
 *     (`aktivUnderside: null` mot `"Lön & Förhandling"` på /salary)
 *   - rådgivarkolumnen försvann helt (`radgivarpanel: false` mot `true`)
 *
 * Inget av det syntes i ett test eller ett typfel: en sökväg som inte matchar
 * ser exakt ut som en sida utan innehåll. Samma familj som fantomtabellerna —
 * en saknad rad och ett fel renderas likadant.
 *
 * `decodeURIComponent` kastar på ogiltiga sekvenser (`%E0%A4%A`), och en
 * trasig URL ska inte krascha navigationen. Därför try/catch med sökvägen
 * oförändrad som reserv.
 */
export function avkodaSokvag(pathname: string): string {
  if (!pathname || !pathname.includes('%')) return pathname
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}
