import { Printer } from 'lucide-react'
import { Widget } from './Widget'
import type { WidgetProps } from './types'

/**
 * PrintResourcesWidget — STATIC content (no slice, no data fetch).
 * Renders 3-item printable templates list.
 * v1.1 TODO: actual PDF files at /templates/* must be added — links currently 404 gracefully.
 * allowedSizes: ['S', 'M']
 */
const PRINT_TEMPLATES = [
  { label: 'CV-mall (utskrift)',     file: '/templates/cv-template.pdf' },
  { label: 'Personligt brev-mall',   file: '/templates/cover-letter-template.pdf' },
  { label: 'Intervjuförberedelse',   file: '/templates/interview-prep.pdf' },
] as const

export default function PrintResourcesWidget({
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
      <Widget.Header icon={Printer} title="Utskriftsmaterial" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-2">
            3 mallar att skriva ut
          </p>
          <ul className="list-none m-0 p-0 flex flex-col gap-1">
            {PRINT_TEMPLATES.map(item => (
              <li key={item.file}>
                <a
                  href={item.file}
                  download
                  className="inline-flex items-center gap-1 text-[12px] text-[var(--c-text)] hover:underline"
                >
                  <Printer size={10} aria-hidden="true" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Widget.Body>
    </Widget>
  )
}
