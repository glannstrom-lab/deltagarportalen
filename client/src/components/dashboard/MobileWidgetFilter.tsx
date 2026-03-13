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
  ChevronDown,
  Eye,
  Sparkles,
} from 'lucide-react'
import type { WidgetType, WidgetFilterItem } from './WidgetFilter'

export { availableWidgets, type WidgetType, type WidgetFilterItem } from './WidgetFilter'

// Kompakt variant av availableWidgets för mobil
const mobileWidgets: WidgetFilterItem[] = [
  { id: 'cv', label: 'CV', icon: FileText, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'coverLetter', label: 'Brev', icon: Mail, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'jobSearch', label: 'Jobb', icon: Briefcase, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'career', label: 'Karriär', icon: Target, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'interests', label: 'Intressen', icon: Compass, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { id: 'exercises', label: 'Övningar', icon: Dumbbell, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'diary', label: 'Dagbok', icon: BookHeart, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'wellness', label: 'Hälsa', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'knowledge', label: 'Kunskap', icon: BookOpen, color: 'text-amber-600 bg-amber-50 border-amber-200' },
]

interface MobileWidgetFilterProps {
  visibleWidgets: WidgetType[]
  onToggleWidget: (widgetId: WidgetType) => void
  onShowAll: () => void
  onHideAll: () => void
}

export const MobileWidgetFilter = memo(function MobileWidgetFilter({
  visibleWidgets,
  onToggleWidget,
  onShowAll,
  onHideAll,
}: MobileWidgetFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visibleCount = visibleWidgets.length

  // Visa bara de första 3 synliga widgets när ihopfälld
  const visiblePreview = mobileWidgets.filter(w => visibleWidgets.includes(w.id)).slice(0, 3)

  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-3 overflow-hidden">
      {/* Compact Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 active:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            {visibleCount} {visibleCount === 1 ? 'modul' : 'moduler'} synliga
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Preview dots */}
          <div className="flex -space-x-1">
            {visiblePreview.map((widget) => {
              const Icon = widget.icon
              return (
                <div
                  key={widget.id}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 border-white flex items-center justify-center',
                    widget.color.split(' ')[1] // bg color
                  )}
                >
                  <Icon size={12} className={widget.color.split(' ')[0]} />
                </div>
              )
            })}
            {visibleCount > 3 && (
              <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs text-slate-500 font-medium">
                +{visibleCount - 3}
              </div>
            )}
          </div>
          <ChevronDown 
            size={18} 
            className={cn(
              'text-slate-400 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )} 
          />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-100">
          {/* Quick actions */}
          <div className="flex items-center justify-between py-2 mb-2">
            <span className="text-xs text-slate-500">Välj vad du vill se:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onShowAll}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 hover:bg-indigo-50 rounded transition-colors"
              >
                Alla
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={onHideAll}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 hover:bg-slate-100 rounded transition-colors"
              >
                Ingen
              </button>
            </div>
          </div>

          {/* Widget grid - 4 columns for compact layout */}
          <div className="grid grid-cols-4 gap-2">
            {mobileWidgets.map((widget) => {
              const Icon = widget.icon
              const isVisible = visibleWidgets.includes(widget.id)
              
              return (
                <button
                  key={widget.id}
                  onClick={() => onToggleWidget(widget.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all duration-200',
                    isVisible
                      ? `${widget.color} border border-current`
                      : 'bg-slate-50 text-slate-400 border border-transparent opacity-60'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-[10px] leading-tight">{widget.label}</span>
                  {isVisible && (
                    <div className="w-1.5 h-1.5 rounded-full bg-current absolute top-1 right-1" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})
