/**
 * External Job API Integrations
 * Integrationer med Arbetsförmedlingen, LinkedIn och andra jobb-API:er
 */

import { z } from 'zod'

// Schemas för jobbdata
export const JobPostingSchema = z.object({
  id: z.string(),
  source: z.enum(['arbetsformedlingen', 'linkedin', 'indeed', 'other']),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  employmentType: z.enum(['permanent', 'temporary', 'contract', 'internship', 'part_time']),
  publishedAt: z.string().datetime(),
  applicationDeadline: z.string().datetime().optional(),
  url: z.string().url(),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('SEK')
  }).optional(),
  contact: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional()
  }).optional(),
  skills: z.array(z.string()),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive'])
})

export const SearchFiltersSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  radius: z.number().default(50), // km
  jobType: z.array(z.string()).optional(),
  experienceLevel: z.array(z.string()).optional(),
  publishedWithin: z.enum(['24h', '7d', '30d', 'any']).default('any'),
  salaryMin: z.number().optional(),
  excludeWords: z.array(z.string()).optional()
})

export type JobPosting = z.infer<typeof JobPostingSchema>
export type SearchFilters = z.infer<typeof SearchFiltersSchema>

// Arbetsförmedlingen API-integration
export class ArbetsformedlingenAPI {
  private baseUrl = 'https://jobsearch.api.jobtechdev.se'
  
  async searchJobs(filters: SearchFilters): Promise<JobPosting[]> {
    try {
      const params = new URLSearchParams()
      
      if (filters.query) params.append('q', filters.query)
      if (filters.location) {
        params.append('place', filters.location)
        params.append('radius', filters.radius?.toString() || '50')
      }
      if (filters.publishedWithin !== 'any') {
        const days = filters.publishedWithin === '24h' ? 1 : 
                     filters.publishedWithin === '7d' ? 7 : 30
        params.append('published-after', days.toString())
      }
      
      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'Accept': 'application/json',
          'api-key': import.meta.env.VITE_AF_API_KEY || ''
        }
      })
      
      if (!response.ok) {
        throw new Error(`AF API error: ${response.status}`)
      }
      
interface AFJobHit {
  id: string;
  headline?: string;
  employer?: { name?: string };
  workplace_address?: { municipality?: string };
  description?: { text?: string };
  must_have?: { skills?: Array<{ label: string }> };
  nice_to_have?: { skills?: Array<{ label: string }> };
  employment_type?: { label?: string };
  publication_date: string;
  application_deadline?: string;
  webpage_url?: string;
  experience_required?: boolean;
}

interface AFJobSearchResponse {
  hits?: AFJobHit[];
}

      const data = await response.json() as AFJobSearchResponse;

      return data.hits?.map((hit) => this.transformAFJob(hit)) || []
    } catch (error) {
      console.error('Arbetsförmedlingen search failed:', error)
      return this.getMockJobs() // Fallback till mock-data
    }
  }

  async getJobDetails(id: string): Promise<JobPosting | null> {
    try {
      const response = await fetch(`${this.baseUrl}/ad/${id}`, {
        headers: {
          'Accept': 'application/json',
          'api-key': import.meta.env.VITE_AF_API_KEY || ''
        }
      })

      if (!response.ok) return null

      const data = await response.json() as AFJobHit;
      return this.transformAFJob(data)
    } catch (error) {
      console.error('Failed to fetch job details:', error)
      return null
    }
  }

  private transformAFJob(hit: AFJobHit): JobPosting {
    return {
      id: hit.id,
      source: 'arbetsformedlingen',
      title: hit.headline || 'Okänd tjänst',
      company: hit.employer?.name || 'Okänt företag',
      location: hit.workplace_address?.municipality || 'Ort ej angiven',
      description: hit.description?.text || '',
      requirements: hit.must_have?.skills?.map((s) => s.label) || [],
      employmentType: this.mapEmploymentType(hit.employment_type?.label),
      publishedAt: hit.publication_date,
      applicationDeadline: hit.application_deadline,
      url: hit.webpage_url || `https://arbetsformedlingen.se/platsbanken/annonser/${hit.id}`,
      skills: [...(hit.must_have?.skills?.map((s) => s.label) || []),
               ...(hit.nice_to_have?.skills?.map((s) => s.label) || [])],
      experienceLevel: this.mapExperienceLevel(hit.experience_required)
    }
  }
  
  private mapEmploymentType(type?: string): JobPosting['employmentType'] {
    if (!type) return 'permanent'
    const lower = type.toLowerCase()
    if (lower.includes('tillsvidare')) return 'permanent'
    if (lower.includes('projekt') || lower.includes('visstid')) return 'temporary'
    if (lower.includes('vikariat')) return 'contract'
    if (lower.includes('praktik') || lower.includes('lärling')) return 'internship'
    if (lower.includes('deltid')) return 'part_time'
    return 'permanent'
  }
  
  private mapExperienceLevel(required?: boolean): JobPosting['experienceLevel'] {
    if (required === false) return 'entry'
    return 'mid' // Default assumption
  }
  
  private getMockJobs(): JobPosting[] {
    return [
      {
        id: 'mock-1',
        source: 'arbetsformedlingen',
        title: 'Kundservicemedarbetare',
        company: 'Stockholm Stad',
        location: 'Stockholm',
        description: 'Vi söker en engagerad kundservice...',
        requirements: ['God kommunikationsförmåga', 'Svenska flytande', 'Erfarenhet av kundservice'],
        employmentType: 'permanent',
        publishedAt: new Date().toISOString(),
        url: 'https://arbetsformedlingen.se',
        skills: ['Kommunikation', 'Kundservice', 'Svenska'],
        experienceLevel: 'entry'
      },
      {
        id: 'mock-2',
        source: 'arbetsformedlingen',
        title: 'Lagerarbetare',
        company: 'PostNord',
        location: 'Göteborg',
        description: 'Söker dig som vill arbeta på lager...',
        requirements: ['Fysisk arbetsförmåga', 'B-körkort', 'Punktlig'],
        employmentType: 'temporary',
        publishedAt: new Date().toISOString(),
        url: 'https://arbetsformedlingen.se',
        skills: ['Lager', 'Logistik', 'Körkort'],
        experienceLevel: 'entry'
      }
    ]
  }
}

