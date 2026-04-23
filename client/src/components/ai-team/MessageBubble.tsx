/**
 * Message Bubble Component
 * Displays a single chat message with action buttons
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { agentColorClasses } from './types'
import { User, Copy, Check, BookOpen, Volume2, CalendarPlus } from '@/components/ui/icons'

export interface MessageBubbleProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
  }
  agentColor: string
  onSaveToDiary?: (content: string) => void
  diarySaved?: boolean
  onSpeak?: (content: string) => void
  isSpeaking?: boolean
  onCreateTask?: (content: string) => void
  taskCreated?: boolean
}

export function MessageBubble({
  message,
  agentColor,
  onSaveToDiary,
  diarySaved,
  onSpeak,
  isSpeaking,
  onCreateTask,
  taskCreated
}: MessageBubbleProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const colors = agentColorClasses[agentColor as keyof typeof agentColorClasses]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={cn(
      'flex items-start gap-3 group',
      isUser && 'flex-row-reverse'
    )}>
      {isUser ? (
        <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-stone-600 dark:text-stone-400" aria-hidden="true" />
        </div>
      ) : (
        <div className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
          colors.bgLight
        )}>
          <span className={cn('text-sm', colors.text)} aria-hidden="true">AI</span>
        </div>
      )}
      <div className="relative max-w-[80%]">
        <div
          className={cn(
            'px-4 py-3 rounded-xl',
            isUser
              ? 'bg-teal-500 text-white'
              : cn(
                  'bg-stone-100 dark:bg-stone-800',
                  'text-stone-900 dark:text-stone-100'
                )
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        {/* Action buttons - always visible on mobile, hover/focus on desktop */}
        {!isUser && (
          <div className={cn(
            'absolute -bottom-2 right-2',
            'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100',
            'transition-opacity duration-200',
            'flex items-center gap-1',
            (copied || diarySaved || taskCreated || isSpeaking) && 'sm:opacity-100'
          )}>
            {/* Speak button */}
            <button
              onClick={() => onSpeak?.(message.content)}
              className={cn(
                'px-2 py-1 rounded-lg',
                'bg-white dark:bg-stone-700',
                'border border-stone-200 dark:border-stone-600',
                'text-xs text-stone-600 dark:text-stone-400',
                'hover:text-stone-900 dark:hover:text-stone-200',
                'shadow-sm hover:shadow',
                'flex items-center gap-1',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
                isSpeaking && 'bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700'
              )}
              aria-label={isSpeaking ? t('aiTeam.voice.stopSpeaking') : t('aiTeam.voice.speak')}
            >
              <Volume2 className={cn('w-3 h-3', isSpeaking && 'text-teal-500 animate-pulse')} aria-hidden="true" />
            </button>
            {/* Create task button */}
            <button
              onClick={() => onCreateTask?.(message.content)}
              className={cn(
                'px-2 py-1 rounded-lg',
                'bg-white dark:bg-stone-700',
                'border border-stone-200 dark:border-stone-600',
                'text-xs text-stone-600 dark:text-stone-400',
                'hover:text-stone-900 dark:hover:text-stone-200',
                'shadow-sm hover:shadow',
                'flex items-center gap-1',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1'
              )}
              aria-label={taskCreated ? t('aiTeam.calendar.taskCreated') : t('aiTeam.calendar.createTask')}
            >
              {taskCreated ? (
                <Check className="w-3 h-3 text-green-500" aria-hidden="true" />
              ) : (
                <CalendarPlus className="w-3 h-3" aria-hidden="true" />
              )}
            </button>
            {/* Save to diary button */}
            <button
              onClick={() => onSaveToDiary?.(message.content)}
              className={cn(
                'px-2 py-1 rounded-lg',
                'bg-white dark:bg-stone-700',
                'border border-stone-200 dark:border-stone-600',
                'text-xs text-stone-600 dark:text-stone-400',
                'hover:text-stone-900 dark:hover:text-stone-200',
                'shadow-sm hover:shadow',
                'flex items-center gap-1',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1'
              )}
              aria-label={diarySaved ? t('aiTeam.savedToDiary') : t('aiTeam.saveToDiary')}
            >
              {diarySaved ? (
                <Check className="w-3 h-3 text-green-500" aria-hidden="true" />
              ) : (
                <BookOpen className="w-3 h-3" aria-hidden="true" />
              )}
            </button>
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={cn(
                'px-2 py-1 rounded-lg',
                'bg-white dark:bg-stone-700',
                'border border-stone-200 dark:border-stone-600',
                'text-xs text-stone-600 dark:text-stone-400',
                'hover:text-stone-900 dark:hover:text-stone-200',
                'shadow-sm hover:shadow',
                'flex items-center gap-1',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1'
              )}
              aria-label={copied ? t('aiTeam.messageCopied') : t('aiTeam.copyMessage')}
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" aria-hidden="true" />
              ) : (
                <Copy className="w-3 h-3" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
