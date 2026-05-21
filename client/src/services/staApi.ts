/**
 * STA-API: Steg till arbete-data
 *
 * CRUD-funktioner för:
 *   - sta_enrollments    (deltagarens tilldelning)
 *   - sta_activities     (genomförda dagar)
 *   - sta_assessments    (DOA/WRI/MOHOST/AWP/AWC)
 *   - sta_workplaces     (arbetsprövningsplatser)
 *   - sta_documents      (rapporter)
 *   - sta_quick_notes    (snabbanteckningar)
 *   - sta_pulse_checks   (daglig energi)
 *   - sta_weekly_checkins (fredagsavslutning)
 *
 * RLS-policies i migrationen styr åtkomst — denna fil förlitar sig på dem.
 */

import { supabase } from '../lib/supabase'
import { APIError, handleError } from './apiError'

// =============================================================================
// TYPER
// =============================================================================

export type StaPart = 1 | 2 | 3 | 4
export type ParticipantLinkStatus = 'linked' | 'invited' | 'unlinked'
export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type AssessmentInstrument = 'DOA' | 'WRI' | 'MOHOST' | 'AWP' | 'AWC'
export type AssessmentStatus = 'draft' | 'complete' | 'submitted_to_af'
export type DocumentType =
  | 'initial_planering'
  | 'delredovisning_1'
  | 'delredovisning_2'
  | 'delredovisning_3'
  | 'delredovisning_4'
  | 'anmalan_arbetsprovning'
  | 'information_arbetsprovning'
  | 'atgardsplan_utebliven_ap'
  | 'informativ_rapport_hjalpmedel'
export type DocumentStatus = 'draft' | 'consultant_review' | 'approved' | 'submitted'
export type NoteVisibility = 'consultant_only' | 'shared_in_report' | 'shared_with_participant'
export type ActivityType =
  | 'startsamtal'
  | 'dagsslinga'
  | 'arbetsstation'
  | 'arbetsprovning'
  | 'samtal'
  | 'halsoaktivitet'
  | 'karriarvagledning'
  | 'kompetenskartlaggning'
  | 'annat'
export type Attendance = 'present' | 'absent' | 'sick' | 'allowed_absence' | 'external'
export type Mood = 'great' | 'okay' | 'soso' | 'tough' | 'bad'

export interface StaEnrollment {
  id: string
  participant_id: string | null
  external_name: string | null
  external_email: string | null
  external_phone: string | null
  external_personal_id: string | null
  consultant_id: string
  current_part: StaPart
  started_at: string
  part_started_at: string
  focus_occupation: string | null
  adaptations: string | null
  language_support: string[]
  communication_support: string[]
  /** Aktivitetsomfattning i timmar/vecka (10-40). Styr schemavyn. */
  weekly_hours: number
  /** Tidpunkt då deltagaren slutfört intro-flödet. NULL = ej genomfört. */
  onboarding_completed_at: string | null
  link_status: ParticipantLinkStatus
  status: EnrollmentStatus
  created_at: string
  updated_at: string
}

export type AbsenceKind = 'sick' | 'vab' | 'allowed' | 'other'

export interface StaAbsence {
  id: string
  enrollment_id: string
  absence_date: string
  kind: AbsenceKind
  reason: string | null
  reported_by: string
  reported_at: string
  consultant_note: string | null
  created_at: string
}

