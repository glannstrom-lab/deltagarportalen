/**
 * MatchCard - Jobbkort i matchningsfliken med ordbadge (Stark/Bra/Möjlig),
 * spara-toggle och expanderbara matchningsdetaljer.
 * Utbruten ur components/jobs/MatchesTab.tsx (2026-07-03).
 */

import { useState, memo } from 'react'
import {
  Target, CheckCircle, FileText, Briefcase, MapPin,
  Heart, ExternalLink, ChevronDown, Compass, Settings2
} from '@/components/ui/icons'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import type { MatchedJob } from '@/services/jobMatching'
import { cn } from '@/lib/utils'

// Memoized to prevent unnecessary re-renders when filtering/sorting doesn't change this card's data
export const MatchCard = memo(function MatchCard({
  matchedJob,
  onSave,
  isSaved,
  labels
}: {
  matchedJob: MatchedJob
  onSave: (job: PlatsbankenJob) => void
  isSaved: boolean
  labels: {
    match: string
    levelStrong: string
    levelGood: string
    levelPossible: string
    cv: string
    interest: string
    career: string
    unknownCompany: string
    showMatchDetails: string
    matchesOn: string
    apply: string
  }
}) {
  const { job, score, source, matchDetails } = matchedJob
  const [showDetails, setShowDetails] = useState(false)

  const scoreColor = score >= 70
    ? 'text-green-600 bg-green-100 border-green-200'
    : score >= 50
      ? 'text-amber-600 bg-amber-100 border-amber-200'
      : 'text-stone-600 bg-stone-100 border-stone-200'

  const sourceConfig = {
    cv: { color: 'bg-[var(--c-accent)]/40 text-[var(--c-text)]', label: labels.cv, icon: FileText },
    interest: { color: 'bg-amber-100 text-amber-700', label: labels.interest, icon: Compass },
    career: { color: 'bg-[var(--c-accent)]/40 text-[var(--c-text)]', label: labels.career, icon: Target }
  }

  const config = sourceConfig[source]

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 p-5">
        {/* Ord i stället för procent — poängen är delvis konstruerad (golv,
            boosts) så "68%" ger falsk precision; "Stark/Bra/Möjlig" säger det
            som faktiskt går att lova utan att skrämma med låga siffror. */}
        <div className={cn(
          "w-16 h-14 px-1 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border text-center",
          scoreColor
        )}>
          <span className="text-xs font-bold leading-tight">
            {score >= 70 ? labels.levelStrong : score >= 50 ? labels.levelGood : labels.levelPossible}
          </span>
          <span className="text-[10px] font-medium">{labels.match}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 mb-1">
            {job.headline}
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            {job.employer?.name || labels.unknownCompany}
          </p>
          {job.workplace_address?.municipality && (
            <p className="text-sm text-stone-700 dark:text-stone-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {job.workplace_address.municipality}
            </p>
          )}
        </div>

        {/* Toggle — inte disabled: sparade jobb ska gå att av-spara här,
            precis som i Sök-flikens kort. */}
        <button
          onClick={() => onSave(job)}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Ta bort från sparade jobb' : 'Spara jobb'}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isSaved
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-red-500"
          )}
        >
          <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
        </button>
      </div>

      {matchDetails.length > 0 && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <Settings2 className="w-3 h-3" />
            {labels.showMatchDetails}
            <ChevronDown className={cn("w-3 h-3 transition-transform", showDetails && "rotate-180")} />
          </button>
        </div>
      )}

      {showDetails && matchDetails.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            {labels.matchesOn}
          </p>
          <div className="flex flex-wrap gap-1">
            {matchDetails.slice(0, 6).map((detail, i) => (
              <span key={i} className={cn("px-2 py-0.5 text-xs rounded", config.color)}>
                {detail}
              </span>
            ))}
            {matchDetails.length > 6 && (
              <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs rounded">
                +{matchDetails.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
        <span className="text-xs text-stone-700 dark:text-stone-300">
          {new Date(job.publication_date).toLocaleDateString('sv-SE')}
        </span>
        {job.webpage_url && (
          <a
            href={job.webpage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {labels.apply}
          </a>
        )}
      </div>
    </div>
  )
})
