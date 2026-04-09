import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ArrowRight, Zap, Coffee, Target } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface QuickAction {
  duration: number
  label: string
  description: string
  icon: React.ReactNode
  color: string
  suggestions: { label: string; link: string }[]
}

const quickActions: QuickAction[] = [
  {
    duration: 5,
    label: '5 minuter',
    description: 'Snabb aktivitet',
    icon: <Coffee size={20} />,
    color: 'emerald',
    suggestions: [
      { label: 'Logga ditt humör', link: '/wellness' },
      { label: 'Uppdatera en CV-rad', link: '/cv' },
      { label: 'Spara ett intressant jobb', link: '/job-search' },
      { label: 'Markera en quest klar', link: '/quests' }
    ]
  },
  {
    duration: 15,
    label: '15 minuter',
    description: 'Fokuserad stund',
    icon: <Zap size={20} />,
    color: 'violet',
    suggestions: [
      { label: 'Skriv en ansökan', link: '/job-search' },
      { label: 'Uppdatera CV-sektion', link: '/cv' },
      { label: 'Gör en övning', link: '/exercises' },
      { label: 'Läs en artikel', link: '/knowledge-base' }
    ]
  },
  {
    duration: 30,
    label: '30 minuter',
    description: 'Djuparbete',
    icon: <Target size={20} />,
    color: 'blue',
    suggestions: [
      { label: 'Färdigställ ansökan', link: '/job-search' },
      { label: 'Gör intresseguiden', link: '/interest-guide' },
      { label: 'Skriv personligt brev', link: '/cover-letter' },
      { label: 'Planera veckan', link: '/diary' }
    ]
  }
]

const colorClasses: Record<string, { 
  bg: string
  hover: string
  text: string
  border: string
  shadow: string
}> = {
  emerald: {
    bg: 'bg-emerald-50',
    hover: 'hover:bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    shadow: 'hover:shadow-emerald-100'
  },
  violet: {
    bg: 'bg-violet-50',
    hover: 'hover:bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-200',
    shadow: 'hover:shadow-violet-100'
  },
  blue: {
    bg: 'bg-blue-50',
    hover: 'hover:bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    shadow: 'hover:shadow-blue-100'
  }
}

export function QuickActions() {
  const navigate = useNavigate()
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [hoveredAction, setHoveredAction] = useState<number | null>(null)

  const handleSuggestionClick = (link: string) => {
    navigate(link)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-slate-700" />
        <h3 className="text-sm font-semibold text-slate-700">
          Vad vill du göra?
        </h3>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, index) => {
          const colors = colorClasses[action.color]
          const isSelected = selectedDuration === action.duration
          const isHovered = hoveredAction === index

          return (
            <button
              key={action.duration}
              onClick={() => setSelectedDuration(
                selectedDuration === action.duration ? null : action.duration
              )}
              onMouseEnter={() => setHoveredAction(index)}
              onMouseLeave={() => setHoveredAction(null)}
              className={cn(
                "relative group p-4 rounded-2xl border-2 text-left transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                colors.bg,
                colors.border,
                "hover:-translate-y-1 hover:shadow-lg",
                colors.shadow,
                isSelected && "ring-2 ring-offset-2 ring-slate-400"
              )}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Duration badge */}
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3",
                "bg-white/80 backdrop-blur-sm",
                colors.text
              )}>
                {action.icon}
                {action.label}
              </div>

              {/* Description - only show on hover or selected */}
              <p className={cn(
                "text-xs text-slate-600 transition-all duration-300",
                isHovered || isSelected ? "opacity-100 max-h-10" : "opacity-70 max-h-6 overflow-hidden"
              )}>
                {action.description}
              </p>

              {/* Arrow indicator */}
              <div className={cn(
                "absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center",
                "bg-white/50 text-slate-600 transition-all duration-300",
                "group-hover:bg-white group-hover:text-slate-600",
                isSelected && "rotate-90"
              )}>
                <ArrowRight size={14} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded suggestions */}
      {selectedDuration && (
        <div 
          className="animate-fade-in-up bg-white rounded-2xl border-2 border-slate-200 p-4"
          style={{ animationDelay: '0ms' }}
        >
          <p className="text-sm font-medium text-slate-700 mb-3">
            Förslag för {selectedDuration} minuter:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions
              .find(a => a.duration === selectedDuration)
              ?.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion.link)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl text-sm",
                    "bg-slate-50 hover:bg-violet-50 hover:text-violet-700",
                    "border border-slate-200 hover:border-violet-200",
                    "transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-md"
                  )}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {suggestion.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickActions
