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
  type ActivityType,
  type Attendance,
  type TemplateItem,
} from './aktivitetSchema'

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
  created_at: string
  updated_at: string
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
  activity_type: ActivityType
  location?: string | null
  notes?: string | null
}

// ============================================================================
// HJÄLP
// ============================================================================

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
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

function mapSession(row: Record<string, unknown>): ActivitySession {
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

    return { plan: plan as ActivityPlan, sessions }
  },

  async update(planId: string, patch: Partial<Pick<ActivityPlan, 'weekly_hours_target' | 'jobsearch_hours_per_week' | 'target_reason' | 'plan_text' | 'decided_at' | 'status' | 'end_date'>>): Promise<ActivityPlan> {
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
    return mapSession(data as Record<string, unknown>)
  },

  async addSession(planId: string, participantId: string, input: SessionInput): Promise<ActivitySession> {
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
      })
      .select('*')
      .single()
    if (error) throw error
    return mapSession(data as Record<string, unknown>)
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
    return mapSession(data as Record<string, unknown>)
  },

  async removeSession(sessionId: string): Promise<void> {
    await requireUser()
    const { error } = await supabase.from('activity_sessions').delete().eq('id', sessionId)
    if (error) throw error
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

function addDaysStr(s: string, n: number): string {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}
