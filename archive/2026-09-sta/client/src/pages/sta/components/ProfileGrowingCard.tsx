/**
 * ProfileGrowingCard — "Din profil växer fram"
 *
 * Insiktssammanfattning på Översikt. Sammanställer:
 *   - Styrkor från quick_notes (3-5 st)
 *   - Topp 1-3 mönster från pulse checks
 *   - Senaste reflektioner från dagsslinga och arbetsstationer
 *   - Fokusyrke om satt
 *
 * Allt data finns redan i DB — komponenten gör bara presentationen.
 * Syfte: motverka känslan "ingenting händer" — deltagaren ser sin egen
 * utveckling kondenserat på ett kort.
 */

import { useMemo } from 'react'
import { Sparkles, Activity, Target, MessageSquare } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import type { StaPulseCheck, StaQuickNote, StaActivity, Mood } from '@/services/staApi'

const SWEDISH_WEEKDAY_LONG = ['söndagar', 'måndagar', 'tisdagar', 'onsdagar', 'torsdagar', 'fredagar', 'lördagar'] as const
const SWEDISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const

interface Props {
  consultantFirstName: string
  pulseChecks: StaPulseCheck[]
  quickNotes: StaQuickNote[]
  activities: StaActivity[]
  focusOccupation: string | null
}

interface PulseInsight {
  kind: 'best-day' | 'trend' | 'consistency' | 'mood'
  text: string
}

