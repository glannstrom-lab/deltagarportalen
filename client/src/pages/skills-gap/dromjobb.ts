/**
 * Drömjobbsfältet är en `rows={6}` textarea vars placeholder uttryckligen ber
 * användaren klistra in en hel jobbannons. Det som sparas i
 * `skills_analyses.dream_job` är alltså ofta nittio ord, inte en yrkestitel —
 * och sidan skrev in hela strängen mitt i meningen "Så här ser dina styrkor
 * och nästa steg ut mot …".
 */

const MAX_ETIKETT = 60

/** Är texten en hel annons snarare än en yrkestitel? */
export function arLangDromjobb(dreamJob: string | null | undefined): boolean {
  const t = (dreamJob || '').trim()
  return t.length > MAX_ETIKETT || t.includes('\n')
}

/**
 * En kort etikett att skriva i löpande text — eller tom sträng.
 *
 * Första försöket kapade bara första raden vid 70 tecken. Det räcker inte:
 * en annons börjar med en MENING, och "Vi söker en lagermedarbetare till vårt
 * distributionscenter i Göteborg." är sextionio tecken. Den slank rakt igenom
 * och hamnade i "Här är dina styrkor och nästa steg mot Vi söker en
 * lagermedarbetare...". Kortare kap hade bara gett en avhuggen mening.
 *
 * En yrkestitel är kort, har få ord och är ingen mening. Ser texten inte ut
 * som en titel returneras tom sträng — då skriver anroparen en formulering
 * utan yrkesnamn och visar texten som citat i stället. Att gissa fram en
 * titel ur en annons vore ett påstående vi inte kan belägga.
 */
export function kortDromjobb(dreamJob: string | null | undefined): string {
  const helt = (dreamJob || '').trim()
  if (!helt) return ''

  const forstaRaden = helt.split('\n')[0].trim()
  if (forstaRaden.length > MAX_ETIKETT) return ''

  // En mening, inte en titel: slutar med punkt, eller innehåller en.
  if (/[.!?]/.test(forstaRaden)) return ''

  // Mer än sju ord är en beskrivning, inte ett yrkesnamn.
  if (forstaRaden.split(/\s+/).length > 7) return ''

  return forstaRaden
}

/**
 * Ett citat av det användaren skrev, tydligt kapat. Används där en etikett
 * hade stått om vi kunnat härleda en — så raden visar VAD ANVÄNDAREN SKREV i
 * stället för ett påstående om vilket yrke det är.
 */
export function forhandsvisning(dreamJob: string | null | undefined): string {
  const helt = (dreamJob || '').trim().replace(/\s+/g, ' ')
  if (!helt) return ''
  if (helt.length <= 90) return helt
  const kapad = helt.slice(0, 90)
  const sista = kapad.lastIndexOf(' ')
  return (sista > 40 ? kapad.slice(0, sista) : kapad) + '…'
}

/**
 * Hur många av de kompetenser analysen tog upp som redan är på plats.
 *
 * Ersätter `match_percentage` i gränssnittet. Skälet: procenten är en
 * språkmodells helhetsomdöme om en person, den varierar mellan körningar på
 * samma underlag, och den stod i hjälteposition som en stor siffra i en
 * solid cirkel. Det här talet har i stället en definition som går att läsa i
 * listan under — man kan räkna efter.
 */
export function antalKlara(skills: { current: number; target: number; gap?: string }[]): number {
  return skills.filter(s => s.gap === 'none' || s.current >= s.target).length
}

/**
 * Flyttad till `@/lib/sakerUrl` 2026-08-22 och återexporterad här.
 *
 * Skyddet behövdes på tre ställen till — utbildningssidan och intresseguidens
 * karriärrekommendationer gjorde `href={edu.url}` utan vakt, och fick
 * `href="[object Object]"` när API:t skickade `{lang, content}`. En kopia per
 * sida hade gett samma bugg en fjärde gång.
 *
 * `window.open(course.url, '_blank')` öppnade tidigare vad AI:n än hade
 * skrivit i fältet — inklusive `javascript:` — och utan `noopener`, så
 * måldokumentet fick `window.opener` mot portalen.
 */
export { sakerUrl } from '@/lib/sakerUrl'
