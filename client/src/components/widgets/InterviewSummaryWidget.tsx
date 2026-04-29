import { MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Widget } from './Widget'
import { useAuth } from '@/hooks/useSupabase'
import { JOBSOK_HUB_KEY } from '@/hooks/useJobsokHubSummary'
import type { JobsokSummary } from './JobsokDataContext'
import type { WidgetProps } from './types'

/**
 * InterviewSummaryWidget — Översikt cross-hub summary for Intervju.
 *
 * Reads JOBSOK_HUB_KEY → interviewSessions slice. Renders QUALITATIVE label
 * derived from latest score — NEVER the raw number (anti-shaming contract).
 */
function qualitativeLabel(score: number | null | undefined): string {
  if (score == null) return 'Tid för övning'
  if (score >= 80) return 'Stark prestation'
  if (score >= 60) return 'Bra framsteg'
  if (score >= 40) return 'Bygger upp'
  return 'Tid för övning'
}

export default function InterviewSummaryWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()
  const data = queryClient.getQueryData(JOBSOK_HUB_KEY(userId)) as JobsokSummary | undefined
  const sessions = data?.interviewSessions ?? []
  const isEmpty = sessions.length === 0
  const latestScore = sessions[0]?.score ?? null

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={MessageSquare} title="Intervju" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Tid för övning
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Träna på vanliga frågor när du är redo
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            {/* Qualitative label — NEVER raw score (anti-shaming) */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {qualitativeLabel(latestScore)}
            </p>
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/interview-simulator"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Öppna Intervju →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
