import { memo } from 'react'
import { 
  Briefcase, 
  Bookmark, 
  MapPin, 
  Building2, 
  Bell, 
  Search, 
  Sparkles,
  ArrowRight,
  Plus,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface JobSearchWidgetProps {
  savedCount: number
  newMatches?: number
  recentJobs?: { id: string; title: string; company: string; location?: string; isNew?: boolean }[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// Helper för att förkorta långa texter
function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// Helper för att generera företagsfärg baserat på namn
function getCompanyColor(company: string): string {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-sky-500 to-blue-600',
    'from-indigo-500 to-purple-600',
    'from-cyan-500 to-blue-500',
    'from-blue-600 to-sky-500',
  ]
  const index = company.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

// Helper för att generera företagsinitialer
function getCompanyInitials(company: string): string {
  return company
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// SMALL - Kompakt vy med fokus på antal sparade jobb
function JobSearchWidgetSmall({ savedCount, newMatches = 0, recentJobs = [], loading, error, onRetry }: JobSearchWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (savedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const latestJob = recentJobs[0]

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
        label: savedCount > 0 ? 'Se alla' : 'Hitta jobb',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        {savedCount > 0 ? (
          <>
            {/* Modern stat display med gradient bakgrund */}
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Bookmark size={28} className="text-white" fill="white" />
              </div>
              {newMatches > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-[10px] font-bold text-white">{newMatches}</span>
                </div>
              )}
            </div>
            
            {/* Tydlig siffra */}
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {savedCount}
              </p>
              <span className="text-sm text-slate-500 font-medium">
                {savedCount === 1 ? 'jobb' : 'jobb'}
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mt-1">
              {savedCount === 1 ? 'sparat' : 'sparade'}
            </p>
            
            {latestJob && (
              <p className="text-xs text-slate-500 mt-2 truncate max-w-[160px] font-medium" title={latestJob.title}>
                {truncate(latestJob.title, 22)}
              </p>
            )}
          </>
        ) : (
          <>
            {/* Empty state med gradient */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-3">
              <Search size={28} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">Inga sparade jobb</p>
            <p className="text-xs text-slate-400 mt-1">Klicka för att söka</p>
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Visa sparade jobb med detaljer
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
        label: savedCount > 0 ? 'Se alla jobb' : 'Sök jobb',
      }}
    >
      <div className="space-y-3">
        {/* Stats rad med modern design */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Bookmark size={22} className="text-white" fill="white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-bold text-slate-800">{savedCount}</p>
                {newMatches > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    +{newMatches}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">sparade jobb</p>
            </div>
          </div>
          
          {/* Snyggare "nya matchningar" badge */}
          {newMatches > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-700">{newMatches}</p>
                <p className="text-[10px] text-emerald-600 font-medium">nya</p>
              </div>
            </div>
          )}
        </div>

        {/* Senaste sparade med företagsikoner */}
        {recentJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Senast sparade</p>
            <div className="space-y-2">
              {recentJobs.slice(0, 2).map((job, index) => (
                <div 
                  key={job.id}
                  className="group flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Företagsikon med gradient */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCompanyColor(job.company)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-xs font-bold text-white">{getCompanyInitials(job.company)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700 truncate" title={job.title}>
                        {truncate(job.title, 28)}
                      </p>
                      {job.isNew && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1" title={job.company}>
                      <Building2 size={10} className="text-slate-400" />
                      {job.company}
                      {job.location && (
                        <>
                          <span className="text-slate-300 mx-0.5">•</span>
                          <MapPin size={10} className="text-slate-400" />
                          <span className="text-slate-400">{job.location}</span>
                        </>
                      )}
                    </p>
                  </div>
                  
                  {/* Hover arrow */}
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state med CTA */}
        {savedCount === 0 && (
          <div className="p-4 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Target size={20} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Hitta ditt nästa jobb</p>
                <p className="text-xs text-blue-600 mt-0.5 mb-2">Sök bland tusentals jobb från Arbetsförmedlingen</p>
                <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors">
                  Börja sök
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
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
  const hasNewJobs = recentJobs.some(job => job.isNew)

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
        {/* Stats grid med modern design */}
        <div className="grid grid-cols-3 gap-3">
          {/* Sparade jobb */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Bookmark size={22} className="text-blue-600" fill="#3b82f6" fillOpacity={0.2} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-2xl font-bold text-blue-700">{savedCount}</p>
                {savedCount > 0 && (
                  <TrendingUp size={14} className="text-blue-400" />
                )}
              </div>
              <p className="text-xs text-blue-600 font-medium">sparade jobb</p>
            </div>
          </div>

          {/* Nya matchningar */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{newMatches}</p>
              <p className="text-xs text-emerald-600 font-medium">nya matchningar</p>
            </div>
          </div>

          {/* Senaste aktivitet */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl border border-sky-100">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Clock size={22} className="text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-sky-700">
                {recentJobs.length > 0 ? 'Idag' : '-'}
              </p>
              <p className="text-xs text-sky-600 font-medium">senaste aktivitet</p>
            </div>
          </div>
        </div>

        {/* Lista över sparade jobb med sections */}
        {recentJobs.length > 0 ? (
          <div className="space-y-3">
            {/* Section header med filter-indikation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-700">
                  Dina sparade jobb
                </p>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                  {savedCount}
                </span>
              </div>
              
              {/* Filter badges */}
              <div className="flex items-center gap-2">
                {hasNewJobs && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-sky-50 text-sky-600 text-xs font-medium rounded-lg border border-sky-100">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></span>
                    Nya
                  </span>
                )}
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg border border-blue-100">
                  Alla
                </span>
              </div>
            </div>

            {/* Grid med snyggare jobbkort */}
            <div className="grid grid-cols-2 gap-3">
              {recentJobs.slice(0, 4).map((job, index) => (
                <div 
                  key={job.id}
                  className="group relative flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {/* Ny-indikator stripe */}
                  {job.isNew && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400 to-blue-500"></div>
                  )}
                  
                  {/* Företagsikon med gradient */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getCompanyColor(job.company)} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <span className="text-sm font-bold text-white">{getCompanyInitials(job.company)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate" title={job.title}>
                        {truncate(job.title, 32)}
                      </p>
                      {job.isNew && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full border border-sky-100">
                          NY
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500 truncate mt-0.5" title={job.company}>
                      {job.company}
                    </p>
                    
                    {job.location && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <MapPin size={11} className="text-slate-400" />
                        <p className="text-xs text-slate-400 truncate" title={job.location}>
                          {truncate(job.location, 25)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Hover overlay med action */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              ))}
            </div>
            
            {/* Show more hint */}
            {savedCount > 4 && (
              <div className="flex items-center justify-center pt-1">
                <span className="text-xs text-slate-400">
                  +{savedCount - 4} fler jobb
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Empty state med CTA */
          <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Search size={32} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Hitta ditt nästa jobb</h3>
                <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                  Sök bland tusentals jobb från Arbetsförmedlingen. 
                  Spara de som intresserar dig och få notifieringar när nya matchningar dyker upp.
                </p>
                
                {/* Feature highlights */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 rounded-lg text-xs font-medium text-blue-700">
                    <Building2 size={14} className="text-blue-500" />
                    Företag
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 rounded-lg text-xs font-medium text-blue-700">
                    <MapPin size={14} className="text-blue-500" />
                    Platser
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 rounded-lg text-xs font-medium text-blue-700">
                    <Bell size={14} className="text-blue-500" />
                    Notifieringar
                  </span>
                </div>

                {/* CTA Button */}
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200">
                  <Plus size={16} />
                  Börja söka jobb
                </button>
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
