import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useKarriarWidgetData } from './KarriarDataContext'
import type { WidgetProps } from './types'

function brandLabel(score: number): string {
  if (score >= 75) return 'Starkt varumärke'
  if (score >= 50) return 'Bra start'
  return 'Förbättringsområden'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function PersonalBrandWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const audit = useKarriarWidgetData('latestBrandAudit')
  const isEmpty = !audit

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Sparkles} title="Personligt varumärke" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Ditt personliga varumärke
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Gör en audit och se hur starkt ditt varumärke är
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            {/* Qualitative label — NEVER raw score as 32/22px primary KPI */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {brandLabel(audit!.score)}
            </p>
            <p className="text-[12px] text-[var(--stone-600)] m-0">
              Senaste audit: {formatDate(audit!.created_at)}
            </p>
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/personal-brand"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Starta audit' : 'Se varumärkesanalys'}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
