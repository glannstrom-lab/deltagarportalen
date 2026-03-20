/**
 * Community Types - Stötta & Fira
 */

export type ActivityType =
  | 'application_sent'
  | 'interview_scheduled'
  | 'cv_completed'
  | 'milestone_reached'
  | 'streak_achieved'
  | 'first_login'
  | 'profile_completed'
  | 'article_read'
  | 'exercise_completed'
  | 'job_offer'

export type CheerType =
  | 'encouragement'
  | 'congratulation'
  | 'support'
  | 'reaction'

export interface FeedItem {
  id: string
  userId: string
  activityType: ActivityType
  title: string
  description?: string
  metadata: Record<string, unknown>
  isPublic: boolean
  cheerCount: number
  createdAt: string
  // Joined data
  user?: {
    firstName: string
    lastName: string
    avatarUrl?: string
  }
  myReactions?: string[] // Emojis I've reacted with
  reactions?: ReactionSummary[]
}

export interface ReactionSummary {
  emoji: string
  count: number
  hasReacted: boolean // Did current user react with this emoji
}

export interface Cheer {
  id: string
  fromUserId: string
  toUserId?: string
  feedItemId?: string
  cheerType: CheerType
  message?: string
  emoji?: string
  isAnonymous: boolean
  createdAt: string
  // Joined data
  fromUser?: {
    firstName: string
    lastName: string
    avatarUrl?: string
  }
}

export interface SendCheerData {
  toUserId?: string
  feedItemId?: string
  cheerType: CheerType
  message?: string
  emoji?: string
  isAnonymous?: boolean
}

// Activity type metadata for display
export const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: string
  color: string
  bgColor: string
  celebrationEmoji: string
}> = {
  application_sent: {
    icon: 'Send',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    celebrationEmoji: '📨'
  },
  interview_scheduled: {
    icon: 'Calendar',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    celebrationEmoji: '🎯'
  },
  cv_completed: {
    icon: 'FileCheck',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    celebrationEmoji: '📄'
  },
  milestone_reached: {
    icon: 'Trophy',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    celebrationEmoji: '🏆'
  },
  streak_achieved: {
    icon: 'Flame',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    celebrationEmoji: '🔥'
  },
  first_login: {
    icon: 'Sparkles',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    celebrationEmoji: '✨'
  },
  profile_completed: {
    icon: 'UserCheck',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    celebrationEmoji: '👤'
  },
  article_read: {
    icon: 'BookOpen',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    celebrationEmoji: '📚'
  },
  exercise_completed: {
    icon: 'Dumbbell',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    celebrationEmoji: '💪'
  },
  job_offer: {
    icon: 'PartyPopper',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    celebrationEmoji: '🎉'
  }
}

// Common reaction emojis
export const REACTION_EMOJIS = ['💪', '🎉', '👏', '❤️', '🔥', '🙌', '⭐', '🚀']

// Encouragement templates
export const ENCOURAGEMENT_TEMPLATES = [
  { emoji: '💪', text: 'Du klarar det!' },
  { emoji: '🌟', text: 'Fortsätt kämpa!' },
  { emoji: '🤗', text: 'Du är inte ensam!' },
  { emoji: '🎯', text: 'Ett steg i taget!' },
  { emoji: '💜', text: 'Jag tror på dig!' },
  { emoji: '🌈', text: 'Bättre tider kommer!' },
]
