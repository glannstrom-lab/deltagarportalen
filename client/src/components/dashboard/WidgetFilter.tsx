import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  FileText,
  Mail,
  Briefcase,
  Send,
  Target,
  Compass,
  Dumbbell,
  BookHeart,
  BookOpen,
  LayoutGrid,
} from 'lucide-react'

export type WidgetType = 
  | 'cv'
  | 'coverLetter'
  | 'jobSearch'
  | 'applications'
  | 'career'
  | 'interests'
  | 'exercises'
  | 'diary'
  | 'knowledge'

export interface WidgetFilterItem {
  id: WidgetType
  label: string
  icon: typeof FileText
  color: string
}

// Widget-färger - varje widget har sin egen distinkta färg för enkel igenkänning
export const availableWidgets: WidgetFilterItem[] = [
  { id: 'cv', label: 'Profil', icon: FileText, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'coverLetter', label: 'Brev', icon: Mail, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'jobSearch', label: 'Jobb', icon: Briefcase, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'applications', label: 'Ansökningar', icon: Send, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'career', label: 'Karriär', icon: Target, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'interests', label: 'Intressen', icon: Compass, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { id: 'exercises', label: 'Övningar', icon: Dumbbell, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'diary', label: 'Dagbok', icon: BookHeart, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'knowledge', label: 'Kunskap', icon: BookOpen, color: 'text-amber-600 bg-amber-50 border-amber-200' },
]

interface WidgetFilterProps {
  visibleWidgets: WidgetType[]
  onToggleWidget: (widgetId: WidgetType) => void
  onShowAll: () => void
  onHideAll: () => void
}

export const WidgetFilter = memo(function WidgetFilter({
  visibleWidgets,
  onToggleWidget,
  onShowAll,
  onHideAll,
}: WidgetFilterProps) {
  const visibleCount = visibleWidgets.length
  const totalCount = availableWidgets.length

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid size={18} className="text-slate-500" />
          <h3 className="text-sm font-medium text-slate-700">
            Visa moduler
          </h3>
          <span className="text-xs text-slate-400">
            ({visibleCount}/{totalCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onShowAll}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 hover:bg-indigo-50 rounded transition-colors"
          >
            Visa alla
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={onHideAll}
            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 hover:bg-slate-100 rounded transition-colors"
          >
            Dölj alla
          </button>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {availableWidgets.map((widget) => {
          const Icon = widget.icon
          const isVisible = visibleWidgets.includes(widget.id)
          
          return (
            <button
              key={widget.id}
              onClick={() => onToggleWidget(widget.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                isVisible
                  ? `${widget.color} border border-current opacity-100`
                  : 'bg-slate-100 text-slate-400 border border-transparent opacity-60 hover:opacity-80'
              )}
              title={isVisible ? 'Klicka för att dölja' : 'Klicka för att visa'}
            >
              <Icon size={14} />
              <span>{widget.label}</span>
              {isVisible && (
                <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              )}
            </button>
          )
        })}
      </div>

      {/* Hint */}
      <p className="text-xs text-slate-400 mt-3">
        Klicka på en modul för att visa eller dölja den. Ändra storlek på varje widget med ikonen uppe till höger.
      </p>
    </div>
  )
})
