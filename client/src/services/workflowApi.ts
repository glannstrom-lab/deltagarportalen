/**
 * Workflow API - Fas 1 Integration Service
 * Hanterar "Skapa Ansökan"-flödet och nästa-steg logik
 */

import { supabase } from '@/lib/supabase'
import { savedJobsApi, jobApplicationsApi } from './cloudStorage'
import { applicationService, type ApplicationData } from './applicationService'
import type { PlatsbankenJob } from './arbetsformedlingenApi'

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

export interface NextStep {
  type: 'CREATE_CV' | 'SEARCH_JOBS' | 'CREATE_APPLICATION' | 'CONTINUE_SEARCH' | 'COMPLETE_PROFILE'
  message: string
  submessage?: string
  action: { label: string; link: string }
  secondaryAction?: { label: string; link: string }
  icon: string
  priority: 'high' | 'medium' | 'low'
}

export interface UserProgress {
  hasCV: boolean
  cvScore: number
  savedJobsCount: number
  savedJobsWithoutApplication: number
  applicationsCount: number
  recentApplications: number
  coverLettersCount: number
  lastActivity: string | null
}

interface CVWorkExperience {
  title: string
  description?: string
}

interface CVRecord {
  title?: string
  summary?: string
  skills?: string[]
  work_experience?: CVWorkExperience[]
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
      // Step 1: Spara jobbet (om inte redan sparad)
      const existingJobs = await savedJobsApi.getAll()
      const existingJob = existingJobs.find(j => j.job_id === jobData.jobId)
      
      if (!existingJob) {
        const savedJob = await savedJobsApi.add({
          job_id: jobData.jobId,
          job_data: {
            headline: jobData.headline,
            employer: { name: jobData.employer },
            description: { text: jobData.description },
            application_details: { url: jobData.url },
            workplace_address: { municipality: jobData.location },
            employment_type: { label: jobData.employmentType }
          },
          status: workflow.step3_tracker.status,
          notes: workflow.step3_tracker.notes
        })
        results.savedJobId = savedJob.id
      } else {
        results.savedJobId = existingJob.id
        // Uppdatera status om jobbet redan finns
        await savedJobsApi.update(existingJob.id, {
          status: workflow.step3_tracker.status,
          notes: workflow.step3_tracker.notes
        })
      }

      // Step 2: Skapa personligt brev (om valt)
      if (workflow.step2_letter.generateAI) {
        const { data: coverLetter } = await supabase
          .from('cover_letters')
          .insert({
            title: `Ansökan - ${jobData.headline}`,
            job_ad: jobData.jobId,
            company: jobData.employer,
            job_title: jobData.headline,
            content: workflow.step2_letter.content || this.generateDefaultCoverLetter(jobData),
            ai_generated: true
          })
          .select()
          .single()
        
        if (coverLetter) {
          results.coverLetterId = coverLetter.id
        }
      }

      // Step 3: Skapa ansökning i tracker (om status är APPLIED)
      if (workflow.step3_tracker.status === 'APPLIED') {
        const application = await applicationService.createApplication({
          jobId: jobData.jobId,
          jobTitle: jobData.headline,
          employer: jobData.employer,
          status: 'sent',
          notes: workflow.step3_tracker.notes,
          coverLetter: workflow.step2_letter.content
        })
        results.trackerEntryId = application.id
      }

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
   * Generera ett standard personligt brev
   */
  generateDefaultCoverLetter(jobData: JobData): string {
    return `Hej!

Jag skriver med stort intresse angående tjänsten som ${jobData.headline} på ${jobData.employer}.

Efter att ha läst om er verksamhet och tjänstbeskrivningen känner jag att mina kunskaper och erfarenheter skulle passa väl in i ert team. Jag är särskilt intresserad av möjligheten att bidra med mitt engagemang och mina kompetenser.

Jag ser fram emot möjligheten att diskutera hur jag kan bidra till ${jobData.employer}s fortsatta framgång.

Med vänliga hälsningar,
[Mitt namn]`
  },

  /**
   * Hämta CV-matchning för ett jobb
   */
  async getCVMatchScore(jobData: JobData): Promise<number> {
    try {
      const { data: cv } = await supabase
        .from('cvs')
        .select('*')
        .maybeSingle() as { data: CVRecord | null }

      if (!cv) return 0

      // Enkel matchningsalgoritm baserat på nyckelord
      const cvText = [
        cv.title || '',
        cv.summary || '',
        ...(cv.skills || []),
        ...(cv.work_experience || []).map((e) => `${e.title} ${e.description || ''}`).join(' ')
      ].join(' ').toLowerCase()

      const jobText = `${jobData.headline} ${jobData.description}`.toLowerCase()

      // Extrahera viktiga ord (enkel implementation)
      const jobWords = jobText.split(/\s+/).filter(w => w.length > 4)
      const uniqueJobWords = [...new Set(jobWords)]

      const matchedWords = uniqueJobWords.filter(word => cvText.includes(word))
      const score = Math.min(95, Math.round((matchedWords.length / Math.min(uniqueJobWords.length, 20)) * 100))

      return score
    } catch (error) {
      console.error('Fel vid CV-matchning:', error)
      return 50 // Default score
    }
  }
}

// ============================================
// NEXT STEP API
// ============================================

