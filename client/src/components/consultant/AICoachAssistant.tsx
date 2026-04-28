/**
 * AICoachAssistant - AI-powered coaching assistant for consultants
 * Provides intelligent suggestions, insights, and recommendations
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bot,
  X,
  Send,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Target,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Loader2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Minimize2,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

// Types
interface Insight {
  id: string
  type: 'warning' | 'suggestion' | 'opportunity' | 'achievement'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  participant?: {
    id: string
    name: string
  }
  priority: 'high' | 'medium' | 'low'
  timestamp: Date
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface AICoachAssistantProps {
  participantId?: string
  participantName?: string
  context?: 'overview' | 'participant' | 'analytics'
  onScheduleMeeting?: (participantId: string) => void
  onSendMessage?: (participantId: string) => void
  onCreateGoal?: (participantId: string) => void
}

// Mock AI responses based on context
const getContextualInsights = (context: string, participantName?: string): Insight[] => {
  const baseInsights: Insight[] = [
    {
      id: '1',
      type: 'warning',
      title: 'Inaktiv deltagare',
      description: 'Maria Lindberg har inte loggat in på 12 dagar. Överväg att kontakta henne.',
      priority: 'high',
      timestamp: new Date(),
      participant: { id: 'p1', name: 'Maria Lindberg' },
    },
    {
      id: '2',
      type: 'suggestion',
      title: 'Föreslå intervjuträning',
      description: 'Erik Svensson har uppnått 85% CV-kvalitet. Dags för intervjuträning?',
      priority: 'medium',
      timestamp: new Date(),
      participant: { id: 'p2', name: 'Erik Svensson' },
    },
    {
      id: '3',
      type: 'opportunity',
      title: 'Matchning möjlig',
      description: 'Anna Karlsson\'s profil matchar 3 nya jobb inom IT-support.',
      priority: 'medium',
      timestamp: new Date(),
      participant: { id: 'p3', name: 'Anna Karlsson' },
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Mål uppnått',
      description: 'Jonas Berg har genomfört 5 jobbansökningar denna vecka!',
      priority: 'low',
      timestamp: new Date(),
      participant: { id: 'p4', name: 'Jonas Berg' },
    },
  ]

  if (context === 'participant' && participantName) {
    return [
      {
        id: '5',
        type: 'suggestion',
        title: 'Nästa steg',
        description: `Baserat på ${participantName}s framsteg, rekommenderar jag att fokusera på LinkedIn-profilen nästa.`,
        priority: 'high',
        timestamp: new Date(),
      },
      {
        id: '6',
        type: 'opportunity',
        title: 'Kompetensområden',
        description: `${participantName} har stark potential inom projektledning baserat på tidigare erfarenhet.`,
        priority: 'medium',
        timestamp: new Date(),
      },
    ]
  }

  return baseInsights.slice(0, 3)
}

// Mock AI chat response
const generateAIResponse = async (
  message: string,
  context: string,
  participantName?: string
): Promise<{ content: string; suggestions: string[] }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500))

  const responses: Record<string, { content: string; suggestions: string[] }> = {
    default: {
      content: 'Jag analyserar situationen... Baserat på deltagarens progress och engagemang, här är mina rekommendationer:\n\n1. Fokusera på att stärka CV:t med konkreta resultat\n2. Boka ett uppföljningsmöte för att diskutera jobbsökning\n3. Sätt upp ett kortsiktigt mål för denna vecka',
      suggestions: [
        'Hur kan jag öka engagemanget?',
        'Föreslå lämpliga mål',
        'Tips för intervjuförberedelse',
      ],
    },
    cv: {
      content: 'För att förbättra CV-kvaliteten, föreslår jag:\n\n• Lägg till kvantifierbara resultat (ex: "Ökade försäljningen med 20%")\n• Anpassa CV:t för varje jobbansökan\n• Säkerställ att relevanta nyckelord finns med\n• Kontrollera grammatik och formatering',
      suggestions: [
        'Vanliga CV-misstag',
        'ATS-optimering tips',
        'Bästa CV-strukturen',
      ],
    },
    motivation: {
      content: 'Att hålla deltagare motiverade kräver en personlig approach:\n\n1. Fira små framgångar - varje steg framåt räknas\n2. Sätt realistiska delmål som går att uppnå\n3. Ge regelbunden feedback och uppmuntran\n4. Förstå individuella hinder och hitta lösningar tillsammans',
      suggestions: [
        'Motiverande övningar',
        'Hantera motgångar',
        'Skapa momentum',
      ],
    },
    interview: {
      content: 'Förberedelse för intervjuer är nyckeln till framgång:\n\n• Öva på vanliga intervjufrågor med STAR-metoden\n• Research företaget grundligt innan intervjun\n• Förbered frågor att ställa till intervjuaren\n• Träna på presentation av sig själv (30 sek, 1 min, 2 min)',
      suggestions: [
        'STAR-metoden exempel',
        'Svåra intervjufrågor',
        'Kroppsspråk tips',
      ],
    },
  }

  // Simple keyword matching for demo
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes('cv')) return responses.cv
  if (lowerMessage.includes('motivat') || lowerMessage.includes('engag')) return responses.motivation
  if (lowerMessage.includes('intervju')) return responses.interview

  return responses.default
}

// Insight Card Component
function InsightCard({ insight, onAction }: { insight: Insight; onAction?: () => void }) {
  const iconMap = {
    warning: AlertTriangle,
    suggestion: Lightbulb,
    opportunity: TrendingUp,
    achievement: Target,
  }
  const colorMap = {
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    suggestion: 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)]',
    opportunity: 'bg-emerald-100 dark:bg-emerald-900/40 text-[var(--c-text)] dark:text-[var(--c-text)]',
    achievement: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  }
  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-stone-400',
  }

  const Icon = iconMap[insight.type]

  return (
    <div
      className={cn(
        'p-3 bg-stone-50 dark:bg-stone-800 rounded-lg border-l-4',
        priorityColors[insight.priority]
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-1.5 rounded-lg', colorMap[insight.type])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-stone-900 dark:text-stone-100">
            {insight.title}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-600 mt-0.5">
            {insight.description}
          </p>
          {insight.participant && (
            <button
              onClick={onAction}
              className="flex items-center gap-1 mt-2 text-xs text-[var(--c-text)] dark:text-[var(--c-text)] hover:underline"
            >
              <User className="w-3 h-3" />
              {insight.participant.name}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AICoachAssistant({
  participantId,
  participantName,
  context = 'overview',
  onScheduleMeeting,
  onSendMessage,
  onCreateGoal,
}: AICoachAssistantProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights')
  const [insights, setInsights] = useState<Insight[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load insights on mount and context change
  useEffect(() => {
    loadInsights()
  }, [context, participantId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadInsights = () => {
    setLoadingInsights(true)
    // Simulate API call
    setTimeout(() => {
      setInsights(getContextualInsights(context, participantName))
      setLoadingInsights(false)
    }, 500)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await generateAIResponse(inputValue, context, participantName)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating response:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const quickActions = [
    {
      icon: Calendar,
      label: t('consultant.aiCoach.bookMeeting', 'Boka möte'),
      onClick: () => participantId && onScheduleMeeting?.(participantId),
    },
    {
      icon: MessageSquare,
      label: t('consultant.aiCoach.sendMessage', 'Skicka meddelande'),
      onClick: () => participantId && onSendMessage?.(participantId),
    },
    {
      icon: Target,
      label: t('consultant.aiCoach.createGoal', 'Skapa mål'),
      onClick: () => participantId && onCreateGoal?.(participantId),
    },
  ]

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'w-14 h-14 rounded-full',
          'bg-gradient-to-br from-[var(--c-solid)] to-sky-700',
          'shadow-lg ',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-transform',
          'animate-pulse hover:animate-none'
        )}
        title={t('consultant.aiCoach.open', 'Öppna AI Coach')}
      >
        <Bot className="w-6 h-6 text-white" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed z-50 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl',
        'border border-stone-200 dark:border-stone-700',
        'flex flex-col overflow-hidden',
        'transition-all duration-300',
        isExpanded
          ? 'bottom-4 right-4 w-[500px] h-[700px]'
          : 'bottom-6 right-6 w-[380px] h-[520px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--c-solid)] to-sky-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {t('consultant.aiCoach.title', 'AI Coach')}
            </h3>
            <p className="text-xs text-white/70">
              {participantName || t('consultant.aiCoach.subtitle', 'Din intelligenta assistent')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-white" />
            ) : (
              <Maximize2 className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-700">
        <button
          onClick={() => setActiveTab('insights')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'insights'
              ? 'text-[var(--c-text)] dark:text-[var(--c-text)] border-b-2 border-[var(--c-solid)]'
              : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t('consultant.aiCoach.insights', 'Insikter')}
            {insights.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-xs text-[var(--c-text)] dark:text-[var(--c-text)]">
                {insights.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'chat'
              ? 'text-[var(--c-text)] dark:text-[var(--c-text)] border-b-2 border-[var(--c-solid)]'
              : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {t('consultant.aiCoach.chat', 'Chatt')}
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'insights' ? (
          <div className="h-full flex flex-col">
            {/* Insights List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingInsights ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[var(--c-text)] animate-spin" />
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                  <p className="text-sm text-stone-500">
                    {t('consultant.aiCoach.noInsights', 'Inga insikter just nu')}
                  </p>
                </div>
              ) : (
                <>
                  {insights.map(insight => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onAction={() => {
                        if (insight.participant) {
                          // Navigate to participant
                        }
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Quick Actions */}
            {participantId && (
              <div className="p-4 border-t border-stone-200 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-600 mb-2">
                  {t('consultant.aiCoach.quickActions', 'Snabbåtgärder')}
                </p>
                <div className="flex gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg',
                        'bg-stone-100 dark:bg-stone-800',
                        'hover:bg-stone-200 dark:hover:bg-stone-700',
                        'transition-colors'
                      )}
                    >
                      <action.icon className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                      <span className="text-xs text-stone-600 dark:text-stone-300">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-700">
              <button
                onClick={loadInsights}
                disabled={loadingInsights}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2 rounded-lg',
                  'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20',
                  'text-[var(--c-text)] dark:text-[var(--c-text)]',
                  'hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-bg)]/40',
                  'transition-colors'
                )}
              >
                <RefreshCw className={cn('w-4 h-4', loadingInsights && 'animate-spin')} />
                <span className="text-sm font-medium">
                  {t('consultant.aiCoach.refreshInsights', 'Uppdatera insikter')}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-[var(--c-accent)] dark:text-[var(--c-text)] mx-auto mb-3" />
                  <p className="text-sm text-stone-600 dark:text-stone-300 mb-1">
                    {t('consultant.aiCoach.welcomeTitle', 'Hur kan jag hjälpa dig?')}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-600">
                    {t(
                      'consultant.aiCoach.welcomeSubtitle',
                      'Ställ frågor om deltagare, strategier eller best practices'
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {[
                      'Hur förbättrar jag CV-kvaliteten?',
                      'Tips för intervjuträning',
                      'Öka motivationen',
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInputValue(suggestion)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs',
                          'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40',
                          'text-[var(--c-text)] dark:text-[var(--c-text)]',
                          'hover:bg-[var(--c-accent)]/60 dark:hover:bg-[var(--c-bg)]/60',
                          'transition-colors'
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-2.5',
                          message.role === 'user'
                            ? 'bg-[var(--c-solid)] text-white rounded-br-md'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-md'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-stone-200 dark:border-stone-700">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className={cn(
                                  'px-2.5 py-1 rounded-full text-xs',
                                  'bg-white dark:bg-stone-700',
                                  'text-[var(--c-text)] dark:text-[var(--c-text)]',
                                  'hover:bg-[var(--c-bg)] dark:hover:bg-stone-600',
                                  'transition-colors'
                                )}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-stone-100 dark:bg-stone-800 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-[var(--c-text)] animate-spin" />
                          <span className="text-sm text-stone-500">
                            {t('consultant.aiCoach.thinking', 'Tänker...')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={t('consultant.aiCoach.placeholder', 'Skriv din fråga...')}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-xl',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-transparent',
                    'focus:border-[var(--c-solid)] focus:outline-none',
                    'text-stone-900 dark:text-stone-100',
                    'placeholder:text-stone-600 text-sm'
                  )}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    'px-4 rounded-xl',
                    'bg-[var(--c-solid)] hover:bg-[var(--c-text)]',
                    'text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
