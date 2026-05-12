/**
 * WeeklyCheckinForm — deltagarens fredagsavslutning
 *
 * Visas på STA-Översikt från och med torsdag eftermiddag.
 * 4 frågor, tar 2 minuter. Sparas till sta_weekly_checkins.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, Sparkles } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { VoiceInput } from './VoiceInput'
import type { Mood, StaWeeklyCheckin } from '@/services/staApi'
import { getCurrentWeekMonday } from '@/hooks/useSta'

const MOOD_OPTIONS: Array<{ value: Mood; emoji: string; label: string }> = [
  { value: 'great', emoji: '🌤️', label: 'Riktigt bra' },
  { value: 'okay', emoji: '🙂', label: 'Okej' },
  { value: 'soso', emoji: '😐', label: 'Sådär' },
  { value: 'tough', emoji: '😞', label: 'Tungt' },
  { value: 'bad', emoji: '🌧️', label: 'Dåligt' },
]

interface WeeklyCheckinFormProps {
  existingForThisWeek?: StaWeeklyCheckin
  onSubmit: (input: {
    week_starts: string
    overall_mood?: Mood
    best_thing?: string
    hardest_thing?: string
    question_for_consultant?: string
  }) => Promise<unknown>
  consultantFirstName?: string
}

export function WeeklyCheckinForm({
  existingForThisWeek,
  onSubmit,
  consultantFirstName,
}: WeeklyCheckinFormProps) {
  const [mood, setMood] = useState<Mood | null>(existingForThisWeek?.overall_mood ?? null)
  const [bestThing, setBestThing] = useState(existingForThisWeek?.best_thing ?? '')
  const [hardestThing, setHardestThing] = useState(existingForThisWeek?.hardest_thing ?? '')
  const [question, setQuestion] = useState(existingForThisWeek?.question_for_consultant ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({
        week_starts: getCurrentWeekMonday(),
        overall_mood: mood ?? undefined,
        best_thing: bestThing.trim() || undefined,
        hardest_thing: hardestThing.trim() || undefined,
        question_for_consultant: question.trim() || undefined,
      })
      setJustSaved(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (justSaved) {
    return (
      <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-center gap-3">
          <Sparkles size={20} style={{ color: 'var(--c-solid)' }} />
          <div>
            <div className="font-semibold text-stone-900">Tack för veckans avslut</div>
            <div className="text-sm text-stone-600">
              {consultantFirstName ?? 'Din konsulent'} läser detta när hen är tillbaka.
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="flat" padding="lg">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 size={20} style={{ color: 'var(--c-solid)' }} />
        <h3 className="text-base font-semibold text-stone-900">Veckans avslut</h3>
      </div>
      <p className="text-sm text-stone-600 mb-4">
        Fyra frågor som tar 2 minuter. Det blir grund för hur vi planerar nästa vecka.
      </p>

      {/* Q1: Mood */}
      <div className="mb-5">
        <label className="text-sm font-medium text-stone-900 block mb-2">
          1. Hur har veckan känts?
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = mood === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMood(isSelected ? null : opt.value)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border-2 transition-colors',
                  isSelected
                    ? 'text-white border-transparent'
                    : 'bg-white border-stone-200 text-stone-700',
                )}
                style={isSelected ? { background: 'var(--c-solid)' } : undefined}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Q2: Best thing */}
      <div className="mb-5">
        <label className="text-sm font-medium text-stone-900 block mb-2">
          2. Vad var bäst denna vecka?
        </label>
        <VoiceInput
          value={bestThing}
          onChange={setBestThing}
          placeholder="T.ex. 'Jag klarade dag 7 om sömn och började sova bättre.'"
          rows={2}
        />
      </div>

      {/* Q3: Hardest thing */}
      <div className="mb-5">
        <label className="text-sm font-medium text-stone-900 block mb-2">
          3. Vad var jobbigast?
        </label>
        <VoiceInput
          value={hardestThing}
          onChange={setHardestThing}
          placeholder="T.ex. 'Det var svårt att komma igång på måndag morgon.'"
          rows={2}
        />
      </div>

      {/* Q4: Question */}
      <div className="mb-5">
        <label className="text-sm font-medium text-stone-900 block mb-2">
          4. En fråga till {consultantFirstName ?? 'din konsulent'}? <span className="text-xs text-stone-500">(frivilligt)</span>
        </label>
        <VoiceInput
          value={question}
          onChange={setQuestion}
          placeholder="T.ex. 'Kan vi prata om hur jag ska göra om jag mår dåligt en dag?'"
          rows={2}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
          Skicka in veckan
        </Button>
      </div>
    </Card>
  )
}
