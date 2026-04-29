import { Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Widget } from './Widget'
import { useAuth } from '@/hooks/useSupabase'
import { JOBSOK_HUB_KEY } from '@/hooks/useJobsokHubSummary'
import type { JobsokSummary } from './JobsokDataContext'
import type { WidgetProps } from './types'

/**
 * JobsokSummaryWidget — Översikt cross-hub summary for Söka jobb.
 *
 * Pitfall D pattern: reads from React Query cache via getQueryData — does NOT
 * issue its own supabase select. The Översikt aggregator hook
 * (useOversiktHubSummary) triggers useJobsokHubSummary which populates the
 * JOBSOK_HUB_KEY entry; this widget consumes it.
 */
export default function JobsokSummaryWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()
  const data = queryClient.getQueryData(JOBSOK_HUB_KEY(userId)) as JobsokSummary | undefined
  const totalApps = data?.applicationStats?.total ?? 0
  const isEmpty = totalApps === 0

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Briefcase} title="Söka jobb" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Inga ansökningar än
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Inga ansökningar än — börja söka idag
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {totalApps} aktiva ansökningar
            </p>
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/jobb"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Öppna Söka jobb →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
