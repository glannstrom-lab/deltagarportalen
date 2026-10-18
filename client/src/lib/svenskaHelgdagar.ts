/**
 * Svenska allmänna helgdagar ("röda dagar", lag 1989:253) — KF2, 2026-10-18.
 *
 * Grundersättningen i Rusta och matcha räknas på femdagarsvecka utan röda dagar
 * (FFU Af-2025/0017 §5.1). Aftnar (midsommar-, jul-, nyårsafton) är INTE allmänna
 * helgdagar i lagens mening och räknas därför som vardagar här; avtalet säger
 * "röda dagar", inte "klämdagar". Står det annat i ert avtal: ändra här.
 *
 * Bara de som kan infalla på en vardag spelar roll för räkningen, men alla
 * listas så att funktionen går att använda till annat.
 */

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Påskdagen (gregoriansk, Meeus/Jones/Butcher). */
export function paskdagen(ar: number): Date {
  const a = ar % 19, b = Math.floor(ar / 100), c = ar % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const manad = Math.floor((h + l - 7 * m + 114) / 31)
  const dag = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ar, manad - 1, dag)
}

const plus = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** Lördagen 20–26 juni (midsommardagen) och lördagen 31 okt–6 nov (alla helgons dag). */
function forstaLordagFran(ar: number, manad: number, dag: number): Date {
  const d = new Date(ar, manad, dag)
  return plus(d, (6 - d.getDay() + 7) % 7)
}

export function helgdagar(ar: number): Set<string> {
  const pask = paskdagen(ar)
  return new Set([
    `${ar}-01-01`, `${ar}-01-06`, `${ar}-05-01`, `${ar}-06-06`, `${ar}-12-25`, `${ar}-12-26`,
    ymd(plus(pask, -2)), ymd(pask), ymd(plus(pask, 1)), ymd(plus(pask, 39)), ymd(plus(pask, 49)),
    ymd(forstaLordagFran(ar, 5, 20)), ymd(forstaLordagFran(ar, 9, 31)),
  ])
}

/**
 * Vardagar (mån–fre utan röda dagar) i en kalendermånad, inom [fran, till].
 * `till` null = tills vidare. Datum som 'YYYY-MM-DD'.
 */
export function ersattningsbaraDagar(manad: string, fran: string, till: string | null): number {
  const [ar, m] = manad.split('-').map(Number)
  const roda = helgdagar(ar)
  let n = 0
  for (let d = new Date(ar, m - 1, 1); d.getMonth() === m - 1; d = plus(d, 1)) {
    const s = ymd(d)
    if (s < fran || (till && s > till)) continue
    const vd = d.getDay()
    if (vd === 0 || vd === 6 || roda.has(s)) continue
    n++
  }
  return n
}
