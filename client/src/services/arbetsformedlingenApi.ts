// API för Arbetsförmedlingens JobSearch, JobAd Enrichments och JobEd Connect
// Dokumentation: https://jobsearch.api.jobtechdev.se/
// Dokumentation: https://enrichments.api.jobtechdev.se/
// Dokumentation: https://education-api.jobtechdev.se/

const JOBSEARCH_BASE_URL = 'https://jobsearch.api.jobtechdev.se'
const ENRICHMENTS_BASE_URL = 'https://enrichments.api.jobtechdev.se'
const EDUCATION_BASE_URL = 'https://education-api.jobtechdev.se'
const HISTORICAL_BASE_URL = 'https://historical.api.jobtechdev.se'

// ============================================
// TYPER
// ============================================

export interface JobAd {
  id: string
  headline: string
  description: {
    text: string
    text_formatted: string
  }
  employer: {
    name: string
    workplace?: string
    url?: string
    email?: string
    phone_number?: string
    organization_number?: string
  }
  workplace_address?: {
    street_address?: string
    region?: string
    municipality?: string
    city?: string
    country?: string
    postcode?: string
  }
  occupation: {
    concept_id: string
    label: string
    legacy_ams_taxonomy_id: string
  }
  occupation_group?: {
    concept_id: string
    label: string
    legacy_ams_taxonomy_id: string
  }
  occupation_field?: {
    concept_id: string
    label: string
    legacy_ams_taxonomy_id: string
  }
  application_details?: {
    reference?: string
    email?: string
    via_af?: boolean
    url?: string
    other?: string
  }
  application_deadline?: string
  application_contacts?: Array<{
    name?: string
    email?: string
    phone?: string
  }>
  publication_date: string
  last_publication_date?: string
  removed?: boolean
  salary_type?: {
    concept_id: string
    label: string
    legacy_ams_taxonomy_id: string
  }
  salary_description?: string
  employment_type?: {
    concept_id: string
    label: string
    legacy_ams_taxonomy_id: string
  }
  experience_required?: boolean
  driving_license_required?: boolean
  driving_license?: Array<{
    concept_id: string
    label: string
  }>
  must_have?: {
    skills?: Array<{
      concept_id: string
      label: string
      legacy_ams_taxonomy_id: string
      weight: number
    }>
    languages?: Array<{
      concept_id: string
      label: string
      legacy_ams_taxonomy_id: string
      weight: number
    }>
    work_experiences?: Array<{
      concept_id: string
      label: string
      legacy_ams_taxonomy_id: string
      weight: number
    }>
    education?: Array<{
      concept_id: string
      label: string
      legacy_ams_taxonomy_id: string
      weight: number
    }>
    education_level?: Array<{
      concept_id: string
      label: string
      legacy_ams_taxonomy_id: string
      weight: number
    }>
  }
  nice_to_have?: {
    skills?: Array<{
      concept_id: string
      label: string
      legacy_ams_taxonomy_id: string
      weight: number
    }>
    languages?: Array<{
      concept_id: string
      label: string
      legacy_ams_taxonomy_id: string
      weight: number
    }>
    work_experiences?: Array<{
      concept_id: string
      label: string
      legacy_ams_taxonomy_id: string
      weight: number
    }>
    education?: Array<{
      concept_id: string
      label: string
      legacy_ams_taxonomy_id: string
      weight: number
    }>
  }
}

export interface JobSearchResponse {
  total: {
    value: number
  }
  hits: JobAd[]
  positions: number
}

export interface SearchFilters {
  q?: string
  occupation?: string
  occupation_group?: string
  occupation_field?: string
  municipality?: string
  region?: string
  experience?: boolean
  driving_license?: boolean
  remote?: boolean
  employment_type?: string
  published_after?: string
  limit?: number
  offset?: number
  sort?: 'relevance' | 'pubdate-desc' | 'pubdate-asc' | 'applydate-desc' | 'applydate-asc'
}

// Enrichment API typer
export interface EnrichmentEntity {
  label: string
  type: 'skill' | 'occupation' | 'language' | 'location' | 'education'
  frequency: number
  confidence?: number
}

export interface EnrichmentRelation {
  source: string
  target: string
  type: string
  weight: number
}

export interface EnrichmentResult {
  entities: EnrichmentEntity[]
  relations?: EnrichmentRelation[]
  text_analysis?: {
    complexity: number
    formality: number
  }
}

// JobEd Connect typer
export interface Education {
  id: string
  title: string
  description: string
  education_type: string
  duration_months: number
  provider: string
  municipality: string
  url?: string
}

