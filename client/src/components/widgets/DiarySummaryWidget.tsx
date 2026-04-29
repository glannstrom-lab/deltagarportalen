import { BookText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Widget } from './Widget'
import { useAuth } from '@/hooks/useSupabase'
import { MIN_VARDAG_HUB_KEY } from '@/hooks/useMinVardagHubSummary'
import type { MinVardagSummary } from './MinVardagDataContext'
import type { WidgetProps } from './types'

/**
 * DiarySummaryWidget — Översikt cross-hub summary for Dagbok.
 *
 * Reads MIN_VARDAG_HUB_KEY → diaryEntryCount. Pitfall D pattern: getQueryData only.
 * Empty state framing is invitational, not pressuring.
 */
export default function DiarySummaryWidget({
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
  const count = data?.diaryEntryCount ?? 0
  const isEmpty = count === 0

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={BookText} title="Dagbok" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Skriv idag
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Reflektera fritt om din vecka
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {`${count} inlägg`}
            </p>
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/diary"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Öppna Dagbok →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
