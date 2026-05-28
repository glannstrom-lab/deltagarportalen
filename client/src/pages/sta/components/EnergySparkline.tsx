/**
 * EnergySparkline — visar pulse_checks senaste 14 dagarna som emoji-mönster.
 *
 * Plats: Översikt-vyn. Inte en tävling — bara observation. Hjälper deltagaren
 * se sina egna mönster och ger AT samtalsunderlag.
 *
 * Design: 14 små cirklar i rad. Varje cirkel = en dag. Emoji-skugga via mood,
 * fyllningsgrad via energy_level. Tomma dagar visas som ljusgrå punkter.
 */

import { useMemo } from 'react'
import { Activity } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { StaPulseCheck, Mood } from '@/services/staApi'

const SWEDISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const
const SHORT_WEEKDAY = ['s', 'm', 't', 'o', 't', 'f', 'l'] as const

interface DayPoint {
  date: Date
  iso: string
  pulse: StaPulseCheck | null
}

interface Props {
  pulseChecks: StaPulseCheck[]
  /** Antal dagar bakåt att visa (default 14) */
  days?: number
}

export function EnergySparkline({ pulseChecks, days = 14 }: Props) {
  const points = useMemo((): DayPoint[] => {
    const byIso = new Map<string, StaPulseCheck>()
    for (const p of pulseChecks) byIso.set(p.check_date, p)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const out: DayPoint[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const iso = isoDate(d)
      out.push({ date: d, iso, pulse: byIso.get(iso) ?? null })
    }
    return out
  }, [pulseChecks, days])

  const filledCount = points.filter((p) => p.pulse).length
  const totalEnergy = points.reduce((sum, p) => sum + (p.pulse?.energy_level ?? 0), 0)
  const avgEnergy = filledCount > 0 ? totalEnergy / filledCount : 0

  return (
    <Card variant="flat" padding="md">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: 'var(--c-solid)' }} />
          <h3 className="text-sm font-semibold text-stone-900">Din energi senaste {days} dagarna</h3>
        </div>
        {filledCount > 0 && (
          <span className="text-[11px] text-stone-500">
            {filledCount} av {days} dagar · snitt {avgEnergy.toFixed(1)}/5
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5 sm:gap-2">
        {points.map((p) => (
          <DayCell key={p.iso} point={p} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 flex-wrap text-[11px] text-stone-500">
        <span>← {formatShortSv(points[0].date)}</span>
        <span className="flex-1 text-center">
          {filledCount === 0
            ? 'Börja med en pulse-check så börjar mönstret växa fram.'
            : 'Ingen tävling — bara en bild av hur du haft det.'}
        </span>
        <span>idag →</span>
      </div>
    </Card>
  )
}

function DayCell({ point }: { point: DayPoint }) {
  const dow = point.date.getDay()
  const isToday = isSameDay(point.date, new Date())
  const energy = point.pulse?.energy_level ?? null
  const mood = point.pulse?.mood ?? null

  // Visual encoding:
  //   - Höjd på stapeln = energy_level (1-5)
  //   - Färg från mood
  //   - Tom dag = ljusgrå låg stapel
  const heightPx = energy ? 8 + energy * 6 : 6 // 14-38px
  const bgColor = energy ? moodColor(mood, energy) : '#E7E5E1'
  const opacity = energy ? 1 : 0.5

  const title = energy
    ? `${pointDateLabel(point.date)}: energi ${energy}/5${mood ? ' · ' + moodLabel(mood) : ''}${point.pulse?.comment ? '\n"' + point.pulse.comment + '"' : ''}`
    : `${pointDateLabel(point.date)}: ingen pulse-check`

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div
        className={cn(
          'w-full rounded-md transition-all',
          isToday && 'ring-2 ring-offset-1',
        )}
        style={{
          height: `${heightPx}px`,
          background: bgColor,
          opacity,
          ['--tw-ring-color' as string]: 'var(--c-solid)',
        }}
        title={title}
      />
      <div className={cn('text-[10px]', isToday ? 'font-semibold text-stone-700' : 'text-stone-400')}>
        {SHORT_WEEKDAY[dow]}
      </div>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function moodColor(mood: Mood | null, energy: number): string {
  // För starka emotionella signaler, använd mood-färg. Annars härled från energy.
  switch (mood) {
    case 'great': return '#86EFAC' // ljusgrön
    case 'okay': return '#BBF7D0'  // mjukgrön
    case 'soso': return '#FED7AA'  // persika
    case 'tough': return '#FCA5A5' // ljusrosa-röd
    case 'bad': return '#FCA5A5'
    default:
      // Bara energy: ljus→mörk grön när högre
      if (energy >= 4) return '#86EFAC'
      if (energy >= 3) return '#BBF7D0'
      if (energy >= 2) return '#FED7AA'
      return '#FCA5A5'
  }
}

function moodLabel(m: Mood): string {
  switch (m) {
    case 'great': return 'stark'
    case 'okay': return 'okej'
    case 'soso': return 'sådär'
    case 'tough': return 'jobbigt'
    case 'bad': return 'tungt'
    default: return ''
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function formatShortSv(d: Date): string {
  return `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}

function pointDateLabel(d: Date): string {
  const today = new Date()
  if (isSameDay(d, today)) return 'idag'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(d, yesterday)) return 'igår'
  return formatShortSv(d)
}
