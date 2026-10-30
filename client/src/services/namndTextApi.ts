/**
 * AIX16 — Text till nämnd och verksamhetsberättelse.
 *
 * Chefen får ett utkast till en löptext ("Under kvartalet …") ur statistik som
 * REDAN är räknad (`namndrapportUnderlag`). Modellen får bara aggregerade tal,
 * aldrig deltagarrader, och inga celler under 5 (cellgränsen):
 *
 *   - en grupp (försörjningshinder) med färre än 5 deltagare redovisas inte alls
 *     för sig, utan läggs ihop med övriga små grupper — och är de tillsammans
 *     också färre än 5 utelämnas de helt;
 *   - ett antal på 1–4 i en redovisad grupp skickas som `null` (undertryckt);
 *   - en närvarograd skickas bara om minst 5 pass är bedömda;
 *   - summan räknas bara över det som redovisas, och en kolumn där någon cell
 *     undertryckts undertrycks också i summan — annars går den undertryckta
 *     cellen att räkna ut genom subtraktion.
 *
 * Servern (`client/api/_prompts/_namndtext.js`) undertrycker en gång till och
 * validerar svaret: varje tal ska stå i underlaget, inga orsaker, inga jämförelser
 * över tid. Texten är ett TILLÄGG som chefen redigerar — den ersätter aldrig
 * tabellerna. Går genom `callAI` (PII-sanering, AI-av-brytare, dagstak).
 */

import { callAI } from '@/services/aiApi'
import type { Namndrapport, NamndRad } from '@/services/namndrapportPdf'

/** Cellgränsen: en grupp eller en cell under den redovisas inte. */
export const CELLGRANS = 5

export interface NamndTextGrupp {
  namn: string
  deltagare: number | null
  bedomdaPass: number | null
  narvarograd: number | null
  anmaldFranvaro: number | null
  oanmaldFranvaro: number | null
  sjukUtanIntyg: number | null
  underlagLamnat: number | null
}

export interface NamndTextUnderlag {
  kvartal: number
  ar: number
  grupper: NamndTextGrupp[]
  summa: Omit<NamndTextGrupp, 'namn'> | null
  /** Fler grupper finns men är så små att de inte redovisas. */
  ovrigaUndertryckta: boolean
}

type Antal = Pick<NamndRad, 'deltagare_med_plan' | 'pass_bedomda' | 'narvarograd' | 'franvaro_anmald' | 'franvaro_oanmald' | 'sjuk_utan_intyg' | 'underlag_lamnat'>

const KOLUMNER = ['deltagare_med_plan', 'pass_bedomda', 'franvaro_anmald', 'franvaro_oanmald', 'sjuk_utan_intyg', 'underlag_lamnat'] as const

/** 1–4 undertrycks (null), 0 och 5 eller mer redovisas. */
export function cellvarde(n: number): number | null {
  return n > 0 && n < CELLGRANS ? null : n
}

function narvarande(r: Antal): number {
  return r.narvarograd === null ? 0 : Math.round((r.narvarograd / 100) * r.pass_bedomda)
}

function tillGrupp(namn: string, r: Antal): NamndTextGrupp {
  return {
    namn,
    deltagare: cellvarde(r.deltagare_med_plan),
    bedomdaPass: cellvarde(r.pass_bedomda),
    // Närvarograden bygger på bedömda pass: under gränsen redovisas den inte.
    narvarograd: r.narvarograd === null || r.pass_bedomda < CELLGRANS ? null : r.narvarograd,
    anmaldFranvaro: cellvarde(r.franvaro_anmald),
    oanmaldFranvaro: cellvarde(r.franvaro_oanmald),
    sjukUtanIntyg: cellvarde(r.sjuk_utan_intyg),
    underlagLamnat: cellvarde(r.underlag_lamnat),
  }
}

