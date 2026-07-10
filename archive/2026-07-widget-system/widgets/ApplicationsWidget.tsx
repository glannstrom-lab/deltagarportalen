// ApplicationsWidget — Mina ansökningar
// Shows total application count + 4-segment stacked bar (closed segment de-emphasized)
// + amber alert chip for pending action (anti-shaming rule: closed count NOT primary KPI)
// A11Y-04: closed/avslutade segment hidden by default with explicit "Visa avslutade (N)" toggle

import { useState } from 'react'
import { Briefcase, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { StackedBar } from './StackedBar'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import { useJobsokWidgetData } from './JobsokDataContext'
import type { WidgetProps } from './types'

export default function ApplicationsWidget({ id, size, onSizeChange, allowedSizes, editMode, onHide }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)
  const stats = useJobsokWidgetData('applicationStats')
  const [showClosed, setShowClosed] = useState(false)

  // Loading: context not yet resolved
  if (stats === undefined) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode} onHide={onHide}>
        <Widget.Header icon={Briefcase} title="Mina ansökningar" />
      </Widget>
    )
  }

  // Empty state: no applications yet
  if (stats.total === 0) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode} onHide={onHide}>
        <Widget.Header icon={Briefcase} title="Mina ansökningar" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">Inga ansökningar ännu</p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">Lägg till din första ansökan för att hålla koll på din pipeline</p>
          </div>
        </Widget.Body>
        <Widget.Footer>
          <Link
            to="/applications"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Lägg till ansökan
          </Link>
        </Widget.Footer>
      </Widget>
    )
  }

  // Map context segments (no color) to StackedBar segments (with color)
  // Colors match the Phase 2 MOCK pattern
  const SEGMENT_COLORS: Record<string, string> = {
    aktiva: 'var(--c-solid)',
    'svar inväntas': 'var(--c-accent)',
    intervju: '#059669',
    avslutade: '#C9C6BD',
  }
  const coloredSegments = stats.segments.map(s => ({
    ...s,
    color: SEGMENT_COLORS[s.label] ?? 'var(--stone-300)',
  }))

  // A11Y-04: hide closed segment by default
  const visibleSegments = showClosed
    ? coloredSegments
    : coloredSegments.filter(s => !s.deEmphasized)

  const closedCount = stats.segments
    .filter(s => s.deEmphasized)
    .reduce((sum, s) => sum + s.count, 0)

  const pendingCount = stats.byStatus['pending_response'] ?? 0
  const pendingAlert = pendingCount > 0 ? `${pendingCount} ansökan väntar på ditt svar` : null

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode} onHide={onHide}>
      <Widget.Header icon={Briefcase} title="Mina ansökningar" />
      <Widget.Body>
        <div className="flex-1 flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {stats.total}
            </span>
            <span className="text-[12px] text-[var(--stone-700)]">totalt</span>
          </div>

          {!compact && (
            <div className="mt-3">
              <StackedBar segments={visibleSegments} showLegend={!minimal} />
            </div>
          )}

          {/* A11Y-04: show toggle to reveal closed segment */}
          {!compact && !showClosed && closedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowClosed(true)}
              className="mt-2 self-start text-[12px] text-[var(--c-text)] underline-offset-2 hover:underline"
            >
              Visa avslutade ({closedCount})
            </button>
          )}

          {!compact && pendingAlert && (
            <div
              className="mt-3 inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[12px] font-bold"
              style={{ background: '#FEF3C7', color: '#92400E' }}
              role="status"
            >
              <AlertTriangle size={12} aria-hidden="true" />
              <span>{pendingAlert}</span>
            </div>
          )}
        </div>
      </Widget.Body>
      {!minimal && (
        <Widget.Footer>
          <Link
            to="/applications"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
          >
            Visa pipeline →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
