/**
 * KC13 (2026-10-21): statuskort i chefsvyn — tre tal per organisation och per
 * konsulent, ur organization_caseload. Bara tal, inga deltagaruppgifter, inga
 * hälsodata.
 *
 * Ärlighetsregeln (CLAUDE.md 2026-08-09): ett tal utan underlag visas som "—"
 * med en rad om varför, aldrig som 0 % eller 100 %. Det gäller både när
 * nämnaren är noll och när databasen ännu saknar kolumnen (migrationen väntar).
 *
 * Talet skrivs som "3 av 5"; procent läggs till först från tio, eftersom en
 * procent på fyra deltagare ser mer exakt ut än den är.
 */
import type { CaseloadRow } from '@/services/orgApi'

export const PROCENT_FRAN = 10

export type Statustal =
  | { visas: true; text: string; varde: number; nämnare: number }
  | { visas: false; text: '—'; varfor: string }

export interface Statuskort {
  plan: Statustal
  veckomal: Statustal
  dokumentation: Statustal
}

function tal(taljare: number, namnare: number, tomt: string): Statustal {
  if (namnare <= 0) return { visas: false, text: '—', varfor: tomt }
  const t = Math.min(taljare, namnare)
  const procent = namnare >= PROCENT_FRAN ? ` (${Math.round((t / namnare) * 100)} %)` : ''
  return { visas: true, text: `${t} av ${namnare}${procent}`, varde: t, nämnare: namnare }
}

const EJ_MATT = 'Räknas inte än: databasen saknar det här talet.'

/** Summerar rader (en eller flera konsulenter) till ett statuskort. */
export function statuskort(rader: readonly CaseloadRow[]): Statuskort {
  const sum = (f: (r: CaseloadRow) => number) => rader.reduce((a, r) => a + f(r), 0)
  const deltagare = sum((r) => r.antal_deltagare - (r.antal_uppfoljning ?? 0))
  const aktiva = sum((r) => r.antal_aktiva_planer)
  const harKolumner = rader.length > 0 && rader.every((r) => typeof r.antal_veckomal_nadda === 'number'
    && typeof r.antal_veckomal_underlag === 'number' && typeof r.antal_dokumentation_klar === 'number')

  return {
    plan: tal(aktiva, deltagare, 'Inga deltagare utan uppföljning än.'),
    veckomal: harKolumner
      ? tal(sum((r) => r.antal_veckomal_nadda ?? 0), sum((r) => r.antal_veckomal_underlag ?? 0), 'Inga planer hade pass förra veckan.')
      : { visas: false, text: '—', varfor: EJ_MATT },
    dokumentation: harKolumner
      ? tal(sum((r) => r.antal_dokumentation_klar ?? 0), aktiva, 'Inga aktiva planer än.')
      : { visas: false, text: '—', varfor: EJ_MATT },
  }
}

export const STATUSKORT_RUBRIK = {
  plan: { rubrik: 'Har en gällande plan', forklaring: 'Aktiva aktivitetsplaner av deltagarna. Deltagare i uppföljning räknas inte.' },
  veckomal: { rubrik: 'Nådde veckomålet förra veckan', forklaring: 'Bekräftad närvaro i anvisade pass, minst det anvisade veckomålet och ingen ogiltig frånvaro. Planer utan pass förra veckan räknas inte.' },
  dokumentation: { rubrik: 'Dokumentationen klar', forklaring: 'Deltagaren har bekräftat gällande plan, och underlaget för förra månaden är lämnat.' },
} as const
