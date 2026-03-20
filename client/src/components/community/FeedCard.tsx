/**
 * FeedCard - Displays a single activity in the community feed
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Send, Calendar, FileCheck, Trophy, Flame, Sparkles,
  UserCheck, BookOpen, Dumbbell, PartyPopper, MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { FeedItem, ActivityType } from '@/types/community.types'
import { REACTION_EMOJIS } from '@/types/community.types'

interface FeedCardProps {
  item: FeedItem
  onReact: (feedItemId: string, emoji: string) => void
}

// Icon mapping
const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  application_sent: Send,
  interview_scheduled: Calendar,
  cv_completed: FileCheck,
  milestone_reached: Trophy,
  streak_achieved: Flame,
  first_login: Sparkles,
  profile_completed: UserCheck,
  article_read: BookOpen,
  exercise_completed: Dumbbell,
  job_offer: PartyPopper
}

const ACTIVITY_COLORS: Record<ActivityType, { bg: string; icon: string; border: string }> = {
  application_sent: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
  interview_scheduled: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
  cv_completed: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
  milestone_reached: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200' },
  streak_achieved: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
  first_login: { bg: 'bg-pink-50', icon: 'text-pink-600', border: 'border-pink-200' },
  profile_completed: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-200' },
  article_read: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200' },
  exercise_completed: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-200' },
  job_offer: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-200' }
}

export function FeedCard({ item, onReact }: FeedCardProps) {
  const [showAllReactions, setShowAllReactions] = useState(false)

  const Icon = ACTIVITY_ICONS[item.activityType] || Sparkles
  const colors = ACTIVITY_COLORS[item.activityType] || ACTIVITY_COLORS.first_login

  const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
    locale: sv
  })

  const userName = item.user
    ? `${item.user.firstName} ${item.user.lastName}`.trim()
    : 'Någon'

  const userInitials = item.user
    ? `${item.user.firstName?.[0] || ''}${item.user.lastName?.[0] || ''}`.toUpperCase()
    : '?'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-xl border p-4 hover:shadow-md transition-shadow",
        colors.border
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {item.user?.avatarUrl ? (
            <img
              src={item.user.avatarUrl}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
              colors.bg, colors.icon
            )}>
              {userInitials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800">{userName}</span>
              <span className="text-slate-500 text-sm ml-2">{timeAgo}</span>
            </div>
            <div className={cn(
              "p-1.5 rounded-lg",
              colors.bg
            )}>
              <Icon className={cn("w-4 h-4", colors.icon)} />
            </div>
          </div>

          {/* Activity text */}
          <p className="text-slate-700 mt-1">{item.title}</p>
          {item.description && (
            <p className="text-slate-500 text-sm mt-1">{item.description}</p>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Existing reactions */}
            {item.reactions?.slice(0, 5).map(reaction => (
              <button
                key={reaction.emoji}
                onClick={() => onReact(item.id, reaction.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors",
                  reaction.hasReacted
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="text-xs font-medium">{reaction.count}</span>
              </button>
            ))}

            {/* Add reaction button */}
            <div className="relative">
              <button
                onClick={() => setShowAllReactions(!showAllReactions)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Reaction picker */}
              {showAllReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 p-2 flex gap-1 z-10"
                >
                  {REACTION_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(item.id, emoji)
                        setShowAllReactions(false)
                      }}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-lg",
                        item.myReactions?.includes(emoji) && "bg-emerald-100"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default FeedCard
