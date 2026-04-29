import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import type { WidgetProps } from './types'

/**
 * EducationWidget — static-content widget (no slice, no data fetch).
 * RESEARCH.md confirmed: always renders action-oriented CTA.
 * allowedSizes: ['S', 'M']
 */
export default function EducationWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={GraduationCap} title="Utbildning" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
            Hitta din nästa utbildning
          </p>
          <p className="text-[12px] text-[var(--stone-700)] m-0">
            Sök bland tusentals kurser och utbildningar anpassade för dig
          </p>
        </div>
      </Widget.Body>
      {(size === 'M') && (
        <Widget.Footer>
          <Link
            to="/education"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Utforska utbildningar
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
