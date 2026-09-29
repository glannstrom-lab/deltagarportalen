/**
 * aktivitetApi — schemamallar, individuell plan, pass och närvaro enligt
 * aktivitetskravet (KM3/KM4/KM6). Tabellerna skapades av
 * `supabase/migrations/20260911120000_km_aktivitetskrav.sql` (körd 2026-09-11).
 *
 * Mönster (samma som placeringarApi.ts): varje metod hämtar `auth.getUser()`
 * själv och KASTAR om ingen är inloggad eller om databasen svarar med fel.
 * Ingen metod sväljer ett fel till `[]` eller `null` — anroparen äger
 * tre-lägen-logiken laddar / fel / klart.
 *
 * RLS är golvet: konsulenten når bara deltagare med aktiv rad i
 * consultant_participants, deltagaren läser sina egna rader och får bara
 * ändra `self_checkin_at` (trigger). Vi filtrerar ändå explicit i frågorna.
 *
 * Ingen AI någonstans i den här kedjan. Schema → närvaro → underlag ska vara
 * deterministiskt och spårbart (AI-förordningen bilaga III p. 5 a).
 */

import { supabase } from '@/lib/supabase'
import {
  generateSessions,
  veckovisaDatum,
  type ActivityType,
  type PassTyp,
  type Attendance,
  type TemplateItem,
} from './aktivitetSchema'
import { notisOgiltigFranvaro, notisPassAndrat, notisPlanSkapad } from './aktivitetNotiser'
import { arendeKolumn, passKolumner, underrattadKolumner, type PassExtra } from './planMarkning'

import { anvandareFranSession } from '@/lib/anvandareFranSession'
// ============================================================================
// TYPER
// ============================================================================

export interface ActivityTemplateItem extends TemplateItem {
  id: string
  template_id: string
  sort_order: number
}

export interface ActivityTemplate {
  id: string
  owner_id: string
  org_id: string | null
  name: string
  description: string | null
  is_public: boolean
  is_starred: boolean
  usage_count: number
  created_at: string
  updated_at: string
  items: ActivityTemplateItem[]
}

export type PlanStatus = 'active' | 'paused' | 'ended'

export interface ActivityPlan {
  id: string
  participant_id: string
  consultant_id: string
  org_id: string | null
  template_id: string | null
  template_name: string | null
  start_date: string
  end_date: string | null
  weekly_hours_target: number
  jobsearch_hours_per_week: number
  target_reason: string | null
  status: PlanStatus
  plan_text: string | null
  decided_at: string | null
  /** KM7: kategori enligt Socialstyrelsens register över ekonomiskt bistånd. */
  forsorjningshinder: Forsorjningshinder | null
  /** KM7: datum då avvikelseunderlag lämnats till biståndshandläggaren. */
  nedsattning_underlag_lamnat_at: string | null
  /** KM7: datum då anvisningen registrerats i AF:s Mina sidor för kommuner (manuellt). */
  af_registered_at: string | null
  /** RK40 — PENDING_20260927d_plan_och_pass: ärende-/dossiernummer, aldrig personnummer. */
  case_reference?: string | null
  created_at: string
  updated_at: string
}

export type Forsorjningshinder =
  | 'arbetslos'
  | 'sjukskriven_med_intyg'
  | 'sjuk_eller_aktivitetsersattning'
  | 'arbetshinder_sociala_skal'
  | 'foraldraledig'
  | 'arbetar_deltid'
  | 'sprakhinder'
  | 'utan_forsorjningshinder'
  | 'annat'

export const FORSORJNINGSHINDER: readonly Forsorjningshinder[] = [
  'arbetslos', 'sjukskriven_med_intyg', 'sjuk_eller_aktivitetsersattning', 'arbetshinder_sociala_skal',
  'foraldraledig', 'arbetar_deltid', 'sprakhinder', 'utan_forsorjningshinder', 'annat',
] as const

export const FORSORJNINGSHINDER_ETIKETT: Record<Forsorjningshinder, string> = {
  arbetslos: 'Arbetslös',
  sjukskriven_med_intyg: 'Sjukskriven med läkarintyg',
  sjuk_eller_aktivitetsersattning: 'Sjuk- eller aktivitetsersättning',
  arbetshinder_sociala_skal: 'Arbetshinder, sociala skäl',
  foraldraledig: 'Föräldraledig',
  arbetar_deltid: 'Arbetar deltid',
  sprakhinder: 'Språkhinder',
  utan_forsorjningshinder: 'Utan försörjningshinder',
  annat: 'Annat',
}

