import { ExternalLink } from 'lucide-react'
import { Widget } from './Widget'
import type { WidgetProps } from './types'

/**
 * ExternalResourcesWidget — STATIC content (no slice, no data fetch).
 * Always renders a curated 3-link list of external resources.
 * allowedSizes: ['S', 'M']
 */
const EXTERNAL_LINKS = [
  { label: 'Arbetsförmedlingen', url: 'https://arbetsformedlingen.se' },
  { label: 'Jobtech Atlas',      url: 'https://jobtechdev.se' },
  { label: 'Karriärguiden',      url: 'https://karriarguiden.se' },
] as const

export default function ExternalResourcesWidget({
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
      <Widget.Header icon={ExternalLink} title="Externa resurser" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-2">
            3 utvalda externa länkar
          </p>
          <ul className="list-none m-0 p-0 flex flex-col gap-1">
            {EXTERNAL_LINKS.map(item => (
              <li key={item.url}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-[var(--c-text)] hover:underline"
                >
                  <ExternalLink size={10} aria-hidden="true" />
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
