// Automatisk ansökningshantering
import { type JobAd } from './arbetsformedlingenApi'

export interface ApplicationData {
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

class ApplicationService {
  private readonly APPLICATIONS_KEY = 'job-applications'
  private readonly TEMPLATES_KEY = 'application-templates'

  // Hämta alla ansökningar
  getApplications(): ApplicationData[] {
    const stored = localStorage.getItem(this.APPLICATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  // Spara ansökningar
  private saveApplications(applications: ApplicationData[]): void {
    localStorage.setItem(this.APPLICATIONS_KEY, JSON.stringify(applications))
  }

  // Skapa ny ansökan
  createApplication(data: Omit<ApplicationData, 'applicationDate'>): ApplicationData {
    const application: ApplicationData = {
      ...data,
      applicationDate: new Date().toISOString(),
    }

    const applications = this.getApplications()
    applications.push(application)
    this.saveApplications(applications)

    return application
  }

  // Uppdatera ansökan
  updateApplication(jobId: string, updates: Partial<ApplicationData>): void {
    const applications = this.getApplications().map(app =>
      app.jobId === jobId ? { ...app, ...updates } : app
    )
    this.saveApplications(applications)
  }

  // Ta bort ansökan
  deleteApplication(jobId: string): void {
    const applications = this.getApplications().filter(app => app.jobId !== jobId)
    this.saveApplications(applications)
  }

  // Hämta ansökan för specifikt jobb
  getApplicationByJobId(jobId: string): ApplicationData | undefined {
    return this.getApplications().find(app => app.jobId === jobId)
  }

  // Kolla om redan ansökt
  hasApplied(jobId: string): boolean {
    return this.getApplications().some(app => app.jobId === jobId)
  }

  // Hämta mallar
  getTemplates(): ApplicationTemplate[] {
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

  // Spara mallar
  private saveTemplates(templates: ApplicationTemplate[]): void {
    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates))
  }

  // Skapa mall
  createTemplate(template: Omit<ApplicationTemplate, 'id'>): ApplicationTemplate {
    const newTemplate: ApplicationTemplate = {
      ...template,
      id: `template-${Date.now()}`,
    }

    const templates = this.getTemplates()
    templates.push(newTemplate)
    this.saveTemplates(templates)

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
  scheduleFollowUp(jobId: string, daysFromNow: number = 7): void {
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + daysFromNow)

    this.updateApplication(jobId, {
      followUpDate: followUpDate.toISOString(),
    })
  }

  // Hämta kommande uppföljningar
  getUpcomingFollowUps(): ApplicationData[] {
    const now = new Date().toISOString()
    return this.getApplications()
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
  getStatistics(): {
    total: number
    byStatus: Record<string, number>
    responseRate: number
    interviewRate: number
  } {
    const applications = this.getApplications()
    
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
