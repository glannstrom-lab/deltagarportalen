/**
 * Chat Input Component
 * Input field with voice recording and send button
 */

import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Send, RefreshCw, Mic, MicOff } from '@/components/ui/icons'

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onToggleRecording: () => void
  isLoading?: boolean
  isRecording?: boolean
  disabled?: boolean
  className?: string
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onToggleRecording,
  isLoading = false,
  isRecording = false,
  disabled = false,
  className,
}: ChatInputProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }, [onSend])

  // Reset textarea height when value is cleared
  const resetHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }, [])

  // Expose reset function via callback when value becomes empty
  if (value === '' && inputRef.current && inputRef.current.style.height !== 'auto') {
    resetHeight()
  }

  return (
    <div className={cn(
      'p-4 border-t border-stone-200 dark:border-stone-700',
      'bg-white dark:bg-stone-900',
      className
    )}>
      <div className="flex items-end gap-2 sm:gap-3">
        <button
          onClick={onToggleRecording}
          disabled={disabled || isLoading}
          className={cn(
            'flex-shrink-0 p-3 rounded-xl',
            'transition-all duration-200',
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400',
            'hover:bg-stone-200 dark:hover:bg-stone-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2'
          )}
          aria-label={isRecording ? t('aiTeam.voice.stopRecording') : t('aiTeam.voice.startRecording')}
          title={isRecording ? t('aiTeam.voice.stopRecording') : t('aiTeam.voice.startRecording')}
        >
          {isRecording ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
        </button>
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t('aiTeam.inputPlaceholder')}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            'flex-1 resize-none',
            'px-4 py-3 rounded-xl',
            'bg-stone-50 dark:bg-stone-800',
            'border border-stone-200 dark:border-stone-700',
            'focus:border-teal-500 dark:focus:border-teal-400',
            'focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900',
            'outline-none transition-colors',
            'text-stone-900 dark:text-stone-100',
            'placeholder:text-stone-400 dark:placeholder:text-stone-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label={t('aiTeam.inputPlaceholder')}
        />
        <Button
          onClick={onSend}
          disabled={!value.trim() || isLoading || disabled}
          className="flex-shrink-0"
          aria-label={t('aiTeam.send')}
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-5 h-5" aria-hidden="true" />
          )}
        </Button>
      </div>
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        {t('aiTeam.inputHint')}
      </p>
    </div>
  )
}

export default ChatInput
