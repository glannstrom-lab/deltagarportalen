import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useResurserSummary } from './ResurserDataContext'
import type { WidgetProps } from './types'

/**
 * MyDocumentsWidget — Resurser hub.
 * Reads `cv` + `coverLetters` slices from ResurserDataContext.
 * Resurser is the documents-canonical hub view; cache shared with JobsokHub.
 */
export default function MyDocumentsWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const summary = useResurserSummary()
  const cv = summary?.cv ?? null
  const coverLetters = summary?.coverLetters ?? []
  const isEmpty = !cv && coverLetters.length === 0

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={FileText} title="Mina dokument" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Inga dokument ännu
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Skapa ditt CV och dina personliga brev
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            {/* Milestone-style label, NEVER a percentage. */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {cv ? 'CV' : 'Inget CV'} + {coverLetters.length} brev klara
            </p>
            {(size === 'M' || size === 'L') && cv?.updated_at && (
              <p className="text-[12px] text-[var(--stone-600)] m-0">
                Senast uppdaterad: {new Date(cv.updated_at).toLocaleDateString('sv-SE')}
              </p>
            )}
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/soka-jobb"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Gå till Söka jobb' : 'Hantera dokument'}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
