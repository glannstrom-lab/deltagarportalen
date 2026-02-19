// CV-matchning mot jobbannonser
import { type JobAd } from './arbetsformedlingenApi'

export interface CVData {
  skills: string[]
  experiences: Array<{
    title: string
    description: string
    years: number
  }>
  education: Array<{
    degree: string
    field: string
  }>
  languages: string[]
  summary?: string
}

export interface MatchResult {
  score: number // 0-100
  matchedSkills: string[]
  missingSkills: string[]
  recommendations: string[]
  overallAssessment: string
}

class CVMatcher {
  // Extrahera kompetenser från text
  private extractKeywords(text: string): string[] {
    const commonWords = new Set([
      'och', 'eller', 'med', 'för', 'att', 'det', 'är', 'en', 'ett', 'i', 'på', 'som',
      'av', 'till', 'den', 'ett', 'om', 'vi', 'du', 'jag', 'man', 'kan', 'ska', 'the',
      'and', 'for', 'with', 'are', 'the', 'have', 'will', 'would', 'should'
    ])

    const words = text
      .toLowerCase()
      .replace(/[^\w\såäöÅÄÖ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !commonWords.has(w))

    return [...new Set(words)]
  }

  // Normalisera kompetens
  private normalizeSkill(skill: string): string {
    return skill.toLowerCase().trim()
  }

  // Beräkna matchning mellan CV och jobb
  analyzeMatch(cv: CVData, job: JobAd): MatchResult {
    // Samla alla CV-kompetenser
    const cvSkills = new Set(
      cv.skills.map(s => this.normalizeSkill(s))
    )
    
    // Lägg till kompetenser från erfarenheter
    cv.experiences.forEach(exp => {
      this.extractKeywords(exp.title).forEach(k => cvSkills.add(k))
      this.extractKeywords(exp.description).forEach(k => cvSkills.add(k))
    })

    // Lägg till utbildning
    cv.education.forEach(edu => {
      this.extractKeywords(edu.degree).forEach(k => cvSkills.add(k))
      this.extractKeywords(edu.field).forEach(k => cvSkills.add(k))
    })

    // Lägg till språk
    cv.languages.forEach(lang => cvSkills.add(this.normalizeSkill(lang)))

    // Extrahera jobbkrav
    const jobText = [
      job.headline,
      job.description?.text || '',
      job.must_have?.skills?.map(s => s.label).join(' ') || '',
      job.occupation?.label || ''
    ].join(' ')

    const jobKeywords = this.extractKeywords(jobText)

    // Hitta matchande och saknade kompetenser
    const matchedSkills: string[] = []
    const missingSkills: string[] = []

    jobKeywords.forEach(keyword => {
      const normalized = this.normalizeSkill(keyword)
      
      // Kolla exakt match
      if (cvSkills.has(normalized)) {
        matchedSkills.push(keyword)
        return
      }

      // Kolla partiell match
      for (const cvSkill of cvSkills) {
        if (cvSkill.includes(normalized) || normalized.includes(cvSkill)) {
          matchedSkills.push(keyword)
          return
        }
      }

      // Sök i synonymer/relaterade termer
      const relatedTerms = this.getRelatedTerms(normalized)
      for (const term of relatedTerms) {
        if (cvSkills.has(term)) {
          matchedSkills.push(keyword)
          return
        }
      }

      missingSkills.push(keyword)
    })

    // Beräkna poäng
    const totalRequirements = jobKeywords.length || 1
    const matchScore = Math.round((matchedSkills.length / totalRequirements) * 100)

    // Generera rekommendationer
    const recommendations = this.generateRecommendations(
      matchScore,
      missingSkills,
      cv,
      job
    )

    // Generera övergripande bedömning
    const overallAssessment = this.generateAssessment(matchScore, missingSkills.length)

    return {
      score: Math.min(matchScore, 100),
      matchedSkills: [...new Set(matchedSkills)].slice(0, 10),
      missingSkills: [...new Set(missingSkills)].slice(0, 10),
      recommendations,
      overallAssessment,
    }
  }

  // Hitta relaterade termer
  private getRelatedTerms(term: string): string[] {
    const relations: Record<string, string[]> = {
      'javascript': ['js', 'typescript', 'ts', 'frontend', 'webbutveckling'],
      'typescript': ['ts', 'javascript', 'js'],
      'react': ['reactjs', 'frontend', 'webbutveckling'],
      'python': ['py', 'django', 'flask', 'data'],
      'java': ['spring', 'backend'],
      'c#': ['csharp', '.net', 'dotnet'],
      '.net': ['dotnet', 'c#', 'csharp'],
      'sql': ['databas', 'mysql', 'postgresql', 'database'],
      'agil': ['scrum', 'kanban', 'agile'],
      'scrum': ['agil', 'agile', 'kanban'],
      'projektledning': ['projektledare', 'ledarskap'],
      'excel': ['kalkylark', 'dataanalys'],
      'powerpoint': ['presentationer'],
      'svenska': ['svenska språket', 'modersmål'],
      'engelska': ['english', 'engelska språket'],
    }

    return relations[term] || []
  }

  // Generera rekommendationer
  private generateRecommendations(
    score: number,
    missingSkills: string[],
    cv: CVData,
    job: JobAd
  ): string[] {
    const recommendations: string[] = []

    if (score >= 80) {
      recommendations.push('🌟 Du har en stark matchning! Detta jobb verkar passa dig bra.')
    } else if (score >= 60) {
      recommendations.push('✅ Du har många av de efterfrågade kompetenserna. Överväg att söka!')
    } else if (score >= 40) {
      recommendations.push('💡 Du har en del av kompetenserna. Fokusera på att lyfta fram dessa i din ansökan.')
    } else {
      recommendations.push('📚 Detta jobb kräver kompetenser du inte har än. Överväg kompetensutveckling.')
    }

    // Specifika rekommendationer baserat på saknade kompetenser
    if (missingSkills.length > 0) {
      const topMissing = missingSkills.slice(0, 3).join(', ')
      recommendations.push(`🎯 Fokusera på att lära dig: ${topMissing}`)
    }

    // Kolla erfarenhetskrav
    if (job.experience_required && cv.experiences.length < 2) {
      recommendations.push('⏰ Jobbet verkar kräva mer erfarenhet. Lyft fram dina praktiska projekt!')
    }

    // Språkrekommendation
    const jobLangs = this.extractKeywords(job.description?.text || '').filter(w => 
      ['svenska', 'engelska', 'norska', 'danska'].includes(w)
    )
    
    for (const lang of jobLangs) {
      if (!cv.languages.some(l => l.toLowerCase().includes(lang))) {
        recommendations.push(`🌍 Jobbet nämner ${lang}. Lägg till detta i ditt CV om du behärskar språket.`)
      }
    }

    return recommendations
  }

  // Generera övergripande bedömning
  private generateAssessment(score: number, _missingCount: number): string {
    if (score >= 80) {
      return 'Utmärkt matchning! Du har de flesta efterfrågade kompetenserna.'
    } else if (score >= 60) {
      return 'God matchning. Du har många av de viktigaste kompetenserna.'
    } else if (score >= 40) {
      return 'Delvis matchning. Du har vissa kompetenser men behöver utvecklas inom vissa områden.'
    } else {
      return 'Svag matchning. Jobbet kräver kompetenser du inte har ännu.'
    }
  }

  // Hitta bästa matchningar från en lista av jobb
  findBestMatches(cv: CVData, jobs: JobAd[], limit: number = 5): Array<{
    job: JobAd
    match: MatchResult
  }> {
    const matches = jobs.map(job => ({
      job,
      match: this.analyzeMatch(cv, job),
    }))

    return matches
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, limit)
  }

  // Generera förslag på kompetensutveckling
  suggestSkillDevelopment(cv: CVData, targetJob: JobAd): string[] {
    const analysis = this.analyzeMatch(cv, targetJob)
    const suggestions: string[] = []

    // Gruppera saknade kompetenser
    const technicalSkills = analysis.missingSkills.filter(s => 
      ['javascript', 'python', 'java', 'sql', 'react', 'angular', 'vue'].some(t => 
        s.toLowerCase().includes(t)
      )
    )

    if (technicalSkills.length > 0) {
      suggestions.push(`💻 Tekniska färdigheter: ${technicalSkills.join(', ')}`)
    }

    const softSkills = analysis.missingSkills.filter(s =>
      ['kommunikation', 'ledarskap', 'projektledning', 'samarbete'].some(t =>
        s.toLowerCase().includes(t)
      )
    )

    if (softSkills.length > 0) {
      suggestions.push(`🤝 Mjuka färdigheter: ${softSkills.join(', ')}`)
    }

    return suggestions
  }
}

export const cvMatcher = new CVMatcher()
