// Yrkesrekommendationsmotor
// Hjälper användare att hitta relaterade yrken

export interface OccupationRelation {
  from: string
  to: string
  relation: 'similar' | 'alternative' | 'progression' | 'related'
  strength: number // 0-1
}

// Realtionsdata mellan yrken
const occupationRelations: OccupationRelation[] = [
  // IT & Utveckling
  { from: 'utvecklare', to: 'programmerare', relation: 'similar', strength: 0.95 },
  { from: 'utvecklare', to: 'systemutvecklare', relation: 'similar', strength: 0.90 },
  { from: 'utvecklare', to: 'mjukvaruutvecklare', relation: 'similar', strength: 0.90 },
  { from: 'utvecklare', to: 'webbutvecklare', relation: 'related', strength: 0.80 },
  { from: 'utvecklare', to: 'app-utvecklare', relation: 'related', strength: 0.75 },
  { from: 'utvecklare', to: 'frontendutvecklare', relation: 'related', strength: 0.85 },
  { from: 'utvecklare', to: 'backendutvecklare', relation: 'related', strength: 0.85 },
  { from: 'utvecklare', to: 'fullstackutvecklare', relation: 'similar', strength: 0.88 },
  { from: 'utvecklare', to: 'devops', relation: 'progression', strength: 0.70 },
  { from: 'utvecklare', to: 'tech lead', relation: 'progression', strength: 0.65 },
  { from: 'utvecklare', to: 'systemarkitekt', relation: 'progression', strength: 0.60 },
  
  // Vård
  { from: 'sjuksköterska', to: 'undersköterska', relation: 'alternative', strength: 0.70 },
  { from: 'sjuksköterska', to: 'vårdbiträde', relation: 'alternative', strength: 0.60 },
  { from: 'sjuksköterska', to: 'barnsjuksköterska', relation: 'related', strength: 0.85 },
  { from: 'sjuksköterska', to: 'intensivvårdssjuksköterska', relation: 'progression', strength: 0.80 },
  { from: 'sjuksköterska', to: 'distriktssköterska', relation: 'progression', strength: 0.75 },
  { from: 'sjuksköterska', to: 'vårdchef', relation: 'progression', strength: 0.65 },
  
  // Lärare
  { from: 'lärare', to: 'förskollärare', relation: 'related', strength: 0.75 },
  { from: 'lärare', to: 'fritidspedagog', relation: 'related', strength: 0.70 },
  { from: 'lärare', to: 'speciallärare', relation: 'progression', strength: 0.75 },
  { from: 'lärare', to: 'specialpedagog', relation: 'progression', strength: 0.80 },
  { from: 'lärare', to: 'rektor', relation: 'progression', strength: 0.60 },
  { from: 'lärare', to: 'utbildare', relation: 'alternative', strength: 0.70 },
  
  // Ekonomi
  { from: 'ekonom', to: 'redovisningsekonom', relation: 'similar', strength: 0.85 },
  { from: 'ekonom', to: 'redovisningskonsult', relation: 'similar', strength: 0.80 },
  { from: 'ekonom', to: 'bokförare', relation: 'alternative', strength: 0.75 },
  { from: 'ekonom', to: 'financial controller', relation: 'progression', strength: 0.80 },
  { from: 'ekonom', to: 'ekonomichef', relation: 'progression', strength: 0.65 },
  { from: 'ekonom', to: 'revisor', relation: 'progression', strength: 0.70 },
  
  // Sälj
  { from: 'säljare', to: 'account manager', relation: 'similar', strength: 0.85 },
  { from: 'säljare', to: 'kundansvarig', relation: 'similar', strength: 0.80 },
  { from: 'säljare', to: 'kundtjänstmedarbetare', relation: 'alternative', strength: 0.70 },
  { from: 'säljare', to: 'key account manager', relation: 'progression', strength: 0.75 },
  { from: 'säljare', to: 'säljchef', relation: 'progression', strength: 0.70 },
  { from: 'säljare', to: 'marknadsförare', relation: 'related', strength: 0.65 },
  
  // Kundtjänst
  { from: 'kundtjänstmedarbetare', to: 'kundservice', relation: 'similar', strength: 0.90 },
  { from: 'kundtjänstmedarbetare', to: 'kundsupport', relation: 'similar', strength: 0.90 },
  { from: 'kundtjänstmedarbetare', to: 'receptionist', relation: 'alternative', strength: 0.65 },
  { from: 'kundtjänstmedarbetare', to: 'kundtjänstchef', relation: 'progression', strength: 0.70 },
  
  // Lager
  { from: 'lagerarbetare', to: 'lagerpersonal', relation: 'similar', strength: 0.95 },
  { from: 'lagerarbetare', to: 'truckförare', relation: 'related', strength: 0.75 },
  { from: 'lagerarbetare', to: 'logistiker', relation: 'progression', strength: 0.70 },
  { from: 'lagerarbetare', to: 'lagerchef', relation: 'progression', strength: 0.65 },
  
  // Bygg
  { from: 'byggarbetare', to: 'snickare', relation: 'related', strength: 0.80 },
  { from: 'byggarbetare', to: 'målare', relation: 'related', strength: 0.75 },
  { from: 'byggarbetare', to: 'elektriker', relation: 'related', strength: 0.70 },
  { from: 'byggarbetare', to: 'vsp-montör', relation: 'related', strength: 0.75 },
  { from: 'byggarbetare', to: 'byggarbetsledare', relation: 'progression', strength: 0.70 },
  { from: 'byggarbetare', to: 'byggchef', relation: 'progression', strength: 0.60 },
  
  // Administration
  { from: 'administratör', to: 'kontorsassistent', relation: 'similar', strength: 0.85 },
  { from: 'administratör', to: 'sekreterare', relation: 'similar', strength: 0.80 },
  { from: 'administratör', to: 'personligassistent', relation: 'alternative', strength: 0.65 },
  { from: 'administratör', to: 'office manager', relation: 'progression', strength: 0.70 },
  
  // Transport
  { from: 'chaufför', to: 'lastbilschaufför', relation: 'similar', strength: 0.85 },
  { from: 'chaufför', to: 'busschaufför', relation: 'similar', strength: 0.80 },
  { from: 'chaufför', to: 'taxiförare', relation: 'alternative', strength: 0.75 },
  { from: 'chaufför', to: 'transportledare', relation: 'progression', strength: 0.70 },
  { from: 'chaufför', to: 'trafikledare', relation: 'progression', strength: 0.65 },
]

