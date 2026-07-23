/**
 * Consultant Insights Service
 * AI-driven analytics and insights for consultants about their participants
 */

import { supabase } from '@/lib/supabase'

// Types
export interface ParticipantInsight {
  participantId: string
  participantName: string
  type: InsightType
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionLabel: string
  actionPath: string
  metric?: string
  trend?: 'up' | 'down' | 'stable'
}

export type InsightType =
  | 'engagement_drop'
  | 'goal_at_risk'
  | 'milestone_overdue'
  | 'cv_improvement'
  | 'ready_for_jobs'
  | 'interview_upcoming'
  | 'skills_gap'
  | 'network_inactive'
  | 'high_performer'
  | 'needs_support'

// Ögonblicksvärden, inte trender: det finns ingen historisk snapshot-tabell,
// så en "förra perioden"-jämförelse går inte att göra ärligt härifrån.
// (Tidigare fabricerades previous med Math.random() — borttaget 2026-07-23.)
export interface KeyMetric {
  label: string
  current: number
  isPercent: boolean
}

export interface CohortComparison {
  cohortName: string
  startDate: string
  participants: number
  cvCompletionRate: number
  placementRate: number
  avgDaysToPlacement: number
  engagementRate: number
}

export interface ParticipantRisk {
  participantId: string
  participantName: string
  riskScore: number // 0-100, higher = more risk
  riskFactors: string[]
  recommendedActions: string[]
}

/**
 * Generate AI-driven insights about participants
 */
