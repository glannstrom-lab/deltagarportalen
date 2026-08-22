/**
 * Bara http(s) släpps igenom — och bara som sträng.
 *
 * Låg tidigare bara i `pages/skills-gap/dromjobb.ts` och användes därför bara
 * av kompetensanalysen. Utbildningssidan och intresseguidens
 * karriärrekommendationer gjorde `href={edu.url}` rakt av, och när
 * `education-search` skickade `{lang, content}` i stället för en sträng blev
 * varje "Läs mer"-länk `href="[object Object]"` — en länk till portalens egen
 * startsida, på varenda kort. Skyddet fanns i projektet; det låg bara inte
 * där det behövdes.
 *
 * Tar `unknown` med flit: det är just fel DATATYP som har varit felet, inte
 * fel innehåll.
 */
export function sakerUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url) return null
  try {
    // ABSOLUT URL krävs — ingen bas skickas med. Löste vi mot
    // `window.location.origin` blev "inte en url alls" till en giltig länk på
    // vårt eget ursprung, alltså en länk till ingenstans som såg legitim ut.
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    return u.href
  } catch {
    return null
  }
}

export default sakerUrl