export function ProfileGrowingCard({
  consultantFirstName,
  pulseChecks,
  quickNotes,
  activities,
  focusOccupation,
}: Props) {
  // Styrkor: quick_notes som är delade med deltagaren ELLER skrivna av deltagaren
  // (consultant_only kanske vi inte vill visa här, men för MVP visar vi alla med body)
  const strengths = useMemo(() => {
    return quickNotes
      .filter((n) => n.body && n.body.trim().length > 0)
      .slice(0, 5)
      .map((n) => ({ id: n.id, text: n.body!.trim() }))
  }, [quickNotes])

  // Reflektioner: aktiviteter med participant_reflection, senaste 3
  const reflections = useMemo(() => {
    return activities
      .filter((a) => a.participant_reflection && a.participant_reflection.trim().length > 0)
      .sort((a, b) => {
        const aDate = a.completed_at ?? a.scheduled_for ?? a.updated_at
        const bDate = b.completed_at ?? b.scheduled_for ?? b.updated_at
        return (bDate || '').localeCompare(aDate || '')
      })
      .slice(0, 3)
      .map((a) => ({
        id: a.id,
        text: a.participant_reflection!.trim(),
        when: a.completed_at ?? a.scheduled_for ?? null,
        kind: a.activity_type,
      }))
  }, [activities])

  const insights = useMemo(() => derivePulseInsights(pulseChecks), [pulseChecks])

  const hasContent =
    strengths.length > 0 ||
    reflections.length > 0 ||
    insights.length > 0 ||
    !!focusOccupation

  return (
    <Card variant="flat" padding="lg" className="lg:col-span-2" style={{ background: 'var(--c-bg)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--c-text)' }}>
            Din profil
          </div>
          <h2 className="text-lg font-semibold text-stone-900 mt-0.5 flex items-center gap-2">
            <Sparkles size={18} style={{ color: 'var(--c-solid)' }} />
            Din profil växer fram
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Det här är vad vi sett av dig hittills. Bilden blir tydligare för varje dag —
            både för dig och för {consultantFirstName}.
          </p>
        </div>
      </div>

      {!hasContent && (
        <p className="text-sm text-stone-600">
          Bilden av dig växer fram när du gör övningar och prata med {consultantFirstName}.
          Det här kortet fylls på automatiskt.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Styrkor */}
        {strengths.length > 0 && (
          <Section
            icon={<Sparkles size={14} style={{ color: 'var(--c-solid)' }} />}
            title="Styrkor som syns"
          >
            <ul className="space-y-1.5 text-sm">
              {strengths.map((s) => (
                <li key={s.id} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--c-solid)' }}
                  />
                  <span className="text-stone-700">{s.text}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-stone-500 mt-2">
              {consultantFirstName} fyller på listan när ni pratas vid.
            </p>
          </Section>
        )}

        {/* Pulse-mönster */}
        {insights.length > 0 && (
          <Section
            icon={<Activity size={14} style={{ color: 'var(--c-solid)' }} />}
            title="Vad pulsen visar"
          >
            <ul className="space-y-1.5 text-sm">
              {insights.map((i, idx) => (
                <li key={`${i.kind}-${idx}`} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--c-solid)' }}
                  />
                  <span className="text-stone-700">{i.text}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Reflektioner */}
        {reflections.length > 0 && (
          <Section
            icon={<MessageSquare size={14} style={{ color: 'var(--c-solid)' }} />}
            title="Senaste du skrivit"
          >
            <ul className="space-y-2 text-sm">
              {reflections.map((r) => (
                <li key={r.id}>
                  <div className="text-stone-700 italic">"{r.text.slice(0, 140)}{r.text.length > 140 ? '…' : ''}"</div>
                  {r.when && (
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {formatShortSv(r.when)} · {labelForActivityType(r.kind)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Fokusyrke */}
        {focusOccupation && (
          <Section
            icon={<Target size={14} style={{ color: 'var(--c-solid)' }} />}
            title="Mitt fokusyrke"
          >
            <div className="text-sm text-stone-900 font-medium">{focusOccupation}</div>
            <p className="text-[11px] text-stone-500 mt-1">
              Bestäms tillsammans i Del 1–2 och styr vad ni provar i Del 3.
            </p>
          </Section>
        )}
      </div>
    </Card>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="p-3 rounded-lg bg-white">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h3 className="text-xs uppercase tracking-wide font-semibold text-stone-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ============================================================
// Pulse-mönster — enkel statistik
// ============================================================

function derivePulseInsights(pulses: StaPulseCheck[]): PulseInsight[] {
  if (pulses.length < 3) {
    return [] // för få datapunkter
  }

  const insights: PulseInsight[] = []
  const withEnergy = pulses.filter((p) => typeof p.energy_level === 'number')

  // Bästa veckodagen för energi (om >= 7 datapunkter)
  if (withEnergy.length >= 7) {
    const sums = new Array(7).fill(0)
    const counts = new Array(7).fill(0)
    for (const p of withEnergy) {
      const dow = new Date(p.check_date + 'T00:00:00').getDay()
      sums[dow] += p.energy_level!
      counts[dow] += 1
    }
    let bestDow = -1
    let bestAvg = -1
    for (let i = 0; i < 7; i++) {
      if (counts[i] < 2) continue
      const avg = sums[i] / counts[i]
      if (avg > bestAvg) {
        bestAvg = avg
        bestDow = i
      }
    }
    if (bestDow >= 0 && bestAvg >= 3.5) {
      insights.push({
        kind: 'best-day',
        text: `Du har ofta mest energi på ${SWEDISH_WEEKDAY_LONG[bestDow]}.`,
      })
    }
  }

  // Trend senaste 7 vs föregående 7
  if (withEnergy.length >= 10) {
    const sorted = [...withEnergy].sort((a, b) => a.check_date.localeCompare(b.check_date))
    const half = Math.floor(sorted.length / 2)
    const olderAvg = avg(sorted.slice(0, half).map((p) => p.energy_level!))
    const newerAvg = avg(sorted.slice(-half).map((p) => p.energy_level!))
    const diff = newerAvg - olderAvg
    if (Math.abs(diff) >= 0.5) {
      insights.push({
        kind: 'trend',
        text: diff > 0
          ? 'Din energi har trendat uppåt senaste tiden.'
          : 'Din energi har varit lite tyngre nu än för en tid sedan.',
      })
    }
  }

  // Mood — vad är vanligast
  const moods = pulses.map((p) => p.mood).filter((m): m is Mood => m !== null)
  if (moods.length >= 5) {
    const counts: Record<string, number> = {}
    for (const m of moods) counts[m] = (counts[m] ?? 0) + 1
    const topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (topMood && topMood[1] >= Math.max(3, Math.floor(moods.length * 0.4))) {
      const moodLabel = moodToHumanLabel(topMood[0] as Mood)
      if (moodLabel) {
        insights.push({
          kind: 'mood',
          text: `Du har oftast känt ${moodLabel} på sistone.`,
        })
      }
    }
  }

  return insights.slice(0, 3)
}

function moodToHumanLabel(m: Mood): string | null {
  switch (m) {
    case 'great': return 'dig stark'
    case 'okay': return 'dig okej'
    case 'soso': return 'dig sådär'
    case 'tough': return 'det jobbigt'
    case 'bad': return 'det riktigt tungt'
    default: return null
  }
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function formatShortSv(iso: string): string {
  const d = new Date(iso.length > 10 ? iso : iso + 'T00:00:00')
  return `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}

function labelForActivityType(t: string): string {
  switch (t) {
    case 'dagsslinga': return 'dagsövning'
    case 'arbetsstation': return 'arbetsstation'
    case 'arbetsprovning': return 'arbetsprövning'
    case 'samtal': return 'samtal'
    case 'kompetenskartlaggning': return 'kompetenskartläggning'
    case 'karriarvagledning': return 'karriärvägledning'
    case 'halsoaktivitet': return 'hälsoaktivitet'
    default: return 'aktivitet'
  }
}
