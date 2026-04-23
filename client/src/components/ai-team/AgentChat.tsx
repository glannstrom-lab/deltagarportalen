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
import { Send, RefreshCw, User, Trash2, Copy, Check, BookOpen, Share2, Mic, MicOff, Volume2, Download, CalendarPlus } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { diaryEntriesApi } from '@/services/diaryApi'
import type { ResponseMode } from './types'

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
    const [isRecording, setIsRecording] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const recognitionRef = useRef<SpeechRecognition | null>(null)
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

      // Set loading state immediately to prevent double-send
      setLoading(true)
      setIsStreaming(true)
      setStreamingContent('')
      setError(null)

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

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    }, [sendMessage])

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

    // Voice input - Start/stop recording
    const toggleRecording = useCallback(() => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        setError(t('aiTeam.voice.notSupported'))
        return
      }

      if (isRecording) {
        recognitionRef.current?.stop()
        setIsRecording(false)
        return
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'sv-SE'
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
        setInputValue(transcript)
        if (inputRef.current) {
          inputRef.current.style.height = 'auto'
          inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px'
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.onerror = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsRecording(true)
    }, [isRecording, t, setError])

    // Voice output - Text-to-speech
    const speakMessage = useCallback((text: string) => {
      if (!('speechSynthesis' in window)) {
        setError(t('aiTeam.voice.notSupported'))
        return
      }

      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'sv-SE'
      utterance.rate = 1.0
      utterance.pitch = 1.0

      // Try to find a Swedish voice
      const voices = window.speechSynthesis.getVoices()
      const svVoice = voices.find(v => v.lang.startsWith('sv'))
      if (svVoice) utterance.voice = svVoice

      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    }, [isSpeaking, t, setError])

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
                leftIcon={shareSuccess ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
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
            <EmptyState agent={agent} />
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
        <div className={cn(
          'p-4 border-t border-stone-200 dark:border-stone-700',
          'bg-white dark:bg-stone-900'
        )}>
          <div className="flex items-end gap-2 sm:gap-3">
            <button
              onClick={toggleRecording}
              disabled={isLoading}
              className={cn(
                'flex-shrink-0 p-3 rounded-xl',
                'transition-all duration-200',
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400',
                'hover:bg-stone-200 dark:hover:bg-stone-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label={isRecording ? t('aiTeam.voice.stopRecording') : t('aiTeam.voice.startRecording')}
              title={isRecording ? t('aiTeam.voice.stopRecording') : t('aiTeam.voice.startRecording')}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
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
  onSaveToDiary?: (content: string) => void
  diarySaved?: boolean
  onSpeak?: (content: string) => void
  isSpeaking?: boolean
  onCreateTask?: (content: string) => void
  taskCreated?: boolean
}

function MessageBubble({ message, agentColor, onSaveToDiary, diarySaved, onSpeak, isSpeaking, onCreateTask, taskCreated }: MessageBubbleProps) {
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

export default AgentChat
