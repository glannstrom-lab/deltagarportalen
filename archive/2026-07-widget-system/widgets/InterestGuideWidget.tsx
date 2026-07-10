import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useInterestProfile } from '@/hooks/useInterestProfile'
import type { WidgetProps } from './types'

export default function InterestGuideWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  // Pitfall F: reads useInterestProfile() directly (not from KarriarDataContext slice)
  const { profile, isLoading } = useInterestProfile()

  if (isLoading) {
    return (
      <Widget
        id={id}
        size={size}
        allowedSizes={allowedSizes}
        onSizeChange={onSizeChange}
        editMode={editMode}
        onHide={onHide}
      >
        <Widget.Header icon={Compass} title="Intresseguide" />
      </Widget>
    )
  }

  const isEmpty = !profile.hasResult

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Compass} title="Intresseguide" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Utforska dina intressen
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Ta reda på vilka yrken som matchar dig bäst
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[12px] font-bold text-[var(--c-text)] m-0 mb-1">
              Topp-match
            </p>
            {profile.dominantTypes.slice(0, 2).map(type => (
              <p key={type.code} className="text-[13px] font-bold text-[var(--stone-900)] m-0">
                {type.code.charAt(0).toUpperCase() + type.code.slice(1)}
              </p>
            ))}
            {profile.recommendedOccupations[0] && (
              <p className="text-[12px] text-[var(--stone-700)] m-0 mt-1">
                {profile.recommendedOccupations[0].name}
              </p>
            )}
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/interest-guide"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Starta intresseguide' : 'Utforska vidare'}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
