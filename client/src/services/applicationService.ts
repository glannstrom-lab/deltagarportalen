// Automatisk ansökningshantering - NU I MOLNET!
import { type JobAd } from './arbetsformedlingenApi'
import { jobApplicationsApi } from './cloudStorage'
import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'
import { logApplicationSent, logInterviewScheduled } from './communityActivityLogger'

export interface ApplicationData {
  id?: string
  jobId: string
  jobTitle: string
  employer: string
  applicationDate: string
  status: 'draft' | 'sent' | 'viewed' | 'interview' | 'rejected' | 'offer'
  coverLetter?: string
  notes?: string
  contactPerson?: string
  followUpDate?: string
}

export interface ApplicationTemplate {
  id: string
  name: string
  subject: string
  body: string
  isDefault: boolean
}

// Konvertera mellan API-format och internt format
const toApiFormat = (app: ApplicationData): Partial<ApplicationDB> => ({
  job_id: app.jobId,
  job_title: app.jobTitle,
  employer: app.employer,
  application_date: app.applicationDate,
  status: app.status,
  cover_letter: app.coverLetter,
  notes: app.notes,
  contact_person: app.contactPerson,
  follow_up_date: app.followUpDate,
})

interface ApplicationDB {
  id: string;
  job_id: string;
  job_title: string;
  employer: string;
  application_date: string;
  status: ApplicationData['status'];
  cover_letter?: string;
  notes?: string;
  contact_person?: string;
  follow_up_date?: string;
}

const fromApiFormat = (data: ApplicationDB): ApplicationData => ({
  id: data.id,
  jobId: data.job_id,
  jobTitle: data.job_title,
  employer: data.employer,
  applicationDate: data.application_date,
  status: data.status,
  coverLetter: data.cover_letter,
  notes: data.notes,
  contactPerson: data.contact_person,
  followUpDate: data.follow_up_date,
})

class ApplicationService {
  private readonly TEMPLATES_KEY = 'application-templates'
  private localCache: ApplicationData[] | null = null

  // Hämta alla ansökningar (från molnet!)
  async getApplications(): Promise<ApplicationData[]> {
    try {
      const data = await jobApplicationsApi.getAll()
      const apps = data.map(fromApiFormat)
      this.localCache = apps
      return apps
    } catch (error) {
      console.error('Fel vid hämtning av ansökningar:', error)
      // Fallback till cache om vi har den
      if (this.localCache) return this.localCache
      // Fallback till localStorage (legacy)
      const stored = localStorage.getItem('job-applications')
      return stored ? JSON.parse(stored) : []
    }
  }

  // Spara ansökningar (lokalt för cache)
  private saveToLocalStorage(applications: ApplicationData[]): void {
    // Behåll som backup/fallback
    try {
      localStorage.setItem('job-applications', JSON.stringify(applications))
    } catch {
      // Ignorera fel
    }
  }

  // Skapa ny ansökan (i molnet!)
  async createApplication(data: Omit<ApplicationData, 'applicationDate'>): Promise<ApplicationData> {
    const application: ApplicationData = {
      ...data,
      applicationDate: new Date().toISOString(),
    }

    try {
      const result = await jobApplicationsApi.add(toApiFormat(application))
      const createdApp = fromApiFormat(result)

      // Uppdatera cache
      if (this.localCache) {
        this.localCache.push(createdApp)
        this.saveToLocalStorage(this.localCache)
      }

      // Logga till community feed (om status är 'sent')
      if (application.status === 'sent') {
        logApplicationSent(application.employer, application.jobTitle)
      }

      return createdApp
    } catch (error) {
      console.error('Fel vid skapande av ansökan:', error)
      // Fallback: spara lokalt
      const applications = await this.getApplications()
      applications.push(application)
      this.saveToLocalStorage(applications)
      this.localCache = applications
      return application
    }
  }

  // Uppdatera ansökan (i molnet!)
  async updateApplication(jobId: string, updates: Partial<ApplicationData>): Promise<void> {
    try {
      // Hitta ansökan först
      const apps = await this.getApplications()
      const app = apps.find(a => a.jobId === jobId)

      if (app?.id) {
        await jobApplicationsApi.update(app.id, {
          ...updates,
          job_id: updates.jobId,
          job_title: updates.jobTitle,
          employer: updates.employer,
          application_date: updates.applicationDate,
          cover_letter: updates.coverLetter,
          contact_person: updates.contactPerson,
          follow_up_date: updates.followUpDate,
        })

        // Logga till community feed om status ändras till intervju
        if (updates.status === 'interview' && app.status !== 'interview') {
          logInterviewScheduled(app.employer)
        }
      }

      // Uppdatera cache
      if (this.localCache) {
        this.localCache = this.localCache.map(a =>
          a.jobId === jobId ? { ...a, ...updates } : a
        )
        this.saveToLocalStorage(this.localCache)
      }
    } catch (error) {
      console.error('Fel vid uppdatering av ansökan:', error)
      // Fallback: uppdatera lokalt
      const applications = await this.getApplications()
      const updated = applications.map(app =>
        app.jobId === jobId ? { ...app, ...updates } : app
      )
      this.saveToLocalStorage(updated)
      this.localCache = updated
    }
  }

