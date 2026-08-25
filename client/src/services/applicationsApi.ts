/**
 * Applications API
 * Comprehensive API for job application tracking
 */

import { supabase } from '@/lib/supabase'
import type {
  Application,
  ApplicationHistoryEntry,
  ApplicationContact,
  ApplicationReminder,
  ApplicationStats,
  ApplicationStatus,
  ApplicationSource,
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateContactInput,
  CreateReminderInput,
  ApplicationFilters,
  ApplicationSort,
} from '@/types/application.types'
import { APPLICATION_STATUS_CONFIG } from '@/types/application.types'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

/**
 * Dagens datum som `YYYY-MM-DD` i användarens tidszon.
 *
 * `new Date().toISOString()` ger UTC, vilket i Sverige betyder att allt som
 * sker efter kl. 01–02 på natten daterar sig till gårdagen. För ett fält som
 * hamnar i en aktivitetsrapport är det fel datum, inte en avrundning.
 */
function idagLokalt(): string {
  const nu = new Date()
  const månad = String(nu.getMonth() + 1).padStart(2, '0')
  const dag = String(nu.getDate()).padStart(2, '0')
  return `${nu.getFullYear()}-${månad}-${dag}`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function handleError(error: unknown): never {
  console.error('Applications API Error:', error)
  throw error
}

function transformApplication(row: Record<string, unknown>): Application {
  const jobData = row.job_data as PlatsbankenJob | null
  return {
    id: row.id as string,
    userId: row.user_id as string,
    jobId: row.job_id as string,
    jobData: jobData || {
      headline: (row.job_title as string) || 'Unknown',
      employer: { name: (row.company_name as string) || 'Unknown' }
    },
    status: ((row.status as string) || 'saved').toLowerCase() as ApplicationStatus,
    source: ((row.source as string) || 'job_search') as ApplicationSource,
    priority: ((row.priority as string) || 'medium') as 'high' | 'medium' | 'low',
    companyName: (row.company_name as string) || jobData?.employer?.name,
    jobTitle: (row.job_title as string) || jobData?.headline,
    location: (row.location as string) || jobData?.workplace_address?.municipality,
    jobUrl: (row.job_url as string) || jobData?.webpage_url,
    applicationMethod: row.application_method as Application['applicationMethod'],
    applicationDate: row.application_date as string | undefined,
    cvVersionId: row.cv_version_id as string | undefined,
    coverLetterId: row.cover_letter_id as string | undefined,
    interviewDate: row.interview_date as string | undefined,
    salaryInfo: row.salary_info as Application['salaryInfo'],
    offerDeadline: row.offer_deadline as string | undefined,
    notes: row.notes as string | undefined,
    followUpDate: row.follow_up_date as string | undefined,
    archivedAt: row.archived_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

function transformContact(row: Record<string, unknown>): ApplicationContact {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    userId: row.user_id as string,
    name: row.name as string,
    title: row.title as string | null,
    email: row.email as string | null,
    phone: row.phone as string | null,
    linkedinUrl: row.linkedin_url as string | null,
    notes: row.notes as string | null,
    isPrimary: row.is_primary as boolean,
    lastContactedAt: row.last_contacted_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

function transformReminder(row: Record<string, unknown>): ApplicationReminder {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    userId: row.user_id as string,
    reminderType: row.reminder_type as ApplicationReminder['reminderType'],
    reminderDate: row.reminder_date as string,
    reminderTime: row.reminder_time as string | null,
    title: row.title as string,
    description: row.description as string | null,
    isCompleted: row.is_completed as boolean,
    completedAt: row.completed_at as string | null,
    createdAt: row.created_at as string
  }
}

function transformHistory(row: Record<string, unknown>): ApplicationHistoryEntry {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    userId: row.user_id as string,
    eventType: row.event_type as ApplicationHistoryEntry['eventType'],
    oldValue: row.old_value as string | null,
    newValue: row.new_value as string | null,
    note: row.note as string | null,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at as string
  }
}

// ============================================
// APPLICATIONS API
// ============================================

export const applicationsApi = {
  /**
   * Get all applications for the current user
   */
  async getAll(
    filters?: ApplicationFilters,
    sort?: ApplicationSort
  ): Promise<Application[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let query = supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status.map(s => s.toUpperCase()))
    }

    if (filters?.source && filters.source.length > 0) {
      query = query.in('source', filters.source)
    }

    if (filters?.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority)
    }

    if (filters?.archived === false) {
      query = query.is('archived_at', null)
    } else if (filters?.archived === true) {
      query = query.not('archived_at', 'is', null)
    }

    // Apply sorting
    const sortField = sort?.field || 'createdAt'
    const sortDir = sort?.direction || 'desc'
    const fieldMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      status: 'status',
      priority: 'priority',
      companyName: 'company_name',
      applicationDate: 'application_date'
    }
    query = query.order(fieldMap[sortField] || 'created_at', { ascending: sortDir === 'asc' })

    const { data, error } = await query

    if (error) handleError(error)
    return (data || []).map(transformApplication)
  },

  /**
   * Get a single application by ID
   */
  async getById(id: string): Promise<Application | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      handleError(error)
    }
    return data ? transformApplication(data) : null
  },

  /**
   * Get application by job ID
   */
  async getByJobId(jobId: string): Promise<Application | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) handleError(error)
    return data ? transformApplication(data) : null
  },

  /**
   * Create a new application
   */
  async create(input: CreateApplicationInput): Promise<Application> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const jobData = input.jobData as PlatsbankenJob
    const jobId = input.jobId || jobData?.id || `manual-${Date.now()}`

    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: user.id,
        job_id: jobId,
        job_data: input.jobData,
        status: (input.status || 'saved').toUpperCase(),
        source: input.source || 'job_search',
        priority: input.priority || 'medium',
        application_method: input.applicationMethod,
        application_date: input.applicationDate,
        notes: input.notes,
        cv_version_id: input.cvVersionId,
        cover_letter_id: input.coverLetterId,
        company_name: jobData?.employer?.name,
        job_title: jobData?.headline,
        location: jobData?.workplace_address?.municipality,
        job_url: jobData?.webpage_url
      })
      .select()
      .single()

    if (error) handleError(error)
    return transformApplication(data)
  },

  /**
   * Update an application
   */
  async update(id: string, input: UpdateApplicationInput): Promise<Application> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (input.status !== undefined) updates.status = input.status.toUpperCase()
    if (input.source !== undefined) updates.source = input.source
    if (input.priority !== undefined) updates.priority = input.priority
    if (input.applicationMethod !== undefined) updates.application_method = input.applicationMethod
    if (input.applicationDate !== undefined) updates.application_date = input.applicationDate
    if (input.interviewDate !== undefined) updates.interview_date = input.interviewDate
    if (input.cvVersionId !== undefined) updates.cv_version_id = input.cvVersionId
    if (input.coverLetterId !== undefined) updates.cover_letter_id = input.coverLetterId
    if (input.salaryInfo !== undefined) updates.salary_info = input.salaryInfo
    if (input.offerDeadline !== undefined) updates.offer_deadline = input.offerDeadline
    if (input.notes !== undefined) updates.notes = input.notes
    if (input.followUpDate !== undefined) updates.follow_up_date = input.followUpDate
    if (input.companyName !== undefined) updates.company_name = input.companyName
    if (input.jobTitle !== undefined) updates.job_title = input.jobTitle
    if (input.location !== undefined) updates.location = input.location
    if (input.jobUrl !== undefined) updates.job_url = input.jobUrl

    const { data, error } = await supabase
      .from('saved_jobs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return transformApplication(data)
  },

  /**
   * Update application status
   */
  async updateStatus(id: string, status: ApplicationStatus): Promise<Application> {
    // O3 (2026-08-25): sätt ansökningsdatum när kortet flyttas till "Ansökt"
    // eller längre fram, om det inte redan finns ett.
    //
    // Fram till i dag skrevs `application_date` bara av formuläret och av
    // `applyToJob`. Att dra ett kort till Ansökt i tavlan — den vanligaste
    // vägen — lämnade fältet tomt. I prod hade **1 av 26 rader** ett datum,
    // och därför kunde ingen aktivitetsrapport byggas ur dem.
    //
    // Datumet är dagens, eftersom det är den dag användaren säger att hen
    // sökte. Sökte man för en vecka sedan går fältet att rätta i
    // ansökningens formulär — det är därför vi bara fyller i när det är TOMT,
    // aldrig skriver över.
    const raknasSomSokt =
      status !== 'withdrawn' &&
      APPLICATION_STATUS_CONFIG[status].order >= APPLICATION_STATUS_CONFIG.applied.order

    if (raknasSomSokt) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: befintlig } = await supabase
          .from('saved_jobs')
          .select('application_date')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (befintlig && !befintlig.application_date) {
          return this.update(id, { status, applicationDate: idagLokalt() })
        }
      }
    }

    return this.update(id, { status })
  },

  /**
   * Archive an application
   */
  async archive(id: string): Promise<Application> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_jobs')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return transformApplication(data)
  },

  /**
   * Unarchive an application
   */
  async unarchive(id: string): Promise<Application> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_jobs')
      .update({ archived_at: null })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return transformApplication(data)
  },

  /**
   * Delete an application
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) handleError(error)
  },

  /**
   * Get application statistics
   */
  async getStats(): Promise<ApplicationStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .rpc('get_application_stats', { p_user_id: user.id })

    if (error) {
      // RPC:n FINNS i prod (verifierad 2026-08-19) — kommentaren här sa till
      // 2026-08-19 att den saknades, vilket fick varje RPC-fel att se ut som
      // en förväntad konfiguration i stället för ett fel att undersöka.
      // Fallbacken behålls som robusthet, men felet skrivs ut som det är.
      console.warn('get_application_stats misslyckades — räknar om i klienten i stället:', error)
      const apps = await this.getAll()
      return {
        total: apps.length,
        interested: apps.filter(a => a.status === 'interested').length,
        saved: apps.filter(a => a.status === 'saved').length,
        applied: apps.filter(a => a.status === 'applied').length,
        screening: apps.filter(a => a.status === 'screening').length,
        phone: apps.filter(a => a.status === 'phone').length,
        interview: apps.filter(a => a.status === 'interview').length,
        assessment: apps.filter(a => a.status === 'assessment').length,
        offer: apps.filter(a => a.status === 'offer').length,
        accepted: apps.filter(a => a.status === 'accepted').length,
        rejected: apps.filter(a => a.status === 'rejected').length,
        withdrawn: apps.filter(a => a.status === 'withdrawn').length,
        active: apps.filter(a => !a.archivedAt && !['accepted', 'rejected', 'withdrawn'].includes(a.status)).length,
        thisWeek: apps.filter(a => new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        thisMonth: apps.filter(a => new Date(a.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
      }
    }

    return {
      total: data.total || 0,
      interested: data.interested || 0,
      saved: data.saved || 0,
      applied: data.applied || 0,
      screening: data.screening || 0,
      phone: data.phone || 0,
      interview: data.interview || 0,
      assessment: data.assessment || 0,
      offer: data.offer || 0,
      accepted: data.accepted || 0,
      rejected: data.rejected || 0,
      withdrawn: data.withdrawn || 0,
      active: data.active || 0,
      thisWeek: data.this_week || 0,
      thisMonth: data.this_month || 0
    }
  },

  /**
   * Get stale applications (no update in X days)
   */
  async getStale(days: number = 7): Promise<Application[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .in('status', ['APPLIED', 'SCREENING', 'PHONE', 'INTERVIEW', 'ASSESSMENT'])
      // `updated_at` är nullable. En rad med NULL är per definition orörd och
      // alltså den mest inaktuella av alla — men `.lt()` matchar aldrig NULL i
      // SQL, så den föll tyst ur listan. 0 sådana rader i prod i dag; villkoret
      // finns för att det inte ska bero på tur.
      .or(`updated_at.is.null,updated_at.lt.${cutoffDate}`)
      .order('updated_at', { ascending: true, nullsFirst: true })

    if (error) handleError(error)
    return (data || []).map(transformApplication)
  },

  // ==========================================================================
  // E12-konsolideringen (2026-07-28): primitiver som tidigare låg i jobsApi och
  // cloudStorage. Båda hade egna `.from('saved_jobs')` mot samma tabell, med
  // olika skiftlägeshantering — `saved_jobs.status` lagras i VERSALER i prod
  // (SAVED/INTERESTED/APPLIED) medan appen arbetar i gemener. Nu äger den här
  // modulen ALL åtkomst till tabellen och normaliserar på ett ställe.
  // ==========================================================================

  /**
   * Spara ett jobb från jobbsökningen. Upsert på (user_id, job_id) så att samma
   * annons inte kan sparas två gånger — samma beteende som jobsApi.saveJob hade.
   */
  async saveJob(jobId: string, jobData: Record<string, unknown>, status: ApplicationStatus = 'saved'): Promise<Application> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // jobData kommer som en lös post från jobbsökningen — läs de härledda
    // kolumnerna defensivt i stället för att casta till PlatsbankenJob.
    const employer = jobData?.employer as { name?: string } | undefined
    const address = jobData?.workplace_address as { municipality?: string } | undefined

    const { data, error } = await supabase
      .from('saved_jobs')
      .upsert({
        user_id: user.id,
        job_id: jobId,
        job_data: jobData,
        status: status.toUpperCase(),
        company_name: employer?.name,
        job_title: jobData?.headline as string | undefined,
        location: address?.municipality,
        job_url: (jobData?.webpage_url ?? jobData?.url) as string | undefined,
      }, { onConflict: 'user_id,job_id' })
      .select()
      .single()

    if (error) handleError(error)
    return transformApplication(data)
  },

  /** Är annonsen redan sparad? */
  async isSaved(jobId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle()

    if (error) handleError(error)
    return !!data
  },

  /**
   * Hämta per status. Anropas med appens gemener — versaliseringen sker här, så
   * ingen anropare behöver känna till lagringsformatet.
   */
  async getByStatus(statuses: ApplicationStatus[]): Promise<Application[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .in('status', statuses.map(s => s.toUpperCase()))
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return (data || []).map(transformApplication)
  },

  /** Uppdatera via annonsens job_id i stället för radens id (jobbsökningens vy). */
  async updateByJobId(jobId: string, updates: UpdateApplicationInput): Promise<Application> {
    const existing = await this.getByJobId(jobId)
    if (!existing) throw new Error('Jobb inte hittat')
    return this.update(existing.id, updates)
  },

  /** Radera via annonsens job_id. Tyst no-op om raden inte finns (som tidigare). */
  async deleteByJobId(jobId: string): Promise<void> {
    const existing = await this.getByJobId(jobId)
    if (!existing) return
    return this.delete(existing.id)
  },

  /**
   * Råa statusrader för räkning/summering (hubbar, progress, profilaggregat).
   * Finns för att de tidigare gjorde egna `.from('saved_jobs')` runt servicelagret.
   * Returnerar status i GEMENER — anroparen ska aldrig behöva veta hur det lagras.
   */
  async getStatusRows(): Promise<Array<{ status: ApplicationStatus; archivedAt: string | null }>> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('status, archived_at')
      .eq('user_id', user.id)

    if (error) handleError(error)
    return (data || []).map(r => ({
      status: ((r.status as string) || 'saved').toLowerCase() as ApplicationStatus,
      archivedAt: (r.archived_at as string | null) ?? null,
    }))
  },

  /** Antal icke-arkiverade ansökningar. Ersätter fyra spridda count-frågor. */
  async getActiveCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { count, error } = await supabase
      .from('saved_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('archived_at', null)

    if (error) handleError(error)
    return count || 0
  }
}

