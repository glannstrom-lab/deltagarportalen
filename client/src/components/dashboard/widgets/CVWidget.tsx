import { Link } from 'react-router-dom'
import { FileText, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CVWidgetProps {
  hasCV?: boolean
  progress?: number
  size?: 'small' | 'medium'
}

export function CVWidget({
  hasCV = false,
  progress = 0,
  size = 'small'
}: CVWidgetProps) {
  const isComplete = progress >= 100

  if (size === 'small') {
    return (
      <Link
        to="/cv"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-violet-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          isComplete ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              isComplete ? "bg-emerald-100 text-emerald-600" : "bg-violet-100 text-violet-600"
            )}>
              {isComplete ? <CheckCircle2 size={18} /> : <FileText size={18} />}
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">CV</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className={cn(
            "text-2xl font-bold",
            isComplete ? "text-emerald-600" : "text-slate-800"
          )}>
            {progress}%
          </span>
          {!hasCV && (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Skapa CV
            </span>
          )}
          {isComplete && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Komplett
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isComplete ? "bg-emerald-500" : "bg-violet-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </Link>
    )
  }

  // Medium size
  return (
    <Link
      to="/cv"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-violet-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
        isComplete ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
            isComplete
              ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600"
              : "bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600"
          )}>
            {isComplete ? <CheckCircle2 size={22} /> : <FileText size={22} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Ditt CV</h3>
            <p className="text-xs text-slate-500">
              {isComplete ? 'Redo att skicka' : hasCV ? 'Fortsätt där du slutade' : 'Kom igång nu'}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Progress card */}
      {isComplete ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Sparkles size={24} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Ditt CV är komplett!</p>
            <p className="text-xs text-emerald-600">Redo att användas</p>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Progress</span>
            <span className={cn(
              "text-lg font-bold",
              isComplete ? "text-emerald-600" : "text-violet-600"
            )}>
              {progress}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : "bg-gradient-to-r from-violet-500 to-purple-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-violet-500" />
            <span className="text-lg font-bold text-slate-800">{hasCV ? '1' : '0'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">CV skapat</p>
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          isComplete ? "bg-emerald-50" : "bg-violet-50"
        )}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className={isComplete ? "text-emerald-500" : "text-violet-500"} />
            <span className="text-lg font-bold text-slate-800">{progress}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Komplett</p>
        </div>
      </div>
    </Link>
  )
}

export default CVWidget
