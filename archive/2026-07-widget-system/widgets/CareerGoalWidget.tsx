import { Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useKarriarWidgetData } from './KarriarDataContext'
import { careerGoalLabel } from '@/utils/careerGoalLabel'
import type { WidgetProps } from './types'

export default function CareerGoalWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const data = useKarriarWidgetData('careerGoals')
  const isEmpty = !data || (!data.shortTerm && !data.longTerm)

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Target} title="Karriärmål" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Inga aktiva mål
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Sätt ditt nästa karriärmål och börja planera
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1 line-clamp-2">
              {careerGoalLabel(data!.shortTerm) ?? careerGoalLabel(data!.longTerm)}
            </p>
            {data!.preferredRoles?.[0] && (
              <p className="text-[12px] text-[var(--stone-700)] m-0">
                {data!.preferredRoles[0]}
              </p>
            )}
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/career"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Skapa mitt karriärmål' : 'Öppna karriärplan'}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