export interface OccupationEducationMatch {
  occupation: {
    concept_id: string
    label: string
  }
  matching_educations: Education[]
  required_competencies: string[]
  matching_percentage: number
}

export interface CareerPath {
  occupation: string
  ssyk_code: string
  education_options: Education[]
  required_competencies: string[]
  nice_to_have_competencies: string[]
  entry_level_jobs: JobAd[]
  salary_range?: {
    min: number
    max: number
    median: number
  }
  demand_trend: 'increasing' | 'stable' | 'decreasing'
}

// CV Match Analys
export interface CVMatchAnalysis {
  job_id: string
  job_title: string
  match_percentage: number
  matching_skills: string[]
  missing_skills: string[]
  matching_languages: string[]
  missing_languages: string[]
  experience_match: boolean
  education_match: boolean
  suggestions: string[]
  priority_improvements: string[]
}

// Lönestatistik
export interface SalaryStats {
  occupation: string
  average_salary: number
  median_salary: number
  salary_range: {
    min: number
    max: number
  }
  trend: 'increasing' | 'stable' | 'decreasing'
  trend_percentage: number
  sample_size: number
  period: string
}

// Kompetenstrender
export interface SkillTrend {
  skill: string
  growth_rate: number
  current_demand: number
  historical_demand: number
  trend_direction: 'up' | 'down' | 'stable'
}

// ============================================
// HUVUDKLASS
// ============================================

