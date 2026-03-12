/**
 * AI Assistant - Fas 3
 * 
 * Intelligent analys av all användardata för att ge
 * personliga, konkreta och tidskänsliga rekommendationer.
 */

import { supabase } from '@/lib/supabase'
import type { CVData } from '../supabaseApi'
import type { ApplicationData } from '../applicationService'
import type { SavedJob } from '../cloudStorage'

// ============================================
// TYPES
// ============================================

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'
export type RecommendationType = 'action' | 'insight' | 'reminder' | 'celebration'

export interface AIRecommendation {
  id: string
  priority: RecommendationPriority
  type: RecommendationType
  title: string
  description: string
  reasoning: string
  action: {
    label: string
    link: string
    dismissLabel?: string
  }
  expectedOutcome?: string
  deadline?: Date
  confidence: number // 0-100
  createdAt: string
}

export interface UserContext {
  // CV & Profile
  hasCV: boolean
  cvCompleteness: number
  lastCVUpdate: string | null
  
  // Applications
  totalApplications: number
  recentApplications: number // Last 7 days
  pendingApplications: number // Waiting for response
  interviewCount: number
  
  // Saved Jobs
  savedJobsCount: number
  savedJobsWithoutApplication: number
  highMatchJobs: SavedJob[] // Match score > 70%
  jobsClosingSoon: SavedJob[] // Saved > 5 days
  
  // Activity patterns
  lastActiveDate: string | null
  streakDays: number
  preferredApplicationTime: string | null
  
  // Interest Guide
  hasInterestResult: boolean
  topOccupations: string[]
  
  // Mood & Energy (from recent diary entries)
  recentMood: 'great' | 'good' | 'neutral' | 'bad' | null
  averageEnergy: number | null
  
  // Upcoming events
  upcomingInterviews: Array<{
    id: string
    company: string
    date: string
  }>
  
  // AI Insights
  applicationTrend: 'increasing' | 'stable' | 'decreasing' | null
  bestPerformingDay: string | null
}

// ============================================
// USER CONTEXT AGGREGATION
// ============================================

/**
 * Samla all användardata för AI-analys
 */
export async function gatherUserContext(): Promise<UserContext> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Parallella hämtningar
    const [
      { data: cv },
      { data: applications },
      { data: savedJobs },
      { data: interestResult },
      { data: recentEntries },
      { data: upcomingInterviews }
    ] = await Promise.all([
      // CV
      supabase.from('cvs').select('*').eq('user_id', user.id).maybeSingle(),
      
      // Applications
      supabase.from('job_applications').select('*').eq('user_id', user.id),
      
      // Saved jobs
      supabase.from('saved_jobs').select('*').eq('user_id', user.id),
      
      // Interest result
      supabase.from('interest_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      
      // Recent diary/activity entries (last 7 days)
      supabase.from('journey_entries').select('*')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false }),
      
      // Upcoming interviews
      supabase.from('job_applications').select('*')
        .eq('user_id', user.id)
        .eq('status', 'interview')
        .gte('follow_up_date', now.toISOString())
        .order('follow_up_date', { ascending: true })
    ])

    // Beräkna CV-kompletthet
    const cvCompleteness = calculateCVCompleteness(cv)
    
    // Analysera ansökningar
    const recentApps = (applications || []).filter(a => 
      new Date(a.application_date) >= weekAgo
    )
    
    const pendingApps = (applications || []).filter(a => 
      a.status === 'sent' || a.status === 'viewed'
    )
    
    const interviews = (applications || []).filter(a => 
      a.status === 'interview' || a.status === 'offer'
    )

    // Analysera sparade jobb
    const jobsWithoutApplication = (savedJobs || []).filter(j => j.status === 'SAVED')
    
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    const oldSavedJobs = jobsWithoutApplication.filter(j => 
      new Date(j.created_at) < fiveDaysAgo
    )

    // Analysera humör och energi
    const diaryEntries = (recentEntries || []).filter(e => e.type === 'diary')
    const recentMood = diaryEntries[0]?.mood || null
    const averageEnergy = diaryEntries.length > 0
      ? diaryEntries.reduce((sum, e) => sum + (e.energy_level || 5), 0) / diaryEntries.length
      : null

    // Beräkna trend
    const applicationTrend = calculateApplicationTrend(applications || [])

    return {
      hasCV: !!cv,
      cvCompleteness,
      lastCVUpdate: cv?.updated_at || null,
      
      totalApplications: applications?.length || 0,
      recentApplications: recentApps.length,
      pendingApplications: pendingApps.length,
      interviewCount: interviews.length,
      
      savedJobsCount: savedJobs?.length || 0,
      savedJobsWithoutApplication: jobsWithoutApplication.length,
      highMatchJobs: [], // TODO: Implementera matchning
      jobsClosingSoon: oldSavedJobs,
      
      lastActiveDate: recentEntries?.[0]?.created_at || null,
      streakDays: calculateStreak(recentEntries || []),
      preferredApplicationTime: null, // TODO: Analysera mönster
      
      hasInterestResult: !!interestResult,
      topOccupations: interestResult?.top_occupations || [],
      
      recentMood,
      averageEnergy,
      
      upcomingInterviews: (upcomingInterviews || []).map(i => ({
        id: i.id,
        company: i.employer,
        date: i.follow_up_date
      })),
      
      applicationTrend,
      bestPerformingDay: null // TODO: Analysera
    }
  } catch (error) {
    console.error('Fel vid insamling av användarkontext:', error)
    return getEmptyContext()
  }
}