export interface StaActivity {
  id: string
  enrollment_id: string
  part: StaPart
  activity_type: ActivityType
  activity_key: string | null
  scheduled_for: string | null
  completed_at: string | null
  duration_minutes: number | null
  participant_reflection: string | null
  consultant_note: string | null
  attendance: Attendance | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface StaAssessment {
  id: string
  enrollment_id: string
  part: StaPart
  instrument: AssessmentInstrument
  performed_by: string | null
  performed_at: string | null
  status: AssessmentStatus
  scores: Record<string, unknown>
  summary: string | null
  workplace_id: string | null
  activity_id: string | null
  created_at: string
  updated_at: string
}

export interface StaWorkplace {
  id: string
  enrollment_id: string
  company_name: string
  org_number: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  start_date: string | null
  end_date: string | null
  weeks_planned: number | null
  inriktning: 'aktiverande' | 'introducerande' | null
  af_submission_status: 'pending' | 'submitted' | 'approved' | 'rejected'
  af_submitted_at: string | null
  af_approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StaDocument {
  id: string
  enrollment_id: string
  doc_type: DocumentType
  part: StaPart | null
  content_json: Record<string, unknown>
  content_md: string | null
  ai_drafted: boolean
  ai_model: string | null
  status: DocumentStatus
  pdf_url: string | null
  submitted_at: string | null
  submitted_by: string | null
  created_at: string
  updated_at: string
}

export interface StaQuickNote {
  id: string
  enrollment_id: string
  author_id: string
  body: string | null
  tags: string[]
  voice_transcript: string | null
  visibility: NoteVisibility
  created_at: string
  updated_at: string
}

export interface StaPulseCheck {
  id: string
  enrollment_id: string
  check_date: string
  energy_level: number | null
  mood: Mood | null
  comment: string | null
  created_at: string
}

export interface StaWeeklyCheckin {
  id: string
  enrollment_id: string
  week_starts: string
  overall_mood: Mood | null
  best_thing: string | null
  hardest_thing: string | null
  question_for_consultant: string | null
  created_at: string
}

// =============================================================================
// ENROLLMENTS
// =============================================================================

export const staEnrollmentsApi = {
  async listMine(): Promise<StaEnrollment[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    const { data, error } = await supabase
      .from('sta_enrollments')
      .select('*')
      .eq('participant_id', user.id)
      .order('started_at', { ascending: false })
    if (error) handleError(error)
    return (data ?? []) as StaEnrollment[]
  },

  async listForConsultant(): Promise<StaEnrollment[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    const { data, error } = await supabase
      .from('sta_enrollments')
      .select('*')
      .eq('consultant_id', user.id)
      .order('started_at', { ascending: false })
    if (error) handleError(error)
    return (data ?? []) as StaEnrollment[]
  },

  async get(id: string): Promise<StaEnrollment | null> {
    const { data, error } = await supabase
      .from('sta_enrollments')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) handleError(error)
    return data as StaEnrollment | null
  },

  async create(input: Partial<StaEnrollment> & { consultant_id: string; started_at: string }): Promise<StaEnrollment> {
    const payload = {
      part_started_at: input.started_at,
      current_part: 1 as StaPart,
      language_support: [],
      communication_support: [],
      weekly_hours: 25,
      link_status: input.participant_id ? 'linked' : 'unlinked',
      status: 'active' as EnrollmentStatus,
      ...input,
    }
    const { data, error } = await supabase
      .from('sta_enrollments')
      .insert(payload)
      .select()
      .single()
    if (error) handleError(error)
    return data as StaEnrollment
  },

  async update(id: string, updates: Partial<StaEnrollment>): Promise<StaEnrollment> {
    const { data, error } = await supabase
      .from('sta_enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) handleError(error)
    return data as StaEnrollment
  },

  async advanceToPart(id: string, nextPart: StaPart): Promise<StaEnrollment> {
    return this.update(id, {
      current_part: nextPart,
      part_started_at: new Date().toISOString().slice(0, 10),
    })
  },

  /**
   * Deltagaren själv uppdaterar startdatum (started_at + part_started_at) via RPC.
   * Konsulenten ska använda update() istället. Datum måste vara ISO YYYY-MM-DD.
   */
  async participantUpdateStartDate(id: string, startedAt: string): Promise<StaEnrollment> {
    return this.participantUpdateSelf(id, { startedAt })
  },

  /**
   * Deltagaren själv uppdaterar något av sina egna fält
   * (startdatum / aktivitetsomfattning / markera onboarding klart) via RPC.
   * Bara icke-undefined parametrar uppdateras.
   */
  async participantUpdateSelf(
    id: string,
    input: { startedAt?: string; weeklyHours?: number; markOnboardingDone?: boolean },
  ): Promise<StaEnrollment> {
    const { data, error } = await supabase.rpc('sta_participant_update_self', {
      p_enrollment_id: id,
      p_started_at: input.startedAt ?? null,
      p_weekly_hours: input.weeklyHours ?? null,
      p_mark_onboarding_done: input.markOnboardingDone ?? false,
    })
    if (error) handleError(error)
    return data as StaEnrollment
  },
}

// =============================================================================
// PROFILE LOOKUP (för konsulent-info till deltagaren)
// =============================================================================

export interface StaConsultantProfile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
}

export const staProfileApi = {
  /**
   * Direktläsning av profile (kräver att caller är admin eller samma user).
   * Används av konsulent-vyn.
   */
  async getConsultant(consultantId: string): Promise<StaConsultantProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, avatar_url')
      .eq('id', consultantId)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') handleError(error)
    return (data as StaConsultantProfile) ?? null
  },

