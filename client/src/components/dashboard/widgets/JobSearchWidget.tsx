import { memo } from 'react'
import { Briefcase, Bookmark } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface JobSearchWidgetProps {
  savedCount: number
  newMatches?: number
  recentJobs?: { id: string; title: string; company: string }[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const JobSearchWidget = memo(function JobSearchWidget({
  savedCount,
  newMatches = 0,
  recentJobs = [],
  loading,
  error,
  onRetry,
}: JobSearchWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (savedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Lediga jobb"
      icon={<Briefcase size={20} />}
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
          label: 'Nya matchningar', 
          value: newMatches,
          trend: 'up' as const
        }] : []),
      ]}
      primaryAction={{
        label: savedCount > 0 ? 'Se sparade jobb' : 'Utforska jobb',
      }}
    >
      {/* Visa senaste sparade jobb om det finns */}
      {recentJobs.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">Senaste sparade:</p>
          <div className="space-y-2">
            {recentJobs.slice(0, 2).map((job) => (
              <div 
                key={job.id}
                className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg"
              >
                <Bookmark size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{job.title}</p>
                  <p className="text-xs text-slate-500 truncate">{job.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tom state med tips */}
      {savedCount === 0 && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Tips: Spara jobb du är intresserad av så du kan återkomma till dem senare.
          </p>
        </div>
      )}
    </DashboardWidget>
  )
})
