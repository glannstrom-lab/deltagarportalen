// Marknadsstatistik från Arbetsförmedlingen
import { afApi } from './arbetsformedlingenApi'

export interface MarketStat {
  label: string
  value: number
  trend: 'up' | 'down' | 'stable'
  change?: number // Procentuell förändring
}

export interface CompetenceDemand {
  competence: string
  count: number
  trend: 'up' | 'down' | 'stable'
  averageSalary?: number
}

export interface RegionalStat {
  region: string
  totalJobs: number
  growth: number
  topOccupations: string[]
}

class MarketStatsService {
  // Hämta mest efterfrågade kompetenser
  async getTopCompetences(limit: number = 10): Promise<CompetenceDemand[]> {
    // Sök på populära kompetenser och räkna
    const popularQueries = [
      'javascript', 'python', 'java', 'sql', 'react',
      'sjuksköterska', 'lärare', 'säljare', 'chaufför',
      'projektledning', 'kundtjänst', 'ekonomi',
      'engelska', 'svenska', 'tyska', 'franska',
      'b-körkort', 'ce-körkort', 'truckkort',
      'excel', 'powerpoint', 'sap', 'salesforce',
    ]

    const results: CompetenceDemand[] = []

    for (const query of popularQueries) {
      try {
        const response = await afApi.searchByQuery(query, 1)
        const count = response.total.value

        // Beräkna trend baserat på tidigare data (simulerat)
        const trend: 'up' | 'down' | 'stable' = this.calculateTrend(query, count)

        results.push({
          competence: query,
          count,
          trend,
        })
      } catch (error) {
        console.error(`Error fetching stats for ${query}:`, error)
      }
    }

    return results
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  // Beräkna trend (simulerad baserat på tidigare data)
  private calculateTrend(query: string, _currentCount: number): 'up' | 'down' | 'stable' {
    // I verkligheten skulle detta jämföra med historisk data
    // Här simulerar vi baserat på frågan
    const growthQueries = [
      'javascript', 'python', 'react', 'ai', 'machine learning',
      'sjuksköterska', 'undersköterska', 'vård'
    ]
    
    const decliningQueries = [
      'administratör', 'sekreterare', 'kontorist'
    ]

    if (growthQueries.some(g => query.toLowerCase().includes(g))) {
      return 'up'
    }
    if (decliningQueries.some(d => query.toLowerCase().includes(d))) {
      return 'down'
    }
    return 'stable'
  }

  // Hämta statistik per region
  async getRegionalStats(): Promise<RegionalStat[]> {
    const regions = [
      { name: 'Stockholm', code: '01' },
      { name: 'Uppsala', code: '03' },
      { name: 'Västra Götaland', code: '14' },
      { name: 'Skåne', code: '12' },
      { name: 'Östergötland', code: '05' },
      { name: 'Jönköping', code: '06' },
    ]

    const results: RegionalStat[] = []

    for (const region of regions) {
      try {
        const response = await afApi.searchJobs({
          region: region.code,
          limit: 1,
        })

        results.push({
          region: region.name,
          totalJobs: response.total.value,
          growth: Math.floor(Math.random() * 20) - 5, // Simulerad tillväxt
          topOccupations: this.getTopOccupationsForRegion(region.name),
        })
      } catch (error) {
        console.error(`Error fetching region ${region.name}:`, error)
      }
    }

    return results.sort((a, b) => b.totalJobs - a.totalJobs)
  }

  // Hämta toppyrken per region (simulerat)
  private getTopOccupationsForRegion(region: string): string[] {
    const regionOccupations: Record<string, string[]> = {
      'Stockholm': ['Utvecklare', 'Ekonom', 'Säljare', 'Projektledare'],
      'Västra Götaland': ['Industriarbetare', 'Ingenjör', 'Sjuksköterska', 'Lärare'],
      'Skåne': ['Vårdpersonal', 'Lagerarbetare', 'Kundtjänst', 'Chaufför'],
    }

    return regionOccupations[region] || ['Säljare', 'Kundtjänst', 'Lager']
  }

  // Hämta allmän marknadsstatistik
  async getGeneralStats(): Promise<MarketStat[]> {
    try {
      // Hämta totalt antal jobb
      const allJobs = await afApi.searchJobs({ limit: 1 })
      const totalJobs = allJobs.total.value

      return [
        {
          label: 'Antal lediga jobb',
          value: totalJobs,
          trend: 'up',
          change: 5,
        },
        {
          label: 'Nya jobb idag',
          value: Math.floor(totalJobs * 0.02),
          trend: 'stable',
        },
        {
          label: 'Flest sökningar',
          value: 0, // Placeholder
          trend: 'up',
        },
      ]
    } catch (error) {
      console.error('Error fetching general stats:', error)
      return []
    }
  }

  // Hämta lönestatistik (simulerad)
  async getSalaryStats(occupation: string): Promise<{
    median: number
    range: { min: number; max: number }
    trend: 'up' | 'down' | 'stable'
  }> {
    // I verkligheten skulle detta hämtas från SCB eller liknande
    const salaryData: Record<string, { median: number; min: number; max: number }> = {
      'utvecklare': { median: 45000, min: 32000, max: 65000 },
      'sjuksköterska': { median: 38000, min: 30000, max: 50000 },
      'lärare': { median: 35000, min: 28000, max: 45000 },
      'ekonom': { median: 40000, min: 30000, max: 55000 },
      'säljare': { median: 35000, min: 25000, max: 60000 },
    }

    const data = salaryData[occupation.toLowerCase()] || { median: 32000, min: 25000, max: 45000 }

    return {
      median: data.median,
      range: { min: data.min, max: data.max },
      trend: 'up',
    }
  }

  // Hämta "heta" yrken just nu
  async getTrendingOccupations(limit: number = 5): Promise<{
    occupation: string
    growth: number
    description: string
  }[]> {
    const trending = [
      {
        occupation: 'AI/Machine Learning Engineer',
        growth: 45,
        description: 'Stor efterfrågan på kompetens inom artificiell intelligens',
      },
      {
        occupation: 'Sjuksköterska',
        growth: 25,
        description: 'Fortsatt brist på sjuksköterskor i hela landet',
      },
      {
        occupation: 'UX Designer',
        growth: 30,
        description: 'Ökande fokus på användarupplevelse',
      },
      {
        occupation: 'Hållbarhetsansvarig',
        growth: 35,
        description: 'Allt fler företag satsar på hållbarhet',
      },
      {
        occupation: 'Cybersecurity Specialist',
        growth: 40,
        description: 'Ökat behov av IT-säkerhet',
      },
    ]

    return trending.slice(0, limit)
  }

  // Generera personliga insikter baserat på användarens sökningar
  generatePersonalizedInsights(
    userSearches: string[],
    savedJobs: string[]
  ): string[] {
    const insights: string[] = []

    if (userSearches.length === 0) {
      insights.push('💡 Börja söka på jobb för att få personliga insikter!')
      return insights
    }

    // Analysera sökmönster
    const hasTechTerms = userSearches.some(s => 
      ['utvecklare', 'programmerare', 'it', 'tech'].some(t => 
        s.toLowerCase().includes(t)
      )
    )

    if (hasTechTerms) {
      insights.push('🚀 Tech-sektorn växer! Det finns gott om jobb inom IT.')
    }

    const hasHealthcare = userSearches.some(s =>
      ['sjuksköterska', 'vård', 'undersköterska'].some(t =>
        s.toLowerCase().includes(t)
      )
    )

    if (hasHealthcare) {
      insights.push('🏥 Vårdsektorn har stor brist på personal - bra läge att söka!')
    }

    if (savedJobs.length > 5) {
      insights.push('📌 Du har sparat många jobb! Glöm inte att faktiskt söka dem.')
    }

    return insights
  }
}

export const marketStatsService = new MarketStatsService()
