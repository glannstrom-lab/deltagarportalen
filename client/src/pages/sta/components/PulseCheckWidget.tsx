/**
 * PulseCheckWidget — deltagarens dagliga check-in
 *
 * Visas på deltagar-sidan i STA-Översikt. Tar < 30 sekunder att svara.
 * EN fråga: "Hur har dagen känts?". Sparas till sta_pulse_checks och utgör
 * underlag för MOHOST + tidig varning.
 *
 * Energinivån (energy_level 1–5) härleds från humöret så att konsulentens
 * energitrend fortsätter fungera utan att deltagaren behöver svara på två
 * separata frågor (dagskänsla + energi).
 */

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, Heart, Sparkles } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { Mood } from '@/services/staApi'

const MOOD_OPTIONS: Array<{ value: Mood; emoji: string; label: string }> = [
  { value: 'great', emoji: '🌤️', label: 'Riktigt bra' },
  { value: 'okay', emoji: '🙂', label: 'Okej' },
  { value: 'soso', emoji: '😐', label: 'Sådär' },
  { value: 'tough', emoji: '😞', label: 'Tungt' },
  { value: 'bad', emoji: '🌧️', label: 'Dåligt' },
]

/** Humör → energinivå (1–5). Speglar moodToNumber i useSta.ts. */
const MOOD_TO_ENERGY: Record<Mood, number> = {
  great: 5,
  okay: 4,
  soso: 3,
  tough: 2,
  bad: 1,
}

interface PulseCheckWidgetProps {
  hasToday: boolean
  onSubmit: (energy: number, mood?: Mood, comment?: string) => Promise<unknown>
  loading?: boolean
}

export function PulseCheckWidget({ hasToday, onSubmit, loading }: PulseCheckWidgetProps) {
  const [mood, setMood] = useState<Mood | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  if (hasToday && !justSaved) {
    return (
      <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'white', color: 'var(--c-text)' }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="font-semibold text-stone-900">Dagens check är klar</div>
            <div className="text-sm text-stone-600">Vi syns imorgon. Bra dag!</div>
          </div>
        </div>
      </Card>
    )
  }

  if (justSaved) {
    return (
      <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-center gap-3">
          <Sparkles size={20} style={{ color: 'var(--c-solid)' }} />
          <div>
            <div className="font-semibold text-stone-900">Tack 🙏</div>
            <div className="text-sm text-stone-600">Vi syns imorgon för en ny check-in.</div>
          </div>
        </div>
      </Card>
    )
  }

  const handleSubmit = async () => {
    if (mood === null) return
    setSubmitting(true)
    try {
      await onSubmit(MOOD_TO_ENERGY[mood], mood, comment.trim() || undefined)
      setJustSaved(true)
    } catch {
      // visa fel om vi vill
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = mood !== null

  return (
    <Card variant="flat" padding="lg">
      <div className="flex items-center gap-2 mb-3">
        <Heart size={18} style={{ color: 'var(--c-solid)' }} />
        <h3 className="text-base font-semibold text-stone-900">Hur har dagen känts?</h3>
      </div>
      <p className="text-sm text-stone-600 mb-4">
        Tar 15 sekunder. Bara du och din konsulent ser detta.
      </p>

      {/* Dagskänsla — fem alternativ */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {MOOD_OPTIONS.map((opt) => {
          const isSelected = mood === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMood(opt.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                isSelected
                  ? 'border-[var(--c-solid)]'
                  : 'border-stone-200 hover:border-stone-300',
              )}
              style={isSelected ? { background: 'var(--c-bg)' } : undefined}
              aria-pressed={isSelected}
            >
              <span className="text-xl">{opt.emoji}</span>
              <span className="text-[10px] text-stone-600 leading-tight text-center">{opt.label}</span>
            </button>
          )
        })}
      </div>

      {/* Frivillig kommentar — visas när dagskänsla valts */}
      {mood !== null && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Vad har varit roligt eller jobbigt idag? (frivilligt)"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        />
      )}

      <div className="flex justify-end mt-4">
        <Button
          variant="primary"
          size="sm"
          disabled={!canSubmit || submitting || loading}
          onClick={handleSubmit}
          isLoading={submitting}
        >
          Skicka in
        </Button>
      </div>
    </Card>
  )
}

/**
 * PulseTrendStrip — kompakt trend för konsulent-vyn (senaste 14 dagarna)
 */
export function PulseTrendStrip({
  pulses,
}: {
  pulses: Array<{ check_date: string; energy_level: number | null }>
}) {
  // Skapa 14 dagar tillbaka och mappa
  const days: Array<{ date: string; energy: number | null }> = []
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const pulse = pulses.find((p) => p.check_date === dateStr)
    days.push({ date: dateStr, energy: pulse?.energy_level ?? null })
  }

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium mb-1">
        Energi senaste 14 dagarna
      </div>
      <div className="flex items-end gap-0.5 h-12">
        {days.map((d) => (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center justify-end"
            title={`${d.date}: ${d.energy ? `${d.energy}/5` : 'ingen data'}`}
          >
            {d.energy !== null ? (
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${(d.energy / 5) * 100}%`,
                  background: 'var(--c-solid)',
                  opacity: 0.7 + 0.06 * d.energy,
                }}
              />
            ) : (
              <div className="w-full h-1 rounded-sm bg-stone-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
