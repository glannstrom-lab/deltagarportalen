import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useResurserSummary } from './ResurserDataContext'
import type { WidgetProps } from './types'

function truncate(s: string, n = 40): string {
  if (s.length <= n) return s
  return s.slice(0, n) + '…'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

/**
 * KnowledgeBaseWidget — Resurser hub.
 * Reads `recentArticles` + `articleCompletedCount` slices from ResurserDataContext.
 * Footer comment: v1.1 should fetch article titles by ID — currently shows raw article_id (slug/UUID).
 */
export default function KnowledgeBaseWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const summary = useResurserSummary()
  const recentArticles = summary?.recentArticles ?? []
  const completedCount = summary?.articleCompletedCount ?? 0
  const isEmpty = recentArticles.length === 0

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={BookOpen} title="Kunskapsbanken" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Utforska kunskapsbanken
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Läs guider och tips för en mer effektiv jobbsökning
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            {/* Qualitative count (no % suffix) — anti-shaming compliant */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {completedCount} {completedCount === 1 ? 'artikel läst' : 'artiklar lästa'}
            </p>
            {recentArticles[0] && (
              <p className="text-[12px] text-[var(--stone-600)] m-0">
                Senast: {truncate(recentArticles[0].article_id)}
                {recentArticles[0].completed_at && ` (${formatDate(recentArticles[0].completed_at)})`}
              </p>
            )}
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/knowledge-base"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Bläddra i kunskapsbanken' : 'Fortsätt läsa'}
          </Link>
        </Widget.Footer>
      )}
      {/* v1.1 TODO: fetch article titles by ID (currently shows raw slug/UUID via article_id). */}
    </Widget>
  )
}
