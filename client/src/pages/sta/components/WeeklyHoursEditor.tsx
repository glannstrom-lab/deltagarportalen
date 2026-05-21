/**
 * WeeklyHoursEditor — slider 10-40h med snabbval och autosave.
 *
 * Visas i hero på STA-sidan. Deltagaren ändrar sin aktivitetsomfattning
 * själv; konsulenten ser värdet i listan och justerar via AF-bedömning.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Clock, CheckCircle2, AlertCircle, Loader2 } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

const QUICK_PICKS = [10, 20, 25, 30, 40] as const

interface Props {
  currentHours: number
  onSave: (hours: number) => Promise<unknown>
  /** Vid preview: knappen finns men sparar inte (skickar inte onSave). */
  readOnly?: boolean
}

export function WeeklyHoursEditor({ currentHours, onSave, readOnly = false }: Props) {
  const [draft, setDraft] = useState(currentHours)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)

  useEffect(() => {
    setDraft(currentHours)
  }, [currentHours])

  const handleSave = async () => {
    if (readOnly) {
      setEditing(false)
      return
    }
    if (draft < 10 || draft > 40) return
    setSaving(true)
    setFeedback(null)
    try {
      await onSave(draft)
      setFeedback('saved')
      setEditing(false)
      setTimeout(() => setFeedback(null), 2000)
    } catch {
      setFeedback('error')
    } finally {
      setSaving(false)
    }
  }

  const daysPerWeek = hoursToDays(draft)
  const hoursPerDay = (draft / daysPerWeek).toFixed(1)

  if (!editing) {
    return (
      <div className="inline-flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700"
          aria-label={`Aktivitetsomfattning ${currentHours} timmar per vecka`}
        >
          <Clock size={12} />
          {currentHours} h/vecka
        </span>
        <button
          type="button"
          onClick={() => {
            setDraft(currentHours)
            setEditing(true)
          }}
          className="text-xs text-stone-500 hover:text-stone-700 hover:underline"
          aria-label="Ändra aktivitetsomfattning"
        >
          Ändra
        </button>
        {feedback === 'saved' && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 size={12} />
            Sparat
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md p-4 rounded-xl bg-white border border-stone-200">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="weekly-hours" className="text-sm font-medium text-stone-900">
          Hur många timmar i veckan deltar du?
        </label>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold"
          style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
        >
          {draft} h
        </span>
      </div>

      <input
        id="weekly-hours"
        type="range"
        min={10}
        max={40}
        step={1}
        value={draft}
        onChange={(e) => setDraft(Number(e.target.value))}
        disabled={saving}
        className="w-full accent-[var(--c-solid)]"
        aria-valuemin={10}
        aria-valuemax={40}
        aria-valuenow={draft}
      />

      <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
        <span>10 h (deltid)</span>
        <span>40 h (heltid)</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {QUICK_PICKS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setDraft(h)}
            disabled={saving}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-colors',
              draft === h
                ? 'border-[var(--c-solid)] text-[var(--c-text)]'
                : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300',
            )}
            style={draft === h ? { background: 'var(--c-bg)' } : undefined}
          >
            {h} h
          </button>
        ))}
      </div>

      <p className="text-xs text-stone-600 mt-3">
        Ditt schema blir <strong>{daysPerWeek} dagar</strong> i veckan, ungefär{' '}
        <strong>{hoursPerDay} timmar per dag</strong>. Du kan ändra när som helst — säg också till
        din konsulent så vi anpassar tillsammans.
      </p>

      <div className="flex items-center gap-2 mt-3">
        <Button size="sm" variant="primary" onClick={handleSave} isLoading={saving}>
          Spara
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(currentHours)
            setEditing(false)
            setFeedback(null)
          }}
          disabled={saving}
        >
          Avbryt
        </Button>
        {saving && (
          <span className="inline-flex items-center gap-1 text-xs text-stone-500">
            <Loader2 size={12} className="animate-spin" />
            Sparar…
          </span>
        )}
        {feedback === 'error' && (
          <span className="inline-flex items-center gap-1 text-xs text-rose-700">
            <AlertCircle size={12} />
            Kunde inte spara
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Schema-derive: bestäm antal dagar/vecka baserat på timmar/vecka.
 *
 * Logik: vi pressar in timmarna på så få dagar som möjligt utan att överskrida
 * 8h/dag (insatsens maxgräns enligt uppdraget). Detta gör att 10h blir 2 dagar,
 * 25h blir 4, 40h blir 5.
 */
export function hoursToDays(weeklyHours: number): number {
  const clamped = Math.max(10, Math.min(40, weeklyHours))
  return Math.max(1, Math.min(5, Math.ceil(clamped / 8)))
}

/**
 * Vilka veckodagar (mån-fre indexerade 0-4) deltagaren är aktiv på,
 * baserat på antal dagar/vecka.
 *
 * 5 dagar = alla. 4 dagar = mån-tor (fre = ledig).
 * 3 dagar = mån/ons/fre (jämn fördelning). 2 dagar = tis/tor. 1 dag = ons.
 */
export function activeDaysForHours(weeklyHours: number): Set<number> {
  const days = hoursToDays(weeklyHours)
  switch (days) {
    case 5: return new Set([0, 1, 2, 3, 4])
    case 4: return new Set([0, 1, 2, 3])
    case 3: return new Set([0, 2, 4])
    case 2: return new Set([1, 3])
    default: return new Set([2])
  }
}