  /**
   * Deltagar-vy: hämtar konsulentens profil via RPC som bypassar RLS efter
   * ägar-koll. Anropas med enrollment_id istället för consultant_id.
   */
  async getConsultantForParticipant(enrollmentId: string): Promise<StaConsultantProfile | null> {
    const { data, error } = await supabase.rpc('sta_get_consultant_for_participant', {
      p_enrollment_id: enrollmentId,
    })
    if (error) handleError(error)
    const rows = (data ?? []) as StaConsultantProfile[]
    return rows[0] ?? null
  },
}

// =============================================================================
// ACTIVITIES
// =============================================================================

export const staActivitiesApi = {
  async list(enrollmentId: string, part?: StaPart): Promise<StaActivity[]> {
    let query = supabase
      .from('sta_activities')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('scheduled_for', { ascending: true })
    if (part) query = query.eq('part', part)
    const { data, error } = await query
    if (error) handleError(error)
    return (data ?? []) as StaActivity[]
  },

  async upsert(activity: Partial<StaActivity> & { enrollment_id: string; part: StaPart; activity_type: ActivityType }): Promise<StaActivity> {
    if (activity.id) {
      const { data, error } = await supabase
        .from('sta_activities')
        .update(activity)
        .eq('id', activity.id)
        .select()
        .single()
      if (error) handleError(error)
      return data as StaActivity
    }
    const { data, error } = await supabase
      .from('sta_activities')
      .insert(activity)
      .select()
      .single()
    if (error) handleError(error)
    return data as StaActivity
  },

  async markComplete(enrollmentId: string, part: StaPart, activityKey: string, reflection?: string): Promise<StaActivity> {
    const { data: existing } = await supabase
      .from('sta_activities')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('activity_key', activityKey)
      .maybeSingle()
    if (existing) {
      return this.upsert({
        ...existing,
        completed_at: new Date().toISOString(),
        participant_reflection: reflection ?? existing.participant_reflection,
      })
    }
    return this.upsert({
      enrollment_id: enrollmentId,
      part,
      activity_type: 'dagsslinga',
      activity_key: activityKey,
      completed_at: new Date().toISOString(),
      participant_reflection: reflection ?? null,
    })
  },

  /**
   * Skapa eller uppdatera en aktivitet identifierad av (enrollment_id, activity_key).
   * Mergar metadata istället för att skriva över. Användbart för formulär som
   * sparar partiella svar (kompetenskartläggning, arbetsstationer m.fl.).
   */
  async upsertByKey(input: {
    enrollment_id: string
    part: StaPart
    activity_type: ActivityType
    activity_key: string
    metadata?: Record<string, unknown>
    participant_reflection?: string | null
    markComplete?: boolean
  }): Promise<StaActivity> {
    const { data: existing } = await supabase
      .from('sta_activities')
      .select('*')
      .eq('enrollment_id', input.enrollment_id)
      .eq('activity_key', input.activity_key)
      .maybeSingle()
    if (existing) {
      const mergedMetadata = { ...(existing.metadata ?? {}), ...(input.metadata ?? {}) }
      return this.upsert({
        ...existing,
        metadata: mergedMetadata,
        participant_reflection: input.participant_reflection ?? existing.participant_reflection,
        completed_at: input.markComplete
          ? (existing.completed_at ?? new Date().toISOString())
          : existing.completed_at,
      })
    }
    return this.upsert({
      enrollment_id: input.enrollment_id,
      part: input.part,
      activity_type: input.activity_type,
      activity_key: input.activity_key,
      metadata: input.metadata ?? {},
      participant_reflection: input.participant_reflection ?? null,
      completed_at: input.markComplete ? new Date().toISOString() : null,
    })
  },
}

// =============================================================================
// ASSESSMENTS
// =============================================================================

export const staAssessmentsApi = {
  async list(enrollmentId: string, part?: StaPart): Promise<StaAssessment[]> {
    let query = supabase
      .from('sta_assessments')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false })
    if (part) query = query.eq('part', part)
    const { data, error } = await query
    if (error) handleError(error)
    return (data ?? []) as StaAssessment[]
  },

  async getOrCreate(
    enrollmentId: string,
    part: StaPart,
    instrument: AssessmentInstrument,
  ): Promise<StaAssessment> {
    const { data: existing } = await supabase
      .from('sta_assessments')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('part', part)
      .eq('instrument', instrument)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing) return existing as StaAssessment

    const { data, error } = await supabase
      .from('sta_assessments')
      .insert({ enrollment_id: enrollmentId, part, instrument, status: 'draft' })
      .select()
      .single()
    if (error) handleError(error)
    return data as StaAssessment
  },

  async update(id: string, updates: Partial<StaAssessment>): Promise<StaAssessment> {
    const { data, error } = await supabase
      .from('sta_assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) handleError(error)
    return data as StaAssessment
  },

  async saveScores(id: string, scores: Record<string, unknown>, summary?: string): Promise<StaAssessment> {
    return this.update(id, {
      scores,
      summary: summary ?? null,
      status: 'draft',
    })
  },

  async markComplete(id: string): Promise<StaAssessment> {
    return this.update(id, { status: 'complete' })
  },
}