export interface ActivitySession {
  id: string
  plan_id: string
  participant_id: string
  date: string
  start_time: string
  end_time: string
  title: string
  activity_type: ActivityType
  location: string | null
  notes: string | null
  attendance: Attendance | null
  attendance_note: string | null
  sick_certificate_received: boolean
  marked_by: string | null
  marked_at: string | null
  self_checkin_at: string | null
  created_at: string
  updated_at: string
  // RR27/RK37/RR28 — PENDING_20260927d_plan_och_pass. Finns bara efter
  // migrationen; läses via select('*'), så de är undefined tills dess.
  // Se services/planMarkning.ts.
  is_provider_led?: boolean | null
  is_physical?: boolean | null
  work_placement_id?: string | null
  af_notified_at?: string | null
  af_notified_by?: string | null
}

export interface TemplateInput {
  name: string
  description?: string | null
  is_public?: boolean
  items: TemplateItem[]
}

export interface CreatePlanInput {
  participantId: string
  templateId: string
  startDate: string
  /** Inklusive. Utan slutdatum genereras 12 veckor framåt. */
  endDate?: string | null
  weeklyHoursTarget: number
  jobsearchHoursPerWeek?: number
  targetReason?: string | null
  planText?: string | null
  decidedAt?: string | null
  forsorjningshinder?: Forsorjningshinder | null
}

export interface AttendanceInput {
  attendance: Attendance | null
  note?: string | null
  sickCertificateReceived?: boolean
}

export interface SessionInput {
  date: string
  start_time: string
  end_time: string
  title: string
  /** PassTyp: de utökade typerna (RK28) går bara att välja när brytaren är på. */
  activity_type: PassTyp
  location?: string | null
  notes?: string | null
}

/** RK37: det som går att ändra på ett pass eller en serie pass på en gång. */
export interface PassAndring {
  start_time?: string
  end_time?: string
  title?: string
  activity_type?: PassTyp
  location?: string | null
}

// ============================================================================
// HJÄLP
// ============================================================================

async function requireUser() {
  const { data: { user }, error } = await anvandareFranSession()
  if (error) throw error
  if (!user) throw new Error('Inte inloggad')
  return user
}

/** Postgres `time` kommer som `HH:MM:SS`; UI:t använder `HH:MM`. */
function kortTid(t: string): string {
  return t.length > 5 ? t.slice(0, 5) : t
}

function mapItem(row: Record<string, unknown>): ActivityTemplateItem {
  return {
    id: row.id as string,
    template_id: row.template_id as string,
    weekday: row.weekday as number,
    start_time: kortTid(row.start_time as string),
    end_time: kortTid(row.end_time as string),
    title: row.title as string,
    activity_type: row.activity_type as ActivityType,
    location: (row.location as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    sort_order: (row.sort_order as number) ?? 0,
  }
}

/** Exporterad för franvaroApi (RD13): varje väg som lägger ett pass i Min veckas cache ska ge HH:MM. */
export function mapSession(row: Record<string, unknown>): ActivitySession {
  return {
    ...(row as unknown as ActivitySession),
    start_time: kortTid(row.start_time as string),
    end_time: kortTid(row.end_time as string),
  }
}

function sortItems(items: ActivityTemplateItem[]): ActivityTemplateItem[] {
  return [...items].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time) || a.sort_order - b.sort_order)
}

const TOLV_VECKOR_DAGAR = 12 * 7 - 1

/**
 * KM10: notisen till deltagaren är en bonus ovanpå det som redan sparats.
 * Det här är det ENDA stället i filen där ett fel får sväljas — och det
 * loggas, så det syns. Huvudoperationen (planen, passet, närvaron) har redan
 * lyckats när vi kommer hit. Inget mejl (DE1).
 */
async function notisBonus(namn: string, skicka: () => Promise<void>): Promise<void> {
  try {
    await skicka()
  } catch (err) {
    console.warn(`[aktivitetApi] notisen "${namn}" kunde inte skapas — huvudoperationen är sparad`, err)
  }
}

// ============================================================================
// SCHEMAMALLAR (KM3)
// ============================================================================

