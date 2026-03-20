/**
 * AI Assistant - Fas 3
 * 
 * Intelligent analys av all användardata för att ge
 * personliga, konkreta och tidskänsliga rekommendationer.
 */

import { supabase } from '@/lib/supabase'
import { aiLogger } from '@/lib/logger'
import type { CVData } from '../supabaseApi'
import type { ApplicationData } from '../applicationService'
import type { SavedJob } from '../cloudStorage'

// ============================================
// DATABASE TYPES
// ============================================

/**
 * Journey entry from database (diary, activities, etc.)
 */
interface JourneyEntry {
  id: string
  user_id: string
  type: 'diary' | 'activity' | 'reflection' | 'goal'
  created_at: string
  mood?: number | null
  energy_level?: number | null
  [key: string]: unknown
}

/**
 * Job application from database
 */
interface JobApplicationDB {
  id: string
  user_id: string
  job_id?: string | null
  job_title: string
  employer: string
  application_date?: string
  status: 'draft' | 'sent' | 'viewed' | 'interview' | 'rejected' | 'offer' | 'applied' | 'withdrawn'
  cover_letter?: string | null
  notes?: string | null
  contact_person?: string | null
  follow_up_date?: string | null
  created_at: string
  updated_at: string
}

/**
 * Saved job with extended data
 */
interface SavedJobDB {
  id: string
  user_id: string
  job_id: string
  status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED'
  match_score?: number | null
  created_at: string
  [key: string]: unknown
}

/**
 * Interest result from database
 */
interface InterestResultDB {
  id: string
  user_id: string
  top_occupations?: string[]
  recommended_jobs?: string[]
  created_at: string
  [key: string]: unknown
}

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
    const applicationsTyped = (applications || []) as JobApplicationDB[]
    const recentApps = applicationsTyped.filter(a =>
      a.application_date && new Date(a.application_date) >= weekAgo
    )

    const pendingApps = applicationsTyped.filter(a =>
      a.status === 'sent' || a.status === 'viewed'
    )

    const interviews = applicationsTyped.filter(a =>
      a.status === 'interview' || a.status === 'offer'
    )

    // Analysera sparade jobb
    const savedJobsTyped = (savedJobs || []) as SavedJobDB[]
    const jobsWithoutApplication = savedJobsTyped.filter(j => j.status === 'SAVED')

    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    const oldSavedJobs = jobsWithoutApplication.filter(j =>
      new Date(j.created_at) < fiveDaysAgo
    )

    // Analysera humör och energi
    const entriesTyped = (recentEntries || []) as JourneyEntry[]
    const diaryEntries = entriesTyped.filter(e => e.type === 'diary')
    const recentMood = diaryEntries[0]?.mood || null
    const averageEnergy = diaryEntries.length > 0
      ? diaryEntries.reduce((sum, e) => sum + (e.energy_level || 5), 0) / diaryEntries.length
      : null

    // Beräkna trend
    const applicationTrend = calculateApplicationTrend(applicationsTyped)

    // Calculate high match jobs (jobs with match_score > 70)
    const highMatchJobs = savedJobsTyped.filter(j =>
      j.match_score && j.match_score > 70
    ) as SavedJob[]

    // Calculate preferred application time
    const preferredApplicationTime = calculatePreferredTime(applicationsTyped)

    // Calculate best performing day
    const bestPerformingDay = calculateBestDay(applicationsTyped)

    // Type interest result
    const interestResultTyped = interestResult as InterestResultDB | null

    // Type upcoming interviews
    const upcomingInterviewsTyped = (upcomingInterviews || []) as JobApplicationDB[]

    return {
      hasCV: !!cv,
      cvCompleteness,
      lastCVUpdate: cv?.updated_at || null,

      totalApplications: applicationsTyped.length,
      recentApplications: recentApps.length,
      pendingApplications: pendingApps.length,
      interviewCount: interviews.length,

      savedJobsCount: savedJobsTyped.length,
      savedJobsWithoutApplication: jobsWithoutApplication.length,
      highMatchJobs,
      jobsClosingSoon: oldSavedJobs as SavedJob[],

      lastActiveDate: entriesTyped[0]?.created_at || null,
      streakDays: calculateStreak(entriesTyped),
      preferredApplicationTime,

      hasInterestResult: !!interestResultTyped,
      topOccupations: interestResultTyped?.top_occupations || interestResultTyped?.recommended_jobs || [],

      recentMood,
      averageEnergy,

      upcomingInterviews: upcomingInterviewsTyped.map(i => ({
        id: i.id,
        company: i.employer,
        date: i.follow_up_date || i.created_at
      })),

      applicationTrend,
      bestPerformingDay
    }
  } catch (error) {
    aiLogger.error('Fel vid insamling av användarkontext:', error)
    return getEmptyContext()
  }
}

function calculateCVCompleteness(cv: CVData | null): number {
  if (!cv) return 0
  let score = 0
  if ((cv.first_name || cv.firstName) && (cv.last_name || cv.lastName)) score += 15
  if (cv.email) score += 10
  if (cv.summary) score += 15
  if (cv.skills && cv.skills.length > 0) score += 20
  if ((cv.work_experience && cv.work_experience.length > 0) || (cv.workExperience && cv.workExperience.length > 0)) score += 25
  if (cv.education && cv.education.length > 0) score += 15
  return Math.min(100, score)
}

