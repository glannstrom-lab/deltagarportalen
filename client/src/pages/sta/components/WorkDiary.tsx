/**
 * WorkDiary — strukturerad arbetsdagbok för arbetsprövning (Del 3-4).
 *
 * Varje post sparas i sta_activities som activity_type='arbetsprovning' med
 * unik activity_key per datum + workplace_id. Strukturerade fält ligger i
 * metadata, fritextreflektion i participant_reflection.
 *
 * Deltagaren loggar:
 *   - vad hen gjorde idag (uppgifter)
 *   - vad gick bra
 *   - vad var svårt
 *   - energi 1-5
 *
 * Konsulent ser samma poster i drawerns aktivitetslogg.
 */

import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  Heart,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { staActivitiesApi, type StaActivity, type StaWorkplace } from '@/services/staApi'

const SWEDISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function isoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatShortSv(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}

interface DiaryMeta {
  tasks?: string
  went_well?: string
  was_hard?: string
  energy?: number
}

interface Props {
  enrollmentId: string | null
  workplace: StaWorkplace
  part: 3 | 4
}

export function WorkDiary({ enrollmentId, workplace, part }: Props) {
  const [entries, setEntries] = useState<StaActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [composing, setComposing] = useState(false)

  // Bara poster för denna arbetsplats
  const reload = useMemo(
    () => async () => {
      if (!enrollmentId) return
      setLoading(true)
      try {
        const all = await staActivitiesApi.list(enrollmentId, part)
        setEntries(
          all
            .filter(
              (a) =>
                a.activity_type === 'arbetsprovning' &&
                (a.metadata as { workplace_id?: string })?.workplace_id === workplace.id,
            )
            .sort((a, b) => {
              const aT = a.completed_at ?? a.scheduled_for ?? ''
              const bT = b.completed_at ?? b.scheduled_for ?? ''
              return bT.localeCompare(aT)
            }),
        )
      } finally {
        setLoading(false)
      }
    },
    [enrollmentId, workplace.id, part],
  )

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <Card variant="flat" padding="lg">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BookOpen size={18} style={{ color: 'var(--c-text)' }} />
          <div>
            <h3 className="text-base font-semibold text-stone-900">Arbetsdagbok</h3>
            <p className="text-xs text-stone-500">
              {workplace.company_name} · {entries.length} post
              {entries.length === 1 ? '' : 'er'}
            </p>
          </div>
        </div>
        {!composing && entries.length > 0 && (
          <Button size="sm" variant="primary" leftIcon={<Plus size={12} />} onClick={() => setComposing(true)}>
            Ny post
          </Button>
        )}
      </div>

      {composing && (
        <DiaryComposer
          enrollmentId={enrollmentId}
          workplace={workplace}
          part={part}
          onSave={async () => {
            await reload()
            setComposing(false)
          }}
          onCancel={() => setComposing(false)}
        />
      )}

      {!composing && entries.length === 0 && !loading && (
        <Card variant="flat" padding="md" className="bg-stone-50">
          <EmptyState
            compact
            icon={BookOpen}
            title="Din arbetsdagbok börjar här"
            description={`När du skriver om en dag på ${workplace.company_name} samlas det här — din konsulent ser samma logg.`}
            action={{
              label: 'Skriv din första rad',
              onClick: () => setComposing(true),
            }}
          />
        </Card>
      )}

      {entries.length > 0 && (
        <ul className="space-y-2 mt-3">
          {entries.slice(0, 10).map((e) => (
            <DiaryEntry key={e.id} entry={e} />
          ))}
        </ul>
      )}
    </Card>
  )
}

function DiaryEntry({ entry }: { entry: StaActivity }) {
  const meta = (entry.metadata as DiaryMeta) ?? {}
  const dateStr = entry.completed_at ?? entry.scheduled_for ?? ''
  const displayDate = dateStr ? formatShortSv(dateStr.slice(0, 10)) : ''

  return (
    <li className="p-3 rounded-xl bg-stone-50">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-stone-900 text-sm">{displayDate}</span>
          {typeof meta.energy === 'number' && <EnergyChip value={meta.energy} />}
        </div>
      </div>

      {meta.tasks && (
        <DiaryRow label="Vad jag gjorde" value={meta.tasks} />
      )}
      {meta.went_well && (
        <DiaryRow label="Gick bra" value={meta.went_well} positive />
      )}
      {meta.was_hard && (
        <DiaryRow label="Var svårt" value={meta.was_hard} caution />
      )}
      {entry.participant_reflection && (
        <DiaryRow label="Reflektion" value={entry.participant_reflection} italic />
      )}
    </li>
  )
}

