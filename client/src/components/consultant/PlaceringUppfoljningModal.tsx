/**
 * PlaceringUppfoljningModal — registrera en veckouppföljning för en plats.
 *
 * Formatet är lånat från den avaktiverade STA-modulens
 * sta_workplace_followups (week_number, followup_date, attendance_pct,
 * status good/concerns/critical, next_step) men lägger till
 * `topics_to_discuss` (frågor att ta upp) från
 * docs/STA-FORBATTRINGSFORSLAG.md:122-130.
 *
 * Samma tillgänglighetsmönster som PlaceringFormModal: role="dialog",
 * aria-modal, useFocusTrap med Escape.
 */

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button, CloseButton } from '@/components/ui/Button'
import { ClipboardList, AlertCircle } from '@/components/ui/icons'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { PlaceringUppfoljningInput } from '@/services/placeringarApi'

interface Props {
  open: boolean
  placementId: string
  /** Nästa lediga veckonummer — föreslås som default. */
  nextWeekNumber: number
  onSave: (input: PlaceringUppfoljningInput) => Promise<unknown>
  onClose: () => void
}

function tomtFormular(placementId: string, weekNumber: number): PlaceringUppfoljningInput {
  return {
    placement_id: placementId,
    week_number: weekNumber,
    followup_date: new Date().toISOString().slice(0, 10),
    // Den här dialogen registrerar en uppföljning som HAR ägt rum — därför
    // alltid genomförd med en status, aldrig en planerad rad utan underlag
    // (CHECK-constraint cwpf_status_kraver_genomford i migrationen). De
    // fyra PLANERADE milstolparna skapas separat, se
    // placeringarApi.berakMilstolpeUppfoljningar().
    is_completed: true,
    attendance_pct: null,
    status: 'good',
    topics_to_discuss: null,
    notes: null,
    next_step: null,
  }
}

export function PlaceringUppfoljningModal({ open, placementId, nextWeekNumber, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<PlaceringUppfoljningInput>(tomtFormular(placementId, nextWeekNumber))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dialogRef = useFocusTrap<HTMLDivElement>(open, { onEscape: onClose })

  useEffect(() => {
    if (open) {
      setDraft(tomtFormular(placementId, nextWeekNumber))
      setError(null)
    }
  }, [open, placementId, nextWeekNumber])

  if (!open) return null

  const update = <K extends keyof PlaceringUppfoljningInput>(key: K, value: PlaceringUppfoljningInput[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!draft.followup_date) {
      setError('Datum krävs')
      return
    }
    if (!draft.week_number || draft.week_number < 1) {
      setError('Ange veckonummer')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="uppf-title"
    >
      <Card variant="flat" padding="none" className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-stone-700" />
            <h2 id="uppf-title" className="font-semibold text-stone-900">
              Veckouppföljning
            </h2>
          </div>
          <CloseButton onClick={onClose} aria-label="Stäng" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Vecka *">
              <input
                type="number"
                min={1}
                max={52}
                value={draft.week_number}
                onChange={(e) => update('week_number', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
            <Field label="Datum *">
              <input
                type="date"
                value={draft.followup_date}
                onChange={(e) => update('followup_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
          </div>

          <Field label="Närvaro (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={draft.attendance_pct ?? ''}
              onChange={(e) => update('attendance_pct', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            />
          </Field>

          <Field label="Läge">
            <div className="grid grid-cols-3 gap-2">
              {(['good', 'concerns', 'critical'] as const).map((s) => (
                <label
                  key={s}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border cursor-pointer text-xs font-medium ${
                    draft.status === s ? 'border-stone-700 bg-stone-50' : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="uppf-status"
                    checked={draft.status === s}
                    onChange={() => update('status', s)}
                    className="sr-only"
                  />
                  {s === 'good' ? 'Går bra' : s === 'concerns' ? 'Vissa svårigheter' : 'Behöver omplaneras'}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Frågor att ta upp">
            <textarea
              rows={2}
              value={draft.topics_to_discuss ?? ''}
              onChange={(e) => update('topics_to_discuss', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              placeholder="Vad ska stämmas av nästa gång?"
            />
          </Field>

          <Field label="Anteckningar">
            <textarea
              rows={2}
              value={draft.notes ?? ''}
              onChange={(e) => update('notes', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            />
          </Field>

          <Field label="Nästa steg">
            <textarea
              rows={2}
              value={draft.next_step ?? ''}
              onChange={(e) => update('next_step', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-stone-100 bg-stone-50 flex-wrap">
          {error && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-700">
              <AlertCircle size={12} />
              {error}
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Avbryt
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave} isLoading={saving}>
            Spara uppföljning
          </Button>
        </div>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-stone-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
