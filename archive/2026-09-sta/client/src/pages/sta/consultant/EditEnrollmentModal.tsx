import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { staEnrollmentsApi } from '@/services/staApi'
import { derivePartTimeline, PART_COLORS } from '../enrollmentDisplay'
import { AlertTriangle, CheckCircle } from '@/components/ui/icons'

export function EditEnrollmentModal({
  enrollment,
  onClose,
  onSaved,
}: {
  enrollment: import('@/services/staApi').StaEnrollment
  onClose: () => void
  onSaved: () => void
}) {
  const [startedAt, setStartedAt] = useState(enrollment.started_at)
  const [includesPart2, setIncludesPart2] = useState<boolean>(enrollment.includes_part_2 ?? true)
  const [weeklyHours, setWeeklyHours] = useState(enrollment.weekly_hours)
  const [focusOccupation, setFocusOccupation] = useState(enrollment.focus_occupation ?? '')
  const [adaptations, setAdaptations] = useState(enrollment.adaptations ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tidslinjen uppdateras live när konsulenten ändrar startdatum eller Del 2-toggle.
  const timeline = derivePartTimeline(startedAt, includesPart2)

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      await staEnrollmentsApi.update(enrollment.id, {
        started_at: startedAt,
        includes_part_2: includesPart2,
        // Synca DB med härlett värde så att aktivitets-inserts får rätt part-default
        current_part: timeline.currentPart as import('@/services/staApi').StaPart,
        part_started_at: timeline.partStartedAt.toISOString().slice(0, 10),
        weekly_hours: weeklyHours,
        focus_occupation: focusOccupation || null,
        adaptations: adaptations || null,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: '2-digit' }).format(d)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-stone-900/40" onClick={onClose} aria-label="Stäng" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" data-domain="action">
        <div className="px-6 py-5 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">Ändra deltagare</h2>
          <p className="text-xs text-stone-500 mt-1">
            Del räknas ut från startdatum + om Del 2 ingår. Tidslinjen uppdateras live.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label htmlFor="edit-started-at" className="block text-sm font-medium text-stone-800 mb-1">
              Programstart
            </label>
            <input
              id="edit-started-at"
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
            <p className="text-[11px] text-stone-500 mt-1">När insatsen startade. Styr hela tidslinjen.</p>
          </div>

          <div>
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-stone-200 hover:bg-stone-50">
              <input
                type="checkbox"
                checked={includesPart2}
                onChange={(e) => setIncludesPart2(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-stone-700"
              />
              <span className="text-sm text-stone-800">
                <strong className="block">Inkluderar Del 2 — Prova på</strong>
                <span className="text-xs text-stone-600">
                  Kartläggning i konstruerad miljö (5 v). AF räknar Del 2 som valbar — avmarkera om
                  deltagaren går direkt från Del 1 till arbetsprövning.
                </span>
              </span>
            </label>
          </div>

          {/* Tidslinje */}
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="text-xs font-medium text-stone-700 mb-2">Tidslinje</div>
            <ol className="space-y-1.5 text-xs">
              {timeline.segments.map((seg) => {
                const color = PART_COLORS[seg.part]
                return (
                  <li
                    key={seg.part}
                    className={cn(
                      'flex items-center justify-between gap-2 py-1.5 px-2 rounded border',
                      seg.isCurrent
                        ? `${color.bgSolid} ${color.text} ${color.border} font-medium`
                        : seg.isPast
                          ? 'bg-white border-stone-200 text-stone-400 line-through'
                          : `${color.bg} ${color.text} ${color.border} opacity-80`,
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        'inline-flex items-center justify-center rounded-full w-5 h-5 text-[10px] font-bold border',
                        color.bgSolid, color.text, color.border,
                      )}>
                        {seg.part}
                      </span>
                      <span>{color.name}</span>
                      {seg.isCurrent && !seg.isOverdue && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/70">
                          pågående
                        </span>
                      )}
                      {seg.isOverdue && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800 border border-rose-200">
                          förfallen
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[11px] opacity-80">
                      {fmt(seg.startDate)} → {fmt(seg.endDate)}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>

          <div>
            <label htmlFor="edit-weekly-hours" className="block text-sm font-medium text-stone-800 mb-1">
              Veckotimmar
            </label>
            <input
              id="edit-weekly-hours"
              type="number"
              min={1}
              max={40}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          <div>
            <label htmlFor="edit-focus-occupation" className="block text-sm font-medium text-stone-800 mb-1">
              Fokusyrke
            </label>
            <input
              id="edit-focus-occupation"
              type="text"
              value={focusOccupation}
              onChange={(e) => setFocusOccupation(e.target.value)}
              placeholder="t.ex. lagerarbetare"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          <div>
            <label htmlFor="edit-adaptations" className="block text-sm font-medium text-stone-800 mb-1">
              Anpassningar
            </label>
            <textarea
              id="edit-adaptations"
              value={adaptations}
              onChange={(e) => setAdaptations(e.target.value)}
              rows={2}
              placeholder="t.ex. längre tid, bildstöd, lugn miljö"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 resize-y"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-900 flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Avbryt
          </Button>
          <Button variant="primary" leftIcon={<CheckCircle size={14} />} onClick={handleSave} disabled={saving}>
            {saving ? 'Sparar…' : 'Spara'}
          </Button>
        </div>
      </div>
    </div>
  )
}


