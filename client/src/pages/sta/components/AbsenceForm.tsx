/**
 * AbsenceForm — deltagaren anmäler frånvaro idag eller framåt.
 *
 * Tre snabbval för vanligaste typerna + valbart datum. Allt sparas i
 * sta_absences-tabellen och syns direkt för konsulent. Upsert mot
 * (enrollment_id, absence_date) — en anmälan per dag, går att ändra.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Stethoscope,
  Baby,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Info,
} from '@/components/ui/icons'
import type { AbsenceKind, StaAbsence } from '@/services/staApi'
import { cn } from '@/lib/utils'

const SWEDISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function isoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function fmtShortSv(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}

const KIND_OPTIONS: Array<{
  kind: AbsenceKind
  label: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}> = [
  { kind: 'sick', label: 'Sjuk', description: 'Jag är sjuk idag', icon: Stethoscope },
  { kind: 'vab', label: 'VAB', description: 'Vård av barn', icon: Baby },
  { kind: 'allowed', label: 'Beviljad frånvaro', description: 'Möte, vård, annat avtalat', icon: CalendarDays },
  { kind: 'other', label: 'Annan orsak', description: 'Skriv själv vad det är', icon: Info },
]

interface Props {
  recentAbsences: StaAbsence[]
  onReport: (input: { date: string; kind: AbsenceKind; reason?: string }) => Promise<unknown>
  onRemove?: (id: string) => Promise<void>
  /** Vid preview-läge: knappar finns men onReport anropas inte. */
  readOnly?: boolean
}

export function AbsenceForm({ recentAbsences, onReport, onRemove, readOnly = false }: Props) {
  const today = isoDate(new Date())
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(today)
  const [kind, setKind] = useState<AbsenceKind>('sick')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)

  const todaysAbsence = recentAbsences.find((a) => a.absence_date === today)

  const reset = () => {
    setDate(today)
    setKind('sick')
    setReason('')
    setOpen(false)
    setFeedback(null)
  }

  const handleSubmit = async () => {
    if (readOnly) {
      reset()
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      await onReport({ date, kind, reason: reason.trim() || undefined })
      setFeedback('saved')
      setTimeout(() => reset(), 1500)
    } catch {
      setFeedback('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="flat" padding="lg">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-stone-500 font-medium">Närvaro</div>
          <h3 className="text-base font-semibold text-stone-900 mt-1">Anmäl frånvaro</h3>
          <p className="text-sm text-stone-600 mt-0.5">
            {todaysAbsence
              ? `Du är anmäld som ${labelForKind(todaysAbsence.kind)} idag.`
              : 'Kan du inte komma idag eller en kommande dag? Säg till här så vet din konsulent.'}
          </p>
        </div>
        {!open && (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {todaysAbsence ? 'Ändra anmälan' : 'Anmäl frånvaro'}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-2 p-4 rounded-xl bg-stone-50 border border-stone-200">
          <label className="block text-xs font-medium text-stone-700 mb-1">Datum</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
            className="px-2 py-1 rounded-lg border border-stone-300 text-sm bg-white"
          />

          <div className="text-xs font-medium text-stone-700 mt-3 mb-1">Vad är orsaken?</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {KIND_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = kind === opt.kind
              return (
                <button
                  key={opt.kind}
                  type="button"
                  onClick={() => setKind(opt.kind)}
                  disabled={saving}
                  className={cn(
                    'flex items-start gap-2 p-2.5 rounded-lg border-2 text-left transition-colors',
                    active
                      ? 'border-[var(--c-solid)] bg-white'
                      : 'border-stone-200 bg-white hover:border-stone-300',
                  )}
                  aria-pressed={active}
                >
                  <Icon
                    size={16}
                    className={cn('mt-0.5 flex-shrink-0', active ? '' : 'text-stone-500')}
                    style={active ? { color: 'var(--c-text)' } : undefined}
                  />
                  <div>
                    <div className="text-sm font-medium text-stone-900">{opt.label}</div>
                    <div className="text-xs text-stone-500">{opt.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {(kind === 'other' || kind === 'allowed') && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                {kind === 'allowed' ? 'Vad är det för möte/avtalad frånvaro?' : 'Beskriv kort'}
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
                placeholder={kind === 'allowed' ? 'T.ex. läkarbesök 10:00' : 'Kort förklaring (frivilligt)'}
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={saving}>
              {todaysAbsence ? 'Uppdatera anmälan' : 'Skicka anmälan'}
            </Button>
            <Button variant="ghost" size="sm" onClick={reset} disabled={saving}>
              Avbryt
            </Button>
            {feedback === 'saved' && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 size={12} />
                Anmält
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
      )}

      {recentAbsences.length > 0 && (
        <div className="mt-4 pt-3 border-t border-stone-100">
          <div className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-2">
            Mina senaste anmälningar
          </div>
          <ul className="space-y-1.5">
            {recentAbsences.slice(0, 5).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-lg bg-stone-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-stone-900">{fmtShortSv(a.absence_date)}</span>
                  <span className="text-stone-500">·</span>
                  <span className="text-stone-700 truncate">{labelForKind(a.kind)}</span>
                  {a.reason && <span className="text-xs text-stone-500 truncate">— {a.reason}</span>}
                </div>
                {onRemove && !readOnly && (
                  <button
                    type="button"
                    onClick={() => onRemove(a.id)}
                    className="text-xs text-stone-400 hover:text-rose-600"
                    aria-label="Ta bort anmälan"
                  >
                    Ta bort
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function labelForKind(kind: AbsenceKind): string {
  switch (kind) {
    case 'sick': return 'Sjuk'
    case 'vab': return 'VAB'
    case 'allowed': return 'Beviljad frånvaro'
    case 'other': return 'Annan orsak'
  }
}
