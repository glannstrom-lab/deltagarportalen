/**
 * Cross-Feature Recommendation Service
 * Analyzes user activity across all modules and generates personalized next-step suggestions
 */

import { cvApi, coverLetterApi, savedJobsApi, userApi } from './supabaseApi'
import { careerPlanApi, skillsAnalysisApi, networkApi } from './careerApi'
import { interestGuideApi } from './cloudStorage'

// Recommendation types
export interface Recommendation {
  id: string
  type: RecommendationType
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
  actionPath: string
  icon: string
  category: RecommendationCategory
  reason: string
  estimatedTime?: string
}

export type RecommendationType =
  | 'cv_incomplete'
  | 'cv_outdated'
  | 'cover_letter_needed'
  | 'skills_gap'
  | 'network_followup'
  | 'network_expand'
  | 'career_plan_start'
  | 'career_plan_milestone'
  | 'job_search'
  | 'interview_prep'
  | 'linkedin_optimize'
  | 'interest_guide'
  | 'application_followup'

export type RecommendationCategory =
  | 'onboarding'
  | 'job_search'
  | 'skills'
  | 'networking'
  | 'career_planning'

// User state aggregation
interface UserState {
  // CV
  hasCv: boolean
  cvCompleteness: number
  cvLastUpdated: Date | null

  // Cover Letters
  coverLetterCount: number
  hasCoverLetterTemplate: boolean

  // Jobs
  savedJobsCount: number
  applicationsCount: number
  pendingApplications: number

  // Career Plan
  hasCareerPlan: boolean
  careerPlanProgress: number
  incompleteMilestones: number
  upcomingMilestones: number

  // Skills
  hasSkillsAnalysis: boolean
  skillsMatchPercentage: number
  skillGaps: number

  // Network
  networkContactsCount: number
  contactsNeedingFollowup: number
  activeContactsThisMonth: number

  // Interest Guide
  hasCompletedInterestGuide: boolean

  // Onboarding
  onboardingProgress: number
}

