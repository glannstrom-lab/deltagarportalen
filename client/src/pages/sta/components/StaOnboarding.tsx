/**
 * StaOnboarding — intro-flöde för Steg till arbete.
 *
 * Visas som card-trigger i översikten när onboarding_completed_at är NULL.
 * När deltagaren startar flödet öppnas en multi-step modal:
 *   1. Välkommen — vad är Steg till arbete?
 *   2. De fyra delarna — översikt och tidslinje
 *   3. Aktivitetsomfattning — välj 10-40h
 *   4. Startdatum — bekräfta eller justera
 *   5. Klart — kort sammanfattning
 *
 * Vid "Klar" anropas onComplete som markerar onboarding_completed_at + sparar
 * weekly_hours och startdatum. Preview-läge: spara hoppas över men flödet
 * går att klicka igenom för att utforska.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CloseButton } from '@/components/ui/Button'
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Clock,
  CalendarDays,
  CheckCircle2,
  Briefcase,
  Heart,
  Building2,
  Award,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { hoursToDays } from './WeeklyHoursEditor'

const SWEDISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function fmtShortSv(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}

const PARTS_BRIEF = [
  { id: 1, icon: Sparkles, title: 'Lära känna dig', duration: '3 veckor', what: 'Vi tittar tillsammans på vad du har med dig och vad du behöver.' },
  { id: 2, icon: Briefcase, title: 'Prova på', duration: '5 veckor', what: 'Du provar arbetsuppgifter i en lugn miljö för att hitta vad som passar.' },
  { id: 3, icon: Heart, title: 'Stärka och utveckla', duration: 'upp till 6 mån', what: 'Vi hittar ditt yrkesområde och du provar på en riktig arbetsplats.' },
  { id: 4, icon: Building2, title: 'Hitta arbetsplats', duration: 'upp till 6 mån', what: 'Vi hittar en arbetsplats där du kan landa stabilt.' },
] as const

// =============================================================================
// CARD-TRIGGER — visas i översikten när onboarding inte är klart
// =============================================================================

export function StaOnboardingTrigger({ firstName, onStart }: { firstName: string; onStart: () => void }) {
  return (
    <Card
      variant="flat"
      padding="lg"
      className="border-l-4"
      style={{ background: 'var(--c-bg)', borderLeftColor: 'var(--c-solid)' }}
    >
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--c-accent)', color: 'var(--c-text)' }}
        >
          <Sparkles size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--c-text)' }}>
            Börja här
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mt-0.5">
            {firstName ? `Välkommen, ${firstName}` : 'Välkommen'} — en kort introduktion
          </h3>
          <p className="text-sm text-stone-700 mt-1 max-w-2xl">
            Tar runt 3 minuter. Vi går igenom vad Steg till arbete är, hur mycket du vill delta
            varje vecka och när din resa startar. Du kan ändra allt senare.
          </p>
          <Button variant="primary" size="sm" className="mt-3" onClick={onStart}>
            Starta introduktion
          </Button>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// MODAL — multi-step intro
// =============================================================================

interface OnboardingModalProps {
  open: boolean
  firstName: string
  initialWeeklyHours: number
  initialStartedAt: string
  onClose: () => void
  /**
   * Anropas när deltagaren klickar "Klar" på sista steget.
   * Returnerar de slutgiltiga värdena så caller kan spara via RPC.
   * Vid preview kallas inte alls (caller passerar in stängningslogik).
   */
  onComplete: (input: { weeklyHours: number; startedAt: string }) => Promise<void>
  /** Vid preview: visa flödet men knappen heter "Stäng" istället för "Klar". */
  readOnly?: boolean
}

type Step = 'welcome' | 'parts' | 'hours' | 'startdate' | 'done'

const STEPS: Step[] = ['welcome', 'parts', 'hours', 'startdate', 'done']

