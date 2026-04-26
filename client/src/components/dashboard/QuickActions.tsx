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
    shadow: 'hover:'
  },
  brand: {
    bg: 'bg-brand-50',
    hover: 'hover:bg-brand-100',
    text: 'text-brand-900',
    border: 'border-brand-200',
    shadow: 'hover:'
  },
  blue: {
    bg: 'bg-blue-50',
    hover: 'hover:bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    shadow: 'hover:'
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
      color: 'brand',
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
        <Clock size={18} className="text-slate-700 dark:text-stone-300" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-stone-300">
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
                "relative group p-4 rounded-xl border-2 text-left transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                colors.bg,
                colors.border,
                "hover:-translate-y-1 hover:",
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
                {t(action.labelKey)}
              </div>

              {/* Description - only show on hover or selected */}
              <p className={cn(
                "text-xs text-slate-600 dark:text-stone-400 transition-all duration-300",
                isHovered || isSelected ? "opacity-100 max-h-10" : "opacity-70 max-h-6 overflow-hidden"
              )}>
                {t(action.descriptionKey)}
              </p>

              {/* Arrow indicator */}
              <div className={cn(
                "absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center",
                "bg-white/50 dark:bg-stone-800/50 text-slate-600 dark:text-stone-400 transition-all duration-300",
                "group-hover:bg-white dark:group-hover:bg-stone-800 group-hover:text-slate-600 dark:group-hover:text-stone-300",
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
          className="animate-fade-in-up bg-white dark:bg-stone-900 rounded-xl border-2 border-slate-200 dark:border-stone-700 p-4"
          style={{ animationDelay: '0ms' }}
        >
          <p className="text-sm font-medium text-slate-700 dark:text-stone-300 mb-3">
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
                    "bg-slate-50 dark:bg-stone-800 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-900 dark:hover:text-brand-400",
                    "border border-slate-200 dark:border-stone-700 hover:border-brand-200 dark:hover:border-brand-900",
                    "transition-all duration-200",
                    "hover:-translate-y-0.5 hover:",
                    "text-slate-800 dark:text-stone-200"
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