// =============================================================================
// WORKPLACES
// =============================================================================

export const staWorkplacesApi = {
  async list(enrollmentId: string): Promise<StaWorkplace[]> {
    const { data, error } = await supabase
      .from('sta_workplaces')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false })
    if (error) handleError(error)
    return (data ?? []) as StaWorkplace[]
  },

  async create(input: Partial<StaWorkplace> & { enrollment_id: string; company_name: string }): Promise<StaWorkplace> {
    const { data, error } = await supabase
      .from('sta_workplaces')
      .insert(input)
      .select()
      .single()
    if (error) handleError(error)
    return data as StaWorkplace
  },

  async update(id: string, updates: Partial<StaWorkplace>): Promise<StaWorkplace> {
    const { data, error } = await supabase
      .from('sta_workplaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) handleError(error)
    return data as StaWorkplace
  },
}

// =============================================================================
// DOCUMENTS
// =============================================================================

export const staDocumentsApi = {
  async list(enrollmentId: string): Promise<StaDocument[]> {
    const { data, error } = await supabase
      .from('sta_documents')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false })
    if (error) handleError(error)
    return (data ?? []) as StaDocument[]
  },

  async getOrCreate(enrollmentId: string, docType: DocumentType, part: StaPart | null): Promise<StaDocument> {
    const { data: existing } = await supabase
      .from('sta_documents')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('doc_type', docType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing) return existing as StaDocument

    const { data, error } = await supabase
      .from('sta_documents')
      .insert({ enrollment_id: enrollmentId, doc_type: docType, part, status: 'draft' })
      .select()
      .single()
    if (error) handleError(error)
    return data as StaDocument
  },

  async update(id: string, updates: Partial<StaDocument>): Promise<StaDocument> {
    const { data, error } = await supabase
      .from('sta_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) handleError(error)
    return data as StaDocument
  },

  async approve(id: string, userId: string): Promise<StaDocument> {
    return this.update(id, { status: 'approved', submitted_by: userId })
  },

  async markSubmitted(id: string, userId: string): Promise<StaDocument> {
    return this.update(id, {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: userId,
    })
  },
}

// =============================================================================
// QUICK NOTES
// =============================================================================

export const staQuickNotesApi = {
  async list(enrollmentId: string, limit = 50): Promise<StaQuickNote[]> {
    const { data, error } = await supabase
      .from('sta_quick_notes')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) handleError(error)
    return (data ?? []) as StaQuickNote[]
  },

  async create(input: {
    enrollment_id: string
    body?: string
    tags?: string[]
    voice_transcript?: string
    visibility?: NoteVisibility
  }): Promise<StaQuickNote> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    const { data, error } = await supabase
      .from('sta_quick_notes')
      .insert({
        enrollment_id: input.enrollment_id,
        author_id: user.id,
        body: input.body ?? null,
        tags: input.tags ?? [],
        voice_transcript: input.voice_transcript ?? null,
        visibility: input.visibility ?? 'consultant_only',
      })
      .select()
      .single()
    if (error) handleError(error)
    return data as StaQuickNote
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sta_quick_notes')
      .delete()
      .eq('id', id)
    if (error) handleError(error)
  },
}

// =============================================================================
// PULSE CHECKS
// =============================================================================

export const staPulseChecksApi = {
  async list(enrollmentId: string, days = 30): Promise<StaPulseCheck[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const { data, error } = await supabase
      .from('sta_pulse_checks')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .gte('check_date', startDate.toISOString().slice(0, 10))
      .order('check_date', { ascending: false })
    if (error) handleError(error)
    return (data ?? []) as StaPulseCheck[]
  },

  async submitToday(input: {
    enrollment_id: string
    energy_level: number
    mood?: Mood
    comment?: string
  }): Promise<StaPulseCheck> {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('sta_pulse_checks')
      .upsert(
        {
          enrollment_id: input.enrollment_id,
          check_date: today,
          energy_level: input.energy_level,
          mood: input.mood ?? null,
          comment: input.comment ?? null,
        },
        { onConflict: 'enrollment_id,check_date' },
      )
      .select()
      .single()
    if (error) handleError(error)
    return data as StaPulseCheck
  },

  async hasTodayCheck(enrollmentId: string): Promise<boolean> {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('sta_pulse_checks')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .eq('check_date', today)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') return false
    return !!data
  },
}