function calculateCVCompleteness(cv: any): number {
  if (!cv) return 0
  let score = 0
  if (cv.first_name && cv.last_name) score += 15
  if (cv.email) score += 10
  if (cv.summary) score += 15
  if (cv.skills?.length > 0) score += 20
  if (cv.work_experience?.length > 0) score += 25
  if (cv.education?.length > 0) score += 15
  return Math.min(100, score)
}

function calculateStreak(entries: any[]): number {
  if (entries.length === 0) return 0
  // TODO: Implementera riktig streak-beräkning
  return Math.min(entries.length, 7)
}

function calculateApplicationTrend(applications: any[]): 'increasing' | 'stable' | 'decreasing' | null {
  if (applications.length < 5) return null
  
  const now = new Date()
  const thisWeek = applications.filter(a => 
    new Date(a.application_date) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  ).length
  
  const lastWeek = applications.filter(a => {
    const date = new Date(a.application_date)
    return date >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
           date < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }).length
  
  if (thisWeek > lastWeek * 1.2) return 'increasing'
  if (thisWeek < lastWeek * 0.8) return 'decreasing'
  return 'stable'
}

function getEmptyContext(): UserContext {
  return {
    hasCV: false,
    cvCompleteness: 0,
    lastCVUpdate: null,
    totalApplications: 0,
    recentApplications: 0,
    pendingApplications: 0,
    interviewCount: 0,
    savedJobsCount: 0,
    savedJobsWithoutApplication: 0,
    highMatchJobs: [],
    jobsClosingSoon: [],
    lastActiveDate: null,
    streakDays: 0,
    preferredApplicationTime: null,
    hasInterestResult: false,
    topOccupations: [],
    recentMood: null,
    averageEnergy: null,
    upcomingInterviews: [],
    applicationTrend: null,
    bestPerformingDay: null
  }
}

// ============================================
// RECOMMENDATION ENGINE
// ============================================

/**
 * Generera AI-rekommendationer baserat på användarkontext
 * 
 * Denna funktion använder regelbaserad logik för att generera
 * rekommendationer. I framtiden kan detta ersättas med ML/AI.
 */
