/**
 * SJ2 (skarpt test 2026-09-28): normalisering av det CV-importen får tillbaka.
 *
 * 1. Datum. Prompten ber modellen skriva datum "exakt som de står", och CV-byggarens
 *    fält är <input type="month"> (YYYY-MM). "2019–2024" hamnade som startdatum med
 *    tomt slutdatum, och "mars 2019" syntes aldrig — fältet visade tomt. Här delas
 *    intervall upp och kända format blir YYYY-MM. Ett år utan månad lämnas som det är:
 *    att skriva "2019-01" vore att hitta på en månad.
 * 2. E-post och telefon. Servern stryker dem ur texten innan den når modellen (PII-
 *    skyddet), så modellen kan aldrig returnera dem. Filen läses i webbläsaren, så vi
 *    plockar dem ur texten här — de lämnar aldrig datorn.
 */

const MANADER: Record<string, string> = {
  jan: '01', januari: '01', january: '01',
  feb: '02', februari: '02', february: '02',
  mar: '03', mars: '03', march: '03',
  apr: '04', april: '04',
  maj: '05', may: '05',
  jun: '06', juni: '06', june: '06',
  jul: '07', juli: '07', july: '07',
  aug: '08', augusti: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  okt: '10', oct: '10', oktober: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
}

const PAGAENDE = /^(nu|idag|i dag|pågående|pagaende|present|current|now|ongoing)$/i

/** Ett datum → YYYY-MM om det går utan att gissa, annars som det stod. */
export function tolkaImportDatum(ratt: string | undefined | null): string {
  const s = (ratt ?? '').trim().replace(/\.$/, '')
  if (!s) return ''
  let m = s.match(/^(\d{4})[-/.](\d{1,2})$/) // 2019-03, 2019/3
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}`
  m = s.match(/^(\d{1,2})[-/.](\d{4})$/) // 03/2019, 3.2019
  if (m) return `${m[2]}-${m[1].padStart(2, '0')}`
  m = s.match(/^([a-zåäö]+)\.?\s+(\d{4})$/i) // mars 2019, Mar 2019
  if (m && MANADER[m[1].toLowerCase()]) return `${m[2]}-${MANADER[m[1].toLowerCase()]}`
  return s
}

export interface ImportPeriod {
  startDate: string
  endDate: string
  current: boolean
}

/** Start och slut, med intervall i startfältet uppdelat ("2019–2024", "mars 2019 - nu"). */
export function tolkaImportPeriod(start: string | undefined, slut: string | undefined, pagar: boolean): ImportPeriod {
  let s = (start ?? '').trim()
  let e = (slut ?? '').trim()
  let current = pagar
  // "2019-03" / "2019/3" är år-månad, inget intervall. Allt annat med ett streck mellan två
  // delar är ett intervall: "2019–2024", "mars 2019 - nu", "2019-03 – 2021-06".
  if (!e && !/^\d{4}[-/.]\d{1,2}$/.test(s)) {
    const m = s.match(/^(.+?)\s*(?:[–—]|\s-\s|(?<=\d{4})-(?=\d{4}|[a-zåäö]))\s*(.+)$/i)
    if (m) {
      s = m[1]
      e = m[2]
    }
  }
  if (PAGAENDE.test(e)) {
    e = ''
    current = true
  }
  return { startDate: tolkaImportDatum(s), endDate: current ? '' : tolkaImportDatum(e), current }
}

const EPOST = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
// Svenska nummer: 07x-xxx xx xx, +46 7x …, 08-… Minst 8 siffror totalt.
const TELEFON = /(?:\+46[\s-]?|0)(?:\d[\s-]?){7,11}\d/

export function hittaKontakt(text: string): { email?: string; phone?: string } {
  const ut: { email?: string; phone?: string } = {}
  const e = text.match(EPOST)
  if (e) ut.email = e[0]
  // Undvik personnummer (ÅÅÅÅMMDD-XXXX / ÅÅMMDD-XXXX) — de börjar inte med 0 eller +46, men
  // kontrollera ändå att träffen inte är en del av ett personnummer.
  const t = text.match(TELEFON)
  if (t && !/\d{6,8}[-+]\d{4}/.test(text.slice(Math.max(0, (t.index ?? 0) - 4), (t.index ?? 0) + t[0].length + 2))) {
    ut.phone = t[0].trim()
  }
  return ut
}
