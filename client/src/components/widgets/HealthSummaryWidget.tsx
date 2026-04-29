import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Widget } from './Widget'
import { useAuth } from '@/hooks/useSupabase'
import { MIN_VARDAG_HUB_KEY } from '@/hooks/useMinVardagHubSummary'
import { streakDays } from '@/utils/streakDays'
import type { MinVardagSummary } from './MinVardagDataContext'
import type { WidgetProps } from './types'

/**
 * HealthSummaryWidget — Översikt cross-hub summary for Hälsa.
 *
 * CRITICAL: streakDays imported from `@/utils/streakDays` — single source of
 * truth established in Plan 04. Do NOT duplicate the streak logic here.
 *
 * Reads MIN_VARDAG_HUB_KEY → recentMoodLogs. Pitfall D pattern: getQueryData only.
 * Anti-shaming: never renders raw mood_level number.
 */
export default function HealthSummaryWidget({
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
  const data = queryClient.getQueryData(MIN_VARDAG_HUB_KEY(userId)) as MinVardagSummary | undefined
  const logs = data?.recentMoodLogs ?? []
  const streak = streakDays(logs)
  const isEmpty = streak === 0

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Heart} title="Hälsa" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Logga ditt mående
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Om du vill — börja med ett klick
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {`Loggat ${streak} ${streak === 1 ? 'dag' : 'dagar'}`}
            </p>
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/wellness"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Öppna Hälsa →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
