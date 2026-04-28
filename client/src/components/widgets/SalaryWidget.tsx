// SalaryWidget — Lön & marknad
// Shows median salary KPI + RangeBar with low/median/high span
// No footer per UI-SPEC Copywriting Contract table

import { Banknote } from 'lucide-react'
import { Widget } from './Widget'
import { RangeBar } from './RangeBar'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = {
  median: 52000,
  low: 42000,
  high: 62000,
  roleLabel: 'UX-designer, Stockholm',
}

export default function SalaryWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Banknote} title="Lön & marknad" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {MOCK.median.toLocaleString('sv-SE')}
            </span>
            <span className="text-[12px] text-[var(--stone-700)]">kr/mån</span>
          </div>
          <span className="text-[12px] text-[var(--stone-700)]">{MOCK.roleLabel}</span>
          {!compact && (
            <div className="mt-3">
              <RangeBar
                low={MOCK.low}
                median={MOCK.median}
                high={MOCK.high}
                unit=" kr"
              />
            </div>
          )}
        </div>
      </Widget.Body>
    </Widget>
  )
}
