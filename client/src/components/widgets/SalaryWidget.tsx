// SalaryWidget — Lön & marknad
// Shows median salary KPI + RangeBar with low/median/high span
// No footer per UI-SPEC Copywriting Contract table
// NOTE: salary_data table does NOT exist in live DB (Plan 01 verified).
// The salary slice will always be undefined/null in Phase 3 — widget renders empty state.
// Wire to real data in Phase 5 when salary_data is provisioned.

import { Banknote } from 'lucide-react'
import { Widget } from './Widget'
import { RangeBar } from './RangeBar'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import { useJobsokWidgetData } from './JobsokDataContext'
import type { WidgetProps } from './types'

export default function SalaryWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact } = useWidgetSize(size)
  // salary slice — loader omits it since salary_data table is absent (Plan 01).
  // undefined = loading, null/absent = no data (empty-state)
  const salary = useJobsokWidgetData('salary')

  // Empty state: no salary data available (covers both loading and absent-table cases)
  if (!salary) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
        <Widget.Header icon={Banknote} title="Lön & marknad" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">Vad är din lön värd?</p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">Ange din roll för att se marknadslönen</p>
          </div>
        </Widget.Body>
        <Widget.Footer>
          {/* TODO: replace '#' with loneforhandling route once confirmed */}
          <a
            href="/loneforhandling"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Beräkna min lön
          </a>
        </Widget.Footer>
      </Widget>
    )
  }

  // Filled state (future Phase 5 — salary_data table provisioned)
  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Banknote} title="Lön & marknad" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {salary.median.toLocaleString('sv-SE')}
            </span>
            <span className="text-[12px] text-[var(--stone-700)]">kr/mån</span>
          </div>
          <span className="text-[12px] text-[var(--stone-700)]">{salary.roleLabel}</span>
          {!compact && (
            <div className="mt-3">
              <RangeBar
                low={salary.low}
                median={salary.median}
                high={salary.high}
                unit=" kr"
              />
            </div>
          )}
        </div>
      </Widget.Body>
    </Widget>
  )
}
