import { Link } from 'react-router-dom'
import { FileText, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CVWidgetProps {
  hasCV?: boolean
  progress?: number
  size?: 'small' | 'medium' | 'large'
}

export function CVWidget({
  hasCV = false,
  progress = 0,
  size = 'small'
}: CVWidgetProps) {
  const isComplete = progress >= 100

  // SMALL SIZE
  if (size === 'small') {
    return (
      <Link
        to="/cv"
        className={cn(
          "group block bg-white p-4 rounded-xl border-2 transition-all duration-200",
          "hover:border-violet-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          isComplete ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              isComplete ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
            )}>
              {isComplete ? <CheckCircle2 size={16} /> : <FileText size={16} />}
            </div>
            <h3 className="font-semibold text-slate-800">CV</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            "text-2xl font-bold",
            isComplete ? "text-emerald-700" : "text-slate-800"
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

        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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

  // MEDIUM SIZE - Featured card with more info
  if (size === 'medium') {
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
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
              isComplete
                ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700"
                : "bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700"
            )}>
              {isComplete ? <CheckCircle2 size={24} /> : <FileText size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Ditt CV</h3>
              <p className="text-sm text-slate-500">
                {isComplete ? 'Redo att skicka' : hasCV ? 'Fortsätt där du slutade' : 'Kom igång nu'}
              </p>
            </div>
          </div>
          <ChevronRight
            size={20}
            className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all mt-1"
          />
        </div>

        {/* Progress visualization */}
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

        {/* Status badge */}
        <div className="flex items-center justify-between">
          {!hasCV ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <FileText size={14} />
              Skapa ditt första CV
            </span>
          ) : isComplete ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 size={14} />
              Komplett
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-200">
              <FileText size={14} />
              Fortsätt redigera
            </span>
          )}

          <span className="text-xs text-slate-400">
            Klicka för att {hasCV ? 'redigera' : 'börja'}
          </span>
        </div>
      </Link>
    )
  }

  // LARGE SIZE
  return (
    <Link 
      to="/cv" 
      className={cn(
        "group block bg-white p-5 rounded-xl border-2 transition-all duration-200",
        "hover:border-violet-300 hover:shadow-lg hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
        isComplete ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          isComplete ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
        )}>
          {isComplete ? <CheckCircle2 size={24} /> : <FileText size={24} />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Ditt CV</h3>
          <p className="text-sm text-slate-500">{progress}% komplett</p>
        </div>
        <ChevronRight 
          size={20} 
          className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" 
        />
      </div>
      
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-purple-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {!hasCV && (
        <p className="mt-4 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          Kom igång genom att skapa ditt CV
        </p>
      )}
    </Link>
  )
}

export default CVWidget
