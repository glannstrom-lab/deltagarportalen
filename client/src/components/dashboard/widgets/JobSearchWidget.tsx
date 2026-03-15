import { Link } from 'react-router-dom'
import { Briefcase, Search, ChevronRight, Bookmark, MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobSearchWidgetProps {
  savedCount?: number
  newMatches?: number
  recentJobs?: { id: string; title: string; company: string; location?: string }[]
  size?: 'mini' | 'medium' | 'large'
}

export function JobSearchWidget({
  savedCount = 0,
  newMatches = 0,
  recentJobs = [],
  size = 'medium'
}: JobSearchWidgetProps) {
  const hasJobs = savedCount > 0

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/job-search"
        className="group flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
          {hasJobs ? <Bookmark size={16} /> : <Search size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Jobb</p>
          <p className="text-xs text-slate-500">{savedCount} sparade</p>
        </div>
        {newMatches > 0 && (
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            +{newMatches}
          </span>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/job-search"
        className="group block bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Jobbsökning</h3>
              <p className="text-xs text-slate-500">
                {hasJobs ? `${savedCount} sparade` : 'Hitta ditt jobb'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-800">{savedCount}</span>
          <span className="text-sm text-slate-500">sparade jobb</span>
          {newMatches > 0 && (
            <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {newMatches} nya
            </span>
          )}
        </div>
      </Link>
    )
  }

  // LARGE
  const sampleJobs = recentJobs.length > 0 ? recentJobs : [
    { id: '1', title: 'Projektledare', company: 'Tech AB', location: 'Stockholm' },
    { id: '2', title: 'Utvecklare', company: 'Startup Co', location: 'Remote' },
  ]

  return (
    <Link
      to="/job-search"
      className="group block bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 flex items-center justify-center">
            <Briefcase size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Jobbsökning</h3>
            <p className="text-sm text-slate-500">
              {hasJobs ? `${savedCount} sparade jobb` : 'Börja söka jobb'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 mt-1 transition-colors" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-blue-500" />
            <span className="text-lg font-bold text-slate-800">{savedCount}</span>
          </div>
          <p className="text-xs text-slate-500">Sparade</p>
        </div>
        <div className="p-3 bg-cyan-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-cyan-500" />
            <span className="text-lg font-bold text-slate-800">{newMatches}</span>
          </div>
          <p className="text-xs text-slate-500">Nya matcher</p>
        </div>
      </div>

      {/* Recent Jobs */}
      {hasJobs && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-slate-500">Senast sparade</p>
          {sampleJobs.slice(0, 2).map(job => (
            <div key={job.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100">
                <Briefcase size={14} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{job.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
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
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium group-hover:bg-blue-200 transition-colors">
          <Search size={12} />
          Sök jobb
        </span>
        {hasJobs && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
            <ExternalLink size={12} />
            Visa sparade
          </span>
        )}
      </div>
    </Link>
  )
}

export default JobSearchWidget
