import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Sparkles } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { chatWithAI } from '@/services/aiApi'

interface Message {
  roll: 'user' | 'assistant'
  innehall: string
  tid?: string
}

export function AICareerChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      roll: 'assistant',
      innehall: 'Hej! Jag är din AI-karriärcoach. Hur kan jag hjälpa dig idag? 💼',
      tid: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
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
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      roll: 'user',
      innehall: input,
      tid: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const data = await chatWithAI({
        meddelande: input,
        historik: messages.slice(-5).map(m => ({ roll: m.roll, innehall: m.innehall }))
      })

      const aiMessage: Message = {
        roll: 'assistant',
        innehall: (data as { svar?: string }).svar || 'Jag kunde tyvärr inte svara just nu.',
        tid: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const fallbackMessage: Message = {
        roll: 'assistant',
        innehall: 'Ursäkta, jag har lite tekniska problem just nu. Försök igen om en stund! 🤖',
        tid: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">Fråga AI-coachen</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">Karriär-AI</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 ${message.roll === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.roll === 'user' 
                ? 'bg-teal-100 text-teal-600' 
                : 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white'
            }`}>
              {message.roll === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[75%] ${message.roll === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                message.roll === 'user'
                  ? 'bg-teal-600 text-white rounded-br-none'
                  : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-none'
              }`}>
                {message.innehall}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {message.tid}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-none shadow-sm border border-slate-100">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Skriv din fråga..."
            className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Tips: Fråga om CV, ansökningar, intervjuer eller motivation!
        </p>
      </div>
    </div>
  )
}
