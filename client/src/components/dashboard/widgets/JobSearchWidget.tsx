import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Briefcase, Search, ChevronRight, Bookmark, MapPin, ExternalLink } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface JobSearchWidgetProps {
  savedCount?: number
  newMatches?: number
  recentJobs?: { id: string; title: string; company: string; location?: string }[]
  size?: 'mini' | 'medium' | 'large'
}

export const JobSearchWidget = memo(function JobSearchWidget({
  savedCount = 0,
  newMatches = 0,
  recentJobs = [],
  size = 'medium'
}: JobSearchWidgetProps) {
  const { t } = useTranslation()
  const hasJobs = savedCount > 0

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/job-search"
        className="group flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
          {hasJobs ? <Bookmark size={16} /> : <Search size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('jobSearchWidget.jobs')}</p>
          <p className="text-xs text-slate-700 dark:text-slate-600">{t('jobSearchWidget.savedCount', { count: savedCount })}</p>
        </div>
        {newMatches > 0 && (
          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
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
        className="group block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('jobSearchWidget.jobSearch')}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-600">
                {hasJobs ? t('jobSearchWidget.savedCount', { count: savedCount }) : t('jobSearchWidget.findYourJob')}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{savedCount}</span>
          <span className="text-sm text-slate-700 dark:text-slate-600">{t('jobSearchWidget.savedJobs')}</span>
          {newMatches > 0 && (
            <span className="ml-auto px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
              {t('jobSearchWidget.newCount', { count: newMatches })}
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
      className="group block bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Briefcase size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('jobSearchWidget.jobSearch')}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-600">
              {hasJobs ? t('jobSearchWidget.savedJobsCount', { count: savedCount }) : t('jobSearchWidget.startSearching')}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 mt-1 transition-colors" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-blue-500 dark:text-blue-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{savedCount}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-600">{t('jobSearchWidget.saved')}</p>
        </div>
        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-cyan-500 dark:text-cyan-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{newMatches}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-600">{t('jobSearchWidget.newMatches')}</p>
        </div>
      </div>

      {/* Recent Jobs */}
      {hasJobs && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-600">{t('jobSearchWidget.recentlySaved')}</p>
          {sampleJobs.slice(0, 2).map(job => (
            <div key={job.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-600">
                <Briefcase size={14} className="text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{job.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-600">
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
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
          <Search size={12} />
          {t('jobSearchWidget.searchJobs')}
        </span>
        {hasJobs && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium">
            <ExternalLink size={12} />
            {t('jobSearchWidget.showSaved')}
          </span>
        )}
      </div>
    </Link>
  )
})

export default JobSearchWidget
