/**
 * oversiktRegler — rena regler för konsulentens Översikt (rollspelet 2026-09-27).
 *
 * RK6: "Möten denna vecka" räknade veckan som `idag − getDay() + 1`. På en
 * söndag är getDay() 0, så "veckan" blev måndagen EFTER — kortet visade nästa
 * veckas möten och Min dag missade dagens. Veckan är måndag–söndag i lokal tid.
 *
 * RR3/RK7: Min dag sa "Inga brådskande punkter idag" om en deltagare som inte
 * haft möte på 33 dagar, och ogiltig frånvaro syntes inte alls. Det brådskande
 * räknas här ur samma källor som deltagarlistans möteschip (moteskadens.ts) och
 * passens närvaro — inget eget tal, ingen egen gräns.
 */

import { kadensForMoten, MOTE_GRANS_DAGAR, FYSISKT_GRANS_DAGAR, type MoteRad } from '@/services/moteskadens'

/** Måndag 00:00 till söndag 23:59:59.999 i lokal tid, för veckan `nu` ligger i. */
export function veckansGranser(nu: Date): { start: Date; slut: Date } {
  const start = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())
  const dagarSedanMandag = (start.getDay() + 6) % 7 // mån=0 … sön=6
  start.setDate(start.getDate() - dagarSedanMandag)
  const slut = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999)
  return { start, slut }
}

function lokaltDatum(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Fönstret för "ogiltig frånvaro senaste 7 dagarna": i dag och sex dagar bakåt. */
export function franvaroFonster(idag: Date): { fran: string; till: string } {
  const fran = new Date(idag.getFullYear(), idag.getMonth(), idag.getDate() - 6)
  return { fran: lokaltDatum(fran), till: lokaltDatum(idag) }
}

export type BradskandeTyp = 'franvaro' | 'mote'

export interface Bradskande {
  participantId: string
  typ: BradskandeTyp
  /** Konsulentvyn översätts inte (DESIGN.md §2). */
  text: string
}

interface DeltagareRad {
  participant_id: string
  status: string
}

interface PassRad {
  participant_id: string
  date: string
  attendance: string | null
}

const MANAD = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function kortDatum(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MANAD[m - 1]}`
}

/**
 * Det som brådskar för konsulentens egna deltagare:
 *   - ogiltig frånvaro på något pass de senaste 7 dagarna (alla deltagare i listan
 *     — frånvaron är ett faktum oavsett status);
 *   - aktiva deltagare vars möteskadens är röd i deltagarlistan (`laget: 'over'`):
 *     senaste genomförda möte över 14 dagar, eller senaste fysiska över 28.
 *     "Inget möte än" är grått i listan och flaggas inte här heller — samma
 *     regel på båda ställena, annars säger två vyer olika saker om samma person.
 * Frånvaron först — den är dagens viktigaste signal under aktivitetskravet.
 */
export function bradskandePunkter(args: {
  deltagare: readonly DeltagareRad[]
  moten: readonly MoteRad[]
  pass: readonly PassRad[]
  idag: Date
}): Bradskande[] {
  const { deltagare, moten, pass, idag } = args
  const mina = new Set(deltagare.map((d) => d.participant_id))
  const { fran, till } = franvaroFonster(idag)

  const franvaro = new Map<string, string[]>()
  for (const p of pass) {
    if (!mina.has(p.participant_id) || p.attendance !== 'absent_invalid') continue
    if (p.date < fran || p.date > till) continue
    const lista = franvaro.get(p.participant_id) ?? []
    lista.push(p.date)
    franvaro.set(p.participant_id, lista)
  }

  const ut: Bradskande[] = []
  for (const d of deltagare) {
    const datum = franvaro.get(d.participant_id)
    if (!datum) continue
    const senast = [...datum].sort().at(-1)!
    ut.push({
      participantId: d.participant_id,
      typ: 'franvaro',
      text: datum.length === 1
        ? `Ogiltig frånvaro ${kortDatum(senast)}`
        : `Ogiltig frånvaro på ${datum.length} pass senaste 7 dagarna, senast ${kortDatum(senast)}`,
    })
  }

  for (const d of deltagare) {
    if (d.status !== 'ACTIVE') continue
    const k = kadensForMoten(moten.filter((m) => m.participant_id === d.participant_id), idag)
    if (k.laget !== 'over') continue
    let text: string | null = null
    if (k.dagarSedanMote !== null && k.dagarSedanMote > MOTE_GRANS_DAGAR) {
      text = `Senaste möte ${k.dagarSedanMote} dagar sedan — gränsen är ${MOTE_GRANS_DAGAR}`
    } else if (k.dagarSedanFysiskt !== null && k.dagarSedanFysiskt > FYSISKT_GRANS_DAGAR) {
      text = `Senaste fysiska möte ${k.dagarSedanFysiskt} dagar sedan — gränsen är ${FYSISKT_GRANS_DAGAR}`
    }
    if (text) ut.push({ participantId: d.participant_id, typ: 'mote', text })
  }
  return ut
}