function calculateStreak(entries: JourneyEntry[]): number {
  if (entries.length === 0) return 0

  // Sort by date descending
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Get unique dates
  const uniqueDates = new Set(
    sortedEntries.map(e => new Date(e.created_at).toISOString().split('T')[0])
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let checkDate = today

  // Check if there's an entry for today or yesterday to start the streak
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (!uniqueDates.has(todayStr) && !uniqueDates.has(yesterdayStr)) {
    return 0 // No streak if no activity today or yesterday
  }

  // Start from today or yesterday
  if (!uniqueDates.has(todayStr)) {
    checkDate = yesterday
  }

  // Count consecutive days
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (uniqueDates.has(dateStr)) {
      streak++
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
    } else {
      break
    }
  }

  return streak
}

function calculateApplicationTrend(applications: JobApplicationDB[]): 'increasing' | 'stable' | 'decreasing' | null {
  if (applications.length < 5) return null

  const now = new Date()
  const thisWeek = applications.filter(a =>
    new Date(a.application_date || a.created_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  ).length

  const lastWeek = applications.filter(a => {
    const date = new Date(a.application_date || a.created_at)
    return date >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
           date < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }).length

  if (thisWeek > lastWeek * 1.2) return 'increasing'
  if (thisWeek < lastWeek * 0.8) return 'decreasing'
  return 'stable'
}

function calculatePreferredTime(applications: JobApplicationDB[]): string | null {
  if (applications.length < 3) return null

  // Count applications by hour
  const hourCounts: Record<number, number> = {}
  applications.forEach(app => {
    const date = new Date(app.application_date || app.created_at)
    const hour = date.getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  // Find most common hour
  let maxHour = 0
  let maxCount = 0
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count
      maxHour = parseInt(hour)
    }
  }

  if (maxCount < 2) return null

  // Format time period
  if (maxHour >= 6 && maxHour < 12) return 'morning'
  if (maxHour >= 12 && maxHour < 17) return 'afternoon'
  if (maxHour >= 17 && maxHour < 21) return 'evening'
  return 'night'
}

function calculateBestDay(applications: JobApplicationDB[]): string | null {
  if (applications.length < 5) return null

  // Only consider applications that led to interviews
  const successfulApps = applications.filter(a =>
    a.status === 'interview' || a.status === 'offer'
  )

  if (successfulApps.length < 2) return null

  // Count by day of week
  const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
  const dayCounts: Record<number, number> = {}

  successfulApps.forEach(app => {
    const date = new Date(app.application_date || app.created_at)
    const day = date.getDay()
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })

  // Find most successful day
  let maxDay = 0
  let maxCount = 0
  for (const [day, count] of Object.entries(dayCounts)) {
    if (count > maxCount) {
      maxCount = count
      maxDay = parseInt(day)
    }
  }

  if (maxCount < 2) return null

  return dayNames[maxDay]
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

// Storage key for dismissed recommendations
const DISMISSED_KEY = 'ai_dismissed_recommendations'
const COMPLETED_KEY = 'ai_completed_recommendations'

interface DismissedItem {
  id: string
  timestamp: number
}

function getDismissedRecommendations(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as DismissedItem[]
      // Filter out entries older than 7 days
      const now = Date.now()
      const valid = parsed.filter((item: DismissedItem) =>
        now - item.timestamp < 7 * 24 * 60 * 60 * 1000
      )
      return new Set(valid.map((item: DismissedItem) => item.id))
    }
  } catch (e) {
    aiLogger.error('Error reading dismissed recommendations:', e)
  }
  return new Set()
}

function saveDismissedRecommendation(id: string): void {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY)
    const items = stored ? JSON.parse(stored) : []
    items.push({ id, timestamp: Date.now() })
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(items))
  } catch (e) {
    aiLogger.error('Error saving dismissed recommendation:', e)
  }
}

function saveCompletedRecommendation(id: string): void {
  try {
    const stored = localStorage.getItem(COMPLETED_KEY)
    const items = stored ? JSON.parse(stored) : []
    items.push({ id, timestamp: Date.now() })
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(items))
  } catch (e) {
    aiLogger.error('Error saving completed recommendation:', e)
  }
}

export const aiAssistantApi = {
  /**
   * Hämta personliga rekommendationer för användaren
   */
  async getRecommendations(): Promise<AIRecommendation[]> {
    const context = await gatherUserContext()
    const allRecommendations = generateRecommendations(context)

    // Filter out dismissed recommendations
    const dismissed = getDismissedRecommendations()
    return allRecommendations.filter(rec => {
      // Extract base ID (without timestamp) for comparison
      const baseId = rec.id.split('-')[0]
      return !dismissed.has(rec.id) && !dismissed.has(baseId)
    })
  },

  /**
   * Markera rekommendation som hanterad (visa inte igen på ett tag)
   */
  async dismissRecommendation(recommendationId: string): Promise<void> {
    saveDismissedRecommendation(recommendationId)
    // Also save the base ID to prevent similar recommendations
    const baseId = recommendationId.split('-')[0]
    if (baseId !== recommendationId) {
      saveDismissedRecommendation(baseId)
    }
    aiLogger.debug('Rekommendation avfärdad:', recommendationId)
  },

  /**
   * Markera rekommendation som utförd
   */
  async completeRecommendation(recommendationId: string): Promise<void> {
    saveCompletedRecommendation(recommendationId)
    // Also dismiss it so it doesn't show again
    saveDismissedRecommendation(recommendationId)
    aiLogger.debug('Rekommendation utförd:', recommendationId)
  },

  /**
   * Hämta användarkontext för debugging/display
   */
  async getUserContext(): Promise<UserContext> {
    return gatherUserContext()
  }
}
