/**
 * aktivitetNotiser — notiser i appen till deltagaren när konsulenten rör
 * hens vecka (KM10). Skrivs till `notifications`; RLS-policyn
 * "Konsulent skapar aktivitetsnotis åt aktiv deltagare" (migration
 * 20260911220000) släpper bara igenom de tre typerna nedan, och bara till
 * en deltagare konsulenten har en aktiv koppling till.
 *
 * Titel och text skrivs in i raden på svenska vid skapandet — konsulenten
 * vet inte vilket språk deltagaren läser i, så texten hålls enkel (B1).
 * Ton: lugn vän. Ogiltig frånvaro är en uppgift, inte en dom.
 *
 * `action_url` skrivs UTAN `#` — notisklockan går genom `navigate()`, inte
 * genom adressfältet (samma regel som job-alerts.js).
 *
 * Varje funktion KASTAR vid fel. Anroparen i aktivitetApi loggar och låter
 * huvudoperationen lyckas: notisen är en bonus ovanpå det som redan sparats.
 * Inget mejl — DE1 blockerar all utgående e-post från jobin.se.
 */

import { supabase } from '@/lib/supabase'
import type { ActivityPlan, ActivitySession } from './aktivitetApi'

export type AktivitetsnotisTyp = 'aktivitet_plan' | 'aktivitet_pass' | 'aktivitet_franvaro'

export type PassAndring = 'tillagt' | 'borttaget' | 'andrat'

const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

/** `2026-09-07` → `7 september`. Ren strängtolkning, ingen Date (UTC-fällan). */
export function langtDatum(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MANADER[m - 1] ?? ''}`.trim()
}

function formatTimmar(h: number): string {
  return Number.isInteger(h) ? `${h}` : `${h}`.replace('.', ',')
}

async function skrivNotis(input: {
  user_id: string
  type: AktivitetsnotisTyp
  title: string
  message: string
  data: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    message: input.message,
    action_url: '/min-vecka',
    data: input.data,
  })
  if (error) throw error
}

/** Efter att en plan skapats ur en mall. */
export async function notisPlanSkapad(plan: ActivityPlan): Promise<void> {
  await skrivNotis({
    user_id: plan.participant_id,
    type: 'aktivitet_plan',
    title: 'Din vecka är planerad',
    message: `Din konsulent har lagt upp ett veckoschema som börjar ${langtDatum(plan.start_date)}, ${formatTimmar(Number(plan.weekly_hours_target))} timmar i veckan. Du ser passen under Min vecka.`,
    data: { plan_id: plan.id, date: plan.start_date },
  })
}

/** Efter att ett pass lagts till, tagits bort eller ändrats. */
export async function notisPassAndrat(session: ActivitySession, opts: { typ: PassAndring }): Promise<void> {
  const nar = `${langtDatum(session.date)} kl ${session.start_time}–${session.end_time}`
  const message =
    opts.typ === 'tillagt'
      ? `Ett nytt pass är inlagt: ${session.title}, ${nar}.`
      : opts.typ === 'borttaget'
        ? `Passet ${session.title} den ${langtDatum(session.date)} är borttaget.`
        : `Passet ${session.title} är ändrat och gäller nu ${nar}.`
  await skrivNotis({
    user_id: session.participant_id,
    type: 'aktivitet_pass',
    title: 'Ett pass ändrades',
    message,
    data: { session_id: session.id, plan_id: session.plan_id, date: session.date, andring: opts.typ },
  })
}

/** När konsulenten markerar ett pass som frånvaro utan giltigt skäl. */
export async function notisOgiltigFranvaro(session: ActivitySession): Promise<void> {
  await skrivNotis({
    user_id: session.participant_id,
    type: 'aktivitet_franvaro',
    title: 'Frånvaro på ett pass',
    message: `Ett pass den ${langtDatum(session.date)} är markerat som frånvaro utan giltigt skäl. Prata med din konsulent om du har ett skäl.`,
    data: { session_id: session.id, plan_id: session.plan_id, date: session.date },
  })
}
