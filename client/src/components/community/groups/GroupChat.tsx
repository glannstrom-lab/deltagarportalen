/**
 * GroupChat - Group detail view with chat
 */

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, Target, Send, Loader2, LogOut, Settings,
  Crown, User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import type { CommunityGroup, GroupMessage } from '@/types/community.types'
import { GROUP_GOAL_LABELS } from '@/types/community.types'

interface GroupChatProps {
  group: CommunityGroup | null
  messages: GroupMessage[]
  isLoading: boolean
  onBack: () => void
  onSend: (content: string) => Promise<boolean>
  onLeave: () => void
  onUpdateContribution: (contribution: number) => void
}

export function GroupChat({
  group,
  messages,
  isLoading,
  onBack,
  onSend,
  onLeave,
  onUpdateContribution
}: GroupChatProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading || !group) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  const handleSend = async () => {
    if (!message.trim() || isSending) return

    setIsSending(true)
    await onSend(message.trim())
    setMessage('')
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const progressPercent = group.weeklyGoalTarget > 0
    ? Math.min(100, Math.round((group.weeklyProgress / (group.weeklyGoalTarget * group.memberCount)) * 100))
    : 0

  const myContribution = group.myMembership?.weeklyContribution || 0

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="bg-white rounded-t-xl border border-slate-200 border-b-0 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5" />
            </button>
            {group.myMembership?.role !== 'leader' && (
              <button
                onClick={onLeave}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Lämna grupp"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h2 className="text-lg font-bold text-slate-800">{group.name}</h2>
          {group.description && (
            <p className="text-sm text-slate-500 mt-1">{group.description}</p>
          )}
        </div>

        {/* Weekly progress */}
        {group.weeklyGoalType && (
          <div className="mt-4 bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 flex items-center gap-1">
                <Target className="w-4 h-4" />
                Veckans mål: {GROUP_GOAL_LABELS[group.weeklyGoalType]}
              </span>
              <span className="font-medium text-slate-700">
                {group.weeklyProgress}/{group.weeklyGoalTarget * group.memberCount}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  progressPercent >= 100 ? "bg-emerald-500" : "bg-emerald-400"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* My contribution */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-slate-600">Din insats denna vecka:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateContribution(Math.max(0, myContribution - 1))}
                  className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-slate-700">
                  {myContribution}
                </span>
                <button
                  onClick={() => onUpdateContribution(myContribution + 1)}
                  className="w-6 h-6 rounded bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Members sidebar */}
      {showMembers && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-0 top-16 w-64 bg-white rounded-xl border border-slate-200 shadow-lg p-4 z-10"
        >
          <h4 className="font-semibold text-slate-800 mb-3">
            Medlemmar ({group.memberCount})
          </h4>
          <div className="space-y-2">
            {group.members?.map(member => (
              <div key={member.id} className="flex items-center gap-2">
                {member.user?.avatarUrl ? (
                  <img
                    src={member.user.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <span className="text-sm text-slate-700">
                    {member.user?.firstName} {member.user?.lastName}
                  </span>
                  {member.role === 'leader' && (
                    <Crown className="w-3.5 h-3.5 text-amber-500 inline ml-1" />
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {member.weeklyContribution}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 border-x border-slate-200 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">
              Inga meddelanden ännu. Säg hej!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv ett meddelande..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: GroupMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
    locale: sv
  })

  const userName = message.user
    ? `${message.user.firstName} ${message.user.lastName}`.trim()
    : 'Anonym'

  if (message.messageType === 'system') {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  if (message.messageType === 'celebration') {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-3 text-center">
        <span className="text-2xl">🎉</span>
        <p className="text-sm text-amber-800 mt-1">{message.content}</p>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      {message.user?.avatarUrl ? (
        <img
          src={message.user.avatarUrl}
          alt=""
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-slate-400" />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-slate-700">{userName}</span>
          <span className="text-xs text-slate-400">{timeAgo}</span>
        </div>
        <p className="text-slate-700 mt-0.5">{message.content}</p>
      </div>
    </div>
  )
}

export default GroupChat
