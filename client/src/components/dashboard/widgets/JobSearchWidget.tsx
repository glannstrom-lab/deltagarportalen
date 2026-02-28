import { memo } from 'react'
import { Briefcase, Bookmark, MapPin, Building2, Bell, Search } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface JobSearchWidgetProps {
  savedCount: number
  newMatches?: number
  recentJobs?: { id: string; title: string; company: string; location?: string }[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// SMALL - Fokus på nya matchningar
function JobSearchWidgetSmall({ savedCount, newMatches = 0, loading, error, onRetry }: Omit<JobSearchWidgetProps, 'size' | 'recentJobs'>) {
  const getStatus = (): WidgetStatus => {
    if (savedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Sök jobb"
      icon={<Briefcase size={20} />}
      to="/job-search"
      color="blue"
      status={status}
      progress={savedCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: newMatches > 0 ? `${newMatches} nya` : savedCount > 0 ? 'Se sparade' : 'Hitta jobb',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        {newMatches > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Bell size={20} className="text-blue-500" />
              <span className="text-3xl font-bold text-blue-600">{newMatches}</span>
            </div>
            <p className="text-sm text-slate-500">nya matchningar</p>
          </>
        ) : (
          <>
            <Bookmark size={28} className="text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-slate-800">{savedCount}</p>
            <p className="text-sm text-slate-500">sparade jobb</p>
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Visa sparade jobb + matchningar
function JobSearchWidgetMedium({ savedCount, newMatches = 0, recentJobs = [], loading, error, onRetry }: JobSearchWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (savedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Sök jobb"
      icon={<Briefcase size={22} />}
      to="/job-search"
      color="blue"
      status={status}
      progress={savedCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: newMatches > 0 ? 'Se nya matchningar' : 'Hitta jobb',
      }}
    >
      <div className="space-y-3">
        {/* Stats rad */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bookmark size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{savedCount}</p>
              <p className="text-xs text-slate-500">sparade jobb</p>
            </div>
          </div>
          {newMatches > 0 && (
            <div className="px-3 py-1.5 bg-blue-50 rounded-lg">
              <span className="text-sm font-semibold text-blue-600">+{newMatches} nya</span>
            </div>
          )}
        </div>

        {/* Senaste sparade */}
        {recentJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Senast sparade:</p>
            <div className="space-y-1.5">
              {recentJobs.slice(0, 2).map((job) => (
                <div 
                  key={job.id}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                >
                  <Building2 size={14} className="text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{job.title}</p>
                    <p className="text-xs text-slate-500 truncate">{job.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {savedCount === 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">Hitta ditt nästa jobb</p>
            <p className="text-xs text-blue-600 mt-1">Sök bland tusentals jobb från Arbetsförmedlingen</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full jobbsök-översikt
function JobSearchWidgetLarge({ savedCount, newMatches = 0, recentJobs = [], loading, error, onRetry }: JobSearchWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (savedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Sök jobb"
      icon={<Briefcase size={24} />}
      to="/job-search"
      color="blue"
      status={status}
      progress={savedCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Sök jobb',
      }}
      secondaryAction={savedCount > 0 ? {
        label: 'Se sparade',
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-4">
        {/* Två kolumner: Stats + Nya matchningar */}
        <div className="grid grid-cols-2 gap-4">
          {/* Sparade jobb */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Bookmark size={28} className="text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700">{savedCount}</p>
              <p className="text-sm text-blue-600">sparade jobb</p>
            </div>
          </div>

          {/* Nya matchningar */}
          <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Bell size={28} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-700">{newMatches}</p>
              <p className="text-sm text-emerald-600">nya matchningar</p>
            </div>
          </div>
        </div>

        {/* Lista över sparade jobb */}
        {recentJobs.length > 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-700 mb-3">Dina sparade jobb:</p>
            <div className="grid grid-cols-2 gap-3">
              {recentJobs.slice(0, 4).map((job) => (
                <div 
                  key={job.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{job.title}</p>
                    <p className="text-xs text-slate-500 truncate">{job.company}</p>
                    {job.location && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin size={10} />
                        {job.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Search size={28} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-blue-900 mb-2">Hitta ditt nästa jobb</p>
                <p className="text-sm text-blue-700 mb-4">
                  Sök bland tusentals jobb från Arbetsförmedlingen. 
                  Spara de som intresserar dig och få notifieringar när nya matchningar dyker upp.
                </p>
                <div className="flex items-center gap-4 text-sm text-blue-600">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    Företag
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    Platser
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark size={14} />
                    Sparade
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent
export const JobSearchWidget = memo(function JobSearchWidget(props: JobSearchWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <JobSearchWidgetLarge {...rest} />
    case 'medium':
      return <JobSearchWidgetMedium {...rest} />
    case 'small':
    default:
      return <JobSearchWidgetSmall {...rest} />
  }
})
