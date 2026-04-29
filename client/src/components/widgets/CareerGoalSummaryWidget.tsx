import { Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Widget } from './Widget'
import { useAuth } from '@/hooks/useSupabase'
import { KARRIAR_HUB_KEY } from '@/hooks/useKarriarHubSummary'
import { careerGoalLabel } from '@/utils/careerGoalLabel'
import type { KarriarSummary } from './KarriarDataContext'
import type { WidgetProps } from './types'

/**
 * CareerGoalSummaryWidget — Översikt cross-hub summary for Karriärmål.
 *
 * Reads KARRIAR_HUB_KEY → careerGoals.shortTerm. Truncates to 50 chars to fit
 * the M-size body. Pitfall D pattern: getQueryData only.
 */
const TRUNC_LIMIT = 50

export default function CareerGoalSummaryWidget({
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
  const data = queryClient.getQueryData(KARRIAR_HUB_KEY(userId)) as KarriarSummary | undefined
  const shortTermRaw = data?.careerGoals?.shortTerm ?? null
  const shortTerm = careerGoalLabel(shortTermRaw)
  const truncated =
    shortTerm && shortTerm.length > TRUNC_LIMIT
      ? shortTerm.slice(0, TRUNC_LIMIT) + '…'
      : shortTerm

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Target} title="Karriärmål" />
      <Widget.Body>
        {truncated ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1 line-clamp-2">
              {truncated}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Inget mål satt
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Sätt ditt nästa karriärmål när du är redo
            </p>
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/career"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Öppna Karriärmål →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