export function StaOnboardingModal({
  open,
  firstName,
  initialWeeklyHours,
  initialStartedAt,
  onClose,
  onComplete,
  readOnly = false,
}: OnboardingModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('welcome')
  const [weeklyHours, setWeeklyHours] = useState(initialWeeklyHours)
  const [startedAt, setStartedAt] = useState(initialStartedAt)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const stepIdx = STEPS.indexOf(step)
  const totalSteps = STEPS.length
  const goNext = () => {
    const next = STEPS[stepIdx + 1]
    if (next) setStep(next)
  }
  const goBack = () => {
    const prev = STEPS[stepIdx - 1]
    if (prev) setStep(prev)
  }

  const handleFinish = async () => {
    setSaving(true)
    setError(null)
    try {
      if (!readOnly) {
        await onComplete({ weeklyHours, startedAt })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara — försök igen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        data-domain="action"
        className="w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full"
              style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
            >
              <Sparkles size={14} />
            </span>
            <div>
              <div id="onboarding-title" className="font-semibold text-sm text-stone-900">
                Introduktion till Steg till arbete
              </div>
              <div className="text-xs text-stone-500">Steg {stepIdx + 1} av {totalSteps}</div>
            </div>
          </div>
          <CloseButton onClick={onClose} aria-label={t('sta.aria.closeIntro', 'Stäng introduktionen')} />
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-stone-100">
          <div
            className="h-full transition-all"
            style={{
              width: `${((stepIdx + 1) / totalSteps) * 100}%`,
              background: 'var(--c-solid)',
            }}
          />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'welcome' && <StepWelcome firstName={firstName} />}
          {step === 'parts' && <StepParts />}
          {step === 'hours' && (
            <StepHours value={weeklyHours} onChange={setWeeklyHours} />
          )}
          {step === 'startdate' && (
            <StepStartdate value={startedAt} onChange={setStartedAt} />
          )}
          {step === 'done' && (
            <StepDone
              firstName={firstName}
              weeklyHours={weeklyHours}
              startedAt={startedAt}
              readOnly={readOnly}
            />
          )}
        </div>

        {/* Footer / nav */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-stone-100 bg-stone-50">
          {stepIdx > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={saving}
              leftIcon={<ChevronLeft size={14} />}
            >
              Tillbaka
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {error && <span className="text-xs text-rose-700">{error}</span>}
            {step !== 'done' && (
              <Button
                variant="primary"
                size="sm"
                onClick={goNext}
                rightIcon={<ChevronRight size={14} />}
              >
                {step === 'welcome' && 'Visa de fyra delarna'}
                {step === 'parts' && 'Sätt aktivitetsomfattning'}
                {step === 'hours' && 'Bekräfta startdatum'}
                {step === 'startdate' && 'Klar att börja'}
              </Button>
            )}
            {step === 'done' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinish}
                isLoading={saving}
                rightIcon={<CheckCircle2 size={14} />}
              >
                {readOnly ? 'Stäng introduktionen' : 'Sätt igång'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STEPS
// =============================================================================

function StepWelcome({ firstName }: { firstName: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-900">
        {firstName ? `Hej ${firstName}` : 'Hej'} — kul att du är här
      </h2>
      <p className="text-stone-700 mt-2 max-w-2xl">
        Steg till arbete är en tjänst från Arbetsförmedlingen där vi tar oss tid att förstå dig
        innan vi pratar om jobb. Tonen är lugn. Du går i din egen takt. Du kan pausa.
      </p>
      <div
        className="mt-4 p-4 rounded-xl"
        style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
      >
        <div className="text-xs uppercase tracking-wide font-medium">Tre saker att veta</div>
        <ul className="mt-2 space-y-1.5 text-sm text-stone-800">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--c-solid)' }} />
            <span><strong>Du bestämmer tempot.</strong> Du väljer hur många timmar du deltar varje vecka (10–40).</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--c-solid)' }} />
            <span><strong>Du gör inget ensam.</strong> Din konsulent finns med hela vägen.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--c-solid)' }} />
            <span><strong>Det är okej att ha jobbiga dagar.</strong> Sjukanmäl dig direkt här — vi hör av oss.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function StepParts() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-900">Resan i fyra delar</h2>
      <p className="text-stone-700 mt-2">
        Du börjar i Del 1. När du är klar går vi vidare tillsammans. Varje del har sin egen tid
        — det är inte en kapplöpning.
      </p>
      <div className="mt-4 space-y-2">
        {PARTS_BRIEF.map((p) => {
          const Icon = p.icon
          return (
            <div
              key={p.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-white"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900 text-sm">Del {p.id} — {p.title}</span>
                  <span className="text-xs text-stone-500">{p.duration}</span>
                </div>
                <p className="text-sm text-stone-700 mt-0.5">{p.what}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepHours({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const daysPerWeek = hoursToDays(value)
  const hoursPerDay = (value / daysPerWeek).toFixed(1)
  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
        <Clock size={20} style={{ color: 'var(--c-text)' }} />
        Hur mycket vill du delta i veckan?
      </h2>
      <p className="text-stone-700 mt-2 max-w-2xl">
        Du väljer mellan 10 och 40 timmar i veckan. Schemat anpassas så att det inte blir för
        mycket på en gång — vi siktar på max 8 timmar per dag.
      </p>

      <div className="mt-5 p-5 rounded-xl bg-stone-50 border border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="onb-hours" className="text-sm font-medium text-stone-700">
            Aktivitetsomfattning
          </label>
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-base font-semibold"
            style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
          >
            {value} h/vecka
          </span>
        </div>
        <input
          id="onb-hours"
          type="range"
          min={10}
          max={40}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[var(--c-solid)]"
        />
        <div className="flex justify-between text-[11px] text-stone-500 mt-1">
          <span>10 h</span>
          <span>20 h</span>
          <span>30 h</span>
          <span>40 h</span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">Schema</div>
            <div className="text-sm text-stone-900 mt-0.5">
              <strong>{daysPerWeek}</strong> dagar i veckan, ca <strong>{hoursPerDay}</strong> tim/dag
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">Du kan ändra</div>
            <div className="text-sm text-stone-900 mt-0.5">När som helst — säg också till din konsulent.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepStartdate({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
        <CalendarDays size={20} style={{ color: 'var(--c-text)' }} />
        När vill du starta?
      </h2>
      <p className="text-stone-700 mt-2 max-w-2xl">
        Det här är ditt startdatum för Steg till arbete. Räknaren för dagsslinga och delar utgår
        från det här datumet. Du kan flytta fram det om du behöver.
      </p>

      <div className="mt-5 p-5 rounded-xl bg-stone-50 border border-stone-200">
        <label htmlFor="onb-date" className="block text-sm font-medium text-stone-700 mb-2">
          Startdatum
        </label>
        <input
          id="onb-date"
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white"
        />
        <p className="text-xs text-stone-600 mt-3">
          Datumet du har idag är{' '}
          <span className="font-medium text-stone-900">{fmtShortSv(value)}</span>. Du kan justera
          det när som helst senare via hero på sidan.
        </p>
      </div>
    </div>
  )
}

function StepDone({
  firstName,
  weeklyHours,
  startedAt,
  readOnly,
}: {
  firstName: string
  weeklyHours: number
  startedAt: string
  readOnly: boolean
}) {
  const daysPerWeek = hoursToDays(weeklyHours)
  return (
    <div>
      <div className="flex items-center gap-2 text-emerald-700">
        <Award size={20} />
        <span className="text-sm font-medium uppercase tracking-wide">Klart</span>
      </div>
      <h2 className="text-xl font-semibold text-stone-900 mt-1">
        {firstName ? `Då är du redo, ${firstName}` : 'Då är du redo'}
      </h2>
      <p className="text-stone-700 mt-2 max-w-2xl">
        Här är vad du valt. Du kan ändra allt under inställningar eller direkt i hero på sidan.
      </p>

      <div className="mt-4 space-y-2">
        <SummaryRow icon={Clock} label="Aktivitetsomfattning" value={`${weeklyHours} h/vecka (${daysPerWeek} dagar)`} />
        <SummaryRow icon={CalendarDays} label="Startdatum" value={fmtShortSv(startedAt)} />
      </div>

      {readOnly ? (
        <p
          className="mt-4 p-3 rounded-xl text-sm"
          style={{ background: 'var(--header-bg)', color: 'var(--c-text)' }}
        >
          Du är i förhandsvisning — dina val sparas inte. När din konsulent kopplat dig kan du
          köra om introduktionen och spara.
        </p>
      ) : (
        <p
          className="mt-4 p-3 rounded-xl text-sm"
          style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
        >
          När du klickar "Sätt igång" sparas dina val och introduktionen markeras som klar.
        </p>
      )}
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
      >
        <Icon size={16} />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-stone-500 font-medium">{label}</div>
        <div className="text-sm font-medium text-stone-900">{value}</div>
      </div>
    </div>
  )
}

// Mark cn import used (avoid eslint unused) — preserved for future styling extensions.
void cn