// =============================================================================
// WEEKLY CHECKINS
// =============================================================================

export const staWeeklyCheckinsApi = {
  async list(enrollmentId: string): Promise<StaWeeklyCheckin[]> {
    const { data, error } = await supabase
      .from('sta_weekly_checkins')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('week_starts', { ascending: false })
    if (error) handleError(error)
    return (data ?? []) as StaWeeklyCheckin[]
  },

  async submitForWeek(input: {
    enrollment_id: string
    week_starts: string  // YYYY-MM-DD (måndag)
    overall_mood?: Mood
    best_thing?: string
    hardest_thing?: string
    question_for_consultant?: string
  }): Promise<StaWeeklyCheckin> {
    const { data, error } = await supabase
      .from('sta_weekly_checkins')
      .upsert(
        {
          enrollment_id: input.enrollment_id,
          week_starts: input.week_starts,
          overall_mood: input.overall_mood ?? null,
          best_thing: input.best_thing ?? null,
          hardest_thing: input.hardest_thing ?? null,
          question_for_consultant: input.question_for_consultant ?? null,
        },
        { onConflict: 'enrollment_id,week_starts' },
      )
      .select()
      .single()
    if (error) handleError(error)
    return data as StaWeeklyCheckin
  },
}

// =============================================================================
// ABSENCES — frånvaroanmälan
// =============================================================================

export const staAbsencesApi = {
  async list(enrollmentId: string, sinceDays = 60): Promise<StaAbsence[]> {
    const since = new Date()
    since.setDate(since.getDate() - sinceDays)
    const { data, error } = await supabase
      .from('sta_absences')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .gte('absence_date', since.toISOString().slice(0, 10))
      .order('absence_date', { ascending: false })
    if (error) handleError(error)
    return (data ?? []) as StaAbsence[]
  },

  async upsert(input: {
    enrollment_id: string
    absence_date: string  // YYYY-MM-DD
    kind: AbsenceKind
    reason?: string | null
  }): Promise<StaAbsence> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    const { data, error } = await supabase
      .from('sta_absences')
      .upsert(
        {
          enrollment_id: input.enrollment_id,
          absence_date: input.absence_date,
          kind: input.kind,
          reason: input.reason ?? null,
          reported_by: user.id,
        },
        { onConflict: 'enrollment_id,absence_date' },
      )
      .select()
      .single()
    if (error) handleError(error)
    return data as StaAbsence
  },

  async addConsultantNote(id: string, note: string): Promise<StaAbsence> {
    const { data, error } = await supabase
      .from('sta_absences')
      .update({ consultant_note: note })
      .eq('id', id)
      .select()
      .single()
    if (error) handleError(error)
    return data as StaAbsence
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sta_absences')
      .delete()
      .eq('id', id)
    if (error) handleError(error)
  },
}

// =============================================================================
// HELPER: Hämta-allt-för-en-deltagare (för rapport-generering)
// =============================================================================

export interface EnrollmentBundle {
  enrollment: StaEnrollment
  activities: StaActivity[]
  assessments: StaAssessment[]
  quickNotes: StaQuickNote[]
  pulseChecks: StaPulseCheck[]
  weeklyCheckins: StaWeeklyCheckin[]
  workplaces: StaWorkplace[]
  documents: StaDocument[]
}

export async function fetchEnrollmentBundle(enrollmentId: string): Promise<EnrollmentBundle | null> {
  const enrollment = await staEnrollmentsApi.get(enrollmentId)
  if (!enrollment) return null
  const [activities, assessments, quickNotes, pulseChecks, weeklyCheckins, workplaces, documents] = await Promise.all([
    staActivitiesApi.list(enrollmentId),
    staAssessmentsApi.list(enrollmentId),
    staQuickNotesApi.list(enrollmentId, 200),
    staPulseChecksApi.list(enrollmentId, 90),
    staWeeklyCheckinsApi.list(enrollmentId),
    staWorkplacesApi.list(enrollmentId),
    staDocumentsApi.list(enrollmentId),
  ])
  return {
    enrollment,
    activities,
    assessments,
    quickNotes,
    pulseChecks,
    weeklyCheckins,
    workplaces,
    documents,
  }
}
