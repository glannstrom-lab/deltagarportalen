import { Bot } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useResurserSummary } from './ResurserDataContext'
import type { WidgetProps } from './types'

/** Map agent_id (English DB key) → Swedish display name for users. */
const AGENT_NAMES: Record<string, string> = {
  'career-coach':       'Karriärcoach',
  'study-advisor':      'Studievägledare',
  'motivation-coach':   'Motivationscoach',
  'cv-coach':           'CV-coach',
  'interview-coach':    'Intervjucoach',
  'cover-letter-coach': 'Personligt brev-coach',
}

function agentName(id: string): string {
  return AGENT_NAMES[id] ?? id
}

/**
 * AITeamWidget — Resurser hub.
 * Reads `aiTeamSessions` + `aiTeamSessionCount` slices from ResurserDataContext.
 * Default size L per registry — focal Resurser widget.
 */
export default function AITeamWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const summary = useResurserSummary()
  const sessions = summary?.aiTeamSessions ?? []
  const count = summary?.aiTeamSessionCount ?? 0
  const isEmpty = count === 0

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Bot} title="AI-team" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Ditt AI-team väntar
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Chatta med din karriärcoach, studievägledare eller motivationscoach
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            {/* Qualitative — agent display name, never a number */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              Senast: {agentName(sessions[0].agent_id)}
            </p>
            <p className="text-[12px] text-[var(--stone-600)] m-0">
              {count} {count === 1 ? 'pågående samtal' : 'pågående samtal'}
            </p>
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/ai-team"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Möt ditt AI-team' : 'Fortsätt samtal'}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
