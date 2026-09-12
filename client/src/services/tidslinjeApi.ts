/**
 * tidslinjeApi — deltagarens händelser i tidsordning för konsulentens
 * detaljsida (PG16/F14, 2026-09-12).
 *
 * Tidslinje-fliken sa fram till i dag "Aktivitetshistorik kommer — vi måste
 * först ge konsulenter läsrättighet". Läsrätten finns sedan KS2 b: journal,
 * mål, möten och platser läses via `har_aktiv_relation(participant_id)`, och
 * passen via planens koppling. Så här läggs ingenting nytt till i databasen —
 * fem befintliga källor slås ihop och sorteras.
 *
 * Läsloggen (audit_logs, ÖV1) är MED FLIT inte med: den är deltagarens egen
 * vy över vem som tittat, och konsulenten får inte läsa den (RLS: bara admin
 * och deltagaren själv).
 *
 * Inga klientfilter på consultant_id — RLS avgör vad som syns (KS2 b), så
 * företrädarens rader kommer med när relationen är aktiv.
 *
 * Varje källa hämtas för sig (Promise.allSettled): faller en, visas de andra
 * och den fallna nämns — samma mönster som consultantInsights (KV2).
 */

import { supabase } from '@/lib/supabase'
import { consultantService } from '@/services/consultantService'
import { aktivitetsplanApi, type ActivitySession } from '@/services/aktivitetApi'

export type TidslinjeTyp = 'journal' | 'mal' | 'mal_klart' | 'mote' | 'plats' | 'pass'

/** Vilken sektion på detaljsidan händelsen hör hemma i. */
export type TidslinjeSektion = 'journal' | 'goals' | 'aktivitet' | 'overview'

export interface TidslinjeHandelse {
  id: string
  typ: TidslinjeTyp
  /** ISO-tidpunkt som sorteringen bygger på. */
  tidpunkt: string
  titel: string
  detalj?: string
  sektion: TidslinjeSektion
}

export interface TidslinjeResultat {
  handelser: TidslinjeHandelse[]
  /** Källor som inte gick att läsa — visas som en rad, inte som ett tomt fält. */
  misslyckadeKallor: string[]
}

const JOURNALKATEGORI: Record<string, string> = {
  GENERAL: 'Anteckning',
  PROGRESS: 'Framsteg',
  CONCERN: 'Oro',
  GOAL: 'Mål',
}

const MOTESTYP: Record<string, string> = {
  video: 'Videomöte',
  phone: 'Telefonmöte',
  physical: 'Möte på plats',
}

const NARVARO: Record<string, string> = {
  present: 'Närvarande',
  absent_valid: 'Giltig frånvaro',
  absent_invalid: 'Ogiltig frånvaro',
  sick: 'Sjuk',
}

function kortText(s: string, max = 90): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

async function journalHandelser(participantId: string): Promise<TidslinjeHandelse[]> {
  const rader = await consultantService.getJournalEntries(participantId)
  return rader.map((r) => ({
    id: `journal-${r.id}`,
    typ: 'journal',
    tidpunkt: r.created_at,
    titel: JOURNALKATEGORI[r.category] ?? 'Anteckning',
    detalj: kortText(r.content),
    sektion: 'journal',
  }))
}

async function malHandelser(participantId: string): Promise<TidslinjeHandelse[]> {
  const mal = await consultantService.getGoalsForParticipant(participantId)
  const ut: TidslinjeHandelse[] = []
  for (const m of mal) {
    ut.push({ id: `mal-${m.id}`, typ: 'mal', tidpunkt: m.created_at, titel: 'Mål satt', detalj: kortText(m.title), sektion: 'goals' })
    if (m.status === 'COMPLETED' && m.completed_at) {
      ut.push({ id: `mal-klart-${m.id}`, typ: 'mal_klart', tidpunkt: m.completed_at, titel: 'Mål uppnått', detalj: kortText(m.title), sektion: 'goals' })
    }
  }
  return ut
}

async function motesHandelser(participantId: string): Promise<TidslinjeHandelse[]> {
  const { data, error } = await supabase
    .from('consultant_meetings')
    .select('id, scheduled_at, meeting_type, status, notes')
    .eq('participant_id', participantId)
  if (error) throw error
  return (data ?? []).map((m) => ({
    id: `mote-${m.id}`,
    typ: 'mote' as const,
    tidpunkt: m.scheduled_at,
    titel: `${MOTESTYP[m.meeting_type as string] ?? 'Möte'}${m.status === 'cancelled' ? ' (inställt)' : ''}`,
    detalj: m.notes ? kortText(m.notes) : undefined,
    sektion: 'overview' as const,
  }))
}

async function platsHandelser(participantId: string): Promise<TidslinjeHandelse[]> {
  const { data, error } = await supabase
    .from('consultant_work_placements')
    .select('id, created_at, company_name, occupation, placement_type')
    .eq('participant_id', participantId)
  if (error) throw error
  return (data ?? []).map((p) => ({
    id: `plats-${p.id}`,
    typ: 'plats' as const,
    tidpunkt: p.created_at,
    titel: 'Plats registrerad',
    detalj: kortText([p.company_name, p.occupation].filter(Boolean).join(' — ')),
    sektion: 'overview' as const,
  }))
}

function passTillHandelse(s: ActivitySession): TidslinjeHandelse | null {
  // Bara pass som fått ett utfall är historia; kommande pass hör hemma i planen.
  const utfall = s.attendance ? NARVARO[s.attendance as string] ?? s.attendance : s.self_checkin_at ? 'Incheckad' : null
  if (!utfall) return null
  return {
    id: `pass-${s.id}`,
    typ: 'pass',
    tidpunkt: `${s.date}T${s.start_time ?? '00:00'}`,
    titel: `Pass: ${s.title}`,
    detalj: utfall,
    sektion: 'aktivitet',
  }
}

async function passHandelser(participantId: string): Promise<TidslinjeHandelse[]> {
  const planer = await aktivitetsplanApi.listForParticipant(participantId)
  const alla = await Promise.all(planer.map((p) => aktivitetsplanApi.listAllSessions(p.id)))
  return alla.flat().map(passTillHandelse).filter((h): h is TidslinjeHandelse => h !== null)
}

const KALLOR: Array<[string, (id: string) => Promise<TidslinjeHandelse[]>]> = [
  ['journalen', journalHandelser],
  ['målen', malHandelser],
  ['mötena', motesHandelser],
  ['platserna', platsHandelser],
  ['passen', passHandelser],
]

export async function hamtaTidslinje(participantId: string): Promise<TidslinjeResultat> {
  const utfall = await Promise.allSettled(KALLOR.map(([, fn]) => fn(participantId)))
  const handelser: TidslinjeHandelse[] = []
  const misslyckadeKallor: string[] = []
  utfall.forEach((u, i) => {
    if (u.status === 'fulfilled') handelser.push(...u.value)
    else {
      misslyckadeKallor.push(KALLOR[i][0])
      console.warn(`[tidslinje] ${KALLOR[i][0]} kunde inte läsas`, u.reason instanceof Error ? u.reason.message : u.reason)
    }
  })
  handelser.sort((a, b) => (a.tidpunkt < b.tidpunkt ? 1 : a.tidpunkt > b.tidpunkt ? -1 : 0))
  return { handelser, misslyckadeKallor }
}

export const tidslinjeApi = { hamtaTidslinje }