  // Ta bort ansökan (från molnet!)
  async deleteApplication(jobId: string): Promise<void> {
    try {
      const apps = await this.getApplications()
      const app = apps.find(a => a.jobId === jobId)
      
      if (app?.id) {
        await jobApplicationsApi.delete(app.id)
      }
      
      // Uppdatera cache
      if (this.localCache) {
        this.localCache = this.localCache.filter(a => a.jobId !== jobId)
        this.saveToLocalStorage(this.localCache)
      }
    } catch (error) {
      console.error('Fel vid borttagning av ansökan:', error)
      // Fallback: ta bort lokalt
      const applications = await this.getApplications()
      const filtered = applications.filter(app => app.jobId !== jobId)
      this.saveToLocalStorage(filtered)
      this.localCache = filtered
    }
  }

  // Hämta ansökan för specifikt jobb
  async getApplicationByJobId(jobId: string): Promise<ApplicationData | undefined> {
    const apps = await this.getApplications()
    return apps.find(app => app.jobId === jobId)
  }

  // Kolla om redan ansökt
  async hasApplied(jobId: string): Promise<boolean> {
    const apps = await this.getApplications()
    return apps.some(app => app.jobId === jobId)
  }

  // Hämta mallar (dessa är personliga, sparar i Supabase)
  async getTemplates(): Promise<ApplicationTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('application_templates')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data && data.length > 0) {
        return data.map(t => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          body: t.body,
          isDefault: t.is_default,
        }))
      }
    } catch (error) {
      storageLogger.debug('Använder localStorage för mallar:', error)
    }

    // Fallback till localStorage
    const stored = localStorage.getItem(this.TEMPLATES_KEY)
    if (stored) return JSON.parse(stored)

    // Standardmallar
    const defaults: ApplicationTemplate[] = [
      {
        id: 'default-1',
        name: 'Standard',
        subject: 'Ansökan om tjänsten som [YRKESROLL]',
        body: `Hej!

Jag heter [DITT NAMN] och skriver med stort intresse angående tjänsten som [YRKESROLL] på [FÖRETAG].

Med min bakgrund inom [RELEVANT ERFARENHET] och mina kunskaper inom [KOMPETENSER] tror jag att jag skulle passa väl in i ert team. Jag är särskilt intresserad av [NÅGOT SPECIFIKT MED FÖRETAGET/JOBBET].

Jag ser fram emot möjligheten att diskutera hur jag kan bidra till [FÖRETAG] fortsatta framgång.

Med vänliga hälsningar,
[DITT NAMN]
[DITT TELEFONNUMMER]
[DIN E-POST]`,
        isDefault: true,
      },
      {
        id: 'default-2',
        name: 'Kort & Koncis',
        subject: 'Ansökan: [YRKESROLL]',
        body: `Hej!

Jag är [DITT NAMN], en [KORT BESKRIVNING AV DIG]. Jag såg er annons om [YRKESROLL] och blev genast intresserad.

Det som lockar mig med [FÖRETAG] är [SPECIFIKT]. Jag har [X ÅR] erfarenhet av [RELEVANT] och skulle gärna bidra med [KOMPETENS].

Bifogat finner du mitt CV. Jag hoppas vi får möjlighet att träffas!

Vänliga hälsningar,
[DITT NAMN]`,
        isDefault: false,
      },
      {
        id: 'default-3',
        name: 'Omväxling',
        subject: 'Driven [YRKESROLL] söker nya utmaningar',
        body: `Hej [FÖRETAG]!

Efter [X ÅR] inom [NUVARANDE BRANSCH/ROLL] söker jag nu nya utmaningar. Er tjänst som [YRKESROLL] verkar vara precis det jag letar efter.

Jag har utvecklat starka färdigheter inom:
• [KOMPETENS 1]
• [KOMPETENS 2]  
• [KOMPETENS 3]

Vad jag kan erbjuda [FÖRETAG]:
→ [VÄRDE 1]
→ [VÄRDE 2]
→ [VÄRDE 3]

Jag ser verkligen fram emot att höra från er!

Med vänliga hälsningar,
[DITT NAMN]
[TELEFON] | [E-POST]`,
        isDefault: false,
      },
    ]

    this.saveTemplates(defaults)
    return defaults
  }

  // Spara mallar (till molnet!)
  private async saveTemplates(templates: ApplicationTemplate[]): Promise<void> {
    try {
      // Spara till Supabase
      const { error } = await supabase
        .from('application_templates')
        .upsert(
          templates.map(t => ({
            id: t.id,
            name: t.name,
            subject: t.subject,
            body: t.body,
            is_default: t.isDefault,
          })),
          { onConflict: 'id' }
        )
      
      if (error) throw error
    } catch (error) {
      // Fallback till localStorage
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates))
    }
  }

  // Skapa mall (i molnet!)
  async createTemplate(template: Omit<ApplicationTemplate, 'id'>): Promise<ApplicationTemplate> {
    const newTemplate: ApplicationTemplate = {
      ...template,
      id: `template-${Date.now()}`,
    }

    const templates = await this.getTemplates()
    templates.push(newTemplate)
    await this.saveTemplates(templates)

    return newTemplate
  }

  // Generera personligt brev baserat på mall och jobb
  generateCoverLetter(
    template: ApplicationTemplate,
    job: JobAd,
    userData: {
      name: string
      phone?: string
      email?: string
      experience?: string
      skills?: string[]
    }
  ): string {
    let letter = template.body

    // Ersätt placeholders
    const replacements: Record<string, string> = {
      '[YRKESROLL]': job.headline,
      '[FÖRETAG]': job.employer.name,
      '[DITT NAMN]': userData.name,
      '[DITT TELEFONNUMMER]': userData.phone || '[Ditt telefonnummer]',
      '[DIN E-POST]': userData.email || '[Din e-post]',
      '[TELEFON]': userData.phone || '[Telefon]',
      '[E-POST]': userData.email || '[E-post]',
      '[RELEVANT ERFARENHET]': userData.experience || '[relevant erfarenhet]',
      '[KOMPETENSER]': userData.skills?.join(', ') || '[kompetenser]',
      '[KOMPETENS]': userData.skills?.[0] || '[kompetens]',
      '[NÅGOT SPECIFIKT MED FÖRETAGET/JOBBET]': 'ert spännande arbete',
      '[KORT BESKRIVNING AV DIG]': 'motiverad yrkesutövare',
      '[X ÅR]': 'flera år',
      '[NUVARANDE BRANSCH/ROLL]': 'branschen',
      '[VÄRDE 1]': 'Engagemang',
      '[VÄRDE 2]': 'Kompetens',
      '[VÄRDE 3]': 'Pålitlighet',
      '[KOMPETENS 1]': userData.skills?.[0] || 'Kompetens 1',
      '[KOMPETENS 2]': userData.skills?.[1] || 'Kompetens 2',
      '[KOMPETENS 3]': userData.skills?.[2] || 'Kompetens 3',
    }

    for (const [placeholder, value] of Object.entries(replacements)) {
      letter = letter.replace(new RegExp(placeholder.replace(/[\[\]]/g, '\\$&'), 'g'), value)
    }

    return letter
  }

  // Förbered e-post för ansökan
  prepareEmail(
    job: JobAd,
    coverLetter: string,
    _options: {
      attachCV?: boolean
      cvFileName?: string
    } = {}
  ): {
    to?: string
    subject: string
    body: string
    mailtoLink: string
  } {
    const to = job.application_details?.email
    const subject = `Ansökan: ${job.headline}`
    
    const body = `${coverLetter}

---

Med vänliga hälsningar,

[Användarens kontaktinformation kommer här]`

    const encodedSubject = encodeURIComponent(subject)
    const encodedBody = encodeURIComponent(body)
    
    const mailtoLink = to 
      ? `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`
      : ''

    return { to, subject, body, mailtoLink }
  }

  // Schemalägg påminnelse om uppföljning
  async scheduleFollowUp(jobId: string, daysFromNow: number = 7): Promise<void> {
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + daysFromNow)

    await this.updateApplication(jobId, {
      followUpDate: followUpDate.toISOString(),
    })
  }

  // Hämta kommande uppföljningar
  async getUpcomingFollowUps(): Promise<ApplicationData[]> {
    const now = new Date().toISOString()
    const apps = await this.getApplications()
    return apps
      .filter(app => 
        app.followUpDate && 
        app.followUpDate > now &&
        app.status !== 'rejected' &&
        app.status !== 'offer'
      )
      .sort((a, b) => 
        new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()
      )
  }

  // Statistik över ansökningar
  async getStatistics(): Promise<{
    total: number
    byStatus: Record<string, number>
    responseRate: number
    interviewRate: number
  }> {
    const applications = await this.getApplications()
    
    const byStatus: Record<string, number> = {}
    applications.forEach(app => {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1
    })

    const withResponse = applications.filter(app => 
      ['viewed', 'interview', 'rejected', 'offer'].includes(app.status)
    ).length

    const interviews = applications.filter(app => 
      ['interview', 'offer'].includes(app.status)
    ).length

    return {
      total: applications.length,
      byStatus,
      responseRate: applications.length > 0 ? (withResponse / applications.length) * 100 : 0,
      interviewRate: applications.length > 0 ? (interviews / applications.length) * 100 : 0,
    }
  }
}

export const applicationService = new ApplicationService()