// ============================================
// CONTACTS API
// ============================================

export const applicationContactsApi = {
  /**
   * Get all contacts for an application
   */
  async getByApplication(applicationId: string): Promise<ApplicationContact[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_contacts')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return (data || []).map(transformContact)
  },

  /**
   * Get all contacts for the user
   */
  async getAll(): Promise<ApplicationContact[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return (data || []).map(transformContact)
  },

  /**
   * Create a contact
   */
  async create(input: CreateContactInput): Promise<ApplicationContact> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_contacts')
      .insert({
        application_id: input.applicationId,
        user_id: user.id,
        name: input.name,
        title: input.title,
        email: input.email,
        phone: input.phone,
        linkedin_url: input.linkedinUrl,
        notes: input.notes,
        is_primary: input.isPrimary || false
      })
      .select()
      .single()

    if (error) handleError(error)

    // Log history
    await applicationHistoryApi.log(input.applicationId, 'contact_added', {
      note: `Added contact: ${input.name}`
    })

    return transformContact(data)
  },

  /**
   * Update a contact
   */
  async update(id: string, updates: Partial<CreateContactInput>): Promise<ApplicationContact> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_contacts')
      .update({
        name: updates.name,
        title: updates.title,
        email: updates.email,
        phone: updates.phone,
        linkedin_url: updates.linkedinUrl,
        notes: updates.notes,
        is_primary: updates.isPrimary
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return transformContact(data)
  },

  /**
   * Delete a contact
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('application_contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) handleError(error)
  },

  /**
   * Mark contact as contacted
   */
  async markContacted(id: string): Promise<ApplicationContact> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_contacts')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return transformContact(data)
  }
}