export const schemamallApi = {
  /** Egna, publika och organisationens mallar, med rader. Mest använda först. */
  async list(): Promise<ActivityTemplate[]> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_templates')
      .select('*, activity_template_items(*)')
      .order('is_starred', { ascending: false })
      .order('usage_count', { ascending: false })
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []).map((t) => {
      const { activity_template_items, ...rest } = t as Record<string, unknown> & { activity_template_items: Record<string, unknown>[] }
      return {
        ...(rest as unknown as Omit<ActivityTemplate, 'items'>),
        items: sortItems((activity_template_items ?? []).map(mapItem)),
      }
    })
  },

  async create(input: TemplateInput): Promise<ActivityTemplate> {
    const user = await requireUser()
    const { data: tpl, error } = await supabase
      .from('activity_templates')
      .insert({
        owner_id: user.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        is_public: input.is_public ?? false,
      })
      .select('*')
      .single()
    if (error) throw error
    const items = await schemamallApi.replaceItems(tpl.id, input.items)
    return { ...(tpl as unknown as Omit<ActivityTemplate, 'items'>), items }
  },

  async update(id: string, input: TemplateInput): Promise<ActivityTemplate> {
    const user = await requireUser()
    const { data: tpl, error } = await supabase
      .from('activity_templates')
      .update({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        is_public: input.is_public ?? false,
      })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select('*')
      .single()
    if (error) throw error
    const items = await schemamallApi.replaceItems(id, input.items)
    return { ...(tpl as unknown as Omit<ActivityTemplate, 'items'>), items }
  },

  /** Byter ut alla rader. Radera-och-skriv är enklare än diff och raderna har inga beroenden. */
  async replaceItems(templateId: string, items: TemplateItem[]): Promise<ActivityTemplateItem[]> {
    const { error: delError } = await supabase
      .from('activity_template_items')
      .delete()
      .eq('template_id', templateId)
    if (delError) throw delError
    if (items.length === 0) return []
    const { data, error } = await supabase
      .from('activity_template_items')
      .insert(items.map((it, i) => ({
        template_id: templateId,
        weekday: it.weekday,
        start_time: it.start_time,
        end_time: it.end_time,
        title: it.title.trim(),
        activity_type: it.activity_type,
        location: it.location?.trim() || null,
        notes: it.notes?.trim() || null,
        sort_order: i,
      })))
      .select('*')
    if (error) throw error
    return sortItems((data ?? []).map((r) => mapItem(r as Record<string, unknown>)))
  },

  async remove(id: string): Promise<void> {
    const user = await requireUser()
    const { error } = await supabase
      .from('activity_templates')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)
    if (error) throw error
  },

  async setStarred(id: string, isStarred: boolean): Promise<void> {
    const user = await requireUser()
    const { error } = await supabase
      .from('activity_templates')
      .update({ is_starred: isStarred })
      .eq('id', id)
      .eq('owner_id', user.id)
    if (error) throw error
  },
}

// ============================================================================
// PLAN + PASS — konsulentens sida (KM3/KM4)
// ============================================================================

