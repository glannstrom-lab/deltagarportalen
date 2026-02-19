// API för Arbetsförmedlingens JobSearch
// Dokumentation: https://jobsearch.api.jobtechdev.se/

const API_BASE_URL = 'https://jobsearch.api.jobtechdev.se'

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
  }
  workplace_address?: {
    street_address?: string
    region?: string
    municipality?: string
    city?: string
    country?: string
  }
  occupation: {
    label: string
  }
  application_details?: {
    reference?: string
    email?: string
    via_af?: boolean
    url?: string
  }
  application_deadline?: string
  publication_date: string
  salary_type?: {
    label: string
  }
  employment_type?: {
    label: string
  }
  experience_required?: boolean
  driving_license_required?: boolean
  must_have?: {
    skills?: Array<{ label: string }>
    languages?: Array<{ label: string }>
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
  q?: string // Fritextsökning
  occupation?: string // Yrkeskod
  municipality?: string // Kommunkod
  region?: string // Länskod
  experience?: boolean // Krävs erfarenhet?
  driving_license?: boolean // Krävs körkort?
  remote?: boolean // Distansarbete?
  employment_type?: string // Anställningstyp
  published_after?: string // ISO-datum
  limit?: number // Max antal resultat (default 10)
  offset?: number // Offset för paginering
}

class ArbetsformedlingenAPI {
  private async fetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryParams = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : ''

    const response = await fetch(`${API_BASE_URL}${endpoint}${queryParams}`, {
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

  // Sök jobbannonser
  async searchJobs(filters: SearchFilters = {}): Promise<JobSearchResponse> {
    return this.fetch<JobSearchResponse>('/search', {
      ...filters,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    })
  }

  // Hämta specifik annons
  async getJobById(id: string): Promise<JobAd> {
    return this.fetch<JobAd>(`/ad/${id}`)
  }

  // Sök på fritext (enkelt)
  async searchByQuery(query: string, limit: number = 10): Promise<JobSearchResponse> {
    return this.searchJobs({ q: query, limit })
  }

  // Hämta populära sökningar/statistik
  async getSearchTrends(): Promise<any> {
    return this.fetch('/search/trends')
  }

  // Hämta komplett lista över yrken (för autocomplete)
  async getOccupations(query?: string): Promise<any[]> {
    const response = await this.fetch<any>('/taxonomy/concepts', {
      type: 'occupation-name',
      q: query,
      limit: 20,
    })
    return response.concepts || []
  }

  // Hämta kommuner (för filtrering)
  async getMunicipalities(): Promise<any[]> {
    const response = await this.fetch<any>('/taxonomy/concepts', {
      type: 'municipality',
      limit: 100,
    })
    return response.concepts || []
  }

  // Hämta län (för filtrering)
  async getRegions(): Promise<any[]> {
    const response = await this.fetch<any>('/taxonomy/concepts', {
      type: 'region',
      limit: 30,
    })
    return response.concepts || []
  }
}

// Exportera singleton
export const afApi = new ArbetsformedlingenAPI()

// Förifyllda populära sökningar
export const POPULAR_QUERIES = [
  { label: 'Utvecklare', query: 'utvecklare programmerare' },
  { label: 'Sjuksköterska', query: 'sjuksköterska' },
  { label: 'Lärare', query: 'lärare' },
  { label: 'Ekonomi', query: 'ekonomi redovisning' },
  { label: 'Säljare', query: 'säljare' },
  { label: 'Kundtjänst', query: 'kundtjänst' },
  { label: 'Lagerarbete', query: 'lager lagerarbetare' },
  { label: 'Vård', query: 'vård omsorg undersköterska' },
]

// Hjälpsamma filter för distansarbete
export const REMOTE_FILTERS = [
  { label: 'Distansarbete möjligt', value: true },
  { label: 'På plats', value: false },
  { label: 'Alla', value: undefined },
]
