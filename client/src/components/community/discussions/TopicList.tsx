/**
 * TopicList - Display discussion topics
 */

import { motion } from 'framer-motion'
import {
  MessageSquare, Pin, CheckCircle, Heart, Eye, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { DiscussionTopic, DiscussionCategory } from '@/types/community.types'

interface TopicListProps {
  topics: DiscussionTopic[]
  categories: DiscussionCategory[]
  selectedCategory?: string
  onSelectCategory: (slug?: string) => void
  onSelectTopic: (topicId: string) => void
  onLike: (topicId: string) => void
}

export function TopicList({
  topics,
  categories,
  selectedCategory,
  onSelectCategory,
  onSelectTopic,
  onLike
}: TopicListProps) {
  return (
    <div className="space-y-4">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory(undefined)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            !selectedCategory
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Alla
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.slug)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              selectedCategory === cat.slug
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Topics */}
      {topics.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">
            Inga diskussioner ännu
          </h3>
          <p className="text-slate-500 text-sm">
            Var först med att starta en diskussion!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <TopicCard
                topic={topic}
                onSelect={() => onSelectTopic(topic.id)}
                onLike={() => onLike(topic.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TopicCardProps {
  topic: DiscussionTopic
  onSelect: () => void
  onLike: () => void
}

function TopicCard({ topic, onSelect, onLike }: TopicCardProps) {
  const timeAgo = formatDistanceToNow(new Date(topic.createdAt), {
    addSuffix: true,
    locale: sv
  })

  const authorName = topic.author
    ? `${topic.author.firstName} ${topic.author.lastName}`.trim()
    : 'Anonym'

  const authorInitials = topic.author
    ? `${topic.author.firstName?.[0] || ''}${topic.author.lastName?.[0] || ''}`.toUpperCase()
    : '?'

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer",
        topic.isPinned && "border-amber-300 bg-amber-50/50"
      )}
      onClick={onSelect}
    >
      <div className="flex gap-3">
        {/* Author avatar */}
        <div className="flex-shrink-0">
          {topic.author?.avatarUrl ? (
            <img
              src={topic.author.avatarUrl}
              alt={authorName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
              {authorInitials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start gap-2">
            {topic.isPinned && (
              <Pin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            {topic.isSolved && (
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            )}
            <h3 className="font-semibold text-slate-800 line-clamp-1">
              {topic.title}
            </h3>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span>{authorName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo}
            </span>
            {topic.category && (
              <>
                <span>•</span>
                <span className="text-violet-600">{topic.category.name}</span>
              </>
            )}
          </div>

          {/* Preview */}
          <p className="text-slate-600 text-sm mt-2 line-clamp-2">
            {topic.content}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLike()
              }}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors",
                topic.hasLiked
                  ? "text-rose-600"
                  : "text-slate-500 hover:text-rose-600"
              )}
            >
              <Heart className={cn("w-4 h-4", topic.hasLiked && "fill-current")} />
              {topic.likeCount}
            </button>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <MessageSquare className="w-4 h-4" />
              {topic.replyCount}
            </span>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Eye className="w-4 h-4" />
              {topic.viewCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopicList
