/**
 * Agent Chat Component
 * Chat interface with message history and streaming support
 * Refactored to use extracted hooks and components
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
import { RefreshCw, Trash2, Share2, Check, Download } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { diaryEntriesApi } from '@/services/diaryApi'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { MarkdownRenderer } from './MarkdownRenderer'

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
      responseMode,
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
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [shareSuccess, setShareSuccess] = useState(false)
    const [diarySuccess, setDiarySuccess] = useState<string | null>(null)
    const [taskSuccess, setTaskSuccess] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const agent = getAgentById(selectedAgent)
    const personality = getPersonalityById(selectedPersonality)
    const colors = agentColorClasses[agent.color]
    const { context: userContext } = useAITeamContext()
    const { user } = useAuthStore()

    // Voice input hook
    const { isRecording, toggleRecording } = useVoiceInput({
      onTranscript: setInputValue,
      onError: setError,
    })

    // Voice output hook
    const { isSpeaking, speak: speakMessage } = useVoiceOutput({
      onError: setError,
    })

    // Load session memory on mount and agent change
    useEffect(() => {
      if (!user?.id) return

      const loadSessionMemory = async () => {
        const { data } = await supabase
          .from('ai_team_sessions')
          .select('messages')
          .eq('user_id', user.id)
          .eq('agent_id', selectedAgent)
          .maybeSingle()

        if (data?.messages && Array.isArray(data.messages)) {
          setMessages(data.messages)
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

    // Cleanup abort controller on unmount to prevent state updates on unmounted component
    useEffect(() => {
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }
    }, [])

    // Abort streaming when agent changes to prevent race conditions
    useEffect(() => {
      // Abort any ongoing streaming when switching agents
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // Reset streaming state
      setIsStreaming(false)
      setStreamingContent('')
      setSuggestions([])
    }, [selectedAgent])

    const sendMessage = useCallback(async (messageText?: string) => {
      const text = messageText || inputValue.trim()
      if (!text || isLoading || isStreaming) return

      // Set loading state immediately to prevent double-send
      setLoading(true)
      setIsStreaming(true)
      setStreamingContent('')
      setError(null)

      // Clear input
      setInputValue('')

      // Add user message
      addMessage({
        role: 'user',
        content: text,
        agentId: selectedAgent,
        personalityId: selectedPersonality,
      })

      // Notify parent if callback provided
      onSendMessage?.(text)

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
              responsLage: responseMode,
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
                if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                  setSuggestions(parsed.suggestions)
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

        // Process any remaining buffer content after stream ends
        if (buffer.trim()) {
          if (buffer.startsWith('data: ')) {
            const data = buffer.slice(6).trim()
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data)
                if (parsed.token) {
                  fullContent += parsed.token
                }
                if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                  setSuggestions(parsed.suggestions)
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
      responseMode,
      messages,
      personality.systemPrompt,
      userContext,
      t,
      addMessage,
      onSendMessage,
      setLoading,
      setError,
    ])

    // Save message to diary
    const handleSaveToDiary = useCallback(async (content: string) => {
      try {
        const entry = await diaryEntriesApi.create({
          title: `${t(agent.nameKey)} - AI Team`,
          content: content,
          mood: null,
          energy_level: null,
          tags: ['ai-team', selectedAgent],
          word_count: content.split(/\s+/).filter(w => w).length,
          entry_date: new Date().toISOString().split('T')[0],
          entry_type: 'reflection',
          is_favorite: false,
        })
        if (entry) {
          setDiarySuccess(entry.id)
          setTimeout(() => setDiarySuccess(null), 3000)
        }
      } catch (err) {
        console.error('Failed to save to diary:', err)
      }
    }, [t, agent.nameKey, selectedAgent])

    // Share conversation with consultant
    const handleShareWithConsultant = useCallback(async () => {
      if (messages.length === 0) return

      try {
        // Create a summary of the conversation
        const conversationSummary = messages.map(m =>
          `${m.role === 'user' ? 'Deltagare' : t(agent.nameKey)}: ${m.content}`
        ).join('\n\n---\n\n')

        // Save as a shared note/resource
        const { error } = await supabase
          .from('shared_resources')
          .insert({
            user_id: user?.id,
            resource_type: 'ai_conversation',
            title: `AI Team: ${t(agent.nameKey)} - ${new Date().toLocaleDateString('sv-SE')}`,
            content: conversationSummary,
            metadata: {
              agent: selectedAgent,
              personality: selectedPersonality,
              messageCount: messages.length,
            },
          })

        if (!error) {
          setShareSuccess(true)
          setTimeout(() => setShareSuccess(false), 3000)
        }
      } catch (err) {
        console.error('Failed to share:', err)
      }
    }, [messages, t, agent.nameKey, user?.id, selectedAgent, selectedPersonality])

    // Handle suggestion click
    const handleSuggestionClick = useCallback((suggestion: string) => {
      setSuggestions([])
      sendMessage(suggestion)
    }, [sendMessage])

    // Create calendar task from message
    const handleCreateTask = useCallback(async (content: string) => {
      try {
        // Extract a task title from the first line or first 50 chars
        const title = content.split('\n')[0].slice(0, 50) + (content.length > 50 ? '...' : '')

        const { error } = await supabase
          .from('calendar_events')
          .insert({
            user_id: user?.id,
            title: `AI Team: ${title}`,
            description: content,
            event_type: 'task',
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            status: 'pending',
            is_all_day: false,
            metadata: {
              source: 'ai-team',
              agent: selectedAgent,
            },
          })

        if (!error) {
          setTaskSuccess(content.slice(0, 20))
          setTimeout(() => setTaskSuccess(null), 3000)
        }
      } catch (err) {
        console.error('Failed to create task:', err)
      }
    }, [user?.id, selectedAgent])

    // Export conversation to PDF
    const handleExportPDF = useCallback(async () => {
      if (messages.length === 0) return
      setIsExporting(true)

      try {
        // Dynamic import for PDF generation
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF()

        const title = `${t(agent.nameKey)} - ${new Date().toLocaleDateString('sv-SE')}`
        doc.setFontSize(18)
        doc.text(title, 20, 20)

        doc.setFontSize(12)
        let yPos = 35
        const pageHeight = doc.internal.pageSize.height
        const margin = 20
        const lineHeight = 7
        const maxWidth = 170

        for (const msg of messages) {
          const role = msg.role === 'user' ? t('aiTeam.you') : t(agent.nameKey)
          const prefix = `${role}:`

          // Add new page if needed
          if (yPos > pageHeight - 30) {
            doc.addPage()
            yPos = 20
          }

          // Role label
          doc.setFont('helvetica', 'bold')
          doc.text(prefix, margin, yPos)
          yPos += lineHeight

          // Message content
          doc.setFont('helvetica', 'normal')
          const lines = doc.splitTextToSize(msg.content, maxWidth)
          for (const line of lines) {
            if (yPos > pageHeight - 20) {
              doc.addPage()
              yPos = 20
            }
            doc.text(line, margin, yPos)
            yPos += lineHeight
          }
          yPos += 5 // Space between messages
        }

        doc.save(`ai-team-${selectedAgent}-${Date.now()}.pdf`)
      } catch (err) {
        console.error('Failed to export PDF:', err)
        setError(t('aiTeam.export.failed'))
      } finally {
        setIsExporting(false)
      }
    }, [messages, t, agent.nameKey, selectedAgent])

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
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                leftIcon={isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                aria-label={t('aiTeam.export.toPdf')}
              >
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareWithConsultant}
                leftIcon={shareSuccess ? <Check className="w-4 h-4 text-brand-700" /> : <Share2 className="w-4 h-4" />}
                aria-label={t('aiTeam.shareWithConsultant')}
              >
                <span className="hidden sm:inline">
                  {shareSuccess ? t('aiTeam.shared') : t('aiTeam.share')}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                leftIcon={<Trash2 className="w-4 h-4" />}
                aria-label={t('aiTeam.clearChat')}
              >
                <span className="hidden sm:inline">{t('aiTeam.clearChat')}</span>
              </Button>
            </div>
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
            <EmptyState agent={agent} onQuickAction={sendMessage} />
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                agentColor={agent.color}
                onSaveToDiary={handleSaveToDiary}
                diarySaved={diarySuccess === message.id}
                onSpeak={speakMessage}
                isSpeaking={isSpeaking}
                onCreateTask={handleCreateTask}
                taskCreated={taskSuccess === message.content.slice(0, 20)}
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
                <MarkdownRenderer content={streamingContent} />
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
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
            <Card
              className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              role="alert"
              aria-live="assertive"
            >
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </Card>
          )}

          {/* Suggested follow-up questions */}
          {suggestions.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-stone-500 dark:text-stone-400 w-full mb-1">
                {t('aiTeam.suggestedQuestions')}
              </span>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs',
                    'bg-stone-100 dark:bg-stone-800',
                    'border border-stone-200 dark:border-stone-700',
                    'text-stone-700 dark:text-stone-300',
                    'hover:bg-stone-200 dark:hover:bg-stone-700',
                    'transition-colors'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={() => sendMessage()}
          onToggleRecording={toggleRecording}
          isLoading={isLoading}
          isRecording={isRecording}
        />
      </div>
    )
  }
)

// Empty state component with welcoming message
interface EmptyStateProps {
  agent: ReturnType<typeof getAgentById>
  onQuickAction?: (prompt: string) => void
}

function EmptyState({ agent, onQuickAction }: EmptyStateProps) {
  const { t } = useTranslation()
  const colors = agentColorClasses[agent.color]

  // Get first 3 quick actions from the agent
  const quickActions = agent.quickActions?.slice(0, 3) || []

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
      <AgentAvatar agentId={agent.id} color={agent.color} size="xl" />
      <h3 className="mt-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
        {t(agent.nameKey)}
      </h3>

      {/* Welcome speech bubble */}
      <div className={cn(
        'mt-4 px-4 py-3 rounded-xl max-w-sm',
        'bg-stone-100 dark:bg-stone-800',
        'border border-stone-200 dark:border-stone-700'
      )}>
        <p className="text-sm text-stone-700 dark:text-stone-300">
          {t('aiTeam.welcomeMessage', { agent: t(agent.nameKey) })}
        </p>
      </div>

      <p className="mt-4 text-sm text-stone-500 dark:text-stone-400 max-w-sm">
        {t(agent.descriptionKey)}
      </p>

      {/* Quick action suggestions */}
      {quickActions.length > 0 && onQuickAction && (
        <div className="mt-6 w-full max-w-sm">
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">
            {t('aiTeam.tryAsking')}
          </p>
          <div className="flex flex-col gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onQuickAction(action.prompt)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-left text-sm',
                  'bg-stone-50 dark:bg-stone-800/50',
                  'border border-stone-200 dark:border-stone-700',
                  'hover:border-stone-300 dark:hover:border-stone-600',
                  'hover:bg-white dark:hover:bg-stone-800',
                  'text-stone-700 dark:text-stone-300',
                  'transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700'
                )}
              >
                {t(action.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className={cn('mt-6 text-xs', colors.text)}>
        {t('aiTeam.startChatHint')}
      </p>
    </div>
  )
}

export default AgentChat
