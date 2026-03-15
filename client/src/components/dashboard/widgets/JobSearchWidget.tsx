import { Link } from 'react-router-dom'
import { Briefcase, Search, ChevronRight, Bookmark, MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobSearchWidgetProps {
  savedCount?: number
  newMatches?: number
  recentJobs?: { id: string; title: string; company: string; location?: string }[]
  size?: 'small' | 'medium'
}

export function JobSearchWidget({
  savedCount = 0,
  newMatches = 0,
  recentJobs = [],
  size = 'small'
}: JobSearchWidgetProps) {
  const hasJobs = savedCount > 0

  if (size === 'small') {
    return (
      <Link
        to="/job-search"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              {hasJobs ? <Bookmark size={18} /> : <Search size={18} />}
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Jobbsök</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-slate-800">{savedCount}</span>
          <span className="text-sm text-slate-500">{savedCount === 1 ? 'sparat jobb' : 'sparade jobb'}</span>
        </div>

        {newMatches > 0 && (
          <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            {newMatches} nya matchningar
          </span>
        )}

        {!hasJobs && (
          <p className="text-xs text-blue-600 mt-1">Hitta ditt nästa jobb</p>
        )}
      </Link>
    )
  }

  // Medium size
  return (
    <Link
      to="/job-search"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-blue-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 flex items-center justify-center shadow-sm">
            <Briefcase size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Jobbsökning</h3>
            <p className="text-xs text-slate-500">
              {hasJobs ? `${savedCount} sparade jobb` : 'Börja söka jobb'}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-blue-500" />
            <span className="text-lg font-bold text-slate-800">{savedCount}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Sparade</p>
        </div>
        <div className="p-3 bg-cyan-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-cyan-500" />
            <span className="text-lg font-bold text-slate-800">{newMatches}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Nya matcher</p>
        </div>
      </div>

      {/* Recent jobs */}
      {recentJobs.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Senast sparade</p>
          {recentJobs.slice(0, 2).map(job => (
            <div key={job.id} className="p-2 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 truncate">{job.title}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{job.company}</span>
                {job.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin size={10} />
                      {job.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm font-medium text-blue-800">Börja söka jobb</p>
          <p className="text-xs text-blue-600 mt-0.5">Vi hjälper dig hitta rätt tjänst</p>
        </div>
      )}
    </Link>
  )
}

export default JobSearchWidget
