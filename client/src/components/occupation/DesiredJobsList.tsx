/**
 * DesiredJobsList — Numrerad prioriteringslista för "Önskade yrken" i profilen.
 *
 * Visar upp till 10 yrken i prio-ordning (1 = högsta). Användaren kan:
 *   - Lägga till via OccupationPicker (AF-taxonomi-autocomplete)
 *   - Flytta upp/ned med pilknappar
 *   - Ta bort
 *   - Skilja på AF-kopplade yrken (matchas exakt) vs fritext (bara display)
 */

import { useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Briefcase,
  CheckCircle2,
  AlertCircle,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { DesiredOccupation } from '@/services/supabaseApi'
import { OccupationPicker, type OccupationSelection } from './OccupationPicker'

export interface DesiredJobsListProps {
  jobs: DesiredOccupation[]
  onChange: (jobs: DesiredOccupation[]) => void
  maxJobs?: number
  className?: string
}

export function DesiredJobsList({
  jobs,
  onChange,
  maxJobs = 10,
  className,
}: DesiredJobsListProps) {
  const [adding, setAdding] = useState(false)

  // Sortera defensivt efter priority
  const ordered = [...jobs].sort((a, b) => a.priority - b.priority)
  const canAdd = ordered.length < maxJobs

  const reassignPriorities = (list: DesiredOccupation[]): DesiredOccupation[] =>
    list.map((j, i) => ({ ...j, priority: i + 1 }))

  const handleAdd = (sel: OccupationSelection) => {
    // Duplikat-skydd
    if (ordered.some((j) => j.conceptId === sel.conceptId)) {
      setAdding(false)
      return
    }
    const next: DesiredOccupation = {
      conceptId: sel.conceptId,
      label: sel.label,
      priority: ordered.length + 1,
    }
    onChange(reassignPriorities([...ordered, next]))
    setAdding(false)
  }

  const handleAddFreeText = (label: string) => {
    if (ordered.some((j) => !j.conceptId && j.label.toLowerCase() === label.toLowerCase())) {
      setAdding(false)
      return
    }
    onChange(reassignPriorities([...ordered, { label, priority: ordered.length + 1 }]))
    setAdding(false)
  }

  const handleRemove = (idx: number) => {
    const next = ordered.filter((_, i) => i !== idx)
    onChange(reassignPriorities(next))
  }

  const handleMove = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= ordered.length) return
    const next = [...ordered]
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    onChange(reassignPriorities(next))
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Lista med numrerade rader */}
      {ordered.length > 0 ? (
        <ol className="space-y-2 mb-3" aria-label="Önskade yrken i prioriteringsordning">
          {ordered.map((job, idx) => (
            <li
              key={`${job.conceptId ?? 'free'}-${job.label}-${idx}`}
              className={cn(
                'group flex items-center gap-2 p-2 rounded-lg border transition-colors',
                'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700',
                'hover:border-stone-300 dark:hover:border-stone-600',
              )}
            >
              {/* Prio-nummer */}
              <span
                className={cn(
                  'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                  idx === 0
                    ? 'bg-[var(--c-solid)] text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
                )}
                aria-label={`Prioritet ${job.priority}`}
              >
                {job.priority}
              </span>

              {/* Yrkesnamn + AF-status */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                  {job.label}
                </span>
                {job.conceptId ? (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400"
                    title="Kopplad till AF-taxonomi — matchas exakt i sökning"
                  >
                    <CheckCircle2 size={11} />
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                    title="Fritext — ej kopplad till AF. Ta bort och välj från listan för exakt matchning."
                  >
                    <AlertCircle size={11} />
                  </span>
                )}
              </div>

              {/* Pil upp */}
              <button
                type="button"
                onClick={() => handleMove(idx, -1)}
                disabled={idx === 0}
                aria-label={`Flytta ${job.label} uppåt`}
                className={cn(
                  'p-1 rounded transition-colors',
                  idx === 0
                    ? 'text-stone-300 cursor-not-allowed'
                    : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700',
                )}
              >
                <ChevronUp size={14} />
              </button>
              {/* Pil ned */}
              <button
                type="button"
                onClick={() => handleMove(idx, 1)}
                disabled={idx === ordered.length - 1}
                aria-label={`Flytta ${job.label} nedåt`}
                className={cn(
                  'p-1 rounded transition-colors',
                  idx === ordered.length - 1
                    ? 'text-stone-300 cursor-not-allowed'
                    : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700',
                )}
              >
                <ChevronDown size={14} />
              </button>
              {/* Ta bort */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label={`Ta bort ${job.label}`}
                className="p-1 rounded text-stone-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mb-3 p-4 rounded-lg border border-dashed border-stone-200 dark:border-stone-700 text-center">
          <Briefcase size={20} className="mx-auto text-stone-400 mb-1" aria-hidden="true" />
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Inga önskade yrken tillagda än.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
            Lägg till upp till {maxJobs} yrken i prioriteringsordning.
          </p>
        </div>
      )}

      {/* Add row */}
      {canAdd && (
        <div>
          {adding ? (
            <div className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900">
              <OccupationPicker
                onSelect={handleAdd}
                onFreeText={handleAddFreeText}
                allowFreeText
                autoFocus
                excludeConceptIds={ordered
                  .map((j) => j.conceptId)
                  .filter((id): id is string => Boolean(id))}
                placeholder={`Sök yrke (#${ordered.length + 1} prio) — t.ex. lager, kock…`}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 px-2 py-1"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium',
                'border border-dashed border-stone-300 dark:border-stone-600',
                'text-stone-600 dark:text-stone-400',
                'hover:border-[var(--c-solid)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)]/40',
                'transition-colors',
              )}
            >
              <Plus size={14} />
              Lägg till yrke ({ordered.length}/{maxJobs})
            </button>
          )}
        </div>
      )}

      {!canAdd && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Du har lagt till maxantalet ({maxJobs}). Ta bort ett yrke för att lägga till ett nytt.
        </p>
      )}

      {/* Footer hint */}
      {ordered.length > 0 && (
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
          Yrken högst upp prioriteras i jobbmatchningen.
          {ordered.some((j) => !j.conceptId) && ' Yrken med ⚠ är fritext och matchas inte exakt.'}
        </p>
      )}
    </div>
  )
}