// LinkedIn API (begränsad tillgänglighet för jobbsökning)
export class LinkedInAPI {
  // LinkedIn har begränsade öppna API:er för jobbsökning
  // Detta är en placeholder för framtida implementation
  
  async searchJobs(filters: SearchFilters): Promise<JobPosting[]> {
    // LinkedIn Job Search API kräver vanligtvis partnerskap
    console.warn('LinkedIn API integration requires partnership approval')
    return []
  }
  
  generateProfileUrl(userProfile: {
    firstName: string
    lastName: string
    headline?: string
  }): string {
    // Generera en LinkedIn profil-URL för delning
    const baseUrl = 'https://www.linkedin.com/in/'
    const slug = `${userProfile.firstName}-${userProfile.lastName}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    return `${baseUrl}${slug}`
  }
  
  generateShareUrl(job: JobPosting): string {
    // Generera en delnings-URL för ett jobb
    const text = encodeURIComponent(`Jag söker jobbet "${job.title}" på ${job.company}!`)
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(job.url)}&summary=${text}`
  }
}

// Jobbaggregator - kombinerar flera källor
export class JobAggregator {
  private afApi = new ArbetsformedlingenAPI()
  private linkedInApi = new LinkedInAPI()
  
  async searchAll(filters: SearchFilters): Promise<{
    jobs: JobPosting[]
    sources: Record<string, number>
    totalCount: number
  }> {
    const [afJobs, linkedInJobs] = await Promise.all([
      this.afApi.searchJobs(filters),
      this.linkedInApi.searchJobs(filters).catch(() => []) // LinkedIn kan misslyckas
    ])
    
    const allJobs = [...afJobs, ...linkedInJobs]
    
    // Deduplicera baserat på titel+företag+ort
    const uniqueJobs = this.deduplicateJobs(allJobs)
    
    // Sortera efter relevans (publiceringsdatum)
    const sortedJobs = uniqueJobs.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    
    const sources = {
      arbetsformedlingen: afJobs.length,
      linkedin: linkedInJobs.length
    }
    
    return {
      jobs: sortedJobs,
      sources,
      totalCount: sortedJobs.length
    }
  }
  
  private deduplicateJobs(jobs: JobPosting[]): JobPosting[] {
    const seen = new Set<string>()
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}-${job.location.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  
  // AI-driven jobbrekommendation
  async getRecommendedJobs(userProfile: {
    skills: string[]
    experience: string[]
    preferredLocations: string[]
    savedJobs: string[]
  }, limit: number = 10): Promise<JobPosting[]> {
    // Bygg sökfråga baserat på användarens skills
    const skillQuery = userProfile.skills.slice(0, 3).join(' ')
    const location = userProfile.preferredLocations[0]
    
    const { jobs } = await this.searchAll({
      query: skillQuery,
      location,
      publishedWithin: '7d'
    })
    
    // Scorea och ranka jobb baserat på matchning
    const scoredJobs = jobs.map(job => ({
      job,
      score: this.calculateJobMatchScore(job, userProfile)
    }))
    
    return scoredJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(sj => sj.job)
  }
  
  private calculateJobMatchScore(job: JobPosting, profile: {
    skills: string[]
    experience: string[]
    preferredLocations: string[]
    savedJobs: string[]
  }): number {
    let score = 0
    
    // Skills match (40%)
    const jobSkills = job.skills.map(s => s.toLowerCase())
    const userSkills = profile.skills.map(s => s.toLowerCase())
    const matchingSkills = jobSkills.filter(s => 
      userSkills.some(us => us.includes(s) || s.includes(us))
    )
    score += (matchingSkills.length / Math.max(jobSkills.length, 1)) * 40
    
    // Location match (20%)
    if (profile.preferredLocations.some(loc => 
      job.location.toLowerCase().includes(loc.toLowerCase())
    )) {
      score += 20
    }
    
    // Experience relevance (20%)
    const relevantExperience = profile.experience.some(exp => 
      job.description.toLowerCase().includes(exp.toLowerCase()) ||
      job.title.toLowerCase().includes(exp.toLowerCase())
    )
    if (relevantExperience) score += 20
    
    // Freshness (10%)
    const daysSincePublished = Math.floor(
      (Date.now() - new Date(job.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSincePublished <= 1) score += 10
    else if (daysSincePublished <= 7) score += 5
    
    // Boost för liknande sparade jobb (10%)
    if (profile.savedJobs.length > 0) {
      // Simplified similarity check
      score += 5 // Placeholder
    }
    
    return Math.min(100, score)
  }
}

// Export singleton instances
export const afApi = new ArbetsformedlingenAPI()
export const linkedInApi = new LinkedInAPI()
export const jobAggregator = new JobAggregator()
