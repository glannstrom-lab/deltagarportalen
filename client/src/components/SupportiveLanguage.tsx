import { useMemo } from 'react'
import { sv } from '@/i18n/sv'

interface SupportiveLanguageProps {
  type: 'encouragement' | 'break' | 'progress' | 'welcome'
  emotionalState?: 'stressed' | 'anxious' | 'frustrated' | 'tired' | 'proud' | 'confident'
  progressPercent?: number
  className?: string
}

export function SupportiveLanguage({ 
  type, 
  emotionalState,
  progressPercent,
  className = '' 
}: SupportiveLanguageProps) {
  const message = useMemo(() => {
    // Hämta meddelanden för denna typ
    const getMessagesForType = () => {
      switch (type) {
        case 'encouragement':
          return emotionalState && emotionalState in sv.supportiveMessages.encouragement
            ? sv.supportiveMessages.encouragement[emotionalState as keyof typeof sv.supportiveMessages.encouragement]
            : sv.supportiveMessages.encouragement.confident
        case 'break':
          return sv.supportiveMessages.break.default
        case 'progress':
          if (progressPercent === undefined) return sv.progress.beginning
          if (progressPercent < 25) return sv.progress.beginning
          if (progressPercent < 50) return sv.progress.progressing
          if (progressPercent < 75) return sv.progress.halfway
          return sv.progress.almostDone
        case 'welcome':
          return ['Välkommen! Du gör bra ifrån dig!']
        default:
          return ['Du gör bra ifrån dig!']
      }
    }

    const messages = getMessagesForType()
    const messageArray = Array.isArray(messages) ? messages : [messages]
    return messageArray[Math.floor(Math.random() * messageArray.length)]
  }, [type, emotionalState, progressPercent])

  const styles = {
    encouragement: 'bg-teal-50 border-teal-200 text-teal-800',
    break: 'bg-amber-50 border-amber-200 text-amber-800',
    progress: 'bg-blue-50 border-blue-200 text-blue-800',
    welcome: 'bg-purple-50 border-purple-200 text-purple-800'
  }

  const icons = {
    encouragement: '💚',
    break: '☕',
    progress: '📈',
    welcome: '👋'
  }

  return (
    <div className={`rounded-xl p-4 border ${styles[type]} ${className}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">{icons[type]}</span>
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  )
}

// Fördefinierade varianter för enklare användning
export function EnergyMessage({ 
  energyLevel, 
  onTakeBreak 
}: { 
  energyLevel: 'high' | 'medium' | 'low' | 'veryLow' | 'exhausted'
  onTakeBreak?: () => void 
}) {
  const messages = sv.supportiveMessages.energy[energyLevel]
  const message = messages[Math.floor(Math.random() * messages.length)]
  
  const styles = {
    high: 'bg-green-50 border-green-200 text-green-800',
    medium: 'bg-teal-50 border-teal-200 text-teal-800',
    low: 'bg-amber-50 border-amber-200 text-amber-800',
    veryLow: 'bg-orange-50 border-orange-200 text-orange-800',
    exhausted: 'bg-rose-50 border-rose-200 text-rose-800'
  }

  return (
    <div className={`rounded-xl p-4 border ${styles[energyLevel]}`} role="status">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed flex-1">{message}</p>
        {onTakeBreak && energyLevel !== 'high' && (
          <button
            onClick={onTakeBreak}
            className="text-sm font-medium underline hover:no-underline opacity-75 hover:opacity-100"
          >
            Ta en paus
          </button>
        )}
      </div>
    </div>
  )
}

export function GreetingMessage({ 
  timeOfDay, 
  userName 
}: { 
  timeOfDay: 'morning' | 'afternoon' | 'evening'
  userName?: string 
}) {
  const messages = sv.greetings[timeOfDay]
  const message = messages[Math.floor(Math.random() * messages.length)]
  
  return (
    <h1 className="text-2xl font-bold text-slate-800">
      {message.replace('{name}', userName ? `, ${userName}` : '')}
    </h1>
  )
}

export function ProgressMessage({ 
  progressPercent 
}: { 
  progressPercent: number 
}) {
  const getMessage = () => {
    if (progressPercent < 10) return sv.progress.beginning[0]
    if (progressPercent < 30) return sv.progress.progressing[0]
    if (progressPercent < 50) return sv.progress.building[0]
    if (progressPercent < 70) return sv.progress.halfway[0]
    if (progressPercent < 90) return sv.progress.almostDone[0]
    return sv.progress.complete[0]
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <p className="text-sm text-blue-800">{getMessage()}</p>
      <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-blue-600 mt-1 text-right">{progressPercent}%</p>
    </div>
  )
}

export function BreakMessage() {
  const messages = sv.supportiveMessages.break.default
  const message = messages[Math.floor(Math.random() * messages.length)]
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <span className="text-xl">☕</span>
      <div>
        <p className="text-sm text-amber-800 font-medium">Dags för en paus?</p>
        <p className="text-sm text-amber-700 mt-1">{message}</p>
      </div>
    </div>
  )
}

export function StressSupportMessage() {
  const messages = sv.supportiveMessages.stressSupport
  const message = messages[Math.floor(Math.random() * messages.length)]
  
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
      <p className="text-sm text-rose-800 leading-relaxed">{message}</p>
      <div className="mt-3 flex gap-2">
        <a 
          href="tel:1177" 
          className="text-xs bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors"
        >
          📞 Ring 1177
        </a>
        <a 
          href="https://www.1177.se" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors"
        >
          🌐 1177.se
        </a>
      </div>
    </div>
  )
}

// Hook för att transformera text till icke-skuldbeläggande språk
export function useSupportiveTransform() {
  return (text: string): string => {
    let transformed = text
    
    // Ersätt skuldbeläggande formuleringar
    for (const [negative, positive] of Object.entries(sv.transformations)) {
      transformed = transformed.replace(new RegExp(negative, 'gi'), positive)
    }
    
    return transformed
  }
}

// Hook för att få rätt meddelande baserat på kontext
export function useSupportiveMessage() {
  return ({
    type,
    emotionalState,
    energyLevel
  }: {
    type: SupportiveLanguageProps['type']
    emotionalState?: SupportiveLanguageProps['emotionalState']
    energyLevel?: 'high' | 'medium' | 'low' | 'veryLow'
  }): string => {
    if (energyLevel && type === 'break') {
      const energyMessages = sv.supportiveMessages.energy[energyLevel]
      return energyMessages[Math.floor(Math.random() * energyMessages.length)]
    }
    
    if (emotionalState && type === 'encouragement') {
      const stateMessages = sv.supportiveMessages.encouragement[emotionalState as keyof typeof sv.supportiveMessages.encouragement]
      if (Array.isArray(stateMessages)) {
        return stateMessages[Math.floor(Math.random() * stateMessages.length)]
      }
    }
    
    const defaultMessages = sv.supportiveMessages.encouragement.confident
    return defaultMessages[Math.floor(Math.random() * defaultMessages.length)]
  }
}

export default SupportiveLanguage
