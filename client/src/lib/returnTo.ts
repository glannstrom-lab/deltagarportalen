/**
 * Vart användaren var på väg innan inloggningen.  (spår K11, 2026-08-12)
 *
 * Bakgrund: en gäst som klickade en CTA på en guidesida — "Bygg ditt CV" —
 * fick B2B-säljsidan renderad medan adressfältet fortfarande sa `/#/cv`.
 * Ingen omdirigering, ingen förklaring, ingen väg tillbaka till det hon ville
 * göra. Det är den enda punkten mellan 180 publika sidor och ett konto.
 *
 * SÄKERHET: `returnTo` kommer från URL:en och är alltså användarstyrd. Utan
 * kontroll är det en öppen vidarebefordran — `?returnTo=https://ondsajt.se`
 * hade tagit någon från jobin.se till en fejkad inloggning, med vår domän i
 * historiken. Därför en tillåtlista på formen, inte en blocklista på det
 * farliga: bara en enkel intern sökväg släpps igenom.
 */

/** Sökvägar det aldrig är meningsfullt att skicka någon tillbaka till. */
const ALDRIG = new Set(['/login', '/register', '/'])

/**
 * Radbrytningar, tabbar och andra kontrolltecken kan användas för att bryta
 * ut ur sökvägen. Kontrolleras på teckenkod i stället för med regex — ett
 * regex över intervallet kräver bokstavliga kontrolltecken i källkoden, och
 * de är osynliga för den som granskar diffen.
 */
const harKontrolltecken = (s: string) =>
  [...s].some((c) => {
    const kod = c.charCodeAt(0)
    return kod < 0x20 || kod === 0x7f
  })

/**
 * Returnerar en säker intern sökväg, eller null.
 *
 * Godkänner: `/cv`, `/cv/steg-2`, `/job-search?q=lager`, `/cv#topp`
 * Nekar: absoluta URL:er, protokollrelativa (`//ond.se`), backslash-varianten
 * som vissa webbläsare normaliserar till `//` (`/\ond.se`), och allt som inte
 * börjar med ett ensamt `/`.
 */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null

  let path = raw
  // En kodad sökväg kan vara dubbelkodad på vägen genom hash-routern.
  // Avkoda tills den är stabil, annars kan `%252f%252fond.se` slinka förbi.
  for (let i = 0; i < 3; i++) {
    let avkodad: string
    try {
      avkodad = decodeURIComponent(path)
    } catch {
      return null // trasig procentkodning — lita inte på den
    }
    if (avkodad === path) break
    path = avkodad
  }

  if (harKontrolltecken(path)) return null

  if (!path.startsWith('/')) return null
  if (path.startsWith('//')) return null // protokollrelativ
  if (path.includes('\\')) return null // `/\ond.se` normaliseras till `//` i vissa webbläsare

  // `/../` kan ta sig ut ur appen i vissa routrar. Vi har inga relativa
  // sökvägar i routetabellen, så det finns inget legitimt fall.
  if (path.split(/[/?#]/).includes('..')) return null

  const utanQuery = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  if (ALDRIG.has(utanQuery)) return null

  return path
}

/**
 * Bygger `/login?returnTo=…`. Utelämnar parametern när sökvägen inte är värd
 * att minnas, så att vi slipper `?returnTo=%2F` i adressfältet.
 */
export function medReturnTo(bas: string, path: string | null | undefined): string {
  const saker = safeReturnTo(path)
  return saker ? `${bas}?returnTo=${encodeURIComponent(saker)}` : bas
}
