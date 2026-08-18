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
