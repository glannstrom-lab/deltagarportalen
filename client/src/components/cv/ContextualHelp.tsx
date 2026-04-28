/**
 * Contextual Help Component
 * Shows helpful tips based on user context and input
 */

import { useState, useEffect } from 'react'
import { 
  Lightbulb, X, ChevronRight, CheckCircle,
  AlertCircle, Info
} from '@/components/ui/icons'

interface HelpTip {
  id: string
  type: 'tip' | 'warning' | 'success' | 'info'
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

interface ContextualHelpProps {
  context: string
  data?: { length?: number } | unknown
  onApplySuggestion?: (suggestion: string) => void
}

const helpDatabase: Record<string, HelpTip[]> = {
  'personal-info': [
    {
      id: 'pi-1',
      type: 'tip',
      title: 'Profesionell titel',
      message: 'Använd en tydlig yrkestitel som beskriver vad du gör, t.ex. "Erfaren kundservicemedarbetare" istället för bara "Arbetssökande".',
    },
    {
      id: 'pi-2',
      type: 'tip',
      title: 'LinkedIn-profil',
      message: 'Lägg till en länk till din LinkedIn-profil för att ge rekryterare mer information om dig.',
    }
  ],
  'summary': [
    {
      id: 'su-1',
      type: 'tip',
      title: 'Starta starkt',
      message: 'Börja med din starkaste kvalifikation eller det du brinner mest för. Fånga läsarens intresse direkt.',
    },
    {
      id: 'su-2',
      type: 'warning',
      title: 'För kort',
      message: 'En bra sammanfattning är 3-5 meningar. Berätta vem du är, vad du kan, och vad du söker.',
    },
    {
      id: 'su-3',
      type: 'success',
      title: 'Bra längd!',
      message: 'Din sammanfattning har en bra längd. Se till att den innehåller nyckelord från jobbannonser du är intresserad av.',
    }
  ],
  'experience': [
    {
      id: 'ex-1',
      type: 'tip',
      title: 'Kvantifiera resultat',
      message: 'Använd siffror när det är möjligt. "Ökade försäljningen med 25%" är starkare än "Ökade försäljningen".',
    },
    {
      id: 'ex-2',
      type: 'tip',
      title: 'Aktiva verb',
      message: 'Börja punkter med aktiva verb: Ledde, Utvecklade, Skapade, Förbättrade, Implementerade.',
    },
    {
      id: 'ex-3',
      type: 'warning',
      title: 'Tidsluckor',
      message: 'Det finns luckor i din erfarenhet. Överväg att lägga till annan relevant erfarenhet som volontärarbete eller praktik.',
    }
  ],
  'skills': [
    {
      id: 'sk-1',
      type: 'tip',
      title: 'Blanda hard och soft skills',
      message: 'Inkludera både tekniska kompetenser (t.ex. Excel, programmering) och mjuka färdigheter (t.ex. kommunikation, lagarbete).',
    },
    {
      id: 'sk-2',
      type: 'info',
      title: 'Nyckelord',
      message: 'Kolla jobbannonser för att se vilka kompetenser efterfrågas mest i din bransch just nu.',
    }
  ],
  'education': [
    {
      id: 'ed-1',
      type: 'tip',
      title: 'Relevanta kurser',
      message: 'Om du saknar formell utbildning, nämn relevanta kurser, certifieringar eller självstudier.',
    }
  ]
}

export function ContextualHelp({ context, data, onApplySuggestion }: ContextualHelpProps) {
  const [visibleTips, setVisibleTips] = useState<Set<string>>(new Set())
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('dismissed-help-tips')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

  useEffect(() => {
    const tips = helpDatabase[context] || []
    const relevantTips = tips.filter(tip => {
      if (dismissedTips.has(tip.id)) return false

      // Context-specific logic
      if (context === 'summary' && data && typeof data === 'object' && 'length' in data) {
        const length = (data.length as number) || 0
        if (tip.id === 'su-2' && length >= 100) return false
        if (tip.id === 'su-3' && length < 100) return false
      }

      return true
    })

    setVisibleTips(new Set(relevantTips.map(t => t.id)))
  }, [context, data, dismissedTips])

  const dismissTip = (id: string) => {
    const newDismissed = new Set(dismissedTips)
    newDismissed.add(id)
    setDismissedTips(newDismissed)
    localStorage.setItem('dismissed-help-tips', JSON.stringify([...newDismissed]))
    
    const newVisible = new Set(visibleTips)
    newVisible.delete(id)
    setVisibleTips(newVisible)
  }

  const getIcon = (type: HelpTip['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />
      case 'info': return <Info className="w-5 h-5 text-blue-500" />
      default: return <Lightbulb className="w-5 h-5 text-purple-500" />
    }
  }

  const getStyles = (type: HelpTip['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'warning': return 'bg-amber-50 border-amber-200'
      case 'info': return 'bg-blue-50 border-blue-200'
      default: return 'bg-purple-50 border-purple-200'
    }
  }

  const tips = helpDatabase[context]?.filter(t => visibleTips.has(t.id)) || []

  if (tips.length === 0) return null

  return (
    <div className="space-y-3">
      {tips.map((tip) => (
        <div
          key={tip.id}
          className={`
            relative p-4 rounded-xl border ${getStyles(tip.type)}
            animate-in slide-in-from-right-2 duration-300
          `}
        >
          {tip.dismissible !== false && (
            <button
              onClick={() => dismissTip(tip.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4 text-stone-600" />
            </button>
          )}
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(tip.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-stone-800 text-sm mb-1">
                {tip.title}
              </h4>
              <p className="text-sm text-stone-600 leading-relaxed">
                {tip.message}
              </p>
              
              {tip.action && (
                <button
                  onClick={tip.action.onClick}
                  className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  {tip.action.label}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Suggestion chip component for inline suggestions
interface SuggestionChipProps {
  text: string
  onClick: () => void
  icon?: React.ReactNode
}

export function SuggestionChip({ text, onClick, icon }: SuggestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="
        inline-flex items-center gap-1.5 px-3 py-1.5
        bg-purple-50 text-purple-700 text-sm
        rounded-full border border-purple-200
        hover:bg-purple-100 hover:border-purple-300
        transition-colors
      "
    >
      {icon || <Sparkles className="w-3.5 h-3.5" />}
      {text}
    </button>
  )
}

// Inline help tooltip
interface InlineHelpProps {
  children: React.ReactNode
  tip: string
}

export function InlineHelp({ children, tip }: InlineHelpProps) {
  const [show, setShow] = useState(false)

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-stone-800 text-white text-xs rounded-lg whitespace-nowrap animate-in fade-in duration-200">
          {tip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800" />
        </div>
      )}
    </div>
  )
}