// Fetch all user data and create state snapshot
async function getUserState(): Promise<UserState> {
  try {
    // Fetch all data in parallel
    const [
      cvData,
      coverLetters,
      savedJobs,
      onboardingProgress,
      careerPlan,
      skillsAnalysis,
      networkContacts,
      interestProgress
    ] = await Promise.all([
      cvApi.getCV().catch(() => null),
      coverLetterApi.getAll().catch(() => []),
      savedJobsApi.getAll().catch(() => []),
      userApi.getOnboardingProgress().catch(() => ({})),
      careerPlanApi.getActive().catch(() => null),
      skillsAnalysisApi.getLatest().catch(() => null),
      networkApi.getAll().catch(() => []),
      interestGuideApi.getProgress().catch(() => null)
    ])

    // Calculate CV completeness
    let cvCompleteness = 0
    if (cvData) {
      const fields = [
        cvData.firstName,
        cvData.lastName,
        cvData.email,
        cvData.phone,
        cvData.summary,
        cvData.workExperience?.length > 0,
        cvData.education?.length > 0,
        cvData.skills?.length > 0
      ]
      cvCompleteness = Math.round((fields.filter(Boolean).length / fields.length) * 100)
    }

    // Calculate contacts needing follow-up
    const now = new Date()
    const contactsNeedingFollowup = networkContacts.filter(c => {
      if (!c.next_contact_date) return false
      const daysUntil = Math.floor((new Date(c.next_contact_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 7
    }).length

    // Calculate active contacts this month
    const activeContactsThisMonth = networkContacts.filter(c => {
      if (!c.last_contact_date) return false
      const daysSince = Math.floor((now.getTime() - new Date(c.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince < 30
    }).length

    // Calculate onboarding progress
    const onboardingFields = Object.values(onboardingProgress || {}).filter(Boolean).length
    const onboardingTotal = 5

    // Calculate milestones
    const milestones = careerPlan?.milestones || []
    const incompleteMilestones = milestones.filter(m => !m.is_completed).length
    const upcomingMilestones = milestones.filter(m => {
      if (m.is_completed || !m.target_date) return false
      const daysUntil = Math.floor((new Date(m.target_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 14 && daysUntil >= 0
    }).length

    return {
      hasCv: !!cvData && cvCompleteness > 20,
      cvCompleteness,
      cvLastUpdated: cvData?.updated_at ? new Date(cvData.updated_at) : null,

      coverLetterCount: coverLetters.length,
      hasCoverLetterTemplate: coverLetters.length > 0,

      savedJobsCount: savedJobs.length,
      applicationsCount: 0, // TODO: Get from applications API
      pendingApplications: 0,

      hasCareerPlan: !!careerPlan,
      careerPlanProgress: careerPlan?.total_progress || 0,
      incompleteMilestones,
      upcomingMilestones,

      hasSkillsAnalysis: !!skillsAnalysis,
      skillsMatchPercentage: skillsAnalysis?.match_percentage || 0,
      skillGaps: skillsAnalysis?.skills_comparison?.filter(s => s.gap !== 'none').length || 0,

      networkContactsCount: networkContacts.length,
      contactsNeedingFollowup,
      activeContactsThisMonth,

      hasCompletedInterestGuide: interestProgress?.is_completed || false,

      onboardingProgress: Math.round((onboardingFields / onboardingTotal) * 100)
    }
  } catch (error) {
    console.error('Failed to fetch user state:', error)
    // Return minimal state on error
    return {
      hasCv: false,
      cvCompleteness: 0,
      cvLastUpdated: null,
      coverLetterCount: 0,
      hasCoverLetterTemplate: false,
      savedJobsCount: 0,
      applicationsCount: 0,
      pendingApplications: 0,
      hasCareerPlan: false,
      careerPlanProgress: 0,
      incompleteMilestones: 0,
      upcomingMilestones: 0,
      hasSkillsAnalysis: false,
      skillsMatchPercentage: 0,
      skillGaps: 0,
      networkContactsCount: 0,
      contactsNeedingFollowup: 0,
      activeContactsThisMonth: 0,
      hasCompletedInterestGuide: false,
      onboardingProgress: 0
    }
  }
}

// Generate recommendations based on user state
function generateRecommendations(state: UserState): Recommendation[] {
  const recommendations: Recommendation[] = []
  let idCounter = 1

  const addRecommendation = (rec: Omit<Recommendation, 'id'>) => {
    recommendations.push({ ...rec, id: `rec-${idCounter++}` })
  }

  // === HIGH PRIORITY ===

  // Network follow-ups are time-sensitive
  if (state.contactsNeedingFollowup > 0) {
    addRecommendation({
      type: 'network_followup',
      priority: 'high',
      title: `${state.contactsNeedingFollowup} kontakter behöver uppföljning`,
      description: 'Dina nätverkskontakter väntar på att höra från dig. Håll relationen stark!',
      action: 'Följ upp nu',
      actionPath: '/career?tab=network',
      icon: 'Users',
      category: 'networking',
      reason: 'Uppföljningar inom 7 dagar',
      estimatedTime: '10 min'
    })
  }

  // Upcoming milestones
  if (state.upcomingMilestones > 0) {
    addRecommendation({
      type: 'career_plan_milestone',
      priority: 'high',
      title: `${state.upcomingMilestones} milstolpar närmar sig`,
      description: 'Du har milstolpar med deadline inom 2 veckor. Fokusera på att slutföra dem!',
      action: 'Se karriärplan',
      actionPath: '/career?tab=plan',
      icon: 'Target',
      category: 'career_planning',
      reason: 'Deadline inom 14 dagar',
      estimatedTime: 'Varierar'
    })
  }

  // === MEDIUM PRIORITY ===

  // CV completeness
  if (!state.hasCv) {
    addRecommendation({
      type: 'cv_incomplete',
      priority: 'medium',
      title: 'Skapa ditt CV',
      description: 'Ett starkt CV är grunden för din jobbsökning. Börja bygga det idag!',
      action: 'Skapa CV',
      actionPath: '/cv',
      icon: 'FileText',
      category: 'onboarding',
      reason: 'Grundläggande steg',
      estimatedTime: '30 min'
    })
  } else if (state.cvCompleteness < 80) {
    addRecommendation({
      type: 'cv_incomplete',
      priority: 'medium',
      title: `Slutför ditt CV (${state.cvCompleteness}%)`,
      description: 'Lägg till mer information för att göra ditt CV mer attraktivt för arbetsgivare.',
      action: 'Förbättra CV',
      actionPath: '/cv',
      icon: 'FileText',
      category: 'onboarding',
      reason: `${100 - state.cvCompleteness}% kvar att fylla i`,
      estimatedTime: '15 min'
    })
  }

  // Interest guide
  if (!state.hasCompletedInterestGuide) {
    addRecommendation({
      type: 'interest_guide',
      priority: 'medium',
      title: 'Upptäck dina intressen',
      description: 'Gör intresseguiden för att hitta yrken som matchar din personlighet.',
      action: 'Starta guiden',
      actionPath: '/interest-guide',
      icon: 'Compass',
      category: 'onboarding',
      reason: 'Hjälper dig hitta rätt karriärväg',
      estimatedTime: '15 min'
    })
  }

  // Career plan
  if (!state.hasCareerPlan && state.hasCv) {
    addRecommendation({
      type: 'career_plan_start',
      priority: 'medium',
      title: 'Skapa en karriärplan',
      description: 'Sätt upp mål och milstolpar för att nå ditt drömjobb.',
      action: 'Skapa plan',
      actionPath: '/career?tab=plan',
      icon: 'Target',
      category: 'career_planning',
      reason: 'Du har ett CV - planera nästa steg',
      estimatedTime: '20 min'
    })
  }

  // Skills analysis
  if (!state.hasSkillsAnalysis && state.hasCv) {
    addRecommendation({
      type: 'skills_gap',
      priority: 'medium',
      title: 'Analysera dina kompetenser',
      description: 'Jämför dina kunskaper med krav för ditt drömjobb och identifiera utvecklingsområden.',
      action: 'Kör analys',
      actionPath: '/career?tab=skills',
      icon: 'TrendingUp',
      category: 'skills',
      reason: 'Baserat på ditt CV',
      estimatedTime: '10 min'
    })
  } else if (state.hasSkillsAnalysis && state.skillGaps > 0) {
    addRecommendation({
      type: 'skills_gap',
      priority: 'medium',
      title: `${state.skillGaps} kompetenser att utveckla`,
      description: `Du har ${state.skillsMatchPercentage}% matchning mot ditt drömjobb. Fokusera på de viktigaste gapen.`,
      action: 'Se kompetensplan',
      actionPath: '/career?tab=skills',
      icon: 'TrendingUp',
      category: 'skills',
      reason: `${100 - state.skillsMatchPercentage}% till full matchning`,
      estimatedTime: 'Varierar'
    })
  }

  // Cover letter
  if (!state.hasCoverLetterTemplate && state.hasCv) {
    addRecommendation({
      type: 'cover_letter_needed',
      priority: 'medium',
      title: 'Skapa ett personligt brev',
      description: 'Förbered en mall som du kan anpassa för olika ansökningar.',
      action: 'Skapa brev',
      actionPath: '/cover-letter',
      icon: 'Mail',
      category: 'job_search',
      reason: 'Komplettera ditt CV',
      estimatedTime: '20 min'
    })
  }

  // === LOW PRIORITY ===

  // Network expansion
  if (state.networkContactsCount < 5) {
    addRecommendation({
      type: 'network_expand',
      priority: 'low',
      title: 'Bygg ut ditt nätverk',
      description: 'Ett starkt nätverk öppnar dörrar. Lägg till fler kontakter!',
      action: 'Lägg till kontakter',
      actionPath: '/career?tab=network',
      icon: 'Users',
      category: 'networking',
      reason: `Du har ${state.networkContactsCount} kontakter`,
      estimatedTime: '10 min'
    })
  }

  // Job search
  if (state.savedJobsCount === 0 && state.hasCv && state.cvCompleteness >= 50) {
    addRecommendation({
      type: 'job_search',
      priority: 'low',
      title: 'Börja söka jobb',
      description: 'Ditt CV är redo - börja söka efter spännande möjligheter!',
      action: 'Sök jobb',
      actionPath: '/job-search',
      icon: 'Search',
      category: 'job_search',
      reason: 'Ditt CV är redo',
      estimatedTime: '15 min'
    })
  }

  // LinkedIn optimization
  if (state.cvCompleteness >= 70) {
    addRecommendation({
      type: 'linkedin_optimize',
      priority: 'low',
      title: 'Optimera din LinkedIn-profil',
      description: 'Se till att din LinkedIn matchar ditt CV och lockar rekryterare.',
      action: 'Optimera LinkedIn',
      actionPath: '/linkedin-optimizer',
      icon: 'Linkedin',
      category: 'networking',
      reason: 'Öka din synlighet',
      estimatedTime: '20 min'
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations
}

// Main API
export const recommendationService = {
  async getRecommendations(limit?: number): Promise<Recommendation[]> {
    const state = await getUserState()
    let recommendations = generateRecommendations(state)

    if (limit) {
      recommendations = recommendations.slice(0, limit)
    }

    return recommendations
  },

  async getTopRecommendations(count: number = 3): Promise<Recommendation[]> {
    return this.getRecommendations(count)
  },

  async getUserState(): Promise<UserState> {
    return getUserState()
  }
}

export default recommendationService
