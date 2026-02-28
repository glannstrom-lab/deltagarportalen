import { memo } from 'react'
import { Briefcase, Bookmark, MapPin, Building2, ExternalLink, Bell } from 'lucide-react'
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

export const JobSearchWidget = memo(function JobSearchWidget({
  savedCount,
  newMatches = 0,
  recentJobs = [],
  loading,
  error,
  onRetry,
  size,
}: JobSearchWidgetProps) {
  // TODO: Implement different layouts based on size
  const _widgetSize = size || 'small'
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
      stats={[
        { label: 'Sparade jobb', value: savedCount },
        ...(newMatches > 0 ? [{ 
          label: 'Nya idag', 
          value: `+${newMatches}`,
          trend: 'up' as const
        }] : []),
      ]}
      primaryAction={{
        label: savedCount > 0 ? 'Se sparade jobb' : 'Hitta jobb',
      }}
    >
      <div className="mt-3 space-y-3">
        {/* Stort nummer med notis */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Bookmark size={28} className="text-blue-600" />
            </div>
            {newMatches > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <Bell size={10} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800">{savedCount}</p>
            <p className="text-sm text-slate-500">
              {savedCount === 0 ? 'Inga sparade jobb' : savedCount === 1 ? 'sparat jobb' : 'sparade jobb'}
            </p>
          </div>
        </div>
        
        {/* Nya matchningar */}
        {newMatches > 0 && (
          <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <ExternalLink size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                {newMatches} nya jobb matchar din profil
              </p>
              <p className="text-xs text-blue-600">
                Ta en titt när du har tid
              </p>
            </div>
          </div>
        )}
        
        {/* Visa senaste sparade jobb */}
        {recentJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Senaste sparade:</p>
            <div className="space-y-2">
              {recentJobs.slice(0, 2).map((job) => (
                <div 
                  key={job.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Building2 size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="truncate">{job.company}</span>
                      {job.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
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
          </div>
        )}
        
        {/* Tom state */}
        {savedCount === 0 && (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <Briefcase size={20} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Hitta ditt nästa jobb</p>
                <p className="text-xs text-blue-700 mt-1">
                  Sök bland tusentals jobb från Arbetsförmedlingen. 
                  Spara de som intresserar dig för att ansöka senare.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
})
