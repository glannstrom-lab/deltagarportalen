/**
 * Workflow API - Fas 1 Integration Service
 * Hanterar "Skapa Ansökan"-flödet och nästa-steg logik
 */

import { supabase } from '@/lib/supabase'
import { applicationsApi } from './applicationsApi'
import type { ApplicationStatus, ManualJobData } from '@/types/application.types'

// ============================================
// TYPES
// ============================================

export interface JobData {
  jobId: string
  headline: string
  employer: string
  description: string
  url: string
  location?: string
  employmentType?: string
}

export interface ApplicationWorkflow {
  step1_cv: {
    optimize: boolean
    matchScore?: number
  }
  step2_letter: {
    generateAI: boolean
    content?: string
    tone?: 'professional' | 'friendly' | 'enthusiastic'
  }
  step3_tracker: {
    status: 'SAVED' | 'APPLIED' | 'INTERVIEW'
    notes: string
  }
}

export interface CreateApplicationRequest {
  jobData: JobData
  workflow: ApplicationWorkflow
}

export interface CreateApplicationResponse {
  success: boolean
  data: {
    trackerEntryId?: string
    coverLetterId?: string
    savedJobId?: string
    cvMatchScore?: number
    message: string
  }
}

interface CVWorkExperience {
  title: string
  description?: string
}

interface CVRecord {
  title?: string | null
  summary?: string | null
  /** I prod objekt `{id,name,level,category}` — inte strängar (se CLAUDE.md 2026-08-03). */
  skills?: Array<string | { name?: string | null }> | null
  work_experience?: CVWorkExperience[] | null
}

// ============================================
// APPLICATION WORKFLOW API
// ============================================

export const workflowApi = {
  /**
   * Skapa komplett ansöknings-flöde från jobb
   * 1. Spara jobbet (om inte redan sparad)
   * 2. Skapa personligt brev (om valt)
   * 3. Skapa tracker-entry
   */
  async createApplication(request: CreateApplicationRequest): Promise<CreateApplicationResponse> {
    const { jobData, workflow } = request
    const results: CreateApplicationResponse['data'] = {
      message: 'Ansökan skapad och sparad'
    }

    try {
      // E12-migreringsspår (2026-07-23, UX2-fix): "Skapa ansökan" skrev
      // tidigare via cloudStorage.savedJobsApi.update(...) — en metod som
      // inte finns på den API-varianten (TypeError: be.update is not a
      // function), plus en parallell job_applications-insert
      // (applicationService.createApplication) med kolumner som inte finns
      // i schemat (employer/cover_letter/contact_person/follow_up_date/
      // application_date) → tyst degraderad till localStorage-fallback.
      //
      // Nu går allt genom applicationsApi (samma saved_jobs-rad med
      // status/priority/source m.m.) som Ansökningar-Kanban (useApplications)
      // redan läser och skriver — en enda sanning för samma jobb-ansökan.
      const jobRecord: ManualJobData = {
        headline: jobData.headline,
        employer: { name: jobData.employer },
        description: { text: jobData.description },
        ...(jobData.location ? { workplace_address: { municipality: jobData.location } } : {}),
        ...(jobData.url ? { application_details: { url: jobData.url } } : {}),
      }

      // step3_tracker.status kommer i versaler (SAVED/APPLIED/INTERVIEW) från
      // modalen — applicationsApi/saved_jobs använder gemener.
      const status = workflow.step3_tracker.status.toLowerCase() as ApplicationStatus
      const applicationDate = status === 'applied' ? new Date().toISOString() : undefined

      const existing = await applicationsApi.getByJobId(jobData.jobId)

      const application = existing
        ? await applicationsApi.update(existing.id, {
            status,
            notes: workflow.step3_tracker.notes || undefined,
            applicationDate,
          })
        : await applicationsApi.create({
            jobId: jobData.jobId,
            jobData: jobRecord,
            status,
            source: 'job_search',
            notes: workflow.step3_tracker.notes || undefined,
            applicationDate,
          })

      results.savedJobId = application.id
      results.trackerEntryId = application.id

      // Steg 2 (brevet) raderat 2026-09-22. Grenen kördes bara när
      // `step2_letter.generateAI` var sant, och modalen sätter den aldrig —
      // "Skriv med AI" navigerar till /cover-letter i stället. Dessutom saknade
      // insertet det NOT NULL:a `user_id` (kunde aldrig lyckas), och innehållet
      // var en fast mall märkt `ai_generated: true` — en mall får aldrig
      // märkas som AI.

      return {
        success: true,
        data: results
      }
    } catch (error) {
      console.error('Fel vid skapande av ansökan:', error)
      throw new Error('Kunde inte skapa ansökan. Försök igen.')
    }
  },

  /**
   * Hämta CV-matchning för ett jobb.
   *
   * @returns poängen, eller `null` när den inte gick att räkna ut.
   *
   * UX14 (2026-08-03): returnerade tidigare `50` vid fel — "Default score".
   * Anroparen kunde inte skilja det från en verklig 50-procentig matchning och
   * visade "God match, kan förbättras". Ett tal vi inte har får inte se ut som
   * ett tal vi har (samma klass som D11:s felmaskering).
   */
  async getCVMatchScore(jobData: JobData): Promise<number | null> {
    try {
      // 2026-09-22: frågan saknade user-filter. RLS på `cvs` släpper igenom
      // aktiva deltagares CV för en konsulent, så `.maybeSingle()` fick flera
      // rader (fel → null) eller EN DELTAGARES CV, som då visades som
      // konsulentens egen "Din matchning". Samma fel som CreateApplicationModal.
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: cv, error } = await supabase
        .from('cvs')
        .select('title, summary, skills, work_experience')
        .eq('user_id', user.id)
        .maybeSingle() as { data: CVRecord | null; error: unknown }

      if (error) throw error
      // Inget CV = ingen matchning att räkna ut. `0` visades som "0 % match".
      if (!cv) return null

      // Enkel matchningsalgoritm baserat på nyckelord. Kompetenserna är objekt
      // i prod — utan `.name` blev de "[object Object]" i texten.
      const kompetenser = (cv.skills || []).map((k) => (typeof k === 'string' ? k : k?.name || ''))
      const cvText = [
        cv.title || '',
        cv.summary || '',
        ...kompetenser,
        // Var `...(…).join(' ')` — spridningen av en STRÄNG gav enskilda tecken
        // ("l a g e r"), så arbetslivserfarenheten matchade aldrig ett ord.
        ...(cv.work_experience || []).map((e) => `${e.title} ${e.description || ''}`)
      ].join(' ').toLowerCase()

      const jobText = `${jobData.headline} ${jobData.description}`.toLowerCase()

      // Extrahera viktiga ord (enkel implementation)
      const jobWords = jobText.split(/\s+/).filter(w => w.length > 4)
      const uniqueJobWords = [...new Set(jobWords)]
      // Inga ord att jämföra = ingen siffra (annars 0/0 = NaN %).
      if (uniqueJobWords.length === 0) return null

      const matchedWords = uniqueJobWords.filter(word => cvText.includes(word))
      const score = Math.min(95, Math.round((matchedWords.length / Math.min(uniqueJobWords.length, 20)) * 100))

      return score
    } catch (error) {
      console.error('Fel vid CV-matchning:', error)
      return null
    }
  }
}

// nextStepApi raderad 2026-09-22: noll anropare. Den läste `cvs` och
// `cover_letters` utan user-filter (RLS släpper igenom deltagares rader för
// en konsulent) och räknade `interested` som en skickad ansökan.
