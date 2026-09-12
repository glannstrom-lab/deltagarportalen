/**
 * WorkplaceCard — visar en arbetsprövningsplats med uppföljningslista.
 *
 * Konsulent-vy: kan redigera, lägga till veckovis uppföljning, skicka till AF.
 * Deltagar-vy: read-only utom kort reflektion.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Building2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Plus,
  PencilLine,
  Trash2,
  ArrowRight,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import {
  staWorkplaceFollowupsApi,
  type StaWorkplace,
  type StaWorkplaceFollowup,
} from '@/services/staApi'
import { useStaWorkplaceFollowups } from '@/hooks/useSta'

interface Props {
  workplace: StaWorkplace
  consultantView: boolean
  onEdit?: () => void
  onDelete?: () => Promise<void>
  onSubmitToAf?: () => Promise<void>
}

export function WorkplaceCard({ workplace, consultantView, onEdit, onDelete, onSubmitToAf }: Props) {
  const { followups, upsert, remove } = useStaWorkplaceFollowups(workplace.id)
  const [followupOpen, setFollowupOpen] = useState(false)
  const [editingFollowup, setEditingFollowup] = useState<StaWorkplaceFollowup | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const afStatusMeta = AF_STATUS_META[workplace.af_submission_status]

  const handleSubmitToAf = async () => {
    if (!onSubmitToAf) return
    setSubmitting(true)
    try {
      await onSubmitToAf()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card variant="flat" padding="lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
          >
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-stone-900 text-lg">{workplace.company_name}</div>
            <div className="text-xs text-stone-500 mt-0.5">
              {workplace.org_number && <>Org. {workplace.org_number} · </>}
              Inriktning: {workplace.inriktning ?? 'ej satt'}
            </div>
            {workplace.contact_name && (
              <div className="text-sm text-stone-700 mt-1">
                Kontakt: <span className="font-medium">{workplace.contact_name}</span>
                {workplace.contact_phone && <> · {workplace.contact_phone}</>}
                {workplace.contact_email && <> · {workplace.contact_email}</>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {workplace.should_extend && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700">
              <ArrowRight size={11} />
              Ska förlängas
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
              afStatusMeta.class,
            )}
          >
            {afStatusMeta.icon}
            {afStatusMeta.label}
          </span>
        </div>
      </div>

      {/* Period + weeks */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        <Stat label="Startdatum" value={workplace.start_date ?? '—'} />
        <Stat label="Slutdatum" value={workplace.end_date ?? '—'} />
        <Stat label="Veckor planerat" value={workplace.weeks_planned ? `${workplace.weeks_planned}` : '—'} />
      </div>

      {workplace.notes && (
        <p className="mt-3 p-3 rounded-lg bg-stone-50 text-sm text-stone-700">{workplace.notes}</p>
      )}

      {/* Uppföljningar */}
      <div className="mt-4 pt-3 border-t border-stone-100">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h4 className="text-sm font-semibold text-stone-900">
            Veckovis uppföljning ({followups.length})
          </h4>
          {consultantView && !followupOpen && !editingFollowup && followups.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Plus size={12} />}
              onClick={() => setFollowupOpen(true)}
            >
              Lägg till
            </Button>
          )}
        </div>

        {(followupOpen || editingFollowup) && (
          <FollowupForm
            workplaceId={workplace.id}
            existing={editingFollowup}
            onSave={async (input) => {
              await upsert(input)
              setFollowupOpen(false)
              setEditingFollowup(null)
            }}
            onCancel={() => {
              setFollowupOpen(false)
              setEditingFollowup(null)
            }}
          />
        )}

        {followups.length === 0 && !followupOpen && !editingFollowup && (
          <EmptyState
            compact
            icon={CheckCircle2}
            title="Uppföljningarna samlas här"
            description="AF kräver minst en uppföljning per vecka."
            action={
              consultantView
                ? {
                    label: 'Lägg till första uppföljningen',
                    onClick: () => setFollowupOpen(true),
                    variant: 'secondary',
                  }
                : undefined
            }
          />
        )}

        {followups.length > 0 && (
          <ul className="space-y-1.5">
            {followups.map((f) => (
              <FollowupRow
                key={f.id}
                followup={f}
                consultantView={consultantView}
                onEdit={() => setEditingFollowup(f)}
                onDelete={() => remove(f.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Konsulent-actions */}
      {consultantView && (
        <div className="mt-4 pt-3 border-t border-stone-100 flex gap-2 flex-wrap">
          {workplace.af_submission_status === 'pending' && onSubmitToAf && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Send size={12} />}
              onClick={handleSubmitToAf}
              isLoading={submitting}
            >
              Skicka till AF
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="secondary" leftIcon={<PencilLine size={12} />} onClick={onEdit}>
              Redigera
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} onClick={onDelete}>
              Ta bort
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

// =============================================================================
// FollowupRow
// =============================================================================

function FollowupRow({
  followup,
  consultantView,
  onEdit,
  onDelete,
}: {
  followup: StaWorkplaceFollowup
  consultantView: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const meta = STATUS_META[followup.status]
  return (
    <li className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50">
      <span
        className={cn(
          'inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold flex-shrink-0',
          meta.bgClass,
          meta.textClass,
        )}
      >
        v{followup.week_number}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-stone-900">{meta.label}</span>
          <span className="text-xs text-stone-500">{followup.followup_date}</span>
          {typeof followup.attendance_pct === 'number' && (
            <span className="text-xs text-stone-600">närvaro {followup.attendance_pct}%</span>
          )}
        </div>
        {followup.notes && <p className="text-xs text-stone-600 mt-0.5 truncate">{followup.notes}</p>}
        {followup.next_step && (
          <p className="text-xs text-stone-500 italic mt-0.5">Nästa: {followup.next_step}</p>
        )}
      </div>
      {consultantView && (
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-1 text-stone-400 hover:text-stone-700"
            aria-label="Redigera"
          >
            <PencilLine size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-stone-400 hover:text-rose-600"
            aria-label="Ta bort"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </li>
  )
}

// =============================================================================
// FollowupForm — inline-formulär för att lägga till/redigera uppföljning
// =============================================================================

function FollowupForm({
  workplaceId,
  existing,
  onSave,
  onCancel,
}: {
  workplaceId: string
  existing: StaWorkplaceFollowup | null
  onSave: (input: Parameters<typeof staWorkplaceFollowupsApi.upsert>[0]) => Promise<unknown>
  onCancel: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [week, setWeek] = useState(existing?.week_number ?? 1)
  const [date, setDate] = useState(existing?.followup_date ?? today)
  const [status, setStatus] = useState<'good' | 'concerns' | 'critical'>(existing?.status ?? 'good')
  const [attendance, setAttendance] = useState<string>(
    existing?.attendance_pct != null ? String(existing.attendance_pct) : '100',
  )
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [nextStep, setNextStep] = useState(existing?.next_step ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave({
        id: existing?.id,
        workplace_id: workplaceId,
        week_number: week,
        followup_date: date,
        status,
        attendance_pct: attendance ? parseInt(attendance, 10) : null,
        notes: notes.trim() || null,
        next_step: nextStep.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 rounded-lg bg-white border-2 border-stone-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
        <div>
          <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Vecka</label>
          <input
            type="number"
            min={1}
            max={26}
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="w-full px-2 py-1 rounded border border-stone-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-2 py-1 rounded border border-stone-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Närvaro %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={attendance}
            onChange={(e) => setAttendance(e.target.value)}
            className="w-full px-2 py-1 rounded border border-stone-200 text-sm"
          />
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Status</label>
        <div className="flex gap-1.5 flex-wrap">
          {(['good', 'concerns', 'critical'] as const).map((s) => {
            const m = STATUS_META[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border-2',
                  status === s
                    ? `${m.bgClass} ${m.textClass} border-current`
                    : 'border-stone-200 bg-white text-stone-600',
                )}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Observationer</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-2 py-1 rounded border border-stone-200 text-sm"
          placeholder="Vad har vi sett? Hur fungerar uppgifterna?"
        />
      </div>

      <div className="mb-3">
        <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Nästa steg</label>
        <input
          type="text"
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          className="w-full px-2 py-1 rounded border border-stone-200 text-sm"
          placeholder="T.ex. boka AT-besök, ändra schema..."
        />
      </div>

      <div className="flex gap-2 items-center">
        <Button size="sm" variant="primary" onClick={handleSave} isLoading={saving}>
          {existing ? 'Spara' : 'Lägg till'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Avbryt
        </Button>
        {error && <span className="text-xs text-rose-700">{error}</span>}
      </div>
    </div>
  )
}

// =============================================================================
// STATIC METADATA
// =============================================================================

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-stone-50">
      <div className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">{label}</div>
      <div className="text-sm font-medium text-stone-900">{value}</div>
    </div>
  )
}

const AF_STATUS_META = {
  pending: { label: 'Förbereds', class: 'bg-stone-100 text-stone-700', icon: null },
  submitted: { label: 'Inskickad till AF', class: 'bg-amber-100 text-amber-800', icon: <Send size={11} /> },
  approved: { label: 'Godkänd av AF', class: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 size={11} /> },
  rejected: { label: 'Avslagen', class: 'bg-rose-50 text-rose-700', icon: <AlertTriangle size={11} /> },
} as const

const STATUS_META = {
  good: { label: 'Går bra', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700' },
  concerns: { label: 'Vissa svårigheter', bgClass: 'bg-amber-50', textClass: 'text-amber-700' },
  critical: { label: 'Kritiskt', bgClass: 'bg-rose-50', textClass: 'text-rose-700' },
} as const
