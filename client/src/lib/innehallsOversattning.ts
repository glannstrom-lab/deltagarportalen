/**
 * Översättning av INNEHÅLLSDATA (övningar, intresseguide, externa resurser,
 * rådgivare …) — till skillnad från gränssnittstexten, som bor i `i18n/locales`.
 *
 * ## Varför innehållet inte ligger i en.json
 *
 * `sv.json` laddas eagerly för alla användare. Innehållsdatan är 600 kB och
 * skulle fördubbla den kostnaden för varje svensk användare som aldrig rör
 * engelskan. Översättningarna ligger därför i egna JSON-filer som importeras
 * dynamiskt, precis som `en.json` redan gör (se `i18n/config.ts`).
 *
 * ## Varför en overlay och inte en kopia av datan
 *
 * En engelsk tvillingfil hade dubblerat strukturen: samma id:n, samma ikoner,
 * samma ordning på två ställen. Den sortens dubblering glider isär tyst — en ny
 * övning läggs till på svenska, den engelska filen glöms, och ingen märker det
 * förrän en användare ser ett tomt kort. Här bor strukturen på ETT ställe.
 * Overlayen är en platt karta `nyckel → engelsk text`, och saknas en nyckel
 * faller texten tillbaka på svenska i stället för att försvinna.
 *
 * ## Nyckelhärledning
 *
 * Nyckeln byggs av vägen genom strukturen, med `id` (eller `slug`) som segment
 * när posten har ett — annars index. `exercises.strengths.steps.1.title` är
 * alltså stabil även om övningarna byter ordning, vilket ett indexbaserat
 * schema inte hade varit.
 *
 * ## Vad som INTE översätts här
 *
 * Fält som används som nycklar i koden. `category` och `difficulty` på en
 * övning filtrerar, slår upp färger och mappar mot kunskapsbanken
 * (`Exercises.tsx:216,237,517`) samtidigt som de visas — översätts de i datan
 * går grupperingen sönder. De visas i stället genom `t()` vid renderingen.
 * Se `FALT_SOM_AR_NYCKLAR`.
 */

/** Platt karta: nyckel → översatt text. Saknad nyckel = behåll originalet. */
export type Overlay = Record<string, string>

/**
 * Fältnamn som aldrig översätts, eftersom koden jämför mot deras värden.
 * Lägger du till ett fält här: kontrollera att det renderas genom `t()`
 * någonstans, annars blir det osynligt för engelskan.
 */
export const FALT_SOM_AR_NYCKLAR = new Set([
  'id', 'slug', 'key', 'icon', 'url', 'href', 'src',
  'avatar', 'avatarSm', 'accent', 'color', 'category', 'difficulty',
  'prognosis', 'type', 'section', 'etikettNyckel',
  // Arrayer av id:n som ser ut som text men slås upp i kod.
  'coachIds', 'kategorier', 'to', 'path', 'pageKey',
])

/** Segment för en post i en lista: id/slug om det finns, annars index. */
function segment(post: unknown, index: number): string {
  if (post && typeof post === 'object') {
    const o = post as Record<string, unknown>
    for (const f of ['id', 'slug', 'key']) {
      if (typeof o[f] === 'string' && o[f]) return String(o[f])
    }
  }
  return String(index)
}

/** Ett värde vi ska gå ned i — inte en React-komponent, funktion eller Date. */
function arVandringsbar(v: unknown): boolean {
  if (v === null || typeof v !== 'object') return false
  if (typeof v === 'function') return false
  if ('$$typeof' in (v as object)) return false
  if (v instanceof Date) return false
  return true
}

/**
 * Går igenom en struktur och anropar `besok` för varje översättbar sträng.
 * Används av extraktorn, av grinden och av `oversattStruktur` nedan — så att
 * de tre omöjligt kan härleda olika nycklar.
 */
export function gaIgenomTexter(
  varde: unknown,
  besok: (nyckel: string, text: string) => void,
  prefix = ''
): void {
  if (typeof varde === 'string') {
    if (varde.trim()) besok(prefix, varde)
    return
  }
  if (!arVandringsbar(varde)) return

  if (Array.isArray(varde)) {
    varde.forEach((post, i) => {
      const seg = typeof post === 'string' ? String(i) : segment(post, i)
      gaIgenomTexter(post, besok, prefix ? `${prefix}.${seg}` : seg)
    })
    return
  }

  for (const [falt, v] of Object.entries(varde as Record<string, unknown>)) {
    if (FALT_SOM_AR_NYCKLAR.has(falt)) continue
    gaIgenomTexter(v, besok, prefix ? `${prefix}.${falt}` : falt)
  }
}

/**
 * Returnerar en djup kopia där varje översättbar sträng bytts mot sin
 * motsvarighet i overlayen. Saknas nyckeln behålls originaltexten — engelskan
 * blir då ofullständig, aldrig tom. Grinden fångar det som saknas.
 */
export function oversattStruktur<T>(varde: T, overlay: Overlay, prefix = ''): T {
  if (typeof varde === 'string') {
    if (!varde.trim()) return varde
    const traff = overlay[prefix]
    return (traff === undefined ? varde : traff) as unknown as T
  }
  if (!arVandringsbar(varde)) return varde

  if (Array.isArray(varde)) {
    return varde.map((post, i) => {
      const seg = typeof post === 'string' ? String(i) : segment(post, i)
      return oversattStruktur(post, overlay, prefix ? `${prefix}.${seg}` : seg)
    }) as unknown as T
  }

  const ut: Record<string, unknown> = {}
  for (const [falt, v] of Object.entries(varde as Record<string, unknown>)) {
    ut[falt] = FALT_SOM_AR_NYCKLAR.has(falt)
      ? v
      : oversattStruktur(v, overlay, prefix ? `${prefix}.${falt}` : falt)
  }
  return ut as T
}

/** Alla nycklar en struktur ger upphov till, i vandringsordning. */
export function nycklarFor(varde: unknown, prefix = ''): string[] {
  const ut: string[] = []
  gaIgenomTexter(varde, (n) => ut.push(n), prefix)
  return ut
}
