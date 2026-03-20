/**
 * Types for Min Jobbresa (My Job Journey)
 */

export interface JourneyPhase {
  id: number
  key: string
  name: string
  description: string
  icon: string
  xpMin: number
  xpMax: number
  milestones: JourneyMilestone[]
  coachingMessage: string
}

export interface JourneyMilestone {
  id: string
  phaseId: number
  key: string
  name: string
  description: string
  icon: string
  xpReward: number
  category: MilestoneCategory
  requirementType: RequirementType
  requirementValue: number
  link?: string
  linkLabel?: string
}

export type MilestoneCategory =
  | 'profile'
  | 'onboarding'
  | 'cv'
  | 'jobs'
  | 'knowledge'
  | 'interview'
  | 'linkedin'
  | 'wellness'
  | 'engagement'
  | 'community'
  | 'special'

export type RequirementType =
  | 'profile_complete'
  | 'onboarding_complete'
  | 'cv_started'
  | 'cv_progress'
  | 'cv_complete'
  | 'cv_ats_score'
  | 'interest_guide_complete'
  | 'jobs_saved'
  | 'jobs_applied'
  | 'cover_letter_created'
  | 'articles_read'
  | 'interview_practice'
  | 'diary_entries'
  | 'streak_days'
  | 'linkedin_analyzed'
  | 'level_reached'
  | 'page_visited'

export interface UserJourneyProgress {
  currentPhase: number
  totalXP: number
  level: number
  levelTitle: string
  nextLevelXP: number
  currentStreak: number
  longestStreak: number
  phasesCompleted: number
  totalPhases: number
  milestonesCompleted: string[]
  phaseProgress: Record<number, PhaseProgress>
}

export interface PhaseProgress {
  phaseId: number
  progress: number // 0-100
  isCompleted: boolean
  completedAt?: string
  startedAt: string
  milestonesCompleted: number
  totalMilestones: number
}

export interface JourneyActivity {
  id: string
  type: string
  title: string
  description?: string
  xpEarned: number
  timestamp: string
  icon?: string
  badgeUnlocked?: string
  milestoneCompleted?: string
}

export interface JourneyStats {
  totalXP: number
  level: number
  levelTitle: string
  currentStreak: number
  longestStreak: number
  daysActive: number
  totalMilestones: number
  milestonesCompleted: number
  totalBadges: number
  badgesUnlocked: number
  applicationsCount: number
  articlesRead: number
  cvProgress: number
}

export interface NextStep {
  milestone: JourneyMilestone
  progress: number
  isReady: boolean
  priority: 'high' | 'medium' | 'low'
}

export interface WeeklySummary {
  daysActive: number
  totalDays: number
  minutesSpent: number
  xpEarned: number
  milestonesCompleted: number
  applicationsSubmitted: number
  articlesRead: number
  streakMaintained: boolean
}
