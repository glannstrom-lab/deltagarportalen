import { Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import type { WidgetProps } from './types'

/**
 * ExercisesWidget — STATIC content for v1.0 (no slice, no data fetch).
 *
 * RESEARCH.md Pitfall G + 05-DB-DISCOVERY.md decision:
 *   No `exercise_progress` / `user_exercise_progress` table exists.
 *   `exercise_answers` tracks answers to questions, not completion.
 *   v1.0 ships static — links to /exercises. v1.1 may switch to data-backed
 *   if/when a progress-tracking table is added.
 *
 * allowedSizes: ['S', 'M']
 */
export default function ExercisesWidget({
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
      <Widget.Header icon={Dumbbell} title="Övningar" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
            Träna och öva
          </p>
          <p className="text-[12px] text-[var(--stone-700)] m-0">
            Öva på intervjufärdigheter, presentationsteknik och mer
          </p>
        </div>
      </Widget.Body>
      {size === 'M' && (
        <Widget.Footer>
          <Link
            to="/exercises"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Se alla övningar
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
