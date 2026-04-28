import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import { useJobsokSummary } from './JobsokDataContext'
import type { WidgetProps } from './types'

export default function JobSearchWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact } = useWidgetSize(size)
  const summary = useJobsokSummary()

  // Loading: context not yet resolved
  if (summary === undefined) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
        <Widget.Header icon={Search} title="Sök jobb" />
      </Widget>
    )
  }

  // Phase 3: "saved" jobs count as "new today" KPI; no live match computation yet
  const newToday = summary.applicationStats.byStatus['saved'] ?? 0

  // Empty state: no saved searches / applications
  if (newToday === 0) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
        <Widget.Header icon={Search} title="Sök jobb" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">Inga sparade sökningar</p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">Spara en sökning så visar vi nya träffar automatiskt</p>
          </div>
        </Widget.Body>
        <Widget.Footer>
          <Link
            to="/job-search"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Gå till jobbsökning
          </Link>
        </Widget.Footer>
      </Widget>
    )
  }

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Search} title="Sök jobb" />
      <Widget.Body>
        <div className="flex-1 flex flex-col">
          <span className="text-[32px] font-bold leading-[1.1] text-[var(--stone-900)]">
            {newToday}
          </span>
          <span className="text-[12px] text-[var(--stone-700)]">sparade sökningar</span>
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/job-search"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Visa alla {newToday} träffar
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