class ArbetsformedlingenAPI {
  private async fetch<T>(baseUrl: string, endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryParams = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : ''

    const response = await fetch(`${baseUrl}${endpoint}${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // ============================================
  // JOBSEARCH API
  // ============================================

  async searchJobs(filters: SearchFilters = {}): Promise<JobSearchResponse> {
    return this.fetch<JobSearchResponse>(JOBSEARCH_BASE_URL, '/search', {
      ...filters,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    })
  }

  async getJobById(id: string): Promise<JobAd> {
    return this.fetch<JobAd>(JOBSEARCH_BASE_URL, `/ad/${id}`)
  }

  async searchByQuery(query: string, limit: number = 10): Promise<JobSearchResponse> {
    return this.searchJobs({ q: query, limit })
  }

  async getAutocomplete(query: string, type: string = 'occupation'): Promise<any[]> {
    const response = await this.fetch<any>(JOBSEARCH_BASE_URL, '/complete', {
      q: query,
      type,
      limit: 10,
    })
    return response.typeahead || []
  }

  // ============================================
  // TAXONOMI
  // ============================================

  async getOccupations(query?: string, limit: number = 20): Promise<any[]> {
    const response = await this.fetch<any>(JOBSEARCH_BASE_URL, '/taxonomy/concepts', {
      type: 'occupation-name',
      q: query,
      limit,
    })
    return response.concepts || []
  }

  async getSkills(query?: string, limit: number = 20): Promise<any[]> {
    const response = await this.fetch<any>(JOBSEARCH_BASE_URL, '/taxonomy/concepts', {
      type: 'skill',
      q: query,
      limit,
    })
    return response.concepts || []
  }

  async getMunicipalities(): Promise<any[]> {
    const response = await this.fetch<any>(JOBSEARCH_BASE_URL, '/taxonomy/concepts', {
      type: 'municipality',
      limit: 100,
    })
    return response.concepts || []
  }

  async getRegions(): Promise<any[]> {
    const response = await this.fetch<any>(JOBSEARCH_BASE_URL, '/taxonomy/concepts', {
      type: 'region',
      limit: 30,
    })
    return response.concepts || []
  }

  async getRelatedConcepts(conceptId: string, relationType: string): Promise<any[]> {
    const response = await this.fetch<any>(JOBSEARCH_BASE_URL, '/taxonomy/graph', {
      concept_id: conceptId,
      relation: relationType,
    })
    return response.related_concepts || []
  }

  // ============================================
  // ENRICHMENTS API - AI-analys
  // ============================================

  async enrichJobAd(text: string): Promise<EnrichmentResult> {
    try {
      const response = await fetch(`${ENRICHMENTS_BASE_URL}/enrichment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`Enrichment API error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('Enrichment API error:', error)
      // Fallback till lokal analys
      return this.fallbackEnrichment(text)
    }
  }

  private fallbackEnrichment(text: string): EnrichmentResult {
    // Enkel regex-baserad extraktion om API:et inte fungerar
    const skills = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'python',
      'java', 'c#', 'sql', 'mongodb', 'postgresql', 'docker', 'kubernetes',
      'aws', 'azure', 'git', 'agil', 'scrum', 'kanban', 'projektledning',
      'kundservice', 'försäljning', 'marknadsföring', 'ekonomi', 'redovisning',
      'hr', 'administration', 'ledarskap', 'kommunikation', 'svenska', 'engelska'
    ]

    const foundSkills = skills
      .filter(skill => text.toLowerCase().includes(skill.toLowerCase()))
      .map(skill => ({
        label: skill.charAt(0).toUpperCase() + skill.slice(1),
        type: 'skill' as const,
        frequency: 1
      }))

    return {
      entities: foundSkills,
      relations: []
    }
  }

  async analyzeJobMatch(jobId: string, userSkills: string[]): Promise<CVMatchAnalysis> {
    const job = await this.getJobById(jobId)
    const enriched = await this.enrichJobAd(job.description.text)
    
    // Extrahera kompetenser från must_have
    const requiredSkills = [
      ...(job.must_have?.skills || []).map(s => s.label.toLowerCase()),
      ...(enriched.entities
        .filter(e => e.type === 'skill')
        .map(e => e.label.toLowerCase()))
    ]
    
    const requiredLanguages = (job.must_have?.languages || []).map(l => l.label.toLowerCase())
    
    // Jämför med användarens kompetenser
    const userSkillsLower = userSkills.map(s => s.toLowerCase())
    
    const matchingSkills = requiredSkills.filter(skill =>
      userSkillsLower.some(userSkill => 
        userSkill.includes(skill) || skill.includes(userSkill)
      )
    )
    
    const missingSkills = [...new Set(requiredSkills.filter(skill => 
      !matchingSkills.some(match => 
        match.includes(skill) || skill.includes(match)
      )
    ))]
    
    const matchingLanguages = requiredLanguages.filter(lang =>
      userSkillsLower.some(skill => skill.includes(lang))
    )
    
    const missingLanguages = requiredLanguages.filter(lang =>
      !matchingLanguages.includes(lang)
    )
    
    // Beräkna matchningsprocent
    const skillWeight = requiredSkills.length > 0 ? 0.6 : 0
    const langWeight = requiredLanguages.length > 0 ? 0.2 : 0
    
    const skillScore = requiredSkills.length > 0 
      ? (matchingSkills.length / requiredSkills.length) * skillWeight 
      : 0
    const langScore = requiredLanguages.length > 0
      ? (matchingLanguages.length / requiredLanguages.length) * langWeight
      : 0
    const expScore = !job.experience_required ? 0.1 : 0
    const eduScore = !job.must_have?.education?.length ? 0.1 : 0
    
    const totalPercentage = Math.round((skillScore + langScore + expScore + eduScore) * 100)
    
    // Generera förslag
    const suggestions = this.generateSuggestions(
      job, 
      matchingSkills, 
      missingSkills,
      matchingLanguages,
      missingLanguages
    )
    
    return {
      job_id: jobId,
      job_title: job.headline,
      match_percentage: totalPercentage,
      matching_skills: [...new Set(matchingSkills)],
      missing_skills: missingSkills.slice(0, 10),
      matching_languages: matchingLanguages,
      missing_languages: missingLanguages,
      experience_match: !job.experience_required || job.nice_to_have?.work_experiences?.length === 0,
      education_match: !job.must_have?.education?.length,
      suggestions: suggestions.general,
      priority_improvements: suggestions.priority,
    }
  }

  private generateSuggestions(
    job: JobAd,
    matchingSkills: string[],
    missingSkills: string[],
    _matchingLanguages: string[],
    missingLanguages: string[]
  ): { general: string[]; priority: string[] } {
    const suggestions: string[] = []
    const priority: string[] = []
    
    if (matchingSkills.length > 0) {
      suggestions.push(`Bra! Du har ${matchingSkills.length} av de efterfrågade kompetenserna.`)
    }
    
    if (missingSkills.length > 0) {
      suggestions.push(`Överväg att lägga till dessa kompetenser i ditt CV: ${missingSkills.slice(0, 5).join(', ')}`)
      priority.push(`Fokusera på att utveckla: ${missingSkills[0]}`)
    }
    
    if (missingLanguages.length > 0) {
      suggestions.push(`Språkkunskaper som kan stärka din ansökan: ${missingLanguages.join(', ')}`)
    }
    
    if (job.driving_license_required) {
      suggestions.push('Körkort krävs för denna tjänst. Se till att nämna det i ditt CV.')
    }
    
    if (job.must_have?.education?.length) {
      suggestions.push(`Utbildningskrav: ${job.must_have.education.map(e => e.label).join(', ')}`)
    }
    
    return { general: suggestions, priority }
  }

  // ============================================
  // JOBED CONNECT - Utbildningsmatchning
  // ============================================

  async findEducationForOccupation(occupationLabel: string): Promise<OccupationEducationMatch | null> {
    try {
      const response = await this.fetch<any>(EDUCATION_BASE_URL, '/match/education-to-occupation', {
        occupation_label: occupationLabel,
        limit: 10,
      })
      
      if (!response || !response.length) return null
      
      return {
        occupation: response[0].occupation,
        matching_educations: response[0].educations || [],
        required_competencies: response[0].required_competencies || [],
        matching_percentage: response[0].match_percentage || 0,
      }
    } catch (error) {
      console.error('Education API error:', error)
      return null
    }
  }

  async findOccupationsForEducation(educationQuery: string): Promise<any[]> {
    try {
      const response = await this.fetch<any>(EDUCATION_BASE_URL, '/match/occupation-to-education', {
        education_query: educationQuery,
        limit: 10,
      })
      return response || []
    } catch (error) {
      console.error('Education API error:', error)
      return []
    }
  }

  async getCareerPath(occupationLabel: string): Promise<CareerPath | null> {
    try {
      // Hämta matchande utbildningar
      const educationMatch = await this.findEducationForOccupation(occupationLabel)
      
      // Hämta lediga jobb för yrket
      const jobs = await this.searchJobs({
        q: occupationLabel,
        limit: 5,
      })
      
      // Hämta lönestatistik (simulerad - skulle behöva historiskt API)
      const salaryStats = await this.getSalaryStats(occupationLabel)
      
      return {
        occupation: occupationLabel,
        ssyk_code: educationMatch?.occupation?.concept_id || '',
        education_options: educationMatch?.matching_educations || [],
        required_competencies: educationMatch?.required_competencies || [],
        nice_to_have_competencies: [],
        entry_level_jobs: jobs.hits.slice(0, 3),
        salary_range: salaryStats ? {
          min: salaryStats.salary_range.min,
          max: salaryStats.salary_range.max,
          median: salaryStats.median_salary,
        } : undefined,
        demand_trend: salaryStats?.trend || 'stable',
      }
    } catch (error) {
      console.error('Career path error:', error)
      return null
    }
  }

  // ============================================
  // LÖNESTATISTIK OCH TRENDER
  // ============================================

  async getSalaryStats(occupation: string): Promise<SalaryStats | null> {
    try {
      // Sök historiska annonser för yrket
      const response = await this.fetch<any>(HISTORICAL_BASE_URL, '/search', {
        q: occupation,
        has_salary_info: true,
        published_after: '2023-01-01',
        limit: 100,
      })
      
      if (!response?.hits?.length) return null
      
      // Extrahera löner från annonserna
      const salaries: number[] = []
      response.hits.forEach((job: any) => {
        if (job.salary_description) {
          const match = job.salary_description.match(/(\d{3,})\s*kr/i)
          if (match) salaries.push(parseInt(match[1]))
        }
      })
      
      if (salaries.length === 0) return null
      
      const sorted = salaries.sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const average = salaries.reduce((a, b) => a + b, 0) / salaries.length
      
      return {
        occupation,
        average_salary: Math.round(average),
        median_salary: median,
        salary_range: {
          min: sorted[0],
          max: sorted[sorted.length - 1],
        },
        trend: 'stable',
        trend_percentage: 0,
        sample_size: salaries.length,
        period: '2023-2024',
      }
    } catch (error) {
      console.error('Salary stats error:', error)
      return null
    }
  }

  async getSkillTrends(): Promise<SkillTrend[]> {
    // Detta skulle kräva tillgång till söktrender-API:et
    // Returnera mock-data för nu
    return [
      { skill: 'AI/Maskininlärning', growth_rate: 156, current_demand: 95, historical_demand: 37, trend_direction: 'up' },
      { skill: 'Hållbarhet/miljö', growth_rate: 89, current_demand: 78, historical_demand: 41, trend_direction: 'up' },
      { skill: 'Digital kommunikation', growth_rate: 67, current_demand: 85, historical_demand: 51, trend_direction: 'up' },
      { skill: 'Projektledning (Agile)', growth_rate: 45, current_demand: 92, historical_demand: 63, trend_direction: 'up' },
      { skill: 'JavaScript/TypeScript', growth_rate: 34, current_demand: 88, historical_demand: 66, trend_direction: 'up' },
    ]
  }

  // ============================================
  // SMARTA FUNKTIONER
  // ============================================

  async getRecommendedJobs(userProfile: {
    skills: string[]
    interests: string[]
    location?: string
  }, limit: number = 10): Promise<JobAd[]> {
    // Bygg sökfråga baserat på profil
    const queries = userProfile.interests.slice(0, 2)
    const allResults: JobAd[] = []
    
    for (const query of queries) {
      const result = await this.searchJobs({
        q: query,
        municipality: userProfile.location,
        limit: Math.ceil(limit / queries.length),
      })
      allResults.push(...result.hits)
    }
    
    // Sortera efter matchning med användarens kompetenser
    const scored = allResults.map(job => {
      const jobText = `${job.headline} ${job.description.text}`.toLowerCase()
      const matches = userProfile.skills.filter(skill => 
        jobText.includes(skill.toLowerCase())
      ).length
      return { job, score: matches }
    })
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.job)
  }

  async optimizeCV(cvText: string, targetJobQuery: string): Promise<{
    suggestions: string[]
    keywords_to_add: string[]
    skills_to_highlight: string[]
  }> {
    // Sök efter liknande jobb
    const similarJobs = await this.searchJobs({
      q: targetJobQuery,
      limit: 20,
    })
    
    // Berika alla annonser
    const enrichments = await Promise.all(
      similarJobs.hits.slice(0, 5).map(job => 
        this.enrichJobAd(job.description.text)
      )
    )
    
    // Räkna frekvens av kompetenser
    const skillFrequency: Record<string, number> = {}
    enrichments.forEach(enrichment => {
      enrichment.entities
        .filter(e => e.type === 'skill')
        .forEach(entity => {
          skillFrequency[entity.label] = (skillFrequency[entity.label] || 0) + 1
        })
    })
    
    // Sortera efter frekvens
    const commonSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill]) => skill)
    
    // Identifiera vilka som saknas i CV:t
    const cvTextLower = cvText.toLowerCase()
    const missingSkills = commonSkills.filter(skill => 
      !cvTextLower.includes(skill.toLowerCase())
    )
    
    // Generera förslag
    const suggestions = [
      `De vanligaste kompetenserna för "${targetJobQuery}": ${commonSkills.slice(0, 5).join(', ')}`,
      missingSkills.length > 0 
        ? `Överväg att lägga till: ${missingSkills.slice(0, 5).join(', ')}`
        : 'Bra! Du verkar ha de vanligaste kompetenserna.',
      'Använd nyckelorden från jobbannonserna i ditt CV för bättre matchning.',
    ]
    
    return {
      suggestions,
      keywords_to_add: missingSkills.slice(0, 10),
      skills_to_highlight: commonSkills.slice(0, 5),
    }
  }
}

// ============================================
// EXPORTER
// ============================================

export const afApi = new ArbetsformedlingenAPI()

// Förifyllda populära sökningar
export const POPULAR_QUERIES = [
  { label: 'Utvecklare', query: 'utvecklare programmerare', icon: '💻' },
  { label: 'Sjuksköterska', query: 'sjuksköterska', icon: '🏥' },
  { label: 'Lärare', query: 'lärare', icon: '📚' },
  { label: 'Ekonomi', query: 'ekonom redovisning', icon: '📊' },
  { label: 'Säljare', query: 'säljare', icon: '🤝' },
  { label: 'Kundtjänst', query: 'kundtjänst', icon: '🎧' },
  { label: 'Lagerarbete', query: 'lager lagerarbetare', icon: '📦' },
  { label: 'Vård', query: 'vård omsorg undersköterska', icon: '❤️' },
  { label: 'Bygg', query: 'bygg snickare elektriker', icon: '🔨' },
  { label: 'Kock', query: 'kock restaurang', icon: '🍳' },
]

export const REMOTE_FILTERS = [
  { label: 'Distansarbete möjligt', value: true },
  { label: 'På plats', value: false },
  { label: 'Alla', value: undefined },
]

// Yrkeskategorier baserat på SSYK
export const OCCUPATION_CATEGORIES = [
  { id: '1', label: 'Chefer', query: 'chef manager' },
  { id: '2', label: 'Specialister inom akademiska yrken', query: 'specialist akademiker' },
  { id: '3', label: 'Tekniker och specialister', query: 'tekniker ingenjör' },
  { id: '4', label: 'Kontorsarbete och kundservice', query: 'kontor administration' },
  { id: '5', label: 'Försäljning och service', query: 'försäljning service' },
  { id: '6', label: 'Jordbruk, skogsbruk, trädgård', query: 'jordbruk trädgård' },
  { id: '7', label: 'Bygg och tillverkning', query: 'bygg tillverkning' },
  { id: '8', label: 'Transport och maskin', query: 'transport maskin' },
  { id: '9', label: 'Vård och omsorg', query: 'vård omsorg' },
]
