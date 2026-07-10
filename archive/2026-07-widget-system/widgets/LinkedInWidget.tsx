import { Linkedin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useKarriarWidgetData } from './KarriarDataContext'
import type { WidgetProps } from './types'

function truncateUrl(url: string, maxLen = 40): string {
  if (url.length <= maxLen) return url
  return url.slice(0, maxLen) + '…'
}

export default function LinkedInWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const linkedinUrl = useKarriarWidgetData('linkedinUrl')
  const isEmpty = !linkedinUrl

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Linkedin} title="LinkedIn" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Koppla LinkedIn
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Lägg till din LinkedIn-URL och optimera din profil
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Profil ansluten
            </p>
            <p className="text-[12px] text-[var(--stone-600)] m-0 break-all">
              {truncateUrl(linkedinUrl!)}
            </p>
          </div>
        )}
      </Widget.Body>
      {(size === 'M') && (
        <Widget.Footer>
          {isEmpty ? (
            <Link
              to="/profile"
              className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
            >
              Lägg till LinkedIn
            </Link>
          ) : (
            <Link
              to="/linkedin-optimizer"
              className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
            >
              Optimera din profil
            </Link>
          )}
        </Widget.Footer>
      )}
    </Widget>
  )
}