export const aktivitetsplanApi = {
  /** Deltagarens aktiva (eller pausade) plan hos den inloggade konsulenten, annars null. */
  async getForParticipant(participantId: string): Promise<ActivityPlan | null> {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('activity_plans')
      .select('*')
      .eq('participant_id', participantId)
      .eq('consultant_id', user.id)
      .neq('status', 'ended')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return (data as ActivityPlan | null) ?? null
  },

  async listForParticipant(participantId: string): Promise<ActivityPlan[]> {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('activity_plans')
      .select('*')
      .eq('participant_id', participantId)
      .eq('consultant_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as ActivityPlan[]
  },

  /**
   * Skapar planen och genererar passen ur mallen. Passen genereras i
   * klienten (generateSessions) och skrivs i en bulk-insert; misslyckas
   * insertet raderas planen igen så inget halvfärdigt ligger kvar.
   */
  async createFromTemplate(input: CreatePlanInput): Promise<{ plan: ActivityPlan; sessions: ActivitySession[] }> {
    const user = await requireUser()
    const templates = await schemamallApi.list()
    const template = templates.find((t) => t.id === input.templateId)
    if (!template) throw new Error('Mallen finns inte eller går inte att läsa')

    const endDate = input.endDate ?? addDaysStr(input.startDate, TOLV_VECKOR_DAGAR)

    const { data: plan, error } = await supabase
      .from('activity_plans')
      .insert({
        participant_id: input.participantId,
        consultant_id: user.id,
        org_id: template.org_id,
        template_id: template.id,
        template_name: template.name,
        start_date: input.startDate,
        end_date: endDate,
        weekly_hours_target: input.weeklyHoursTarget,
        jobsearch_hours_per_week: input.jobsearchHoursPerWeek ?? 0,
        target_reason: input.targetReason?.trim() || null,
        plan_text: input.planText?.trim() || null,
        decided_at: input.decidedAt ?? null,
        forsorjningshinder: input.forsorjningshinder ?? null,
        status: 'active',
      })
      .select('*')
      .single()
    if (error) throw error

    const generated = generateSessions(template.items, input.startDate, endDate)
    let sessions: ActivitySession[] = []
    if (generated.length > 0) {
      const { data: rows, error: sessError } = await supabase
        .from('activity_sessions')
        .insert(generated.map((g) => ({ ...g, plan_id: plan.id, participant_id: input.participantId })))
        .select('*')
      if (sessError) {
        await supabase.from('activity_plans').delete().eq('id', plan.id)
        throw sessError
      }
      sessions = (rows ?? []).map((r) => mapSession(r as Record<string, unknown>))
    }

    // Räknaren är statistik, inte sanning om deltagaren — och bara ägaren får
    // skriva mallen. Fel här får inte fälla planen som redan är skapad.
    if (template.owner_id === user.id) {
      const { error: countError } = await supabase
        .from('activity_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', template.id)
      if (countError) console.warn('usage_count kunde inte räknas upp', countError)
    }

    await notisBonus('plan skapad', () => notisPlanSkapad(plan as ActivityPlan))
    return { plan: plan as ActivityPlan, sessions }
  },

  /** Alla planer hos den inloggade konsulenten (KM7-underlag). Chef/admin ser även organisationens via RLS. */
  async listAll(): Promise<ActivityPlan[]> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_plans')
      .select('*')
      .order('start_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as ActivityPlan[]
  },

  /** Alla pass mellan två datum som RLS låter mig läsa (egna deltagare, eller organisationens som chef). */
  async listSessionsBetween(from: string, to: string): Promise<ActivitySession[]> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_sessions')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => mapSession(r as Record<string, unknown>))
  },

  async update(planId: string, patch: Partial<Pick<ActivityPlan, 'weekly_hours_target' | 'jobsearch_hours_per_week' | 'target_reason' | 'plan_text' | 'decided_at' | 'status' | 'end_date' | 'forsorjningshinder' | 'nedsattning_underlag_lamnat_at' | 'af_registered_at'>>): Promise<ActivityPlan> {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('activity_plans')
      .update(patch)
      .eq('id', planId)
      .eq('consultant_id', user.id)
      .select('*')
      .single()
    if (error) throw error
    return data as ActivityPlan
  },

  /**
   * RK40: ärende-/dossiernummer på planen. Valideras i klienten
   * (`valideraArendenummer`, nekar personnummer) och i databasen (CHECK).
   * Före migrationen PENDING_20260927d finns kolumnen inte — då kastar anropet
   * i stället för att tyst skriva ingenting.
   */
  async sattArendenummer(planId: string, varde: string | null): Promise<ActivityPlan> {
    const user = await requireUser()
    const kolumn = arendeKolumn(varde)
    if (Object.keys(kolumn).length === 0) throw new Error('Ärendenummer kan inte sparas ännu.')
    const { data, error } = await supabase
      .from('activity_plans')
      .update({ ...kolumn })
      .eq('id', planId)
      .eq('consultant_id', user.id)
      .select('*')
      .single()
    if (error) throw error
    return data as ActivityPlan
  },

  async end(planId: string): Promise<ActivityPlan> {
    return aktivitetsplanApi.update(planId, { status: 'ended' })
  },

  /** Alla pass i planen mellan två datum (inklusive). */
  async listSessions(planId: string, from: string, to: string): Promise<ActivitySession[]> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('plan_id', planId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => mapSession(r as Record<string, unknown>))
  },

  /** Alla pass i planen, oavsett datum (för saldo över hela perioden). */
  async listAllSessions(planId: string): Promise<ActivitySession[]> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('plan_id', planId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => mapSession(r as Record<string, unknown>))
  },

  /** Närvaro sätts bara av konsulenten. `attendance: null` nollställer. */
  async markAttendance(sessionId: string, input: AttendanceInput): Promise<ActivitySession> {
    const user = await requireUser()
    // SKK2 (skarpt test 2026-09-28): samma utfall en gång till (t.ex. för att ändra
    // anteckningen) skickade en ny notis om ogiltig frånvaro varje gång. Notisen går
    // bara när markeringen BLIR ogiltig frånvaro.
    const { data: fore } = await supabase.from('activity_sessions').select('attendance').eq('id', sessionId).maybeSingle()
    const { data, error } = await supabase
      .from('activity_sessions')
      .update({
        attendance: input.attendance,
        attendance_note: input.note?.trim() || null,
        sick_certificate_received: input.sickCertificateReceived ?? false,
        marked_by: input.attendance ? user.id : null,
        marked_at: input.attendance ? new Date().toISOString() : null,
      })
      .eq('id', sessionId)
      .select('*')
      .single()
    if (error) throw error
    const markerad = mapSession(data as Record<string, unknown>)
    if (input.attendance === 'absent_invalid' && fore?.attendance !== 'absent_invalid') {
      await notisBonus('ogiltig frånvaro', () => notisOgiltigFranvaro(markerad))
    }
    return markerad
  },

  /**
   * RK4 (2026-09-27): sparar BARA passanteckningen — markeringen, intyget och
   * vem som markerade när lämnas orörda. Tidigare följde anteckningen bara med
   * `markAttendance`, så text som skrevs efter markeringen försvann tyst vid
   * omladdning. Kastar vid fel; anroparen behåller texten och visar felet.
   */
  async saveAttendanceNote(sessionId: string, note: string): Promise<ActivitySession> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_sessions')
      .update({ attendance_note: note.trim() || null })
      .eq('id', sessionId)
      .select('*')
      .single()
    if (error) throw error
    return mapSession(data as Record<string, unknown>)
  },

  /** `extra` = RR27-flaggorna och Platser-kopplingen; skrivs bara efter migrationen. */
  async addSession(planId: string, participantId: string, input: SessionInput, extra: PassExtra = {}): Promise<ActivitySession> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_sessions')
      .insert({
        plan_id: planId,
        participant_id: participantId,
        date: input.date,
        start_time: input.start_time,
        end_time: input.end_time,
        title: input.title.trim(),
        activity_type: input.activity_type,
        location: input.location?.trim() || null,
        notes: input.notes?.trim() || null,
        ...passKolumner(extra),
      })
      .select('*')
      .single()
    if (error) throw error
    const skapat = mapSession(data as Record<string, unknown>)
    await notisBonus('pass tillagt', () => notisPassAndrat(skapat, { typ: 'tillagt' }))
    return skapat
  },

  /**
   * RK28: samma pass varje vecka från `input.date` till och med `slutdatum`
   * (planens slut). Ett insert för alla — antingen kommer alla in eller inget.
   * Deltagaren får EN notis om första passet, inte en per vecka.
   */
  async addWeeklySessions(planId: string, participantId: string, input: SessionInput, slutdatum: string, extra: PassExtra = {}): Promise<ActivitySession[]> {
    return aktivitetsplanApi.addSessionsOnDates(planId, participantId, input, veckovisaDatum(input.date, slutdatum), extra)
  },

  /**
   * RK37: samma pass på en lista datum — t.ex. praktikens dagar ur Platser.
   * Ett insert för alla; deltagaren får EN notis om första passet.
   */
  async addSessionsOnDates(planId: string, participantId: string, input: SessionInput, datum: readonly string[], extra: PassExtra = {}): Promise<ActivitySession[]> {
    await requireUser()
    if (datum.length === 0) return []
    const { data, error } = await supabase
      .from('activity_sessions')
      .insert(datum.map((d) => ({
        plan_id: planId,
        participant_id: participantId,
        date: d,
        start_time: input.start_time,
        end_time: input.end_time,
        title: input.title.trim(),
        activity_type: input.activity_type,
        location: input.location?.trim() || null,
        notes: input.notes?.trim() || null,
        ...passKolumner(extra),
      })))
      .select('*')
    if (error) throw error
    const skapade = (data ?? []).map((r) => mapSession(r as Record<string, unknown>)).sort((a, b) => a.date.localeCompare(b.date))
    if (skapade[0]) await notisBonus('pass tillagt', () => notisPassAndrat(skapade[0], { typ: 'tillagt' }))
    return skapade
  },

  /**
   * RK31: deltagarens pass en viss dag — för att varna när ett möte krockar.
   * Bara tider och rubrik; RLS avgör vilka pass konsulenten ser.
   */
  async passForDeltagareDag(participantId: string, datum: string): Promise<Array<Pick<ActivitySession, 'date' | 'start_time' | 'end_time' | 'title'>>> {
    const { data, error } = await supabase
      .from('activity_sessions')
      .select('date, start_time, end_time, title')
      .eq('participant_id', participantId)
      .eq('date', datum)
    if (error) throw error
    return (data ?? []).map((r) => ({
      date: String(r.date),
      start_time: String(r.start_time).slice(0, 5),
      end_time: String(r.end_time).slice(0, 5),
      title: String(r.title ?? ''),
    }))
  },

  async updateSession(sessionId: string, input: Partial<SessionInput>): Promise<ActivitySession> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_sessions')
      .update(input)
      .eq('id', sessionId)
      .select('*')
      .single()
    if (error) throw error
    const andrat = mapSession(data as Record<string, unknown>)
    await notisBonus('pass ändrat', () => notisPassAndrat(andrat, { typ: 'andrat' }))
    return andrat
  },

  /**
   * RK37: ändra ett pass och alla kommande i samma serie på en gång. Samma
   * ändring skrivs på alla id:n i ett anrop — antingen alla eller inget.
   * Deltagaren får EN notis (om det första passet), inte en per vecka.
   */
  async updateSessions(sessionIds: readonly string[], andring: PassAndring, extra: PassExtra = {}): Promise<ActivitySession[]> {
    await requireUser()
    if (sessionIds.length === 0) return []
    const patch: Record<string, unknown> = { ...andring, ...passKolumner(extra) }
    if (typeof patch.title === 'string') patch.title = patch.title.trim()
    if (typeof patch.location === 'string') patch.location = patch.location.trim() || null
    const { data, error } = await supabase
      .from('activity_sessions')
      .update(patch)
      .in('id', [...sessionIds])
      .select('*')
    if (error) throw error
    const andrade = (data ?? []).map((r) => mapSession(r as Record<string, unknown>)).sort((a, b) => a.date.localeCompare(b.date))
    if (andrade.length < sessionIds.length) {
      throw new Error(`Bara ${andrade.length} av ${sessionIds.length} pass kunde ändras. Ladda om planen och försök igen.`)
    }
    if (andrade[0]) await notisBonus('pass ändrat', () => notisPassAndrat(andrade[0], { typ: 'andrat' }))
    return andrade
  },

  /**
   * SFT7: flytta pass till andra datum — ett pass, eller en serie där varje
   * pass får sitt eget nya datum. Passen som redan är markerade rörs aldrig
   * (villkoret ligger i frågan, inte bara i gränssnittet), och det kastas om
   * något pass inte gick att flytta så ingen halv serie lämnas i tystnad.
   * Konsulenten är planens ägare, så triggern (participant_guard) släpper igenom.
   */
  async flyttaSessions(flytt: ReadonlyArray<{ id: string; date: string }>, opts: { tystNotis?: boolean } = {}): Promise<ActivitySession[]> {
    await requireUser()
    if (flytt.length === 0) return []
    const flyttade: ActivitySession[] = []
    for (const f of flytt) {
      const { data, error } = await supabase
        .from('activity_sessions')
        .update({ date: f.date })
        .eq('id', f.id)
        .is('attendance', null)
        .select('*')
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error(`Bara ${flyttade.length} av ${flytt.length} pass kunde flyttas — ett är redan markerat eller borttaget. Ladda om planen och försök igen.`)
      }
      flyttade.push(mapSession(data[0] as Record<string, unknown>))
    }
    flyttade.sort((a, b) => a.date.localeCompare(b.date))
    if (flyttade[0] && !opts.tystNotis) await notisBonus('pass flyttat', () => notisPassAndrat(flyttade[0], { typ: 'andrat' }))
    return flyttade
  },

  /**
   * RR28: AF underrättad om en avvikelse — en tidsstämpel på passet, satt av
   * konsulenten. Portalen skickar ingenting till Arbetsförmedlingen; det här
   * är bara anteckningen om att det gjorts. `nar = null` nollställer.
   */
  async sattAfUnderrattad(sessionId: string, nar: string | null): Promise<ActivitySession> {
    const user = await requireUser()
    const kolumner = underrattadKolumner(nar, user.id)
    if (Object.keys(kolumner).length === 0) throw new Error('Underrättelsen kan inte sparas ännu.')
    const { data, error } = await supabase
      .from('activity_sessions')
      .update({ ...kolumner })
      .eq('id', sessionId)
      .select('*')
      .single()
    if (error) throw error
    return mapSession(data as Record<string, unknown>)
  },

  async removeSession(sessionId: string): Promise<void> {
    await requireUser()
    // Raden hämtas före raderingen så notisen kan säga vilket pass som försvann.
    const { data: rad, error } = await supabase
      .from('activity_sessions')
      .delete()
      .eq('id', sessionId)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (rad) await notisBonus('pass borttaget', () => notisPassAndrat(mapSession(rad as Record<string, unknown>), { typ: 'borttaget' }))
  },
}

