/**
 * Hook for calculating CV completeness score
 * Gamification to motivate users
 */

import { useMemo } from 'react'
import type { CVData } from '@/services/supabaseApi'

interface CVScoreBreakdown {
  total: number
  max: number
  percentage: number
  sections: {
    name: string
    score: number
    max: number
    tips: string[]
  }[]
}

export function useCVScore(data: CVData): CVScoreBreakdown {
  return useMemo(() => {
    const sections = [
      {
        name: 'Grundläggande info',
        score: calculateBasicInfoScore(data),
        max: 20,
        tips: getBasicInfoTips(data),
      },
      {
        name: 'Sammanfattning',
        score: calculateSummaryScore(data),
        max: 20,
        tips: getSummaryTips(data),
      },
      {
        name: 'Erfarenhet',
        score: calculateExperienceScore(data),
        max: 20,
        tips: getExperienceTips(data),
      },
      {
        name: 'Kompetenser',
        score: calculateSkillsScore(data),
        max: 20,
        tips: getSkillsTips(data),
      },
      {
        name: 'Profilbild',
        score: calculateImageScore(data),
        max: 20,
        tips: getImageTips(data),
      },
    ]
    
    const total = sections.reduce((sum, s) => sum + s.score, 0)
    const max = sections.reduce((sum, s) => sum + s.max, 0)
    
    return {
      total,
      max,
      percentage: Math.round((total / max) * 100),
      sections,
    }
  }, [data])
}

// Score calculations
function calculateBasicInfoScore(data: CVData): number {
  let score = 0
  if (data.firstName || data.first_name) score += 5
  if (data.lastName || data.last_name) score += 5
  if (data.email) score += 5
  if (data.title) score += 5
  return score
}

function calculateSummaryScore(data: CVData): number {
  const summary = data.summary || ''
  const length = summary.length
  
  if (length === 0) return 0
  if (length < 50) return 5
  if (length < 100) return 10
  if (length < 200) return 15
  return 20
}

function calculateExperienceScore(data: CVData): number {
  const experiences = data.work_experience || data.workExperience || []
  if (experiences.length === 0) return 0
  if (experiences.length === 1) return 10
  if (experiences.length === 2) return 15
  return 20
}

function calculateSkillsScore(data: CVData): number {
  const skills = data.skills || []
  if (skills.length === 0) return 0
  if (skills.length < 3) return 10
  if (skills.length < 5) return 15
  return 20
}

function calculateImageScore(data: CVData): number {
  return (data.profileImage || data.profile_image) ? 20 : 0
}

// Tips generation
function getBasicInfoTips(data: CVData): string[] {
  const tips: string[] = []
  if (!data.firstName && !data.first_name) tips.push('Lägg till ditt förnamn')
  if (!data.lastName && !data.last_name) tips.push('Lägg till ditt efternamn')
  if (!data.email) tips.push('Lägg till din e-postadress')
  if (!data.title) tips.push('Lägg till en yrkestitel')
  return tips.length > 0 ? tips : ['Bra! All grundläggande info finns med']
}

function getSummaryTips(data: CVData): string[] {
  const summary = data.summary || ''
  const tips: string[] = []
  
  if (summary.length === 0) {
    tips.push('Skriv en kort sammanfattning om dig själv')
  } else if (summary.length < 100) {
    tips.push('Utöka till minst 100 tecken för bättre effekt')
  } else {
    tips.push('Bra längd! En sammanfattning på 100-300 tecken är optimal')
  }
  
  return tips
}

function getExperienceTips(data: CVData): string[] {
  const experiences = data.work_experience || data.workExperience || []
  const tips: string[] = []
  
  if (experiences.length === 0) {
    tips.push('Lägg till minst ett jobb')
  } else if (experiences.length === 1) {
    tips.push('Bra! Fler erfarenheter ger ett mer komplett CV')
  } else {
    tips.push('Utmärkt! Du har flera erfarenheter med')
  }
  
  return tips
}

function getSkillsTips(data: CVData): string[] {
  const skills = data.skills || []
  const tips: string[] = []
  
  if (skills.length === 0) {
    tips.push('Lägg till minst 3 kompetenser')
  } else if (skills.length < 5) {
    tips.push('Fler kompetenser hjälper dig att sticka ut')
  } else {
    tips.push('Bra! Du har ett brett kompetensområde')
  }
  
  return tips
}

function getImageTips(data: CVData): string[] {
  if (!data.profileImage && !data.profile_image) {
    return ['Lägg till en profilbild för att göra CV:t mer personligt']
  }
  return ['Perfekt! En profilbild gör CV:t mer minnesvärt']
}

/**
 * Get overall tips based on score
 */
export function getOverallTips(percentage: number): string {
  if (percentage < 30) return 'Börja med grundläggande information för att komma igång'
  if (percentage < 50) return 'Bra början! Fortsätt lägga till erfarenheter och kompetenser'
  if (percentage < 70) return 'Du är på god väg! Fyll på med mer detaljer'
  if (percentage < 90) return 'Nästan klart! Bara några detaljer kvar'
  return 'Utmärkt! Ditt CV är väl utformat och redo att användas'
}

/**
 * Get color based on score
 */
export function getScoreColor(percentage: number): string {
  if (percentage < 30) return 'text-red-500'
  if (percentage < 50) return 'text-orange-500'
  if (percentage < 70) return 'text-yellow-500'
  if (percentage < 90) return 'text-blue-500'
  return 'text-brand-700'
}

/**
 * Get background color based on score
 */
export function getScoreBgColor(percentage: number): string {
  if (percentage < 30) return 'bg-red-500'
  if (percentage < 50) return 'bg-orange-500'
  if (percentage < 70) return 'bg-yellow-500'
  if (percentage < 90) return 'bg-blue-500'
  return 'bg-brand-700'
}
