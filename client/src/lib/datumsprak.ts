/**
 * Vilket språk datum ska formateras på.
 *
 * `toLocaleDateString('sv-SE', …)` stod hårdkodat på tre ställen i Översikt.
 * Effekten var att en engelskspråkig användare fick "TISDAG 18 AUGUSTI" mitt i
 * en i övrigt engelsk panel — och en skärmläsare med engelsk röst läste upp
 * svenska. Uppmätt 2026-08-18 efter att panelens i18n-nycklar lagts in: allt
 * annat på sidan bytte språk, datumen inte.
 *
 * i18next-koden kan vara 'sv' eller 'en'; `toLocaleDateString` vill ha en
 * BCP 47-tagg. Kartan är avsiktligt liten — portalen har två språk, och en
 * okänd kod ska falla tillbaka på svenska, inte på webbläsarens språk.
 */
const TAGGAR: Record<string, string> = {
  sv: 'sv-SE',
  en: 'en-GB',
}

export function datumSprak(i18nSprak: string | undefined): string {
  if (!i18nSprak) return TAGGAR.sv
  // 'en-US' → 'en'
  const bas = i18nSprak.split('-')[0].toLowerCase()
  return TAGGAR[bas] ?? TAGGAR.sv
}

/**
 * Ett datum utan klockslag, entydigt på båda språken (RD6, 2026-09-27).
 *
 * `toLocaleDateString('en-US')` gav "9/27/2026" i Jobbsök och Min konsulent —
 * en nyanländ läsare med europeisk datumordning läser det som den 9:e i
 * månad 27, eller inte alls. Svenskan behåller ISO-formen (2026-09-27) som
 * den alltid haft; engelskan skriver ut månaden ("27 September 2026") så att
 * ordningen inte spelar någon roll.
 */
export function kortDatum(datum: Date | string | number, i18nSprak: string | undefined): string {
  const d = datum instanceof Date ? datum : new Date(datum)
  if (Number.isNaN(d.getTime())) return ''
  const tagg = datumSprak(i18nSprak)
  if (tagg === TAGGAR.sv) return d.toLocaleDateString(tagg)
  return d.toLocaleDateString(tagg, { day: 'numeric', month: 'long', year: 'numeric' })
}

/** "september 2026" / "September 2026" ur en `YYYY-MM`-sträng, på användarens språk. */
export function manadOchAr(yyyyMm: string, i18nSprak: string | undefined): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(datumSprak(i18nSprak), { month: 'long', year: 'numeric' })
}