// ============================================
// REMINDERS API
// ============================================

export const applicationRemindersApi = {
  /**
   * Get reminders for an application
   */
  async getByApplication(applicationId: string): Promise<ApplicationReminder[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_reminders')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', user.id)
      .order('reminder_date', { ascending: true })

    if (error) handleError(error)
    return (data || []).map(transformReminder)
  },

  /**
   * Get all upcoming reminders
   */
  async getUpcoming(days: number = 7): Promise<ApplicationReminder[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('application_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .lte('reminder_date', futureDate)
      .order('reminder_date', { ascending: true })
      .order('reminder_time', { ascending: true })

    if (error) handleError(error)
    return (data || []).map(transformReminder)
  },

  /**
   * Get today's reminders
   */
  async getToday(): Promise<ApplicationReminder[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('application_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .eq('reminder_date', today)
      .order('reminder_time', { ascending: true })

    if (error) handleError(error)
    return (data || []).map(transformReminder)
  },

  /**
   * Create a reminder
   */
  async create(input: CreateReminderInput): Promise<ApplicationReminder> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_reminders')
      .insert({
        application_id: input.applicationId,
        user_id: user.id,
        reminder_type: input.reminderType,
        reminder_date: input.reminderDate,
        reminder_time: input.reminderTime,
        title: input.title,
        description: input.description
      })
      .select()
      .single()

    if (error) handleError(error)

    // Log history
    await applicationHistoryApi.log(input.applicationId, 'reminder_set', {
      note: `Set reminder: ${input.title} for ${input.reminderDate}`
    })

    return transformReminder(data)
  },

  /**
   * Mark reminder as completed
   */
  async complete(id: string): Promise<ApplicationReminder> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_reminders')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)

    // Log history
    await applicationHistoryApi.log(data.application_id, 'reminder_completed', {
      note: `Completed reminder: ${data.title}`
    })

    return transformReminder(data)
  },

  /**
   * Delete a reminder
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('application_reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) handleError(error)
  }
}

// ============================================
// HISTORY API
// ============================================

export const applicationHistoryApi = {
  /**
   * Get history for an application
   */
  async getByApplication(applicationId: string, limit: number = 50): Promise<ApplicationHistoryEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_history')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) handleError(error)
    return (data || []).map(transformHistory)
  },

  /**
   * Get recent history across all applications
   */
  async getRecent(limit: number = 20): Promise<ApplicationHistoryEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('application_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) handleError(error)
    return (data || []).map(transformHistory)
  },

  /**
   * Log a history event manually
   */
  async log(
    applicationId: string,
    eventType: ApplicationHistoryEntry['eventType'],
    data?: { oldValue?: string; newValue?: string; note?: string; metadata?: Record<string, unknown> }
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // Silently fail if not authenticated

    // `.catch()` fanns här fram till 2026-08-19 och gjorde tvärtemot vad den
    // såg ut att göra: PostgrestBuilder implementerar bara `then` (PromiseLike),
    // så `.catch` var `undefined` och raden kastade `TypeError` — INNAN
    // loggningen ens hann misslyckas. Eftersom de tre anroparna `await`:ar
    // log() EFTER en lyckad skrivning fick deltagaren "Kunde inte spara
    // kontakten" trots att kontakten låg i databasen, och ett nytt försök gav
    // dubbletter. Testet var grönt för att mocken returnerade en riktig Promise.
    //
    // Loggningen är best effort: historiken är en bonus, inte det som ska
    // fälla en sparning som redan gått igenom. Därför try/catch, inte kast.
    try {
      const { error } = await supabase
        .from('application_history')
        .insert({
          application_id: applicationId,
          user_id: user.id,
          event_type: eventType,
          old_value: data?.oldValue,
          new_value: data?.newValue,
          note: data?.note,
          metadata: data?.metadata || {}
        })
      if (error) console.warn('Kunde inte logga historikhändelse:', error)
    } catch (err) {
      console.warn('Kunde inte logga historikhändelse:', err)
    }
  }
}

export default applicationsApi