export function generateRecommendations(context: UserContext): AIRecommendation[] {
  const recommendations: AIRecommendation[] = []

  // === CRITICAL PRIORITY ===
  
  // 1. Jobb som snart stänger
  if (context.jobsClosingSoon.length > 0) {
    const count = context.jobsClosingSoon.length
    recommendations.push({
      id: `closing-${Date.now()}`,
      priority: 'critical',
      type: 'action',
      title: count === 1 
        ? 'Ett sparat jobb riskerar att stänga snart'
        : `${count} sparade jobb riskerar att stänga snart`,
      description: count === 1
        ? 'Du har ett jobb sparat i över 5 dagar. Rekryteringar stänger ofta utan förvarning.'
        : `Du har ${count} jobb sparade i över 5 dagar utan ansökan. Risk att missa möjligheter.`,
      reasoning: 'Jobbannonser stänger i genomsnitt efter 14 dagar. Ju längre du väntar, desto större risk att missa chansen.',
      action: {
        label: count === 1 ? 'Skapa ansökan nu' : `Se ${count} jobb`,
        link: '/job-search?filter=saved',
        dismissLabel: 'Påminn mig imorgon'
      },
      expectedOutcome: 'Ökar chansen att komma på intervju med 40% genom att ansöka tidigt',
      confidence: 85,
      createdAt: new Date().toISOString()
    })
  }

  // 2. Kommande intervju
  if (context.upcomingInterviews.length > 0) {
    const interview = context.upcomingInterviews[0]
    const interviewDate = new Date(interview.date)
    const daysUntil = Math.ceil((interviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil <= 2) {
      recommendations.push({
        id: `interview-${interview.id}`,
        priority: 'critical',
        type: 'reminder',
        title: daysUntil === 0 
          ? `Intervju med ${interview.company} idag!`
          : `Intervju med ${interview.company} ${daysUntil === 1 ? 'imorgon' : `om ${daysUntil} dagar`}`,
        description: daysUntil === 0
          ? 'Din intervju är idag. Har du förberett dig?'
          : `Det är snart dags för din intervju. Se till att vara väl förberedd.`,
        reasoning: 'Förberedda kandidater har 3x större chans att få jobberbjudande.',
        action: {
          label: 'Förbered dig nu',
          link: '/knowledge-base/interview-prep',
          dismissLabel: 'Jag är redo'
        },
        deadline: interviewDate,
        confidence: 95,
        createdAt: new Date().toISOString()
      })
    }
  }

  // === HIGH PRIORITY ===

  // 3. Ingen CV
  if (!context.hasCV) {
    recommendations.push({
      id: 'no-cv',
      priority: 'high',
      type: 'action',
      title: 'Skapa ditt CV för att komma igång',
      description: 'Ett CV är grunden för all jobbsökning. Det tar bara 10 minuter att komma igång.',
      reasoning: 'Användare med kompletta CV:n får 5x fler intervjuer.',
      action: {
        label: 'Skapa CV nu',
        link: '/cv'
      },
      expectedOutcome: 'Du kan börja söka jobb och skicka ansökningar',
      confidence: 90,
      createdAt: new Date().toISOString()
    })
  }

  // 4. Låg ansökningstakt
  if (context.applicationTrend === 'decreasing' && context.recentApplications < 2) {
    recommendations.push({
      id: 'low-activity',
      priority: 'high',
      type: 'insight',
      title: 'Din ansökningstakt har sjunkit denna vecka',
      description: context.recentMood === 'bad' 
        ? 'Det verkar som du haft en tuff vecka. Det är helt OK att ta ett steg tillbaka ibland.'
        : 'Du verkar fastna i perfektionism? Kom ihåg: en bra ansökan idag slår en perfekt ansökan imorgon.',
      reasoning: 'Konsistens är viktigare än perfektion. 3 ansökningar/vecka ger bäst resultat.',
      action: {
        label: 'Sök ett jobb nu (10 min)',
        link: '/job-search',
        dismissLabel: 'Jag behöver en paus'
      },
      expectedOutcome: 'Komma tillbaka i flow och bygga momentum',
      confidence: 70,
      createdAt: new Date().toISOString()
    })
  }

  // 5. Många sparade jobb utan ansökan
  if (context.savedJobsWithoutApplication >= 5) {
    recommendations.push({
      id: 'saved-backlog',
      priority: 'high',
      type: 'action',
      title: `${context.savedJobsWithoutApplication} sparade jobb väntar på ansökan`,
      description: 'Du har sparat många intressanta jobb men inte hunnit ansöka. Sätt av 30 minuter idag.',
      reasoning: 'Sparade jobb ger inget värde förrän du ansöker. Batch-processera för effektivitet.',
      action: {
        label: 'Ansök på 3 jobb nu',
        link: '/job-tracker?filter=saved',
        dismissLabel: 'Inte idag'
      },
      expectedOutcome: 'Fler ansökningar ute = större chans till intervju',
      confidence: 80,
      createdAt: new Date().toISOString()
    })
  }

  // === MEDIUM PRIORITY ===

  // 6. Har intressen men inte testat matchade jobb
  if (context.hasInterestResult && context.recentApplications === 0) {
    recommendations.push({
      id: 'interest-jobs',
      priority: 'medium',
      type: 'action',
      title: 'Testa jobb matchade efter dina intressen',
      description: `Baserat på dina intressen har vi hittat jobb som kan passa dig. Dina toppområden: ${context.topOccupations.slice(0, 2).join(', ')}.`,
      reasoning: 'Jobb som matchar dina intressen ger högre jobbtillfredsställelse och längre anställningstid.',
      action: {
        label: 'Se matchade jobb',
        link: '/job-search?matched=true'
      },
      expectedOutcome: 'Hitta jobb du kanske missat i vanlig sökning',
      confidence: 75,
      createdAt: new Date().toISOString()
    })
  }

  // 7. Förberedelse inför kommande intervju
  if (context.upcomingInterviews.length > 0) {
    const interview = context.upcomingInterviews[0]
    const interviewDate = new Date(interview.date)
    const daysUntil = Math.ceil((interviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil > 2 && daysUntil <= 7) {
      recommendations.push({
        id: `interview-prep-${interview.id}`,
        priority: 'medium',
        type: 'reminder',
        title: `Förbered dig inför intervjun med ${interview.company}`,
        description: `Du har intervju om ${daysUntil} dagar. Ta tid att förbereda dig ordentligt för att göra ditt bästa intryck.`,
        reasoning: 'Väl förberedda kandidater är mer avslappnade och ger bättre svar.',
        action: {
          label: 'Förberedelse-guide',
          link: '/knowledge-base/interview-prep'
        },
        deadline: interviewDate,
        confidence: 80,
        createdAt: new Date().toISOString()
      })
    }
  }

  // 8. Låg energi
  if (context.averageEnergy !== null && context.averageEnergy < 4) {
    recommendations.push({
      id: 'low-energy',
      priority: 'medium',
      type: 'insight',
      title: 'Du verkar ha låg energi just nu',
      description: 'Det är OK att inte orka söka jobb varje dag. Fokusera på återhämtning och små steg.',
      reasoning: 'Hållbarhet är viktigare än intensitet. Små steg leder också framåt.',
      action: {
        label: 'Se energianpassade övningar',
        link: '/exercises?energy=low',
        dismissLabel: 'Tack, jag vill vila'
      },
      expectedOutcome: 'Undvika utbrändhet och hålla långsiktig motivation',
      confidence: 65,
      createdAt: new Date().toISOString()
    })
  }

  // === LOW PRIORITY / CELEBRATIONS ===

  // 9. Fira milstolpar
  if (context.totalApplications === 1) {
    recommendations.push({
      id: 'first-application',
      priority: 'low',
      type: 'celebration',
      title: '🎉 Grattis till din första ansökan!',
      description: 'Det första steget är alltid det svåraste. Du är på gång!',
      reasoning: 'Att fira små framsteg ökar motivation och bygger självförtroende.',
      action: {
        label: 'Skriv om känslan i dagboken',
        link: '/diary'
      },
      expectedOutcome: 'Bygga positivt momentum i din jobbsökning',
      confidence: 90,
      createdAt: new Date().toISOString()
    })
  }

  if (context.totalApplications === 10) {
    recommendations.push({
      id: 'tenth-application',
      priority: 'low',
      type: 'celebration',
      title: '🎉 10 ansökningar! Du bygger momentum!',
      description: 'Tio ansökningar är en stor milstolpe. Fortsätt så!',
      reasoning: 'Statistiskt sett leder 10-20 ansökningar till 1-2 intervjuer.',
      action: {
        label: 'Se din statistik',
        link: '/job-tracker?tab=stats'
      },
      confidence: 85,
      createdAt: new Date().toISOString()
    })
  }

  if (context.interviewCount === 1) {
    recommendations.push({
      id: 'first-interview',
      priority: 'low',
      type: 'celebration',
      title: '🎉 Du har fått din första intervju!',
      description: 'Ditt CV gjorde intryck! Nu är det dags att förbereda dig.',
      reasoning: 'Att komma på intervju betyder att du är kvalificerad - de vill lära känna dig!',
      action: {
        label: 'Förbered dig för intervjun',
        link: '/knowledge-base/interview-prep'
      },
      expectedOutcome: 'Känn dig stolt och förberedd inför intervjun',
      confidence: 95,
      createdAt: new Date().toISOString()
    })
  }

  // Sortera efter prioritet
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
  return recommendations.sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  )
}

// ============================================
// API
// ============================================

export const aiAssistantApi = {
  /**
   * Hämta personliga rekommendationer för användaren
   */
  async getRecommendations(): Promise<AIRecommendation[]> {
    const context = await gatherUserContext()
    return generateRecommendations(context)
  },

  /**
   * Markera rekommendation som hanterad
   */
  async dismissRecommendation(recommendationId: string): Promise<void> {
    // TODO: Spara i databas för att inte visa igen
    console.log('Rekommendation avfärdad:', recommendationId)
  },

  /**
   * Markera rekommendation som utförd
   */
  async completeRecommendation(recommendationId: string): Promise<void> {
    // TODO: Spara i databas för analytics
    console.log('Rekommendation utförd:', recommendationId)
  }
}
