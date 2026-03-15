import { Link } from 'react-router-dom'
import { MessageSquare, Mic, ChevronRight, Trophy, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InterviewWidgetProps {
  completedSessions?: number
  averageScore?: number
  lastPractice?: string | null
  size?: 'small' | 'medium'
}

export function InterviewWidget({
  completedSessions = 0,
  averageScore = 0,
  lastPractice = null,
  size = 'small'
}: InterviewWidgetProps) {
  const hasStarted = completedSessions > 0

  if (size === 'small') {
    return (
      <Link
        to="/interview-simulator"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
          "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Intervjuträning</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          {hasStarted ? (
            <>
              <span className="text-2xl font-bold text-slate-800">{completedSessions}</span>
              <span className="text-sm text-slate-500">övningar</span>
              {averageScore > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  <Star size={10} className="fill-current" />
                  {averageScore}%
                </span>
              )}
            </>
          ) : (
            <>
              <Mic size={16} className="text-indigo-500" />
              <span className="text-sm text-slate-600">Öva på intervjufrågor</span>
            </>
          )}
        </div>
      </Link>
    )
  }

  // Medium size
  return (
    <Link
      to="/interview-simulator"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-indigo-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center shadow-sm">
            <MessageSquare size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Intervjuträning</h3>
            <p className="text-xs text-slate-500">
              {hasStarted ? `${completedSessions} övningar genomförda` : 'Öva på intervjufrågor'}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Info card */}
      {!hasStarted ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 mb-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Mic size={24} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800">Börja träna</p>
            <p className="text-xs text-indigo-600">AI-driven intervjusimulator</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 mb-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Trophy size={24} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800">Bra jobbat!</p>
            <p className="text-xs text-indigo-600">Fortsätt träna för att förbättras</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-500" />
            <span className="text-lg font-bold text-slate-800">{completedSessions}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Övningar</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-purple-500 fill-current" />
            <span className="text-lg font-bold text-slate-800">{averageScore || '-'}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Snittbetyg</p>
        </div>
      </div>
    </Link>
  )
}

export default InterviewWidget
