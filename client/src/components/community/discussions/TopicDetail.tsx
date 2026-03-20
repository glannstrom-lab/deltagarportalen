/**
 * TopicDetail - View a discussion topic and its replies
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Heart, MessageSquare, CheckCircle, Send, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import type { DiscussionTopic, DiscussionReply, CreateReplyData } from '@/types/community.types'

interface TopicDetailProps {
  topic: DiscussionTopic | null
  replies: DiscussionReply[]
  isLoading: boolean
  onBack: () => void
  onReply: (data: CreateReplyData) => Promise<string | null>
  onAcceptReply: (replyId: string) => void
}

export function TopicDetail({
  topic,
  replies,
  isLoading,
  onBack,
  onReply,
  onAcceptReply
}: TopicDetailProps) {
  const [replyContent, setReplyContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  if (isLoading || !topic) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || isSending) return

    setIsSending(true)
    const result = await onReply({
      topicId: topic.id,
      content: replyContent.trim()
    })
    setIsSending(false)

    if (result) {
      setReplyContent('')
    }
  }

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
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till diskussioner
      </button>

      {/* Topic */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        {/* Header */}
        <div className="flex gap-4">
          {topic.author?.avatarUrl ? (
            <img
              src={topic.author.avatarUrl}
              alt={authorName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
              {authorInitials}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {topic.isSolved && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                  {topic.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <span className="font-medium text-slate-700">{authorName}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                  {topic.category && (
                    <>
                      <span>•</span>
                      <span className="text-violet-600">{topic.category.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 prose prose-slate max-w-none">
          <p className="whitespace-pre-wrap">{topic.content}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <span className={cn(
            "flex items-center gap-1 text-sm",
            topic.hasLiked ? "text-rose-600" : "text-slate-500"
          )}>
            <Heart className={cn("w-4 h-4", topic.hasLiked && "fill-current")} />
            {topic.likeCount} gillar
          </span>
          <span className="flex items-center gap-1 text-sm text-slate-500">
            <MessageSquare className="w-4 h-4" />
            {topic.replyCount} svar
          </span>
        </div>
      </motion.div>

      {/* Reply form */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Skriv ett svar</h3>
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Dela dina tankar..."
          className="w-full h-24 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <div className="flex justify-end mt-3">
          <Button
            onClick={handleSubmitReply}
            disabled={!replyContent.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Skicka svar
          </Button>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-400" />
          {replies.length} svar
        </h3>
        {replies.map((reply, index) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ReplyCard
              reply={reply}
              onAccept={() => onAcceptReply(reply.id)}
              canAccept={topic.authorId === reply.authorId && !topic.isSolved}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

interface ReplyCardProps {
  reply: DiscussionReply
  onAccept: () => void
  canAccept: boolean
}

function ReplyCard({ reply, onAccept, canAccept }: ReplyCardProps) {
  const timeAgo = formatDistanceToNow(new Date(reply.createdAt), {
    addSuffix: true,
    locale: sv
  })

  const authorName = reply.author
    ? `${reply.author.firstName} ${reply.author.lastName}`.trim()
    : 'Anonym'

  const authorInitials = reply.author
    ? `${reply.author.firstName?.[0] || ''}${reply.author.lastName?.[0] || ''}`.toUpperCase()
    : '?'

  return (
    <div className={cn(
      "bg-white rounded-xl border p-4",
      reply.isAccepted
        ? "border-emerald-300 bg-emerald-50/50"
        : "border-slate-200"
    )}>
      <div className="flex gap-3">
        {reply.author?.avatarUrl ? (
          <img
            src={reply.author.avatarUrl}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
            {authorInitials}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-700">{authorName}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{timeAgo}</span>
              {reply.isAccepted && (
                <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Accepterat svar
                </span>
              )}
            </div>
            {canAccept && !reply.isAccepted && (
              <button
                onClick={onAccept}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                Markera som svar
              </button>
            )}
          </div>
          <p className="mt-2 text-slate-700 whitespace-pre-wrap">{reply.content}</p>
        </div>
      </div>
    </div>
  )
}

export default TopicDetail
