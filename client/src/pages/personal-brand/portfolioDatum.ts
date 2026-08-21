/**
 * Datumhanteringen för arbetsprover.
 *
 * `<input type="month">` ger `"2026-03"`. Kolumnerna `portfolio_items.start_date`
 * och `end_date` är av typen `date`, och `pg_input_is_valid('2026-03','date')`
 * är **false** — verifierat mot prod 2026-08-21. Inserten svarade alltså 400,
 * felet sväljdes, formuläret stängdes och posten var borta. `lint:schema`
 * kan inte se det: kolumnnamnet är rätt, det är värdet som är fel.
 *
 * Ligger i egen modul dels för att gå att pröva utan att montera sidan, dels
 * för att exporterade hjälpfunktioner i en komponentfil bryter fast refresh.
 */

/** "2026-03" → "2026-03-01". Månadens första dag är den enda tolkning som
 *  inte hittar på en precision användaren inte angett. */
export function manadTillDatum(manad: string): string | undefined {
  const t = manad.trim()
  if (!t) return undefined
  if (/^\d{4}-\d{2}$/.test(t)) return `${t}-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  return undefined
}

/** Tillbaka till formulärets form. */
export function datumTillManad(datum?: string | null): string {
  if (!datum) return ''
  const m = /^(\d{4}-\d{2})/.exec(datum)
  return m ? m[1] : ''
}

/**
 * "2026-03-01" → "mars 2026". Datumen renderades tidigare rått, så kortet
 * visade "2026-03-01 - 2026-06-01".
 */
export function visaPeriod(start?: string | null, slut?: string | null, locale = 'sv-SE'): string {
  const fmt = (d?: string | null) => {
    if (!d) return ''
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return ''
    return dt.toLocaleDateString(locale, { year: 'numeric', month: 'long' })
  }
  const a = fmt(start)
  const b = fmt(slut)
  if (a && b) return `${a} – ${b}`
  return a || b
}
