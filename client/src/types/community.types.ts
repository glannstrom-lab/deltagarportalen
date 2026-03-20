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

// ============================================
// DISCUSSIONS (Step 2)
// ============================================

export interface DiscussionCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon: string
  color: string
  sortOrder: number
}

export interface DiscussionTopic {
  id: string
  categoryId: string
  authorId: string
  title: string
  content: string
  replyCount: number
  viewCount: number
  likeCount: number
  isPinned: boolean
  isSolved: boolean
  isLocked: boolean
  lastReplyAt?: string
  createdAt: string
  updatedAt: string
  // Joined data
  author?: UserInfo
  category?: DiscussionCategory
  hasLiked?: boolean
}

export interface DiscussionReply {
  id: string
  topicId: string
  authorId: string
  parentReplyId?: string
  content: string
  likeCount: number
  isAccepted: boolean
  createdAt: string
  updatedAt: string
  // Joined data
  author?: UserInfo
  hasLiked?: boolean
}

export interface CreateTopicData {
  categoryId: string
  title: string
  content: string
}

export interface CreateReplyData {
  topicId: string
  content: string
  parentReplyId?: string
}

// ============================================
// ACCOUNTABILITY GROUPS (Step 3)
// ============================================

export type GroupGoalType = 'applications' | 'articles' | 'exercises' | 'custom'

export interface CommunityGroup {
  id: string
  name: string
  description?: string
  maxMembers: number
  isPublic: boolean
  isActive: boolean
  weeklyGoalType?: GroupGoalType
  weeklyGoalTarget: number
  weeklyGoalDescription?: string
  memberCount: number
  weeklyProgress: number
  createdBy: string
  createdAt: string
  // Joined data
  members?: GroupMember[]
  myMembership?: GroupMember
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: 'leader' | 'member'
  weeklyContribution: number
  isActive: boolean
  joinedAt: string
  lastActiveAt: string
  // Joined data
  user?: UserInfo
}

export interface GroupMessage {
  id: string
  groupId: string
  userId: string
  content: string
  messageType: 'text' | 'system' | 'celebration'
  createdAt: string
  // Joined data
  user?: UserInfo
}

export interface GroupInvite {
  id: string
  groupId: string
  invitedBy: string
  invitedUserId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  respondedAt?: string
  // Joined data
  group?: CommunityGroup
  inviter?: UserInfo
}

export interface CreateGroupData {
  name: string
  description?: string
  maxMembers?: number
  isPublic?: boolean
  weeklyGoalType?: GroupGoalType
  weeklyGoalTarget?: number
  weeklyGoalDescription?: string
}

// ============================================
// BUDDY MATCHING (Step 4)
// ============================================

export type ContactPreference = 'chat' | 'video' | 'both'
export type BuddyStatus = 'pending' | 'active' | 'paused' | 'ended'
export type CheckinType = 'weekly' | 'interview_practice' | 'cv_review' | 'motivation' | 'celebration'

export interface BuddyPreferences {
  id: string
  userId: string
  lookingForBuddy: boolean
  // What they want help with
  wantsInterviewPractice: boolean
  wantsCvFeedback: boolean
  wantsMotivationSupport: boolean
  wantsAccountability: boolean
  // What they can offer
  canHelpInterview: boolean
  canHelpCv: boolean
  canHelpMotivation: boolean
  canHelpAccountability: boolean
  // Availability
  preferredContact?: ContactPreference
  timezone: string
  bio?: string
  createdAt: string
  updatedAt: string
}

export interface BuddyMatch {
  userId: string
  matchScore: number
  firstName: string
  lastName: string
  bio?: string
  avatarUrl?: string
}

export interface BuddyPair {
  id: string
  user1Id: string
  user2Id: string
  status: BuddyStatus
  checkInCount: number
  lastCheckIn?: string
  matchScore?: number
  matchedAt: string
  createdAt: string
  // Joined data
  buddy?: UserInfo
}

export interface BuddyCheckin {
  id: string
  buddyPairId: string
  initiatedBy: string
  checkinType: CheckinType
  notes?: string
  rating?: number
  createdAt: string
}

export interface UpdateBuddyPreferencesData {
  lookingForBuddy?: boolean
  wantsInterviewPractice?: boolean
  wantsCvFeedback?: boolean
  wantsMotivationSupport?: boolean
  wantsAccountability?: boolean
  canHelpInterview?: boolean
  canHelpCv?: boolean
  canHelpMotivation?: boolean
  canHelpAccountability?: boolean
  preferredContact?: ContactPreference
  bio?: string
}

// ============================================
// SHARED TYPES
// ============================================

export interface UserInfo {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
}

// Category icon/color config
export const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  'interview-tips': { icon: 'MessageSquare', color: 'violet' },
  'cv-feedback': { icon: 'FileText', color: 'blue' },
  'motivation': { icon: 'Heart', color: 'rose' },
  'success-stories': { icon: 'Trophy', color: 'amber' },
  'general': { icon: 'MessageCircle', color: 'slate' }
}

// Group goal types
export const GROUP_GOAL_LABELS: Record<GroupGoalType, string> = {
  applications: 'Jobbansökningar',
  articles: 'Lästa artiklar',
  exercises: 'Genomförda övningar',
  custom: 'Eget mål'
}

// Checkin type labels
export const CHECKIN_TYPE_LABELS: Record<CheckinType, string> = {
  weekly: 'Veckocheck-in',
  interview_practice: 'Intervjuövning',
  cv_review: 'CV-granskning',
  motivation: 'Motivationssnack',
  celebration: 'Firande'
}