function summera(rader: readonly Antal[]): Antal {
  const sum = (k: (typeof KOLUMNER)[number]) => rader.reduce((a, r) => a + r[k], 0)
  const bedomda = sum('pass_bedomda')
  const nar = rader.reduce((a, r) => a + narvarande(r), 0)
  return {
    deltagare_med_plan: sum('deltagare_med_plan'),
    pass_bedomda: bedomda,
    narvarograd: bedomda === 0 ? null : Math.round((nar / bedomda) * 100),
    franvaro_anmald: sum('franvaro_anmald'),
    franvaro_oanmald: sum('franvaro_oanmald'),
    sjuk_utan_intyg: sum('sjuk_utan_intyg'),
    underlag_lamnat: sum('underlag_lamnat'),
  }
}

/**
 * Det modellen får se. `null` när inget går att redovisa (alla grupper under
 * cellgränsen) — då finns inget att skriva en text om.
 */
export function byggNamndUnderlag(u: Namndrapport): NamndTextUnderlag | null {
  const stora = u.rader.filter((r) => r.deltagare_med_plan >= CELLGRANS)
  const sma = u.rader.filter((r) => r.deltagare_med_plan > 0 && r.deltagare_med_plan < CELLGRANS)

  const redovisade: Array<{ namn: string; rad: Antal }> = stora.map((r) => ({ namn: r.etikett, rad: r }))
  let ovrigaUndertryckta = false
  if (sma.length > 0) {
    const ihop = summera(sma)
    if (ihop.deltagare_med_plan >= CELLGRANS) redovisade.push({ namn: 'Övriga grupper', rad: ihop })
    else ovrigaUndertryckta = true
  }
  if (redovisade.length === 0) return null

  const grupper = redovisade.map(({ namn, rad }) => tillGrupp(namn, rad))
  const totalt = tillGrupp('', summera(redovisade.map((r) => r.rad)))
  // Komplementär undertryckning: en kolumn med en undertryckt cell undertrycks i summan.
  const kolumnNamn: Record<(typeof KOLUMNER)[number], keyof Omit<NamndTextGrupp, 'namn' | 'narvarograd'>> = {
    deltagare_med_plan: 'deltagare',
    pass_bedomda: 'bedomdaPass',
    franvaro_anmald: 'anmaldFranvaro',
    franvaro_oanmald: 'oanmaldFranvaro',
    sjuk_utan_intyg: 'sjukUtanIntyg',
    underlag_lamnat: 'underlagLamnat',
  }
  const summa = { ...totalt } as Omit<NamndTextGrupp, 'namn'> & { namn?: string }
  delete summa.namn
  for (const k of KOLUMNER) {
    const falt = kolumnNamn[k]
    if (grupper.some((g) => g[falt] === null)) summa[falt] = null
  }
  if (grupper.some((g) => g.bedomdaPass === null)) summa.narvarograd = null

  return { kvartal: u.kvartal, ar: u.ar, grupper, summa, ovrigaUndertryckta }
}

export interface Namndtext {
  text: string
  /** Antal meningar servern strök för att de inte höll sig till underlaget. */
  struket: number
}

/** Ber om ett utkast. Kastar vid fel, och när underlaget är för litet för att redovisa. */
export async function foreslaNamndtext(u: Namndrapport): Promise<Namndtext> {
  const underlag = byggNamndUnderlag(u)
  if (!underlag) throw new Error('Underlaget är för litet för att skriva en text om: ingen grupp har fem deltagare eller fler.')
  // Modellen skriver ibland ogiltig JSON (mätt i prod 2026-10-30): ett nytt försök är billigt.
  let svar: unknown
  try {
    svar = await callAI<unknown>('konsulent-namndtext', { underlag })
  } catch (err) {
    if ((err as { kod?: string })?.kod !== 'AI_INVALID_RESPONSE') throw err
    svar = await callAI<unknown>('konsulent-namndtext', { underlag })
  }
  const v = (svar as { namndtext?: { text?: unknown; struket?: unknown } })?.namndtext
  if (!v || typeof v.text !== 'string' || !v.text.trim()) {
    throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')
  }
  return { text: v.text.trim(), struket: typeof v.struket === 'number' ? v.struket : 0 }
}
