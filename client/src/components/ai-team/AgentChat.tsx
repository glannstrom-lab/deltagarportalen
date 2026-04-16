/**
 * Agent Chat Component
 * Chat interface with message history and streaming support
 */

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { AgentAvatar } from './AgentAvatar'
import { getAgentById } from './AgentSelector'
import { getPersonalityById } from './PersonalityDropdown'
import { agentColorClasses } from './types'
import { useAITeamContext, formatAITeamContext } from '@/hooks/useAITeamContext'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Send, RefreshCw, User, Trash2 } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export interface AgentChatHandle {
  sendMessage: (message: string) => Promise<void>
}

interface AgentChatProps {
  onSendMessage?: (message: string) => void
  className?: string
}

export const AgentChat = forwardRef<AgentChatHandle, AgentChatProps>(
  function AgentChat({ onSendMessage, className }, ref) {
    const { t } = useTranslation()
    const {
      selectedAgent,
      selectedPersonality,
      messages,
      isLoading,
      error,
      addMessage,
      clearMessages,
      setLoading,
      setError,
      setMessages,
    } = useAITeamStore()

    const [inputValue, setInputValue] = useState('')
    const [streamingContent, setStreamingContent] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const agent = getAgentById(selectedAgent)
    const personality = getPersonalityById(selectedPersonality)
    const colors = agentColorClasses[agent.color]
    const { context: userContext } = useAITeamContext()
    const { user } = useAuthStore()

    // Load session memory on mount and agent change
    useEffect(() => {
      if (!user?.id) return

      const loadSessionMemory = async () => {
        try {
          const { data } = await supabase
            .from('ai_team_sessions')
            .select('messages')
            .eq('user_id', user.id)
            .eq('agent_id', selectedAgent)
            .single()

          if (data?.messages && Array.isArray(data.messages)) {
            setMessages(data.messages)
          }
        } catch {
          // No saved session, start fresh
        }
      }

      loadSessionMemory()
    }, [user?.id, selectedAgent, setMessages])

    // Save session memory when messages change
    useEffect(() => {
      if (!user?.id || messages.length === 0) return

      const saveSessionMemory = async () => {
        try {
          await supabase
            .from('ai_team_sessions')
            .upsert({
              user_id: user.id,
              agent_id: selectedAgent,
              messages: messages.slice(-30), // Keep last 30 messages
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,agent_id'
            })
        } catch (err) {
          console.error('Failed to save session:', err)
        }
      }

      // Debounce save
      const timeout = setTimeout(saveSessionMemory, 1000)
      return () => clearTimeout(timeout)
    }, [user?.id, selectedAgent, messages])

    // Scroll to bottom when new messages arrive or streaming updates
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streamingContent])

    // Auto-resize textarea
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value)
      // Auto-resize
      e.target.style.height = 'auto'
      e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
    }, [])

    const sendMessage = useCallback(async (messageText?: string) => {
      const text = messageText || inputValue.trim()
      if (!text || isLoading || isStreaming) return

      // Clear input
      setInputValue('')
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }

      // Add user message
      addMessage({
        role: 'user',
        content: text,
        agentId: selectedAgent,
        personalityId: selectedPersonality,
      })

      // Notify parent if callback provided
      onSendMessage?.(text)

      // Send to AI with streaming
      setLoading(true)
      setIsStreaming(true)
      setStreamingContent('')
      setError(null)

      try {
        // Build context message with agent role, personality, and user data
        const agentContext = t(`aiTeam.agents.${selectedAgent}.systemPrompt`)
        const personalityContext = personality.systemPrompt
        const userDataContext = formatAITeamContext(userContext, selectedAgent)

        // Get auth token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('Not authenticated')
        }

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController()

        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            function: 'ai-team-chat',
            stream: true,
            data: {
              meddelande: text,
              agentTyp: selectedAgent,
              personlighet: selectedPersonality,
              systemKontext: `${agentContext}\n\nPersonlighet: ${personalityContext}${userDataContext}`,
              historik: messages.slice(-10).map((m) => ({
                roll: m.role === 'user' ? 'användare' : 'assistent',
                innehall: m.content,
              })),
            },
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to get response')
        }

        // Read streaming response
        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let fullContent = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.token) {
                  fullContent += parsed.token
                  setStreamingContent(fullContent)
                }
                if (parsed.error) {
                  throw new Error(parsed.error)
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        // Add final message
        if (fullContent) {
          addMessage({
            role: 'assistant',
            content: fullContent,
            agentId: selectedAgent,
            personalityId: selectedPersonality,
          })
        } else {
          setError(t('aiTeam.error.noResponse'))
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : t('aiTeam.error.generic'))
        }
      } finally {
        setLoading(false)
        setIsStreaming(false)
        setStreamingContent('')
        abortControllerRef.current = null
      }
    }, [
      inputValue,
      isLoading,
      isStreaming,
      selectedAgent,
      selectedPersonality,
      messages,
      personality.systemPrompt,
      userContext,
      t,
      addMessage,
      onSendMessage,
      setLoading,
      setError,
    ])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    }, [sendMessage])

    // Expose sendMessage to parent via ref
    useImperativeHandle(ref, () => ({
      sendMessage: async (message: string) => {
        await sendMessage(message)
      }
    }), [sendMessage])

    return (
      <div className={cn('flex flex-col h-full', className)}>
        {/* Chat Header */}
        <div className={cn(
          'flex items-center justify-between p-4',
          'border-b border-stone-200 dark:border-stone-700'
        )}>
          <div className="flex items-center gap-3">
            <AgentAvatar agentId={selectedAgent} color={agent.color} size="md" />
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {t(agent.nameKey)}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t(personality.nameKey)}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              leftIcon={<Trash2 className="w-4 h-4" />}
              aria-label={t('aiTeam.clearChat')}
            >
              <span className="hidden sm:inline">{t('aiTeam.clearChat')}</span>
            </Button>
          )}
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="log"
          aria-live="polite"
          aria-label={t('aiTeam.chatHistory')}
        >
          {messages.length === 0 ? (
            <EmptyState agent={agent} />
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                agentColor={agent.color}
              />
            ))
          )}

          {/* Streaming response */}
          {isStreaming && streamingContent && (
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                colors.bgLight
              )}>
                <span className={cn('text-sm', colors.text)} aria-hidden="true">AI</span>
              </div>
              <div className={cn(
                'max-w-[80%] px-4 py-3 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'text-stone-900 dark:text-stone-100'
              )}>
                <p className="text-sm whitespace-pre-wrap">
                  {streamingContent}
                  <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                </p>
              </div>
            </div>
          )}

          {/* Loading indicator (before streaming starts) */}
          {isLoading && !streamingContent && (
            <div
              className={cn('flex items-start gap-3 animate-pulse')}
              role="status"
              aria-label={t('aiTeam.thinking')}
            >
              <AgentAvatar agentId={selectedAgent} color={agent.color} size="sm" />
              <div className={cn(
                'px-4 py-3 rounded-xl',
                colors.bgLight,
                colors.border,
                'border'
              )}>
                <div className="flex items-center gap-3">
                  {/* Typing dots animation */}
                  <div className="flex items-center gap-1">
                    <span className={cn('w-2 h-2 rounded-full animate-bounce', colors.bg)} style={{ animationDelay: '0ms' }} />
                    <span className={cn('w-2 h-2 rounded-full animate-bounce', colors.bg)} style={{ animationDelay: '150ms' }} />
                    <span className={cn('w-2 h-2 rounded-full animate-bounce', colors.bg)} style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className={cn('text-sm', colors.text)}>
                    {t('aiTeam.thinking')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </Card>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={cn(
          'p-4 border-t border-stone-200 dark:border-stone-700',
          'bg-white dark:bg-stone-900'
        )}>
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('aiTeam.inputPlaceholder')}
              disabled={isLoading}
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
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0"
              aria-label={t('aiTeam.send')}
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            {t('aiTeam.inputHint')}
          </p>
        </div>
      </div>
    )
  }
)

// Empty state component
function EmptyState({ agent }: { agent: ReturnType<typeof getAgentById> }) {
  const { t } = useTranslation()
  const colors = agentColorClasses[agent.color]

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <AgentAvatar agentId={agent.id} color={agent.color} size="xl" />
      <h3 className="mt-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
        {t(agent.nameKey)}
      </h3>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-sm">
        {t(agent.descriptionKey)}
      </p>
      <p className={cn('mt-4 text-sm', colors.text)}>
        {t('aiTeam.startChatHint')}
      </p>
    </div>
  )
}

// Message bubble component
interface MessageBubbleProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
  }
  agentColor: string
}

function MessageBubble({ message, agentColor }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const colors = agentColorClasses[agentColor as keyof typeof agentColorClasses]

  return (
    <div className={cn(
      'flex items-start gap-3',
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
      <div
        className={cn(
          'max-w-[80%] px-4 py-3 rounded-xl',
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
    </div>
  )
}

export default AgentChat