export interface OccupationSuggestion {
  occupation: string
  type: 'similar' | 'alternative' | 'progression' | 'related'
  strength: number
  description: string
}

class OccupationMatcher {
  // Normalisera sökterm
  private normalize(term: string): string {
    return term
      .toLowerCase()
      .replace(/[-\s]/g, '')
      .replace(/are$/, '')
      .replace(/er$/, '')
  }

  // Hitta relaterade yrken
  findRelated(query: string): OccupationSuggestion[] {
    const normalizedQuery = this.normalize(query)
    
    const matches = occupationRelations.filter(
      rel => this.normalize(rel.from) === normalizedQuery || 
             this.normalize(rel.to) === normalizedQuery
    )

    const suggestions: OccupationSuggestion[] = matches.map(match => {
      const isFrom = this.normalize(match.from) === normalizedQuery
      const occupation = isFrom ? match.to : match.from
      
      let description = ''
      switch (match.relation) {
        case 'similar':
          description = 'Liknande arbetsuppgifter och kompetenser'
          break
        case 'alternative':
          description = 'Alternativ karriärväg med överlappande kompetenser'
          break
        case 'progression':
          description = 'Nästa steg i karriären'
          break
        case 'related':
          description = 'Relaterat område som kan vara av intresse'
          break
      }

      return {
        occupation,
        type: match.relation,
        strength: match.strength,
        description,
      }
    })

    // Sortera efter styrka
    return suggestions.sort((a, b) => b.strength - a.strength)
  }

  // Hitta karriärväg
  findCareerPath(currentOccupation: string): string[] {
    const normalized = this.normalize(currentOccupation)
    const path: string[] = [currentOccupation]
    
    let current = normalized
    let iterations = 0
    const maxIterations = 5

    while (iterations < maxIterations) {
      const nextStep = occupationRelations.find(
        rel => this.normalize(rel.from) === current && 
               rel.relation === 'progression' &&
               rel.strength > 0.6
      )

      if (!nextStep) break

      path.push(nextStep.to)
      current = this.normalize(nextStep.to)
      iterations++
    }

    return path
  }

  // Hitta alternativa vägar för personer med viss kompetens
  findAlternatives(query: string): OccupationSuggestion[] {
    return this.findRelated(query).filter(s => 
      s.type === 'alternative' || s.type === 'related'
    )
  }

  // Beräkna matchning mellan två yrken
  calculateMatch(occupation1: string, occupation2: string): number {
    const normalized1 = this.normalize(occupation1)
    const normalized2 = this.normalize(occupation2)

    const relation = occupationRelations.find(
      rel => (this.normalize(rel.from) === normalized1 && this.normalize(rel.to) === normalized2) ||
             (this.normalize(rel.from) === normalized2 && this.normalize(rel.to) === normalized1)
    )

    return relation?.strength || 0
  }
}

export const occupationMatcher = new OccupationMatcher()

// Populära yrken för förslag
export const POPULAR_OCCUPATIONS = [
  'utvecklare', 'sjuksköterska', 'lärare', 'ekonom', 
  'säljare', 'kundtjänstmedarbetare', 'lagerarbetare',
  'byggarbetare', 'administratör', 'chaufför',
  'vårdbiträde', 'undersköterska', 'snickare',
  'elektriker', 'målare', 'kock', 'servitör',
]