export const nextStepApi = {
  /**
   * Hämta användarens progress för nästa-steg analys
   */
  async getUserProgress(): Promise<UserProgress> {
    try {
      // Hämta CV
      const { data: cv } = await supabase
        .from('cvs')
        .select('ats_score, updated_at')
        .maybeSingle()

      // Hämta sparade jobb
      const savedJobs = await savedJobsApi.getAll()
      
      // Hämta ansökningar
      const applications = await jobApplicationsApi.getAll()
      const recentApps = applications.filter(a => {
        const appDate = new Date(a.application_date || a.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return appDate >= weekAgo
      })

      // Hämta personliga brev
      const { data: coverLetters } = await supabase
        .from('cover_letters')
        .select('id')

      // Räkna jobb utan ansökan
      const jobsWithoutApplication = savedJobs.filter(j => j.status === 'SAVED').length

      // Hämta senaste aktivitet
      const lastActivity = cv?.updated_at || 
        (savedJobs[0]?.created_at) || 
        (applications[0]?.created_at) || 
        null

      return {
        hasCV: !!cv,
        cvScore: cv?.ats_score || 0,
        savedJobsCount: savedJobs.length,
        savedJobsWithoutApplication: jobsWithoutApplication,
        applicationsCount: applications.length,
        recentApplications: recentApps.length,
        coverLettersCount: coverLetters?.length || 0,
        lastActivity
      }
    } catch (error) {
      console.error('Fel vid hämtning av progress:', error)
      return {
        hasCV: false,
        cvScore: 0,
        savedJobsCount: 0,
        savedJobsWithoutApplication: 0,
        applicationsCount: 0,
        recentApplications: 0,
        coverLettersCount: 0,
        lastActivity: null
      }
    }
  },

  /**
   * Beräkna nästa steg baserat på användarens progress
   */
  async getNextStep(): Promise<NextStep> {
    const progress = await this.getUserProgress()

    // Prioriteringsordning enligt spec
    
    // 1. Inget CV - högsta prioritet
    if (!progress.hasCV) {
      return {
        type: 'CREATE_CV',
        message: 'Varmt välkommen! Låt oss komma igång',
        submessage: 'Ett bra CV är grunden för en framgångsrik jobbsökning',
        action: { 
          label: 'Skapa ditt första CV', 
          link: '/cv' 
        },
        icon: '📝',
        priority: 'high'
      }
    }

    // 2. Låg CV-score - förbättra CV
    if (progress.cvScore < 50) {
      return {
        type: 'COMPLETE_PROFILE',
        message: 'Ditt CV kan bli ännu bättre!',
        submessage: `Nuvarande poäng: ${progress.cvScore}/100. Lägg till mer information för att öka dina chanser.`,
        action: { 
          label: 'Förbättra CV:t', 
          link: '/cv' 
        },
        icon: '✨',
        priority: 'high'
      }
    }

    // 3. Inga sparade jobb
    if (progress.savedJobsCount === 0) {
      return {
        type: 'SEARCH_JOBS',
        message: 'Bra jobbat med CV:t! Nu är det dags att hitta jobb',
        submessage: 'Vi har tusentals jobb från Arbetsförmedlingen att välja mellan',
        action: { 
          label: 'Sök jobb', 
          link: '/job-search' 
        },
        secondaryAction: {
          label: 'Se matchade jobb för dig',
          link: '/job-search?matched=true'
        },
        icon: '🔍',
        priority: 'high'
      }
    }

    // 4. Sparade jobb utan ansökan
    if (progress.savedJobsWithoutApplication > 0) {
      // Hämta första jobbet utan ansökan
      const savedJobs = await savedJobsApi.getAll()
      const firstUnapplied = savedJobs.find(j => j.status === 'SAVED')
      
      return {
        type: 'CREATE_APPLICATION',
        message: `Du har ${progress.savedJobsWithoutApplication} sparade jobb utan ansökan`,
        submessage: firstUnapplied 
          ? `Börja med "${firstUnapplied.job_data?.headline?.substring(0, 40)}..."`
          : 'Skicka din första ansökan idag!',
        action: { 
          label: firstUnapplied 
            ? `Skapa ansökan för ${firstUnapplied.job_data?.headline?.substring(0, 30)}...`
            : 'Skapa ansökan',
          link: firstUnapplied 
            ? `/dashboard/job-search?createApplication=${firstUnapplied.job_id}`
            : '/dashboard/job-tracker'
        },
        secondaryAction: {
          label: 'Se alla sparade jobb',
          link: '/job-tracker'
        },
        icon: '📨',
        priority: 'high'
      }
    }

    // 5. Aktiv sökare med nyligen skickade ansökningar
    if (progress.recentApplications > 0) {
      return {
        type: 'CONTINUE_SEARCH',
        message: `Du är på rätt väg! ${progress.recentApplications} ansökningar denna vecka.`,
        submessage: 'Fortsätt momentumet och hitta fler intressanta jobb',
        action: { 
          label: 'Sök fler jobb', 
          link: '/job-search' 
        },
        secondaryAction: {
          label: 'Skriv i dagboken',
          link: '/diary'
        },
        icon: '🎯',
        priority: 'medium'
      }
    }

    // 6. Har ansökningar men inga nyligen
    if (progress.applicationsCount > 0) {
      return {
        type: 'CONTINUE_SEARCH',
        message: 'Dags att skicka fler ansökningar!',
        submessage: `Du har skickat ${progress.applicationsCount} ansökningar totalt.`,
        action: { 
          label: 'Fortsätt söka jobb', 
          link: '/job-search' 
        },
        secondaryAction: {
          label: 'Se dina ansökningar',
          link: '/job-tracker'
        },
        icon: '📊',
        priority: 'medium'
      }
    }

    // Default
    return {
      type: 'SEARCH_JOBS',
      message: 'Redo för nästa steg i karriären?',
      action: { 
        label: 'Sök jobb', 
        link: '/job-search' 
      },
      icon: '🚀',
      priority: 'low'
    }
  }
}