function DiaryRow({
  label,
  value,
  positive,
  caution,
  italic,
}: {
  label: string
  value: string
  positive?: boolean
  caution?: boolean
  italic?: boolean
}) {
  return (
    <div className="text-sm mt-1">
      <span
        className={cn(
          'text-xs font-medium',
          positive && 'text-emerald-700',
          caution && 'text-amber-700',
          !positive && !caution && 'text-stone-500',
        )}
      >
        {label}:
      </span>{' '}
      <span className={cn('text-stone-800', italic && 'italic')}>{value}</span>
    </div>
  )
}

function EnergyChip({ value }: { value: number }) {
  const emoji = ['😴', '😐', '🙂', '🌤️', '⭐'][Math.max(0, Math.min(4, value - 1))]
  const colorClass =
    value <= 2
      ? 'bg-amber-50 text-amber-700'
      : value === 3
        ? 'bg-stone-100 text-stone-600'
        : 'bg-emerald-50 text-emerald-700'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
        colorClass,
      )}
      title={`Energi ${value}/5`}
    >
      {emoji} {value}/5
    </span>
  )
}

// ============================================================================
// DiaryComposer — input-formulär
// ============================================================================

function DiaryComposer({
  enrollmentId,
  workplace,
  part,
  onSave,
  onCancel,
}: {
  enrollmentId: string | null
  workplace: StaWorkplace
  part: 3 | 4
  onSave: () => Promise<void>
  onCancel: () => void
}) {
  const today = isoDate(new Date())
  const [date, setDate] = useState(today)
  const [tasks, setTasks] = useState('')
  const [wentWell, setWentWell] = useState('')
  const [wasHard, setWasHard] = useState('')
  const [reflection, setReflection] = useState('')
  const [energy, setEnergy] = useState(3)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!enrollmentId) {
      onCancel()
      return
    }
    if (!tasks.trim() && !wentWell.trim() && !wasHard.trim() && !reflection.trim()) {
      setError('Skriv något i minst ett fält innan du sparar')
      return
    }
    setSaving(true)
    setError(null)
    setFeedback(null)
    try {
      await staActivitiesApi.upsertByKey({
        enrollment_id: enrollmentId,
        part,
        activity_type: 'arbetsprovning',
        activity_key: `arbetsdagbok-${workplace.id}-${date}`,
        metadata: {
          workplace_id: workplace.id,
          tasks: tasks.trim() || undefined,
          went_well: wentWell.trim() || undefined,
          was_hard: wasHard.trim() || undefined,
          energy,
        },
        participant_reflection: reflection.trim() || null,
        markComplete: true,
      })
      setFeedback('saved')
      await onSave()
    } catch (err) {
      setFeedback('error')
      setError(err instanceof Error ? err.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 rounded-xl bg-white border-2 border-stone-200 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h4 className="text-sm font-semibold text-stone-900">Ny dagbokspost</h4>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          disabled={saving}
          className="px-2 py-1 rounded border border-stone-200 text-sm"
        />
      </div>

      <Field label="Vad gjorde du idag?">
        <textarea
          rows={2}
          value={tasks}
          onChange={(e) => setTasks(e.target.value)}
          disabled={saving}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
          placeholder="T.ex. plockade varor på morgonen, möte 13:00..."
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Vad gick bra?">
          <textarea
            rows={2}
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
          />
        </Field>
        <Field label="Vad var svårt?">
          <textarea
            rows={2}
            value={wasHard}
            onChange={(e) => setWasHard(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
          />
        </Field>
      </div>

      <Field label="Hur var energin idag?">
        <div className="flex items-center gap-1.5 mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEnergy(n)}
              disabled={saving}
              aria-pressed={energy === n}
              className={cn(
                'flex-1 py-2 rounded-lg border-2 transition-colors text-sm flex items-center justify-center gap-1',
                energy === n
                  ? 'border-[var(--c-solid)] bg-[var(--c-bg)]'
                  : 'border-stone-200 bg-white hover:border-stone-300',
              )}
            >
              {['😴', '😐', '🙂', '🌤️', '⭐'][n - 1]}
              <span className="text-xs text-stone-600">{n}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Övrig reflektion (frivilligt)">
        <textarea
          rows={2}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          disabled={saving}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
          placeholder="Något annat din konsulent borde veta?"
        />
      </Field>

      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <Button size="sm" variant="primary" onClick={handleSave} isLoading={saving} leftIcon={<CheckCircle2 size={12} />}>
          Spara
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Avbryt
        </Button>
        {feedback === 'saved' && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <Heart size={12} />
            Sparat
          </span>
        )}
        {feedback === 'error' && error && (
          <span className="inline-flex items-center gap-1 text-xs text-rose-700">
            <AlertCircle size={12} />
            {error}
          </span>
        )}
      </div>
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
