import { BookText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useMinVardagSummary } from './MinVardagDataContext'
import type { WidgetProps } from './types'

/**
 * DiaryWidget — Min Vardag hub (Dagbok).
 * Reads `diaryEntryCount` + `latestDiaryEntry` slices from MinVardagDataContext.
 *
 * Empty-state copy is non-pressuring ("Börja din dagbok — skriv fritt").
 * Filled-state primary KPI is the entry count (qualitative — no %).
 *
 * Deep-link route: /diary
 */
export default function DiaryWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const summary = useMinVardagSummary()
  const count = summary?.diaryEntryCount ?? 0
  const latest = summary?.latestDiaryEntry ?? null
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
              Inga anteckningar ännu
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Börja din dagbok — skriv fritt om din jobbsökning
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            {/* Qualitative count (no %) — anti-shaming compliant */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {count} {count === 1 ? 'inlägg' : 'inlägg'}
            </p>
            {latest && (size === 'M' || size === 'L') && (
              <p className="text-[12px] text-[var(--stone-600)] m-0">
                Senast: {new Date(latest.created_at).toLocaleDateString('sv-SE')}
              </p>
            )}
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/diary"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Skriv idag' : 'Öppna dagbok'}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