export async function generateParticipantInsights(
  consultantId: string,
  limit: number = 10
): Promise<ParticipantInsight[]> {
  const insights: ParticipantInsight[] = []

  // Fetch participants with their data
  const { data: participants, error: participantsError } = await supabase
    .from('consultant_dashboard_participants')
    .select('*')
    .eq('consultant_id', consultantId)
    .eq('status', 'ACTIVE')

  if (participantsError) throw participantsError
  if (!participants) return insights

    const now = new Date()

    for (const participant of participants) {
      // Check for engagement drop
      if (participant.last_login) {
        const daysSinceLogin = Math.floor(
          (now.getTime() - new Date(participant.last_login).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceLogin > 7) {
          insights.push({
            participantId: participant.user_id,
            participantName: participant.name || 'Deltagare',
            type: 'engagement_drop',
            priority: daysSinceLogin > 14 ? 'high' : 'medium',
            title: `${participant.name || 'Deltagare'} har inte loggat in på ${daysSinceLogin} dagar`,
            description: 'Överväg att ta kontakt för att återengagera deltagaren.',
            actionLabel: 'Skicka påminnelse',
            actionPath: `/consultant/participants/${participant.user_id}`,
            metric: `${daysSinceLogin} dagar`,
            trend: 'down'
          })
        }
      }

      // Check CV completion
      if (participant.ats_score !== null && participant.ats_score < 50) {
        insights.push({
          participantId: participant.user_id,
          participantName: participant.name || 'Deltagare',
          type: 'cv_improvement',
          priority: participant.ats_score < 30 ? 'high' : 'medium',
          title: `${participant.name || 'Deltagare'} har ett CV som behöver förbättras`,
          description: `CV-poäng är ${participant.ats_score}%. Hjälp till med att förbättra nyckelområden.`,
          actionLabel: 'Se CV-analys',
          actionPath: `/consultant/participants/${participant.user_id}?tab=cv`,
          metric: `${participant.ats_score}%`,
          trend: 'stable'
        })
      }

      // Check if ready for job search
      if (participant.ats_score >= 70 && participant.saved_jobs_count === 0) {
        insights.push({
          participantId: participant.user_id,
          participantName: participant.name || 'Deltagare',
          type: 'ready_for_jobs',
          priority: 'medium',
          title: `${participant.name || 'Deltagare'} har ett starkt CV men söker inga jobb`,
          description: 'CV är redo - uppmuntra till aktiv jobbsökning.',
          actionLabel: 'Diskutera jobbsökning',
          actionPath: `/consultant/participants/${participant.user_id}`,
          metric: `${participant.ats_score}% CV`,
          trend: 'stable'
        })
      }

      // High performer recognition
      if (participant.ats_score >= 85 && participant.saved_jobs_count > 5) {
        insights.push({
          participantId: participant.user_id,
          participantName: participant.name || 'Deltagare',
          type: 'high_performer',
          priority: 'low',
          title: `${participant.name || 'Deltagare'} visar utmärkta framsteg`,
          description: 'Överväg att erbjuda avancerade resurser eller intervjuträning.',
          actionLabel: 'Se profil',
          actionPath: `/consultant/participants/${participant.user_id}`,
          metric: `${participant.saved_jobs_count} sparade jobb`,
          trend: 'up'
        })
      }
    }

  // Fetch goals at risk
  const { data: goals, error: goalsError } = await supabase
    .from('consultant_goals')
    .select('*, participant:consultant_dashboard_participants!inner(name, user_id)')
    .eq('consultant_id', consultantId)
    .eq('status', 'IN_PROGRESS')

  if (goalsError) throw goalsError

    if (goals) {
      for (const goal of goals) {
        if (goal.deadline) {
          const daysUntil = Math.floor(
            (new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (daysUntil < 0) {
            insights.push({
              participantId: goal.participant?.user_id || goal.participant_id,
              participantName: goal.participant?.name || 'Deltagare',
              type: 'milestone_overdue',
              priority: 'high',
              title: `"${goal.title}" är försenad`,
              description: `Deadline var ${Math.abs(daysUntil)} dagar sedan. Planera om eller uppdatera målet.`,
              actionLabel: 'Hantera mål',
              actionPath: `/consultant/participants/${goal.participant_id}?tab=goals`,
              metric: `${Math.abs(daysUntil)} dagar försenad`,
              trend: 'down'
            })
          } else if (daysUntil <= 7 && goal.progress < 50) {
            insights.push({
              participantId: goal.participant?.user_id || goal.participant_id,
              participantName: goal.participant?.name || 'Deltagare',
              type: 'goal_at_risk',
              priority: 'high',
              title: `"${goal.title}" riskerar att inte nås`,
              description: `Endast ${goal.progress}% framsteg med ${daysUntil} dagar kvar.`,
              actionLabel: 'Granska mål',
              actionPath: `/consultant/participants/${goal.participant_id}?tab=goals`,
              metric: `${goal.progress}% klart`,
              trend: 'down'
            })
          }
        }
      }
    }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return insights.slice(0, limit)
}

/**
 * Current key metrics for the consultant's caseload (honest snapshot, no
 * fabricated period comparison — see note at KeyMetric).
 */
export async function getKeyMetrics(consultantId: string): Promise<KeyMetric[]> {
  const { data: participants, error } = await supabase
    .from('consultant_dashboard_participants')
    .select('*')
    .eq('consultant_id', consultantId)

  if (error) throw error
  if (!participants || participants.length === 0) return []

  const activeCount = participants.filter(p => p.status === 'ACTIVE').length

  const withCV = participants.filter(p => p.has_cv).length
  const cvRate = Math.round((withCV / participants.length) * 100)

  const now = new Date()
  const recentlyActive = participants.filter(p => {
    if (!p.last_login) return false
    const daysSince = Math.floor((now.getTime() - new Date(p.last_login).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince < 7
  }).length
  const engagement = Math.round((recentlyActive / participants.length) * 100)

  const avgScore = Math.round(
    participants.reduce((sum, p) => sum + (p.ats_score || 0), 0) / participants.length
  )

  return [
    { label: 'Aktiva deltagare', current: activeCount, isPercent: false },
    { label: 'CV-komplettering', current: cvRate, isPercent: true },
    { label: 'Aktiva senaste veckan', current: engagement, isPercent: true },
    { label: 'Genomsnittlig CV-poäng', current: avgScore, isPercent: true }
  ]
}

/**
 * Generate risk assessment for participants
 */
export async function assessParticipantRisks(
  consultantId: string
): Promise<ParticipantRisk[]> {
  const risks: ParticipantRisk[] = []

  const { data: participants, error } = await supabase
    .from('consultant_dashboard_participants')
    .select('*')
    .eq('consultant_id', consultantId)
    .eq('status', 'ACTIVE')

  // Ett DB-fel får ALDRIG tolkas som "inga riskdeltagare" — kasta vidare så UI:t kan visa fel
  if (error) throw error
  if (!participants) return risks

    const now = new Date()

    for (const participant of participants) {
      const riskFactors: string[] = []
      const recommendedActions: string[] = []
      let riskScore = 0

      // Check login activity
      if (participant.last_login) {
        const daysSinceLogin = Math.floor(
          (now.getTime() - new Date(participant.last_login).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLogin > 14) {
          riskScore += 30
          riskFactors.push(`Ingen aktivitet på ${daysSinceLogin} dagar`)
          recommendedActions.push('Schemalägg ett uppföljningssamtal')
        } else if (daysSinceLogin > 7) {
          riskScore += 15
          riskFactors.push('Minskad aktivitet senaste veckan')
          recommendedActions.push('Skicka en påminnelse')
        }
      } else {
        riskScore += 20
        riskFactors.push('Aldrig loggat in')
        recommendedActions.push('Kontakta för att hjälpa med att komma igång')
      }

      // Check CV status
      if (!participant.has_cv) {
        riskScore += 25
        riskFactors.push('Inget CV skapat')
        recommendedActions.push('Erbjud hjälp med CV-byggaren')
      } else if (participant.ats_score && participant.ats_score < 50) {
        riskScore += 15
        riskFactors.push(`Låg CV-poäng (${participant.ats_score}%)`)
        recommendedActions.push('Granska och förbättra CV tillsammans')
      }

      // Check job search activity
      if (participant.saved_jobs_count === 0 && participant.has_cv) {
        riskScore += 15
        riskFactors.push('Inga sparade jobb trots CV')
        recommendedActions.push('Diskutera jobbsökningsstrategi')
      }

      // Only include participants with some risk
      if (riskScore > 0) {
        risks.push({
          participantId: participant.user_id,
          participantName: participant.name || 'Deltagare',
          riskScore: Math.min(100, riskScore),
          riskFactors,
          recommendedActions
        })
      }
    }

  // Sort by risk score (highest first)
  risks.sort((a, b) => b.riskScore - a.riskScore)

  return risks
}

/**
 * Generate summary statistics for dashboard
 */
export async function getDashboardSummary(consultantId: string): Promise<{
  totalParticipants: number
  activeParticipants: number
  highRiskCount: number
  upcomingDeadlines: number
  avgEngagement: number
  avgCvScore: number
  topInsight: ParticipantInsight | null
}> {
  try {
    const { data: participants } = await supabase
      .from('consultant_dashboard_participants')
      .select('*')
      .eq('consultant_id', consultantId)

    const { data: goals } = await supabase
      .from('consultant_goals')
      .select('*')
      .eq('consultant_id', consultantId)
      .eq('status', 'IN_PROGRESS')

    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const total = participants?.length || 0
    const active = participants?.filter(p => p.status === 'ACTIVE').length || 0

    // Calculate high risk count
    const risks = await assessParticipantRisks(consultantId)
    const highRiskCount = risks.filter(r => r.riskScore >= 50).length

    // Calculate upcoming deadlines
    const upcomingDeadlines = goals?.filter(g => {
      if (!g.deadline) return false
      const deadline = new Date(g.deadline)
      return deadline >= now && deadline <= weekFromNow
    }).length || 0

    // Calculate engagement
    const recentlyActive = participants?.filter(p => {
      if (!p.last_login) return false
      const daysSince = Math.floor((now.getTime() - new Date(p.last_login).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince < 7
    }).length || 0
    const avgEngagement = Math.round((recentlyActive / Math.max(total, 1)) * 100)

    // Calculate avg CV score
    const avgCvScore = Math.round(
      (participants?.reduce((sum, p) => sum + (p.ats_score || 0), 0) || 0) / Math.max(total, 1)
    )

    // Get top insight
    const insights = await generateParticipantInsights(consultantId, 1)
    const topInsight = insights[0] || null

    return {
      totalParticipants: total,
      activeParticipants: active,
      highRiskCount,
      upcomingDeadlines,
      avgEngagement,
      avgCvScore,
      topInsight
    }
  } catch (error) {
    console.error('Failed to get dashboard summary:', error)
    return {
      totalParticipants: 0,
      activeParticipants: 0,
      highRiskCount: 0,
      upcomingDeadlines: 0,
      avgEngagement: 0,
      avgCvScore: 0,
      topInsight: null
    }
  }
}

// Export service
export const consultantInsights = {
  generateParticipantInsights,
  getKeyMetrics,
  assessParticipantRisks,
  getDashboardSummary
}

export default consultantInsights
