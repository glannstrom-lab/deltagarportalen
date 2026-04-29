import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Widget } from './Widget'
import { useAuth } from '@/hooks/useSupabase'
import { JOBSOK_HUB_KEY } from '@/hooks/useJobsokHubSummary'
import type { JobsokSummary } from './JobsokDataContext'
import type { WidgetProps } from './types'

/**
 * CvStatusSummaryWidget — Översikt cross-hub summary for CV.
 *
 * Reads JOBSOK_HUB_KEY → cv slice. CTA target /cv (canonical CV builder route,
 * verified in navigation.ts memberPaths for `jobb` hub).
 */
export default function CvStatusSummaryWidget({
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
  const cv = data?.cv ?? null

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={FileText} title="CV" />
      <Widget.Body>
        {cv ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              CV uppdaterat
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              {new Date(cv.updated_at).toLocaleDateString('sv-SE')}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Inget CV
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Kom igång med ditt första CV
            </p>
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/cv"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Öppna CV →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
