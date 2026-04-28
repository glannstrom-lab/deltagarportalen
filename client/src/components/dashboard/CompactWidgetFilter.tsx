import { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  FileText,
  Mail,
  Briefcase,
  Target,
  Compass,
  Dumbbell,
  BookHeart,
  BookOpen,
  LayoutGrid,
  ChevronDown,
  Eye,
  Sparkles,
  Send,
  Zap,
} from '@/components/ui/icons'
import type { WidgetType, WidgetFilterItem } from './WidgetFilter'

export { availableWidgets, type WidgetType, type WidgetFilterItem } from './WidgetFilter'

const compactWidgets: WidgetFilterItem[] = [
  { id: 'cv', label: 'CV', icon: FileText, color: 'text-[var(--c-text)] bg-[var(--c-bg)] border-[var(--c-accent)]/60' },
  { id: 'coverLetter', label: 'Brev', icon: Mail, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'jobSearch', label: 'Jobb', icon: Briefcase, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'applications', label: 'Ansökningar', icon: Send, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'career', label: 'Karriär', icon: Target, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'interests', label: 'Intressen', icon: Compass, color: 'text-[var(--c-text)] bg-[var(--c-bg)] border-[var(--c-accent)]/60' },
  { id: 'exercises', label: 'Övningar', icon: Dumbbell, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'diary', label: 'Dagbok', icon: BookHeart, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'wellness', label: 'Hälsa', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'knowledge', label: 'Kunskap', icon: BookOpen, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'quests', label: 'Quests', icon: Zap, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
]

interface CompactWidgetFilterProps {
  visibleWidgets: WidgetType[]
  onToggleWidget: (widgetId: WidgetType) => void
  onShowAll: () => void
  onHideAll: () => void
}

export const CompactWidgetFilter = memo(function CompactWidgetFilter({
  visibleWidgets,
  onToggleWidget,
  onShowAll,
  onHideAll,
}: CompactWidgetFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visibleCount = visibleWidgets.length

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      {/* Compact Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-stone-700" />
            <span className="text-sm font-medium text-stone-700">Moduler</span>
          </div>
          <span className="text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
            {visibleCount}/{compactWidgets.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Preview icons */}
          <div className="flex -space-x-1.5">
            {compactWidgets
              .filter(w => visibleWidgets.includes(w.id))
              .slice(0, 5)
              .map((widget) => {
                const Icon = widget.icon
                return (
                  <div
                    key={widget.id}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 border-white flex items-center justify-center',
                      widget.color.split(' ')[1]
                    )}
                  >
                    <Icon size={12} className={widget.color.split(' ')[0]} />
                  </div>
                )
              })}
            {visibleCount > 5 && (
              <div className="w-6 h-6 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-xs text-stone-700 font-medium">
                +{visibleCount - 5}
              </div>
            )}
          </div>
          <ChevronDown 
            size={18} 
            className={cn(
              'text-stone-600 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )} 
          />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-stone-100">
          {/* Quick actions */}
          <div className="flex items-center justify-between py-2 mb-2">
            <span className="text-xs text-stone-700">Välj moduler att visa:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onShowAll}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium px-2 py-1 hover:bg-sky-50 rounded transition-colors"
              >
                Alla
              </button>
              <span className="text-stone-300">|</span>
              <button
                onClick={onHideAll}
                className="text-xs text-stone-700 hover:text-stone-700 px-2 py-1 hover:bg-stone-100 rounded transition-colors"
              >
                Ingen
              </button>
            </div>
          </div>

          {/* Widget grid - 8 columns for compact layout */}
          <div className="grid grid-cols-8 gap-2">
            {compactWidgets.map((widget) => {
              const Icon = widget.icon
              const isVisible = visibleWidgets.includes(widget.id)
              
              return (
                <button
                  key={widget.id}
                  onClick={() => onToggleWidget(widget.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all duration-200',
                    isVisible
                      ? `${widget.color} border border-current`
                      : 'bg-stone-50 text-stone-600 border border-transparent opacity-60 hover:opacity-80'
                  )}
                >
                  <Icon size={16} />
                  <span className="text-xs leading-tight">{widget.label}</span>
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-xs text-stone-600">
            Tips: Du kan ändra storlek på varje widget med ikonen uppe till höger på kortet.
          </p>
        </div>
      )}
    </div>
  )
})
