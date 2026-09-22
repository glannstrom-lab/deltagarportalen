import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Clock, ArrowRight, Zap, Coffee, Target } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface QuickAction {
  duration: number
  labelKey: string
  descriptionKey: string
  icon: React.ReactNode
  color: string
  suggestions: { labelKey: string; link: string }[]
}

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
  teal: {
    bg: 'bg-[var(--c-bg)]',
    hover: 'hover:bg-[var(--c-accent)]/40',
    text: 'text-[var(--c-text)]',
    border: 'border-[var(--c-accent)]/60',
    shadow: ''
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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [hoveredAction, setHoveredAction] = useState<number | null>(null)

  const quickActions: QuickAction[] = [
    {
      duration: 5,
      labelKey: 'dashboard.quickActions.fiveMin',
      descriptionKey: 'dashboard.quickActions.quickActivity',
      icon: <Coffee size={20} />,
      color: 'emerald',
      suggestions: [
        { labelKey: 'dashboard.quickActions.logMood', link: '/wellness' },
        { labelKey: 'dashboard.quickActions.updateCVLine', link: '/cv' },
        { labelKey: 'dashboard.quickActions.saveJob', link: '/job-search' },
        { labelKey: 'dashboard.quickActions.markQuestDone', link: '/quests' }
      ]
    },
    {
      duration: 15,
      labelKey: 'dashboard.quickActions.fifteenMin',
      descriptionKey: 'dashboard.quickActions.focusedTime',
      icon: <Zap size={20} />,
      color: 'teal',
      suggestions: [
        { labelKey: 'dashboard.quickActions.writeApplication', link: '/job-search' },
        { labelKey: 'dashboard.quickActions.updateCVSection', link: '/cv' },
        { labelKey: 'dashboard.quickActions.doExercise', link: '/exercises' },
        { labelKey: 'dashboard.quickActions.readArticle', link: '/knowledge-base' }
      ]
    },
    {
      duration: 30,
      labelKey: 'dashboard.quickActions.thirtyMin',
      descriptionKey: 'dashboard.quickActions.deepWork',
      icon: <Target size={20} />,
      color: 'blue',
      suggestions: [
        { labelKey: 'dashboard.quickActions.completeApplication', link: '/job-search' },
        { labelKey: 'dashboard.quickActions.doInterestGuide', link: '/interest-guide' },
        { labelKey: 'dashboard.quickActions.writeCoverLetter', link: '/cover-letter' },
        { labelKey: 'dashboard.quickActions.planWeek', link: '/diary' }
      ]
    }
  ]

  const handleSuggestionClick = (link: string) => {
    navigate(link)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-stone-700 dark:text-stone-300" />
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          {t('dashboard.quickActions.title')}
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
                isSelected && "ring-2 ring-offset-2 ring-stone-400"
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
                {t(action.labelKey)}
              </div>

              {/* Description - only show on hover or selected */}
              <p className={cn(
                "text-xs text-stone-600 dark:text-stone-400 transition-all duration-300",
                isHovered || isSelected ? "opacity-100 max-h-10" : "opacity-70 max-h-6 overflow-hidden"
              )}>
                {t(action.descriptionKey)}
              </p>

              {/* Arrow indicator */}
              <div className={cn(
                "absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center",
                "bg-white/50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 transition-all duration-300",
                "group-hover:bg-white dark:group-hover:bg-stone-800 group-hover:text-stone-600 dark:group-hover:text-stone-300",
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
          className="animate-fade-in-up bg-white dark:bg-stone-900 rounded-2xl border-2 border-stone-200 dark:border-stone-700 p-4"
          style={{ animationDelay: '0ms' }}
        >
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            {t('dashboard.quickActions.suggestionsFor', { minutes: selectedDuration })}
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
                    "bg-stone-50 dark:bg-stone-800 hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/40 hover:text-[var(--c-text)] dark:hover:text-[var(--c-solid)]",
                    "border border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)]/60 dark:hover:border-[var(--c-accent)]/60",
                    "transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-md",
                    "text-stone-800 dark:text-stone-200"
                  )}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {t(suggestion.labelKey)}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickActions
