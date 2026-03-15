import { Link } from 'react-router-dom'
import { MessageSquare, Mic, ChevronRight, Trophy, Star, Play, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InterviewWidgetProps {
  completedSessions?: number
  averageScore?: number
  lastPractice?: string | null
  totalQuestions?: number
  size?: 'mini' | 'medium' | 'large'
}

export function InterviewWidget({
  completedSessions = 0,
  averageScore = 0,
  lastPractice = null,
  totalQuestions = 50,
  size = 'medium'
}: InterviewWidgetProps) {
  const hasStarted = completedSessions > 0

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/interview-simulator"
        className="group flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Intervju</p>
          <p className="text-xs text-slate-500">
            {hasStarted ? `${completedSessions} övningar` : 'Öva nu'}
          </p>
        </div>
        {averageScore > 0 && (
          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
            {averageScore}%
          </span>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/interview-simulator"
        className="group block bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Intervjuträning</h3>
              <p className="text-xs text-slate-500">
                {hasStarted ? `${completedSessions} genomförda` : 'AI-simulator'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          {hasStarted ? (
            <>
              <span className="text-2xl font-bold text-indigo-600">{averageScore}%</span>
              <span className="text-sm text-slate-500">snittbetyg</span>
            </>
          ) : (
            <div className="flex items-center gap-2 text-indigo-600">
              <Mic size={16} />
              <span className="text-sm">Starta träning</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  // LARGE
  return (
    <Link
      to="/interview-simulator"
      className="group block bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Intervjuträning</h3>
            <p className="text-sm text-slate-500">
              {hasStarted ? `${completedSessions} övningar genomförda` : 'Öva på intervjufrågor'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 mt-1 transition-colors" />
      </div>

      {/* Info card */}
      {hasStarted ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Trophy size={24} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800">Bra jobbat!</p>
            <p className="text-xs text-indigo-600">Snittbetyg: {averageScore}%</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Mic size={24} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800">Börja träna</p>
            <p className="text-xs text-indigo-600">AI-driven intervjusimulator</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-indigo-50 rounded-lg">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-500" />
            <span className="text-lg font-bold text-slate-800">{completedSessions}</span>
          </div>
          <p className="text-xs text-slate-500">Övningar</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-purple-500 fill-current" />
            <span className="text-lg font-bold text-slate-800">{averageScore || '-'}%</span>
          </div>
          <p className="text-xs text-slate-500">Snittbetyg</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium group-hover:bg-indigo-200 transition-colors">
          <Play size={12} />
          {hasStarted ? 'Fortsätt träna' : 'Starta träning'}
        </span>
      </div>
    </Link>
  )
}

export default InterviewWidget