// ============================================================================
// DELTAGARENS SIDA — "Min vecka"
// ============================================================================

export const minVeckaApi = {
  /** Deltagarens aktiva plan, annars null. */
  async getMyPlan(): Promise<ActivityPlan | null> {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('activity_plans')
      .select('*')
      .eq('participant_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return (data as ActivityPlan | null) ?? null
  },

  async listMySessions(from: string, to: string): Promise<ActivitySession[]> {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('participant_id', user.id)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => mapSession(r as Record<string, unknown>))
  },

  /** Deltagarens egen incheckning. Triggern släpper bara igenom just den här kolumnen. */
  async checkin(sessionId: string): Promise<ActivitySession> {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('activity_sessions')
      .update({ self_checkin_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('participant_id', user.id)
      .select('*')
      .single()
    if (error) throw error
    return mapSession(data as Record<string, unknown>)
  },
}

// ---------------------------------------------------------------------------
// F10 (2026-09-13): spårbart underlag till handläggaren. En rad per lämnat
// underlag i activity_plan_handovers (migration 20260913020000 — körs efter
// Mikaels ja; tills dess ger anropen ett tydligt fel). Ångra = withdrawn_at
// samma dag, aldrig radering. Planens gamla kolumn synkas av en trigger.
// ---------------------------------------------------------------------------
export interface NarvaroSammanfattning {
  pass: number
  present: number
  absent_valid: number
  absent_invalid: number
  /**
   * Sjuk MED inkommet läkarintyg (`sick_certificate_received`). RK3
   * (2026-09-27): räknade tidigare alla pass markerade Sjuk, med eller utan
   * intyg, och sammanfattningen till handläggaren sa "sjuk med intyg" om båda.
   * Underlag lämnade före rättelsen bär den gamla, blandade räkningen och
   * saknar `sjuk_utan_intyg`.
   */
  sick_certified: number
  /** Sjuk UTAN inkommet intyg — skilt från `sick_certified` sedan RK3. */
  sjuk_utan_intyg: number
  external: number
  omarkerade: number
  anmald_franvaro: number
}

export interface PlanHandover {
  id: string
  plan_id: string
  participant_id: string
  consultant_id: string | null
  org_id: string | null
  handed_over_at: string
  handed_over_by: string | null
  recipient: string
  period_from: string
  period_to: string
  summary: Partial<NarvaroSammanfattning>
  note: string | null
  withdrawn_at: string | null
  withdrawn_reason: string | null
  created_at: string
  updated_at: string
  /** KH11 (2026-09-28): mottagande handläggare som konto. NULL = extern mottagare, bara fritext. */
  recipient_user_id?: string | null
  /** KH11: när handläggaren kvitterade underlaget i portalen. */
  received_at?: string | null
}

/** KH11: ett underlag som lämnats till mig som handläggare (rpc mina_mottagna_underlag). */
export interface MottagetUnderlag {
  id: string
  handed_over_at: string
  period_from: string
  period_to: string
  summary: Partial<NarvaroSammanfattning>
  note: string | null
  withdrawn_at: string | null
  withdrawn_reason: string | null
  received_at: string | null
  participant_first_name: string | null
  participant_last_name: string | null
  consultant_first_name: string | null
  consultant_last_name: string | null
  consultant_email: string | null
  forsorjningshinder: string | null
  ogiltig_franvaro: number
  ogiltig_franvaro_forklarad: number
}

export interface LamnaUnderlagInput {
  plan: Pick<ActivityPlan, 'id' | 'participant_id' | 'org_id'>
  recipient: string
  /** KH11: handläggare i organisationen. Databasen fäller allt annat. */
  recipient_user_id?: string | null
  period_from: string
  period_to: string
  summary: NarvaroSammanfattning
  note?: string | null
}

/** Räknar närvaron i perioden ur passen — det som faktiskt lämnas till handläggaren. */
export function sammanfattaNarvaro(
  sessions: readonly (Pick<ActivitySession, 'date' | 'attendance'> & { absence_reported_at?: string | null; sick_certificate_received?: boolean | null })[],
  from: string,
  to: string,
): NarvaroSammanfattning {
  const s: NarvaroSammanfattning = { pass: 0, present: 0, absent_valid: 0, absent_invalid: 0, sick_certified: 0, sjuk_utan_intyg: 0, external: 0, omarkerade: 0, anmald_franvaro: 0 }
  for (const pass of sessions) {
    if (pass.date < from || pass.date > to) continue
    s.pass += 1
    if (pass.absence_reported_at) s.anmald_franvaro += 1
    switch (pass.attendance) {
      case 'present': s.present += 1; break
      case 'absent_valid': s.absent_valid += 1; break
      case 'absent_invalid': s.absent_invalid += 1; break
      case 'sick_certified':
        if (pass.sick_certificate_received === true) s.sick_certified += 1
        else s.sjuk_utan_intyg += 1
        break
      case 'external': s.external += 1; break
      default: s.omarkerade += 1
    }
  }
  return s
}

/** Kan underlaget fortfarande ångras? Samma dag (svensk tid) som det lämnades, och inte redan ångrat. */
export function kanAngraUnderlag(h: Pick<PlanHandover, 'handed_over_at' | 'withdrawn_at'>, nu: Date = new Date()): boolean {
  if (h.withdrawn_at) return false
  const dag = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' })
  return dag(new Date(h.handed_over_at)) === dag(nu)
}

export const underlagApi = {
  /**
   * GG1 (2026-09-20): alla underlag som lämnats i en period, över alla planer
   * konsulenten ser (RLS avgränsar). Nämndrapporten och IVO-kvartalsunderlaget
   * måste räkna ur de här raderna, inte ur planens synkade kolumn: triggern
   * sätter kolumnen till `max(handed_over_at)` över ALL tid, så ett underlag
   * lämnat i Q2 raderar tyst Q1:s räkning i en rapport som redan är avlämnad.
   *
   * Ångrade rader tas inte bort här — `ivoKvartalsunderlag` filtrerar på
   * `withdrawn_at`, och den som vill visa historiken behöver dem.
   *
   * Hämtningen är avsiktligt ett dygn vidare åt båda håll: `handed_over_at` är
   * en timestamptz och gränserna är lokala datum, så en exakt jämförelse i SQL
   * skulle tappa rader kring kvartalsskiftet. Den exakta avgränsningen görs av
   * `ivoKvartalsunderlag`, som äger definitionen av vad som hör till kvartalet.
   */
  async listIPeriod(from: string, to: string): Promise<PlanHandover[]> {
    const dag = (datum: string, steg: number) => {
      const d = new Date(`${datum}T12:00:00Z`)
      d.setUTCDate(d.getUTCDate() + steg)
      return d.toISOString().slice(0, 10)
    }
    const { data, error } = await supabase
      .from('activity_plan_handovers')
      .select('*')
      .gte('handed_over_at', `${dag(from, -1)}T00:00:00Z`)
      .lte('handed_over_at', `${dag(to, 1)}T23:59:59.999Z`)
      .order('handed_over_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as PlanHandover[]
  },

  async list(planId: string): Promise<PlanHandover[]> {
    const { data, error } = await supabase
      .from('activity_plan_handovers')
      .select('*')
      .eq('plan_id', planId)
      .order('handed_over_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as PlanHandover[]
  },

  async lamna(input: LamnaUnderlagInput): Promise<PlanHandover> {
    const user = await requireUser()
    const recipient = input.recipient.trim()
    if (!recipient) throw new Error('Ange vem som tog emot underlaget')
    const { data, error } = await supabase
      .from('activity_plan_handovers')
      .insert({
        plan_id: input.plan.id,
        participant_id: input.plan.participant_id,
        consultant_id: user.id,
        org_id: input.plan.org_id,
        handed_over_by: user.id,
        recipient,
        recipient_user_id: input.recipient_user_id ?? null,
        period_from: input.period_from,
        period_to: input.period_to,
        summary: input.summary,
        note: input.note?.trim() || null,
      })
      .select('*')
      .single()
    if (error) throw error
    return data as PlanHandover
  },

  /** KH11: underlag lämnade till mig som handläggare. Tom lista för alla andra. */
  async mottagna(): Promise<MottagetUnderlag[]> {
    await requireUser()
    const { data, error } = await supabase.rpc('mina_mottagna_underlag')
    if (error) throw error
    return (data ?? []) as MottagetUnderlag[]
  },

  /** KH11: kvittera att underlaget tagits emot. Bara mottagaren kan. */
  async kvittera(id: string): Promise<string> {
    await requireUser()
    const { data, error } = await supabase.rpc('kvittera_underlag', { p_id: id })
    if (error) throw error
    return data as string
  },

  /** Ångra samma dag. Triggern i databasen vaktar dag, ägare och att inget annat ändras. */
  async angra(id: string, reason: string): Promise<PlanHandover> {
    await requireUser()
    const skal = reason.trim()
    if (!skal) throw new Error('Ange varför underlaget ångras')
    const { data, error } = await supabase
      .from('activity_plan_handovers')
      .update({ withdrawn_at: new Date().toISOString(), withdrawn_reason: skal })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as PlanHandover
  },
}

function addDaysStr(s: string, n: number): string {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}
