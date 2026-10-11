/**
 * motesklocka — Rusta och matcha-avtalets mötesregel som en klocka (omtaget
 * "Kvarter", steg 5, 2026-10-11). Räknar ur samma kadens som deltagarlistans
 * chip (services/moteskadens.ts), så de två kan inte säga olika saker.
 *
 *   Individuellt möte minst var 14:e dag, fysiskt minst var 28:e.
 *   Bara GENOMFÖRDA möten räknas — ett bokat möte nämns, men flyttar inte gränsen.
 *
 * Kommunens konsulenter ser inte klockan (fynd A1–A3 i kommunslipningen).
 */
import { FYSISKT_GRANS_DAGAR, MOTE_GRANS_DAGAR, SNART_DAGAR, type Kadens, type MoteTyp } from '@/services/moteskadens'
import { formatLocalDate } from '@/services/aktivitetSchema'
import type { Status } from '@/components/ui/kvarterStatus'

export interface Motesklocka {
  /** Dagar kvar till 14-dagarsgränsen. Negativt = så många dagar över. `null` = inget genomfört möte. */
  dagarKvar: number | null
  /** Sista dag för nästa möte (lokal YYYY-MM-DD), `null` utan genomfört möte. */
  senast: string | null
  /** Sista dag för nästa fysiska möte, `null` utan genomfört fysiskt möte. */
  fysisktSenast: string | null
  fysisktDagarKvar: number | null
  /** Andel av 14-dagarsfönstret som gått, 0–1. */
  andel: number
  status: Status
  bokat: Kadens['bokat']
}

function plusDagar(idag: Date, n: number): string {
  return formatLocalDate(new Date(idag.getFullYear(), idag.getMonth(), idag.getDate() + n))
}

export function motesklocka(k: Kadens, idag: Date): Motesklocka {
  const dagarKvar = k.dagarSedanMote === null ? null : MOTE_GRANS_DAGAR - k.dagarSedanMote
  const fysisktDagarKvar = k.dagarSedanFysiskt === null ? null : FYSISKT_GRANS_DAGAR - k.dagarSedanFysiskt
  const status: Status = dagarKvar === null
    ? 'planerat'
    : dagarKvar < 0
      ? 'ogiltig'
      : dagarKvar <= SNART_DAGAR
        ? 'vantar'
        : 'narvarande'
  return {
    dagarKvar,
    senast: dagarKvar === null ? null : plusDagar(idag, dagarKvar),
    fysisktSenast: fysisktDagarKvar === null ? null : plusDagar(idag, fysisktDagarKvar),
    fysisktDagarKvar,
    andel: k.dagarSedanMote === null ? 0 : Math.min(1, Math.max(0, k.dagarSedanMote / MOTE_GRANS_DAGAR)),
    status,
    bokat: k.bokat,
  }
}

const VECKODAG = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']
const MANAD = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/** `2026-10-17` → `fredag 17 okt`. Läser strängen som lokal dag. */
export function dagMedVeckodag(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dag = new Date(y, m - 1, d)
  return `${VECKODAG[dag.getDay()]} ${d} ${MANAD[m - 1]}`
}

const TYP: Record<MoteTyp, string> = { physical: 'fysiskt', video: 'video', phone: 'telefon' }

/** Klockans två rader i ord. Aldrig "0 dagar" när inget möte finns. */
export function motesklockaText(m: Motesklocka): { rubrik: string; rad: string } {
  if (m.dagarKvar === null || m.senast === null) {
    return {
      rubrik: 'Inget genomfört möte registrerat',
      rad: m.bokat
        ? `Bokat ${TYP[m.bokat.meeting_type]} ${dagMedVeckodag(formatLocalDate(new Date(m.bokat.scheduled_at)))}. Det räknas när det hållits.`
        : `Ett individuellt möte ska hållas minst var ${MOTE_GRANS_DAGAR}:e dag.`,
    }
  }
  const rubrik = m.dagarKvar < 0
    ? `Mötet är ${-m.dagarKvar} ${m.dagarKvar === -1 ? 'dag' : 'dagar'} sent`
    : m.dagarKvar === 0
      ? 'Nästa möte senast i dag'
      : `Nästa möte senast ${dagMedVeckodag(m.senast)}`
  const kvar = m.dagarKvar < 0
    ? `${MOTE_GRANS_DAGAR}-dagarsgränsen passerades ${dagMedVeckodag(m.senast)}.`
    : `${m.dagarKvar} ${m.dagarKvar === 1 ? 'dag' : 'dagar'} kvar till ${MOTE_GRANS_DAGAR}-dagarsgränsen.`
  const fysiskt = m.fysisktSenast === null || m.fysisktDagarKvar === null
    ? 'Inget fysiskt möte registrerat än.'
    : m.fysisktDagarKvar < 0
      ? `Fysiskt möte skulle ha hållits senast ${dagMedVeckodag(m.fysisktSenast)}.`
      : `Fysiskt möte senast ${dagMedVeckodag(m.fysisktSenast)}.`
  return { rubrik, rad: `${kvar} ${fysiskt}` }
}
