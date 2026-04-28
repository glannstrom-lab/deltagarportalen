/**
 * AI Chatbot Component
 * En intelligent chatbot för jobbsökarhjälp med NLP
 */

import { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Sparkles,
  Loader2,
  ChevronDown,
  HelpCircle,
  Briefcase,
  FileText,
  BookOpen
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  actions?: { label: string; url: string }[]
}

interface AIChatbotProps {
  className?: string
}

// Fördefinierade intents och svar för offline/demosyfte
type IntentResponse = {
  response: string;
  suggestions?: string[];
  actions?: { label: string; url: string }[];
}

const intentResponses: Record<string, (params: unknown) => IntentResponse> = {
  'cv_hjälp': () => ({
    response: 'Jag kan hjälpa dig med ditt CV! Vad vill du förbättra? Jag kan ge tips om struktur, innehåll, eller specifika sektioner som sammanfattning eller erfarenheter.',
    suggestions: ['Hur skriver jag en bra sammanfattning?', 'Vilka kompetenser ska jag lyfta?', 'CV-mallar'],
    actions: [{ label: 'Öppna CV-byggaren', url: '/cv' }]
  }),
  
  'personligt_brev': () => ({
    response: 'Ett personligt brev ska komplettera ditt CV och förklara VARFÖR du vill ha just detta jobb. Jag kan hjälpa dig strukturera det!',
    suggestions: ['Hur börjar jag brevet?', 'Vad ska jag undvika?', 'Exempel på bra brev'],
    actions: [{ label: 'Skapa brev', url: '/cover-letter' }]
  }),
  
  'jobbsökning': () => ({
    response: 'Att söka jobb är en process! Jag rekommenderar att du sparar intressanta jobb, anpassar ditt CV för varje ansökan, och följer upp efter en vecka.',
    suggestions: ['Hitta jobb som passar mig', 'Hur följer jag upp?', 'Förberedelse inför intervju'],
    actions: [{ label: 'Sök jobb', url: '/job-search' }]
  }),
  
  'intervju': () => ({
    response: 'Intervjuer kan kännas nervösa, men med rätt förberedelse går det bra! Fokusera på dina styrkor, förbered exempel på tidigare erfarenheter, och ställ frågor till arbetsgivaren.',
    suggestions: ['Vanliga intervjufrågor', 'Hur hanterar jag nervositet?', 'Vad ska jag fråga dem?'],
    actions: [{ label: 'Intervjutips', url: '/knowledge/interview' }]
  }),
  
  'karriärväg': () => ({
    response: 'Att hitta rätt karriärväg börjar med att förstå dina intressen och styrkor. Har du gjort vår intresseguide? Den kan ge dig insikter om vilka yrken som passar dig!',
    suggestions: ['Gör intresseguiden', 'Utforska yrken', 'Utbildningsvägar'],
    actions: [{ label: 'Intresseguide', url: '/interest-guide' }]
  }),
  
  'motivation': () => ({
    response: 'Det är helt normalt att känna sig less eller frustrerad ibland under jobbsökningen. Kom ihåg: varje ansökan är ett steg framåt, även om det inte alltid känns så. Vilken del känns tuffast just nu?',
    suggestions: ['Jag orkar inte mer', 'Ingen svarar på mina ansökningar', 'Hur håller jag motivationen uppe?'],
    actions: [{ label: 'Skriv i dagboken', url: '/diary' }]
  }),
  
  'default': (userMessage: string) => ({
    response: `Jag förstår att du undrar om "${userMessage}". Jag kan hjälpa dig med:\n\n• CV och personliga brev\n• Jobbsökning och ansökningar\n• Intervjuförberedelse\n• Karriärvägledning\n• Motivation och stöd\n\nVad vill du veta mer om?`,
    suggestions: ['CV-tips', 'Hitta jobb', 'Karriärvägledning', 'Jag behöver pepp']
  })
}

// Enkel intent-recognition
function recognizeIntent(message: string): { intent: string; params: unknown } {
  const lowerMsg = message.toLowerCase()
  
  if (/cv|meritförteckning|resume/i.test(lowerMsg)) {
    return { intent: 'cv_hjälp', params: {} }
  }
  if (/personligt brev|ansökan|cover letter/i.test(lowerMsg)) {
    return { intent: 'personligt_brev', params: {} }
  }
  if (/jobb|söka|ansöka|arbete|tjänst/i.test(lowerMsg)) {
    return { intent: 'jobbsökning', params: {} }
  }
  if (/intervju|interview|möte|träffa/i.test(lowerMsg)) {
    return { intent: 'intervju', params: {} }
  }
  if (/karriär|väg|framtid|yrke|vad ska jag bli/i.test(lowerMsg)) {
    return { intent: 'karriärväg', params: {} }
  }
  if (/motivation|ork|trött|less|deppig|nervös/i.test(lowerMsg)) {
    return { intent: 'motivation', params: {} }
  }
  
  return { intent: 'default', params: message }
}

export function AIChatbot({ className }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hej! 👋 Jag är din AI-assistent för jobbsökning. Jag kan hjälpa dig med CV, personliga brev, intervjuförberedelse, eller bara peppa dig när det känns tufft! Vad undrar du över?',
      timestamp: new Date(),
      suggestions: ['Hjälp med CV', 'Skriva personligt brev', 'Förbereda intervju', 'Jag behöver pepp']
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulera AI-svar
    setTimeout(() => {
      const { intent, params } = recognizeIntent(userMessage.content)
      const response = intentResponses[intent]?.(params) || intentResponses['default'](userMessage.content)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actions: response.actions
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => handleSend(), 100)
  }

  const handleAction = (url: string) => {
    window.location.href = url
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-14 h-14 bg-gradient-to-r from-[var(--c-solid)] to-sky-500 rounded-full shadow-lg shadow-[var(--c-accent)]/60 flex items-center justify-center text-white hover:scale-110 transition-transform',
            className
          )}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-96 h-[70vh] sm:h-[600px] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--c-solid)] to-sky-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Jobb-assistenten</h3>
                <p className="text-xs text-white/70 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-driven hjälp
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' && 'flex-row-reverse'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  message.role === 'assistant' ? 'bg-[var(--c-accent)]/40' : 'bg-stone-100'
                )}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-[var(--c-text)]" />
                  ) : (
                    <User className="w-4 h-4 text-stone-600" />
                  )}
                </div>
                
                <div className={cn(
                  'max-w-[75%] space-y-2',
                  message.role === 'user' && 'items-end'
                )}>
                  <div className={cn(
                    'p-3 rounded-2xl text-sm',
                    message.role === 'assistant'
                      ? 'bg-stone-100 text-stone-800 rounded-tl-none'
                      : 'bg-[var(--c-solid)] text-white rounded-tr-none'
                  )}>
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
                  </div>

                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestion(suggestion)}
                          className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs text-stone-600 hover:border-[var(--c-accent)] hover:text-[var(--c-text)] transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {message.actions && (
                    <div className="flex gap-2">
                      {message.actions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => handleAction(action.url)}
                          className="px-3 py-1.5 bg-[var(--c-accent)]/40 text-[var(--c-text)] rounded-lg text-xs font-medium hover:bg-[var(--c-accent)]/60 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[var(--c-accent)]/40 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[var(--c-text)]" />
                </div>
                <div className="bg-stone-100 rounded-2xl rounded-tl-none p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--c-text)]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-stone-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Skriv din fråga..."
                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-[var(--c-solid)] text-white rounded-xl hover:bg-[var(--c-solid)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-stone-600 mt-2 text-center">
              AI:n kan göra fel. Dubbelkolla viktig information.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default AIChatbot
