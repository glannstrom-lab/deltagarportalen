import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { PageLayout } from '@/components/layout/index'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  useParticipantEnrollment,
  useParticipantDoaAssessment,
  useStaPulseChecks,
  useStaWeeklyCheckin,
  useStaActivities,
  useStaConsultantProfile,
  useStaQuickNotes,
  useStaAbsences,
  useStaWorkplaces,
  getCurrentWeekMonday,
} from '@/hooks/useSta'
import type { StaPulseCheck, StaActivity, StaAssessment } from '@/services/staApi'
import { deriveCurrentPart, derivePartTimeline, formatShortDate } from './enrollmentDisplay'
import { PulseCheckWidget } from './components/PulseCheckWidget'
import { WeeklyCheckinForm } from './components/WeeklyCheckinForm'
import { WeeklyHoursEditor, activeDaysForHours } from './components/WeeklyHoursEditor'
import { AbsenceForm } from './components/AbsenceForm'
import { StaOnboardingTrigger, StaOnboardingModal } from './components/StaOnboarding'
import { KompetenskartlaggningForm } from './components/KompetenskartlaggningForm'
import { DoaSelfAssessment } from './components/DoaSelfAssessment'
import { ProfileGrowingCard } from './components/ProfileGrowingCard'
import { EnergySparkline } from './components/EnergySparkline'
import { PartTransitionCard } from './components/PartTransitionCard'
import { DOA } from './assessmentInstruments'
import { WorkplaceCard } from './components/WorkplaceCard'
import { WorkDiary } from './components/WorkDiary'
import { Del3PortalIntegration } from './components/Del3PortalIntegration'
import { Del4PortalIntegration } from './components/Del4PortalIntegration'
import { SelfTestEnrollmentButton } from './components/SelfTestEnrollmentButton'
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  MessageSquare,
  Sparkles,
  ChevronRight,
  BookOpen,
  Coffee,
  Sun,
  Moon,
  Activity,
  MapPin,
  Phone,
  Mic,
  FileUser,
  Building2,
  Target,
  Award,
  PencilLine,
  Info,
  Stethoscope,
  Lock,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import {
  STA_PARTS,
  DAILY_EXERCISES_DEL1,
  WORK_STATIONS,
  STA_RESOURCES,
  DAY_RESOURCES,
  WEEK_THEMES,
  getWeekForDay,
  type StaPart,
  type DailyExercise,
  type DayResource,
  type WeekTheme,
  type WorkStationDef,
  type StaResource,
} from './mockData'

// Alias kvar tills vi bytt namn på alla referenser
const DAGSSLINGA_DEL1 = DAILY_EXERCISES_DEL1

const WEEKDAY_LABELS: Array<'MÅN' | 'TIS' | 'ONS' | 'TOR' | 'FRE'> = ['MÅN', 'TIS', 'ONS', 'TOR', 'FRE']
const SWEDISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

// Dagar i dagsslingan som handlar om kropp/hälsa men inte är fysisk träning.
// Uppdraget förbjuder fysiska aktiviteter pga försäkringsfrågan — vi måste
// tydliggöra för deltagaren att övningen är kunskapsbaserad.
const KNOWLEDGE_ONLY_DAYS = new Set<number>([1, 8])

/** Räkna frånvaroanmälningar senaste 30 dagarna. */
function countAbsencesLast30Days(absences: import('@/services/staApi').StaAbsence[]): number {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceIso = since.toISOString().slice(0, 10)
  return absences.filter((a) => a.absence_date >= sinceIso).length
}

function isoDate(d: Date): string {
  // Använd lokal tid — toISOString() ger UTC, vilket flyttar datumet vid CEST.
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function todayIso(): string {
  return isoDate(new Date())
}

function formatShortSv(d: Date): string {
  return `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}

function formatLongSv(d: Date): string {
  const weekdays = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']
  return `${weekdays[d.getDay()]} ${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}

function mondayOfWeek(d: Date): Date {
  const dayOfWeek = d.getDay() // 0=sön
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - daysSinceMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Räkna ut "dag N av dagsslingan" för ett givet kalenderdatum, givet att
 * deltagaren startade på `startedAt`. Vi räknar bara vardagar (mån–fre) som
 * dagsslinga-dagar. Returnerar null om dagen inte hör till dagsslingan
 * (innan start eller helgdag).
 */
function dagsslingaDayForDate(startedAt: string, target: Date): number | null {
  if (target.getDay() === 0 || target.getDay() === 6) return null
  const targetIso = isoDate(target)
  const cursor = new Date(startedAt + 'T00:00:00')
  cursor.setHours(0, 0, 0, 0)
  let count = 0
  for (let i = 0; i < 90; i++) {
    const cursorIso = isoDate(cursor)
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      count += 1
      if (cursorIso === targetIso) return count
    }
    if (cursorIso > targetIso) return null
    cursor.setDate(cursor.getDate() + 1)
  }
  return null
}

/** Antal schemalagda dagar (vardagar mån–fre) i Del 1 — 3 veckor à 5 dagar. */
const DEL1_PROGRAM_DAYS = 15

/**
 * Hur många vardagar (mån–fre) har passerat sedan `startedAt`, inklusive idag?
 * Helger räknas inte. Stannar vid `max` (vi behöver aldrig veta mer än så) och
 * returnerar 0 om insatsen ännu inte börjat. Om idag är en helg räknas dagen
 * som senaste vardagen — räknaren hoppar alltså inte fram över helgen.
 */
function weekdaysSinceStart(startedAt: string, target: Date, max = DEL1_PROGRAM_DAYS): number {
  const start = new Date(startedAt + 'T00:00:00')
  start.setHours(0, 0, 0, 0)
  const end = new Date(target)
  end.setHours(0, 0, 0, 0)
  if (end < start) return 0
  let count = 0
  const cursor = new Date(start)
  while (cursor <= end && count < max) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

/** Kalenderdatum då den n:te vardagen (mån–fre) sedan `startedAt` inträffar. */
function dateForExerciseDay(startedAt: string, n: number): Date {
  const cursor = new Date(startedAt + 'T00:00:00')
  cursor.setHours(0, 0, 0, 0)
  let count = 0
  for (let i = 0; i < 200; i++) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      count += 1
      if (count === n) return new Date(cursor)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return cursor
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '–'
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type TabId = 'oversikt' | 'del-1' | 'del-2' | 'del-3' | 'del-4'

const TABS: Array<{ id: TabId; label: string; partIndex?: StaPart }> = [
  { id: 'oversikt', label: 'Översikt' },
  { id: 'del-1', label: 'Del 1 — Lära känna dig', partIndex: 1 },
  { id: 'del-2', label: 'Del 2 — Prova på', partIndex: 2 },
  { id: 'del-3', label: 'Del 3 — Stärka och utveckla', partIndex: 3 },
  { id: 'del-4', label: 'Del 4 — Hitta arbetsplats', partIndex: 4 },
]

export default function StaParticipant() {
  const { profile } = useAuthStore()
  const firstName = profile?.first_name || ''
  const [tab, setTab] = useState<TabId>('oversikt')

  const {
    enrollment,
    loading: enrollmentLoading,
    reload: reloadEnrollment,
    updateStartDate,
    updateWeeklyHours,
    markOnboardingDone,
  } = useParticipantEnrollment()
  const enrollmentId = enrollment?.id ?? null
  const { activities, markDayComplete } = useStaActivities(enrollmentId, 1)
  const { activities: activitiesPart2, reload: reloadPart2 } = useStaActivities(enrollmentId, 2)
  const { profile: consultantProfile } = useStaConsultantProfile(enrollmentId)
  const { pulses } = useStaPulseChecks(enrollmentId)
  const { notes: sharedNotes } = useStaQuickNotes(enrollmentId)
  const { absences, report: reportAbsence, remove: removeAbsence } = useStaAbsences(enrollmentId)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  const completedKeys = useMemo(
    () => new Set(activities.filter((a) => a.completed_at).map((a) => a.activity_key)),
    [activities],
  )

  // Härled vyn helt från riktig DB-data. Saknas enrollment visas tomtillstånd.
  const viewModel = useMemo((): ParticipantViewModel | null => {
    if (!enrollment) return null

    // Program-dag: var i de 3 veckorna (15 vardagar) deltagaren är just nu,
    // räknat från startdatum. Detta är räknaren i "Just nu"-kortet — den speglar
    // tid i insatsen, inte hur många övningar man hunnit göra.
    const programDay = Math.max(1, weekdaysSinceStart(enrollment.started_at, new Date()))
    const currentDay = programDay
    const totalDays = DEL1_PROGRAM_DAYS

    // Dagens övning = den som är schemalagd för aktuell program-dag (1–14, så
    // räknaren och dagens övning visar samma dag). Tidigare dagar som inte
    // gjorts når man via dagsslingan nedan.
    const currentExerciseDay = Math.min(programDay, DAGSSLINGA_DEL1.length)

    const consultantName = consultantProfile
      ? `${consultantProfile.first_name ?? ''} ${consultantProfile.last_name ?? ''}`.trim() || 'Din konsulent'
      : 'Din konsulent'

    // Reflektioner per dag — bygg från sta_activities
    const reflectionByDay = new Map<number, string>()
    activities.forEach((a) => {
      if (a.activity_key?.startsWith('dag-') && a.participant_reflection) {
        const dayNum = parseInt(a.activity_key.replace('dag-', ''), 10)
        if (Number.isFinite(dayNum)) reflectionByDay.set(dayNum, a.participant_reflection)
      }
    })

    // Daglig dagsslinga med beräknad status + progressiv upplåsning.
    // Vi öppnar en dag i taget: dagens dag och passerade dagar är öppna,
    // framtida dagar är låsta tills de schemaläggs (så det inte blir för mycket).
    const dailyExercises: DailyExercise[] = DAGSSLINGA_DEL1.map((d) => {
      const key = `dag-${d.day}`
      const isCompleted = completedKeys.has(key)
      const locked = !isCompleted && d.day > currentExerciseDay
      let status: DailyExercise['status'] = 'upcoming'
      if (isCompleted) status = 'completed'
      else if (d.day === currentExerciseDay) status = 'today'
      else if (d.day === currentExerciseDay + 1) status = 'tomorrow'

      let unlockLabel: string | undefined
      if (locked) {
        unlockLabel =
          d.day === currentExerciseDay + 1
            ? 'imorgon'
            : formatShortSv(dateForExerciseDay(enrollment.started_at, d.day))
      }

      return {
        day: d.day,
        title: d.title,
        shortTitle: d.shortTitle,
        durationMin: d.durationMin,
        status,
        reflection: reflectionByDay.get(d.day),
        scheduledFor: status === 'today' ? 'Idag' : undefined,
        locked,
        unlockLabel,
      }
    })

    // Veckans plan: dagar mån–fre av nuvarande vecka
    // Aktivitetsomfattning styr vilka dagar deltagaren faktiskt är på plats.
    const monday = mondayOfWeek(new Date())
    const activeDays = activeDaysForHours(enrollment.weekly_hours)
    const weekPlan: Array<{
      weekday: 'MÅN' | 'TIS' | 'ONS' | 'TOR' | 'FRE'
      date: string
      title: string
      meta: string
      status: 'done' | 'today' | 'upcoming' | 'rest'
    }> = WEEKDAY_LABELS.map((label, idx) => {
      const dayDate = new Date(monday)
      dayDate.setDate(monday.getDate() + idx)
      const dagsslingaDay = dagsslingaDayForDate(enrollment.started_at, dayDate)
      const dayDef = dagsslingaDay ? DAGSSLINGA_DEL1.find((d) => d.day === dagsslingaDay) : null
      const isToday = isoDate(dayDate) === todayIso()
      const isCompleted = dagsslingaDay ? completedKeys.has(`dag-${dagsslingaDay}`) : false
      const isActive = activeDays.has(idx)

      let title: string
      let meta: string
      let status: 'done' | 'today' | 'upcoming' | 'rest'

      if (!isActive) {
        title = 'Ledig dag'
        meta = `Du är inte på plats — ${enrollment.weekly_hours} h/vecka`
        status = 'rest'
      } else if (dayDef) {
        title = `Dag ${dayDef.day} — ${dayDef.title}`
        meta = `${isToday ? 'Idag' : 'Övning'} · ${dayDef.durationMin} min`
        status = isCompleted ? 'done' : isToday ? 'today' : 'upcoming'
      } else if (dagsslingaDay && dagsslingaDay > DAGSSLINGA_DEL1.length) {
        title = 'Klar med Del 1'
        meta = 'Vänta på Del 2'
        status = isCompleted ? 'done' : isToday ? 'today' : 'upcoming'
      } else {
        title = 'Innan start'
        meta = `Insatsen börjar ${formatShortSv(new Date(enrollment.started_at + 'T00:00:00'))}`
        status = 'upcoming'
      }

      return {
        weekday: label,
        date: isToday ? 'Idag' : formatShortSv(dayDate),
        title,
        meta,
        status,
      }
    })

    // Dagens aktivitet
    const todayDef = DAGSSLINGA_DEL1.find((d) => d.day === currentExerciseDay)
    const todayActivity = todayDef
      ? {
          day: todayDef.day,
          title: todayDef.title,
          description: `En kort genomgång och en övning. Tar runt ${todayDef.durationMin} minuter. Du kan göra den i din egen takt.`,
          timeRange: `${todayDef.durationMin} min`,
          href: `/steg-till-arbete/dag/${todayDef.day}`,
        }
      : null

    // Styrkor från delade quick_notes
    const strengths = sharedNotes
      .filter((n) => n.body && n.body.trim().length > 0)
      .slice(0, 5)
      .map((n) => ({ text: n.body!.trim() }))

    // Senaste reflektionen från pulse_checks
    const latestPulse: StaPulseCheck | null = pulses[0] ?? null
    const moodEmoji = (m: string | null): string => {
      switch (m) {
        case 'great': return '🌤️'
        case 'okay': return '🙂'
        case 'soso': return '😐'
        case 'tough': return '😞'
        case 'bad': return '😞'
        default: return ''
      }
    }
    const recentReflection = latestPulse && latestPulse.comment
      ? {
          mood: moodEmoji(latestPulse.mood),
          text: latestPulse.comment,
          at: latestPulse.check_date,
        }
      : null

    // Nästa konsulent-möte: nästa 'samtal'-aktivitet i framtiden
    const today = todayIso()
    const nextMeeting = activities.find(
      (a) => a.activity_type === 'samtal' && a.scheduled_for && a.scheduled_for >= today,
    )
    const nextMeetingLabel = nextMeeting?.scheduled_for
      ? formatLongSv(new Date(nextMeeting.scheduled_for + 'T00:00:00'))
      : 'Ingen tid bokad än'

    return {
      firstName: firstName || '',
      currentPart: deriveCurrentPart(enrollment),
      currentDay,
      currentExerciseDay,
      totalDays,
      startedAt: enrollment.started_at,
      partStartedAt: enrollment.part_started_at,
      weeklyHours: enrollment.weekly_hours,
      onboardingCompleted: !!enrollment.onboarding_completed_at,
      focusOccupation: enrollment.focus_occupation,
      adaptations: enrollment.adaptations
        ? enrollment.adaptations.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
        : [],
      languageSupport: enrollment.language_support ?? [],
      consultant: {
        name: consultantName,
        initials: getInitials(consultantName),
        nextMeeting: nextMeetingLabel,
        email: consultantProfile?.email ?? null,
        phone: consultantProfile?.phone ?? null,
      },
      todayActivity,
      weekPlan,
      strengths,
      recentReflection,
      resources: STA_RESOURCES,
      dailyExercises,
      workStations: WORK_STATIONS,
    }
  }, [enrollment, activities, completedKeys, consultantProfile, sharedNotes, pulses, firstName])

  if (enrollmentLoading) {
    return (
      <PageLayout title="Steg till arbete" showTabs={false} domain="action" showHeader={false}>
        <Card variant="flat" padding="lg">
          <p className="text-stone-600">Laddar din resa…</p>
        </Card>
      </PageLayout>
    )
  }

  if (!viewModel || !enrollment) {
    return (
      <PageLayout title="Steg till arbete" showTabs={false} domain="action" showHeader={false}>
        <NoEnrollmentEmptyState
          firstName={firstName}
          onSelfTestCreated={() => {
            void reloadEnrollment()
          }}
        />
      </PageLayout>
    )
  }

  const showOnboardingTrigger = !viewModel.onboardingCompleted

  const handleOnboardingComplete = async ({
    weeklyHours,
    startedAt,
  }: {
    weeklyHours: number
    startedAt: string
  }) => {
    const startedChanged = startedAt !== enrollment.started_at
    const hoursChanged = weeklyHours !== enrollment.weekly_hours
    if (startedChanged) await updateStartDate(startedAt)
    if (hoursChanged) await updateWeeklyHours(weeklyHours)
    await markOnboardingDone()
  }

  // Resa-nivå upplåsning: framtida delar är låsta tills de börjar. Vi öppnar
  // resan steg för steg så att deltagaren fokuserar på var hen är just nu.
  const includesPart2 = enrollment.includes_part_2 ?? true
  const journeyTimeline = derivePartTimeline(enrollment.started_at, includesPart2)
  const partStartDates = new Map<StaPart, Date>()
  journeyTimeline.segments.forEach((s) => partStartDates.set(s.part, s.startDate))
  const partUnlockLabel = (part: StaPart): string => {
    if (part === 2 && !includesPart2) return 'Ingår inte i din plan'
    const d = partStartDates.get(part)
    return d ? `Öppnas ${formatShortDate(d)}` : 'Öppnas senare'
  }

  return (
    <PageLayout title="Steg till arbete" showTabs={false} domain="action" showHeader={false}>
      <STaHero
        mock={viewModel}
        enrollmentStartedAt={enrollment.started_at}
        onUpdateStartDate={updateStartDate}
        onUpdateWeeklyHours={updateWeeklyHours}
        absences30d={countAbsencesLast30Days(absences)}
        unlockLabelFor={partUnlockLabel}
      />
      <STaTabs
        current={tab}
        onChange={setTab}
        currentPart={viewModel.currentPart}
        unlockLabelFor={partUnlockLabel}
        includesPart2={includesPart2}
      />

      <div className="mt-6">
        {tab === 'oversikt' && (
          <STaOverview
            mock={viewModel}
            onJumpToTab={setTab}
            enrollmentId={enrollmentId}
            absences={absences}
            onReportAbsence={reportAbsence}
            onRemoveAbsence={removeAbsence}
            showOnboarding={showOnboardingTrigger}
            onStartOnboarding={() => setOnboardingOpen(true)}
            pulses={pulses}
            quickNotes={sharedNotes}
            activities={activities}
            includesPart2={includesPart2}
          />
        )}
        {tab === 'del-1' && (
          <STaDel1
            mock={viewModel}
            enrollmentId={enrollmentId}
            activities={activities}
            onMarkDayComplete={markDayComplete}
          />
        )}
        {tab === 'del-2' && (
          <STaDel2
            mock={viewModel}
            enrollmentId={enrollmentId}
            activities={activitiesPart2}
            onActivityChanged={reloadPart2}
          />
        )}
        {tab === 'del-3' && (
          <STaDel3
            mock={viewModel}
            enrollmentId={enrollmentId}
            focusOccupation={viewModel.focusOccupation}
            onReloadEnrollment={reloadEnrollment}
          />
        )}
        {tab === 'del-4' && (
          <STaDel4 mock={viewModel} enrollmentId={enrollmentId} focusOccupation={viewModel.focusOccupation} />
        )}
      </div>

      <StaOnboardingModal
        open={onboardingOpen}
        firstName={firstName}
        initialWeeklyHours={viewModel.weeklyHours}
        initialStartedAt={viewModel.startedAt}
        onClose={() => setOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
      />
    </PageLayout>
  )
}

// ===========================================================================
// TOMTILLSTÅND — ingen aktiv enrollment
// ===========================================================================

function NoEnrollmentEmptyState({
  firstName,
  onSelfTestCreated,
}: {
  firstName: string
  onSelfTestCreated: () => void
}) {
  return (
    <div className="space-y-5">
      {/* Hero — varmt välkomnande, inte byråkratisk avvisning */}
      <Card
        variant="flat"
        padding="lg"
        className="border-l-4"
        style={{
          background: 'var(--header-bg)',
          borderLeftColor: 'var(--c-solid)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">Projekt</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700">
            <Briefcase size={12} />
            Steg till arbete
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-stone-900">
          {firstName ? `Hej ${firstName}!` : 'Välkommen!'}
        </h1>
        <p className="text-stone-700 mt-2 max-w-2xl">
          När din arbetskonsulent har kopplat dig till Steg till arbete öppnas den här sidan upp.
          Här nedan ser du vad som väntar — så vet du vad du har att se fram emot.
        </p>
        <p className="text-stone-700 mt-3 max-w-2xl text-sm">
          Tror du att du borde vara med? Kontakta din konsulent eller arbetsförmedlare.
        </p>

        {/* Admin/AT-genväg: skapa koppling till sig själv för att kunna testa sidan */}
        <div className="mt-5">
          <SelfTestEnrollmentButton onCreated={onSelfTestCreated} variant="full" />
        </div>
      </Card>

      {/* Förhandsvisning — så deltagaren vet vad som väntar (Begripsam: Trygghet/tillit) */}
      <Card variant="flat" padding="lg">
        <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 font-medium">
          Det här kommer du se
        </div>
        <h2 className="text-lg font-semibold text-stone-900 mb-3">
          När du är kopplad öppnas sidan upp för dig
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PreviewItem
            icon={<Calendar size={16} style={{ color: 'var(--c-text)' }} />}
            title="En veckoplan"
            description="Vilka dagar du är på plats och vad som händer den dagen — ingen tidspress, bara struktur."
          />
          <PreviewItem
            icon={<Activity size={16} style={{ color: 'var(--c-text)' }} />}
            title="Dagliga övningar"
            description="Korta övningar att göra i din egen takt under Del 1 — om sömn, stress, intressen, mål."
          />
          <PreviewItem
            icon={<MessageSquare size={16} style={{ color: 'var(--c-text)' }} />}
            title="Plats att skriva"
            description="Reflektioner, dagbok, energi-pulse — bara du och din konsulent ser det."
          />
          <PreviewItem
            icon={<Phone size={16} style={{ color: 'var(--c-text)' }} />}
            title="Din konsulent"
            description="Kontaktuppgifter och nästa möte — alltid synligt så du vet vem du kan höra av dig till."
          />
          <PreviewItem
            icon={<Target size={16} style={{ color: 'var(--c-text)' }} />}
            title="Ditt fokusyrke"
            description="Det yrkesområde ni hittar tillsammans — och vägen dit, steg för steg."
          />
          <PreviewItem
            icon={<Heart size={16} className="text-rose-500" />}
            title="Anpassningar"
            description="Det vi planerat så att insatsen passar dig — synligt så ingen glömmer bort."
          />
        </div>

        <div
          className="mt-4 p-3 rounded-lg flex items-start gap-2"
          style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
        >
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs text-stone-700">
            Det är okej att gå i din egen takt. Steg till arbete har inga prestationskrav — det handlar
            om att hitta vad som passar dig.
          </p>
        </div>
      </Card>
    </div>
  )
}

function PreviewItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-3 rounded-lg border border-stone-200 bg-white">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      </div>
      <p className="text-xs text-stone-600">{description}</p>
    </div>
  )
}

// Vy-modell som byggs från riktig DB-data (ingen mock-fallback för fält).
interface ParticipantViewModel {
  firstName: string
  currentPart: StaPart
  /** Program-dag i Del 1 (vardag 1–15 sedan start) — räknaren i hero. */
  currentDay: number
  /** Övningsdag i dagsslingan (1–14) — vilken övning som visas som "idag". */
  currentExerciseDay: number
  totalDays: number
  startedAt: string
  partStartedAt: string
  weeklyHours: number
  onboardingCompleted: boolean
  focusOccupation: string | null
  adaptations: string[]
  languageSupport: string[]
  consultant: { name: string; initials: string; nextMeeting: string; email: string | null; phone: string | null }
  todayActivity: { day: number; title: string; description: string; timeRange: string; href: string } | null
  weekPlan: Array<{
    weekday: 'MÅN' | 'TIS' | 'ONS' | 'TOR' | 'FRE'
    date: string
    title: string
    meta: string
    status: 'done' | 'today' | 'upcoming' | 'rest'
  }>
  strengths: Array<{ text: string }>
  recentReflection: { mood: string; text: string; at: string } | null
  resources: StaResource[]
  dailyExercises: DailyExercise[]
  workStations: WorkStationDef[]
}

// ===========================================================================
// HERO + TIMELINE
// ===========================================================================

function STaHero({
  mock,
  enrollmentStartedAt,
  onUpdateStartDate,
  onUpdateWeeklyHours,
  absences30d,
  unlockLabelFor,
}: {
  mock: ParticipantViewModel
  enrollmentStartedAt: string
  /** Saknas i förhandsvisning — då döljs "Justera startdatum"-knappen. */
  onUpdateStartDate?: (startedAt: string) => Promise<unknown>
  /** Saknas i förhandsvisning — då sparar inte WeeklyHoursEditor. */
  onUpdateWeeklyHours?: (hours: number) => Promise<unknown>
  /** Antal frånvarodagar senaste 30 dgr — visas som chip om > 0. */
  absences30d: number
  /** Mänsklig etikett för när en låst del öppnas — visas under framtida delar. */
  unlockLabelFor?: (part: StaPart) => string
}) {
  const partLabel = STA_PARTS.find((p) => p.id === mock.currentPart)?.shortLabel ?? ''
  const progressPct = Math.round((mock.currentDay / mock.totalDays) * 100)
  const canEditDate = !!onUpdateStartDate
  const [editing, setEditing] = useState(false)
  const [draftDate, setDraftDate] = useState(enrollmentStartedAt)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startDateDisplay = formatShortSv(new Date(enrollmentStartedAt + 'T00:00:00'))

  const handleSave = async () => {
    if (!onUpdateStartDate) return
    if (!draftDate) {
      setError('Välj ett datum')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onUpdateStartDate(draftDate)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara datum')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      variant="flat"
      padding="lg"
      className="border-l-4"
      style={{
        background: 'var(--header-bg)',
        borderLeftColor: 'var(--c-solid)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">Projekt</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700">
              <Briefcase size={12} />
              Steg till arbete
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-stone-900">
            {mock.firstName ? `Din resa, ${mock.firstName}` : 'Din resa'}
          </h1>
          <p className="text-stone-700 mt-1 max-w-xl">
            Det är okej att gå i din egen takt. Här ser du var du är just nu och vad som väntar — utan tidspress.
          </p>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-stone-500">Startdatum:</span>
            {!editing ? (
              <>
                <span className="text-sm font-medium text-stone-900">{startDateDisplay}</span>
                {canEditDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftDate(enrollmentStartedAt)
                      setEditing(true)
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:border-stone-300"
                    aria-label="Justera startdatum"
                  >
                    <PencilLine size={11} />
                    Justera
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
                  disabled={saving}
                />
                <Button size="sm" variant="primary" onClick={handleSave} isLoading={saving}>
                  Spara
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false)
                    setError(null)
                  }}
                  disabled={saving}
                >
                  Avbryt
                </Button>
                {error && <span className="text-xs text-rose-700">{error}</span>}
              </div>
            )}
          </div>

          {/* Chip-rad: omfattning, fokusyrke, anpassningar, språkstöd */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <WeeklyHoursEditor
              currentHours={mock.weeklyHours}
              onSave={async (h) => {
                if (onUpdateWeeklyHours) await onUpdateWeeklyHours(h)
              }}
              readOnly={!onUpdateWeeklyHours}
            />
            {mock.focusOccupation && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700"
                title="Fokusyrke från Arbetsförmedlingen"
              >
                <Target size={12} />
                {mock.focusOccupation}
              </span>
            )}
            {mock.adaptations.slice(0, 3).map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700"
              >
                <Heart size={12} className="text-rose-500" />
                {a}
              </span>
            ))}
            {mock.adaptations.length > 3 && (
              <span className="text-xs text-stone-500">+{mock.adaptations.length - 3} fler</span>
            )}
            {mock.languageSupport.length > 0 && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700"
                title="Förstärkt språkstöd"
              >
                🌐 {mock.languageSupport.join(', ')}
              </span>
            )}
            {absences30d > 0 && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800"
                title="Frånvaroanmälningar senaste 30 dagarna"
              >
                <Stethoscope size={12} />
                {absences30d} frånvaro senaste 30 dgr
              </span>
            )}
          </div>
        </div>

        <Card variant="flat" padding="md" className="!bg-white min-w-[260px]">
          <div className="text-[11px] uppercase tracking-wide text-stone-500 mb-1 font-medium">Just nu</div>
          <div className="font-semibold text-stone-900">Del {mock.currentPart} — {partLabel}</div>
          <div className="text-sm text-stone-600">Dag {mock.currentDay} av {mock.totalDays}</div>
          <div className="h-1.5 rounded-full mt-2 overflow-hidden bg-stone-100">
            <div
              className="h-full transition-all"
              style={{ width: `${progressPct}%`, background: 'var(--c-solid)' }}
            />
          </div>
        </Card>
      </div>

      <Timeline currentPart={mock.currentPart} unlockLabelFor={unlockLabelFor} />
    </Card>
  )
}

function Timeline({
  currentPart,
  unlockLabelFor,
}: {
  currentPart: StaPart
  unlockLabelFor?: (part: StaPart) => string
}) {
  return (
    <div className="mt-6 flex items-center">
      {STA_PARTS.map((part, idx) => {
        const isActive = part.id === currentPart
        const isPast = part.id < currentPart
        const isFuture = part.id > currentPart
        return (
          <div key={part.id} className="flex items-center flex-1 last:flex-initial">
            <div className={cn('flex flex-col items-center flex-shrink-0', isFuture && 'opacity-60')}>
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold ring-4 ring-[var(--header-bg)]',
                  isActive || isPast ? 'text-white' : 'text-stone-500 bg-stone-200',
                )}
                style={isActive || isPast ? { background: 'var(--c-solid)' } : undefined}
              >
                {isPast ? <CheckCircle2 className="w-5 h-5" /> : isFuture ? <Lock size={15} /> : part.id}
              </div>
              <div className="text-xs mt-2 font-medium text-stone-900 text-center max-w-[110px]">{part.shortLabel}</div>
              <div className="text-[11px] text-stone-500">
                {isFuture ? (unlockLabelFor?.(part.id) ?? part.duration) : part.duration}
              </div>
            </div>
            {idx < STA_PARTS.length - 1 && (
              <div
                className="flex-1 h-1 mx-1 rounded-full"
                style={{
                  background: isPast ? 'var(--c-solid)' : '#ECEAE3',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ===========================================================================
// TABS
// ===========================================================================

function STaTabs({
  current,
  onChange,
  currentPart,
  unlockLabelFor,
  includesPart2 = true,
}: {
  current: TabId
  onChange: (tab: TabId) => void
  currentPart: StaPart
  /** Mänsklig etikett för när en låst del öppnas. */
  unlockLabelFor?: (part: StaPart) => string
  /** Om Del 2 inte ingår i deltagarens plan döljs fliken helt. */
  includesPart2?: boolean
}) {
  const visibleTabs = includesPart2 ? TABS : TABS.filter((t) => t.id !== 'del-2')
  return (
    <div className="mt-6 flex flex-wrap gap-2" role="tablist">
      {visibleTabs.map((t) => {
        const isActive = t.id === current
        const isLocked = t.partIndex !== undefined && t.partIndex > currentPart

        if (isLocked) {
          const label = unlockLabelFor?.(t.partIndex as StaPart) ?? 'Öppnas senare'
          return (
            <span
              key={t.id}
              role="tab"
              aria-selected={false}
              aria-disabled="true"
              title={label}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border-2 border-dashed border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed select-none"
            >
              <Lock size={13} />
              {t.label}
            </span>
          )
        }

        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors',
              isActive
                ? 'border-[var(--c-solid)] text-[var(--c-text)]'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
            )}
            style={isActive ? { background: 'var(--c-bg)' } : undefined}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ===========================================================================
// OVERVIEW
// ===========================================================================

function STaOverview({
  mock,
  onJumpToTab,
  enrollmentId,
  absences,
  onReportAbsence,
  onRemoveAbsence,
  showOnboarding,
  onStartOnboarding,
  pulses,
  quickNotes,
  activities,
  includesPart2,
}: {
  mock: ParticipantViewModel
  onJumpToTab: (tab: TabId) => void
  enrollmentId: string | null
  absences: import('@/services/staApi').StaAbsence[]
  onReportAbsence: (input: { date: string; kind: import('@/services/staApi').AbsenceKind; reason?: string }) => Promise<unknown>
  onRemoveAbsence: (id: string) => Promise<void>
  showOnboarding: boolean
  onStartOnboarding: () => void
  pulses: StaPulseCheck[]
  quickNotes: import('@/services/staApi').StaQuickNote[]
  activities: StaActivity[]
  includesPart2: boolean
}) {
  const { hasToday, submitToday } = useStaPulseChecks(enrollmentId)
  const { checkins, submitForWeek } = useStaWeeklyCheckin(enrollmentId)
  const currentMonday = getCurrentWeekMonday()
  const existingThisWeek = checkins.find((c) => c.week_starts === currentMonday)

  // Visa veckoavslutning från och med torsdag eftermiddag
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=sön 1=mån ... 4=tor 5=fre 6=lör
  const showWeeklyCheckin = dayOfWeek >= 4 || dayOfWeek === 0

  // Vecko-rubrik från weekPlan
  const weekHeader = (() => {
    const monday = mondayOfWeek(now)
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)
    // Hitta ISO-veckonummer
    const target = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()))
    const dayNr = (target.getUTCDay() + 6) % 7
    target.setUTCDate(target.getUTCDate() - dayNr + 3)
    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
    const weekNo = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
    return `v.${weekNo} · ${formatShortSv(monday)}–${formatShortSv(friday)}`
  })()

  // A2: Övergångsskärm — visas i två fall:
  //   (a) Del 1:s vardagsräknare har passerat alla 15 dagar men currentPart är fortfarande 1
  //       → deltagaren är "klar med Del 1" men AT har inte avancerat manuellt
  //   (b) currentPart >= 2 och deltagaren har precis bytt del (part_started_at inom 14 dagar)
  //       → systemet har auto-avancerat och deltagaren behöver se övergången
  const showTransitionForPart1Done = mock.currentPart === 1 && mock.currentDay >= mock.totalDays
  const daysInCurrentPart = mock.partStartedAt
    ? Math.floor((Date.now() - new Date(mock.partStartedAt + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
    : 999
  const showTransitionForLaterPart = mock.currentPart >= 2 && daysInCurrentPart <= 14
  const showTransition = showTransitionForPart1Done || showTransitionForLaterPart
  const completedPart: StaPart = (showTransitionForPart1Done
    ? 1
    : Math.max(1, mock.currentPart - 1)) as StaPart

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Onboarding-trigger — visas tills introduktionen är klar */}
      {showOnboarding && (
        <div className="lg:col-span-3">
          <StaOnboardingTrigger firstName={mock.firstName} onStart={onStartOnboarding} />
        </div>
      )}

      {/* A2: Övergångsskärm Del→Del */}
      {showTransition && (
        <PartTransitionCard
          completedPart={completedPart}
          consultantFirstName={mock.consultant.name.split(' ')[0]}
          strengths={quickNotes
            .filter((n) => n.body && n.body.trim().length > 0)
            .slice(0, 4)
            .map((n) => n.body!.trim())}
          adaptations={mock.adaptations}
          focusOccupation={mock.focusOccupation}
          nextPartIncluded={includesPart2}
        />
      )}

      {/* Today */}
      <Card variant="flat" padding="lg" className="lg:col-span-2" style={{ background: 'var(--c-bg)' }}>
        {mock.todayActivity ? (
          <>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--c-text)' }}>
                  Idag
                </div>
                <h2 className="text-lg font-semibold text-stone-900 mt-1">
                  Dag {mock.todayActivity.day} — {mock.todayActivity.title}
                </h2>
                <p className="text-sm text-stone-700 mt-1 max-w-xl">{mock.todayActivity.description}</p>
              </div>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
                style={{ background: 'var(--c-accent)', color: 'var(--c-text)' }}
              >
                <Clock size={12} />
                {mock.todayActivity.timeRange}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="primary"
                onClick={() => {
                  onJumpToTab('del-1')
                  // Del 1-fliken monteras vid tabbytet och förväljer dagens dag.
                  // Vänta in renderingen och rulla direkt till dagens övning.
                  window.setTimeout(() => {
                    document
                      .getElementById('sta-dagens-ovning')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 150)
                }}
              >
                Öppna dagens övning
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--c-text)' }}>
              Just nu
            </div>
            <h2 className="text-lg font-semibold text-stone-900 mt-1">Du har gjort klart dagsslingan</h2>
            <p className="text-sm text-stone-700 mt-1 max-w-xl">
              Nu förbereder vi nästa steg tillsammans med {mock.consultant.name.split(' ')[0]}.
            </p>
          </>
        )}
      </Card>

      {/* Consultant */}
      <Card variant="flat" padding="lg">
        <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 font-medium">Din konsulent</div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-700 font-semibold">
            {mock.consultant.initials}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-stone-900 truncate">{mock.consultant.name}</div>
            <div className="text-xs text-stone-500 truncate">Träffas {mock.consultant.nextMeeting}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            leftIcon={<MessageSquare size={14} />}
            disabled={!mock.consultant.email}
            title={mock.consultant.email ? `Mejla ${mock.consultant.email}` : 'Ingen e-postadress finns'}
            onClick={() => {
              if (mock.consultant.email) {
                window.location.href = `mailto:${mock.consultant.email}?subject=${encodeURIComponent('Steg till arbete')}`
              }
            }}
          >
            Meddelande
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Phone size={14} />}
            disabled={!mock.consultant.phone}
            title={mock.consultant.phone ? `Ring ${mock.consultant.phone}` : 'Inget telefonnummer finns'}
            onClick={() => {
              if (mock.consultant.phone) {
                window.location.href = `tel:${mock.consultant.phone.replace(/\s+/g, '')}`
              }
            }}
          >
            Ring
          </Button>
        </div>
        {/* AI-coach-länk — extra stöd när konsulenten inte är på plats */}
        <Link
          to={`/ai-team?prompt=${encodeURIComponent(`Jag är i Del ${mock.currentPart} av Steg till arbete. Kan vi reflektera ihop?`)}`}
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-700 hover:border-stone-300 hover:bg-stone-50"
        >
          <Sparkles size={14} style={{ color: 'var(--c-text)' }} />
          <span className="flex-1">Prata med din AI-coach</span>
          <ChevronRight size={14} className="text-stone-400" />
        </Link>
      </Card>

      {/* Week plan */}
      <Card variant="flat" padding="lg" className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-stone-900">Veckans plan</h3>
          <span className="text-xs text-stone-500">{weekHeader}</span>
        </div>
        <ul className="space-y-2">
          {mock.weekPlan.map((item) => (
            <WeekPlanRow key={item.weekday} item={item} />
          ))}
        </ul>
      </Card>

      {/* A1: ProfileGrowingCard — ersätter tidigare "Styrkor"-kort med rikare insiktssammanställning */}
      <ProfileGrowingCard
        consultantFirstName={mock.consultant.name.split(' ')[0]}
        pulseChecks={pulses}
        quickNotes={quickNotes}
        activities={activities}
        focusOccupation={mock.focusOccupation}
      />

      {/* A3: Energi-sparkline — visar pulse-mönster senaste 14 dagarna */}
      <div className="lg:col-span-3">
        <EnergySparkline pulseChecks={pulses} days={14} />
      </div>

      {/* Resources */}
      <Card variant="flat" padding="lg">
        <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 font-medium">Läs när du vill</div>
        <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <BookOpen size={18} style={{ color: 'var(--c-solid)' }} />
          Resurser
        </h3>
        <ul className="space-y-2">
          {mock.resources.map((r) => (
            <li key={r.title}>
              <a
                href={r.href}
                className="block text-sm text-stone-700 hover:text-stone-900 hover:underline py-1"
              >
                <span className="mr-2">{r.icon}</span>
                {r.title}
              </a>
            </li>
          ))}
        </ul>
      </Card>

      {/* Pulse-check (daglig) — endast om vi har riktig enrollment */}
      {enrollmentId && (
        <div className="lg:col-span-2">
          <PulseCheckWidget hasToday={hasToday} onSubmit={submitToday} />
        </div>
      )}

      {/* Frånvaroanmälan */}
      <div>
        <AbsenceForm
          recentAbsences={absences}
          onReport={onReportAbsence}
          onRemove={onRemoveAbsence}
        />
      </div>

      {/* Veckoavslutning — torsdag-söndag, riktig enrollment */}
      {enrollmentId && showWeeklyCheckin && (
        <div className="lg:col-span-3">
          <WeeklyCheckinForm
            existingForThisWeek={existingThisWeek}
            onSubmit={submitForWeek}
            consultantFirstName={mock.consultant.name.split(' ')[0]}
          />
        </div>
      )}
    </div>
  )
}

function WeekPlanRow({ item }: { item: ParticipantViewModel['weekPlan'][number] }) {
  const isToday = item.status === 'today'
  const isDone = item.status === 'done'
  const isRest = item.status === 'rest'
  return (
    <li
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        isToday && '',
        !isToday && !isRest && 'bg-stone-50',
        isRest && 'bg-stone-50/50 opacity-70',
      )}
      style={isToday ? { background: 'var(--c-bg)' } : undefined}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0',
          isToday && 'bg-white',
          !isToday && !isDone && !isRest && 'bg-stone-200 text-stone-600',
          isRest && 'bg-stone-100 text-stone-400',
          isDone && '',
        )}
        style={{
          color: isToday ? 'var(--c-text)' : undefined,
          background: isDone ? 'var(--c-accent)' : undefined,
        }}
      >
        {item.weekday}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-stone-900 text-sm truncate">{item.title}</div>
        <div className="text-xs text-stone-500 truncate">{item.meta}</div>
      </div>
      {isDone && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
          <CheckCircle2 size={12} />
          Klar
        </span>
      )}
      {isToday && (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0"
          style={{ background: 'var(--c-solid)' }}
        >
          Idag
        </span>
      )}
      {!isToday && !isDone && !isRest && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-600 flex-shrink-0">
          {item.date}
        </span>
      )}
      {isRest && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-500 flex-shrink-0">
          Ledig
        </span>
      )}
    </li>
  )
}

// ===========================================================================
// DEL 1 — Lära känna dig
// ===========================================================================

function STaDel1({
  mock,
  enrollmentId,
  activities,
  onMarkDayComplete,
}: {
  mock: ParticipantViewModel
  enrollmentId?: string | null
  activities: StaActivity[]
  onMarkDayComplete?: (activityKey: string, reflection?: string) => Promise<unknown>
}) {
  // Default: visa idag som vald dag, om den finns
  const initialDay = mock.dailyExercises.find((d) => d.status === 'today')?.day ?? mock.currentExerciseDay
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDay)
  const [kompFormOpen, setKompFormOpen] = useState(false)
  const [doaFormOpen, setDoaFormOpen] = useState(false)

  const currentWeek = getWeekForDay(mock.currentExerciseDay)

  // Obligatoriska Del 1-aktiviteter — status från sta_activities och sta_assessments
  const startsamtalAct = activities.find((a) => a.activity_key === 'startsamtal') ?? null
  const kartlaggningAct = activities.find((a) => a.activity_key === 'kartlaggningssamtal') ?? null
  const kompAct = activities.find((a) => a.activity_key === 'kompetenskartlaggning') ?? null
  const { assessment: doaAssessment, reload: reloadDoa } = useParticipantDoaAssessment(enrollmentId ?? null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PartIntro part={1} day={mock.currentDay} totalDays={mock.totalDays} />

        {currentWeek && <CurrentWeekCard week={currentWeek} currentDay={mock.currentExerciseDay} />}

        {/* De obligatoriska aktiviteterna enligt AF-uppdraget */}
        <ObligatoryActivitiesSection
          consultantFirstName={mock.consultant.name.split(' ')[0]}
          adaptations={mock.adaptations}
          startsamtalAct={startsamtalAct}
          kartlaggningAct={kartlaggningAct}
          kompAct={kompAct}
          doaAssessment={doaAssessment}
          onStartKomp={() => setKompFormOpen(true)}
          onStartDoa={() => setDoaFormOpen(true)}
        />

        {/* Dagsslinga — grupperad veckovis */}
        <ActivitySection
          icon={<Calendar size={18} style={{ color: 'var(--c-text)' }} />}
          title="Resan i tre veckor"
          subtitle={`${mock.dailyExercises.filter((d) => d.status === 'completed').length} av 14 dagar klara · vi öppnar en dag i taget`}
          iconBg=""
          iconBgStyle={{ background: 'var(--c-accent)' }}
          defaultOpen
        >
          <div className="space-y-5">
            {WEEK_THEMES.map((week) => (
              <WeekGroup
                key={week.weekNumber}
                week={week}
                exercises={mock.dailyExercises.filter((d) => week.days.includes(d.day))}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                isCurrentWeek={currentWeek?.weekNumber === week.weekNumber}
              />
            ))}
          </div>

          {selectedDay !== null && (
            <DayResourcePanel
              day={selectedDay}
              exercise={mock.dailyExercises.find((d) => d.day === selectedDay)}
              enrollmentId={enrollmentId ?? null}
              onMarkDayComplete={onMarkDayComplete}
            />
          )}
        </ActivitySection>

        {/* Hälsoaktiviteter */}
        <ActivitySection
          icon={<Heart size={18} style={{ color: 'var(--wellbeing-text)' }} />}
          title="Frivilliga hälsoaktiviteter"
          subtitle="Sömn, stress, motivation — när du vill"
          iconBg=""
          iconBgStyle={{ background: 'var(--wellbeing-bg)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <HealthCard icon={<Moon size={18} />} title="Bättre sömn" subtitle="Övningar och guide" href="/knowledge-base/article/sta-somn-ostrukturerad" />
            <HealthCard icon={<Sun size={18} />} title="Stresshantering" subtitle="Korta verktyg" href="/knowledge-base/article/stresshantering" />
            <HealthCard icon={<Coffee size={18} />} title="Vardagsstruktur" subtitle="Hitta din rytm" href="/knowledge-base/article/sta-timeboxing" />
          </div>
        </ActivitySection>
      </div>

      <PartSidebar
        nextPart={STA_PARTS[1]}
        consultantFirstName={mock.consultant.name.split(' ')[0]}
        showLanguageSupport
        consultantEmail={mock.consultant.email}
      />

      {/* Kompetenskartläggning-modal — öppnas från ObligatoryActivitiesSection */}
      {kompFormOpen && (
        <KompetenskartlaggningForm
          enrollmentId={enrollmentId ?? null}
          existing={kompAct}
          onClose={() => setKompFormOpen(false)}
          readOnly={!enrollmentId}
        />
      )}

      {/* DOA-självskattning — wizard öppnas från ObligatoryActivitiesSection */}
      {doaFormOpen && enrollmentId && (
        <DoaSelfAssessment
          enrollmentId={enrollmentId}
          existing={doaAssessment}
          onClose={() => {
            setDoaFormOpen(false)
            void reloadDoa()
          }}
          onSaved={() => {
            void reloadDoa()
          }}
        />
      )}
    </div>
  )
}

// =============================================================================
// Tre obligatoriska aktiviteter enligt AF-uppdraget Del 1
// =============================================================================

function ObligatoryActivitiesSection({
  consultantFirstName,
  adaptations,
  startsamtalAct,
  kartlaggningAct,
  kompAct,
  doaAssessment,
  onStartKomp,
  onStartDoa,
}: {
  consultantFirstName: string
  adaptations: string[]
  startsamtalAct: StaActivity | null
  kartlaggningAct: StaActivity | null
  kompAct: StaActivity | null
  doaAssessment: StaAssessment | null
  onStartKomp: () => void
  onStartDoa: () => void
}) {
  // Räkna deltagarens DOA-progress: hur många av 34 items har person-värde
  const doaProgress = (() => {
    const scores = (doaAssessment?.scores as Record<string, unknown> | undefined) ?? {}
    let filled = 0
    for (const [key, raw] of Object.entries(scores)) {
      if (!key.startsWith('b1_c')) continue
      const entry = raw as { person?: unknown } | undefined
      if (typeof entry?.person === 'number' && entry.person >= 1 && entry.person <= 5) {
        filled++
      }
    }
    const pct = Math.round((filled / DOA.itemCount) * 100)
    const completedAt = (scores as { _participant_completed_at?: string })._participant_completed_at
    return { filled, total: DOA.itemCount, pct, completedAt }
  })()

  return (
    <Card variant="flat" padding="lg">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
        >
          Det här ingår
        </span>
        <h3 className="text-base font-semibold text-stone-900">
          Aktiviteter i Del 1
        </h3>
      </div>

      <div className="space-y-3">
        <ObligatoryActivityRow
          title="Startsamtal"
          description={`Du och ${consultantFirstName} går igenom hur tjänsten fungerar, ditt schema, frånvarorutiner och vad du behöver för att det ska kännas bra.`}
          activity={startsamtalAct}
          extra={
            startsamtalAct?.completed_at && adaptations.length > 0 ? (
              <div className="mt-2 p-2.5 rounded-lg bg-stone-50">
                <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium mb-0.5">
                  Anpassningar som planerades
                </div>
                <ul className="text-xs text-stone-700 space-y-0.5">
                  {adaptations.map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
                </ul>
              </div>
            ) : null
          }
        />

        {/* DOA-självskattning — deltagaren skattar själv, AT gör sin parallellt */}
        <DoaSelfAssessmentRow
          consultantFirstName={consultantFirstName}
          progress={doaProgress}
          onOpen={onStartDoa}
        />

        <ObligatoryActivityRow
          title="Kartläggningssamtal"
          description={`Två samtal med ${consultantFirstName} (eller med en arbetsterapeut) där vi pratar om dina resurser, motivation och vad som funkat tidigare. Vi använder dina svar från Min skattning som underlag.`}
          activity={kartlaggningAct}
        />

        <ObligatoryActivityRow
          title="Kompetenskartläggning"
          description="Du svarar på frågor om dig själv i din egen takt. Det blir grunden för vad vi gör härnäst — och underlag för delredovisning till Arbetsförmedlingen."
          activity={kompAct}
          actionLabel={
            kompAct?.completed_at
              ? 'Se eller justera svaren'
              : kompAct
                ? 'Fortsätt där du var'
                : 'Starta kartläggning'
          }
          onAction={onStartKomp}
          progress={
            kompAct?.metadata && typeof (kompAct.metadata as { completionPct?: unknown }).completionPct === 'number'
              ? ((kompAct.metadata as { completionPct: number }).completionPct as number)
              : undefined
          }
        />
      </div>
    </Card>
  )
}

function ObligatoryActivityRow({
  title,
  description,
  activity,
  actionLabel,
  onAction,
  progress,
  extra,
}: {
  title: string
  description: string
  activity: StaActivity | null
  actionLabel?: string
  onAction?: () => void
  progress?: number
  extra?: React.ReactNode
}) {
  const isComplete = !!activity?.completed_at
  const isScheduled = !!activity?.scheduled_for && !isComplete
  const isInProgress = !!activity && !isComplete && !isScheduled

  const status: 'complete' | 'scheduled' | 'in_progress' | 'pending' = isComplete
    ? 'complete'
    : isScheduled
      ? 'scheduled'
      : isInProgress
        ? 'in_progress'
        : 'pending'

  const statusLabel = {
    complete: activity?.completed_at
      ? `Klart · ${formatShortSv(new Date(activity.completed_at))}`
      : 'Klart',
    scheduled: activity?.scheduled_for
      ? `Bokat · ${formatShortSv(new Date(activity.scheduled_for + 'T00:00:00'))}`
      : 'Bokat',
    in_progress: 'Pågående',
    pending: 'Inte startat ännu',
  }[status]

  const Icon = isComplete ? CheckCircle2 : status === 'pending' ? Clock : Activity

  return (
    <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600',
            )}
          >
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-900 text-sm">{title}</span>
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                  isComplete && 'bg-emerald-50 text-emerald-700',
                  isScheduled && 'bg-amber-50 text-amber-700',
                  isInProgress && 'bg-sky-50 text-sky-700',
                  status === 'pending' && 'bg-stone-100 text-stone-600',
                )}
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-stone-700 mt-1">{description}</p>
            {typeof progress === 'number' && (
              <div className="h-1.5 rounded-full mt-2 overflow-hidden bg-stone-100">
                <div className="h-full" style={{ width: `${progress}%`, background: 'var(--c-solid)' }} />
              </div>
            )}
          </div>
        </div>
        {actionLabel && onAction && (
          <Button size="sm" variant={isComplete ? 'ghost' : 'primary'} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
      {extra}
    </div>
  )
}

function DoaSelfAssessmentRow({
  consultantFirstName,
  progress,
  onOpen,
}: {
  consultantFirstName: string
  progress: { filled: number; total: number; pct: number; completedAt?: string }
  onOpen: () => void
}) {
  const isParticipantDone = !!progress.completedAt
  const isStarted = progress.filled > 0
  const Icon = isParticipantDone ? CheckCircle2 : isStarted ? Activity : Clock

  const statusLabel = isParticipantDone
    ? 'Du har markerat klar'
    : isStarted
      ? `${progress.filled} av ${progress.total} besvarade`
      : 'Inte startat ännu'

  const actionLabel = isParticipantDone
    ? 'Se mina svar'
    : isStarted
      ? 'Fortsätt där du var'
      : 'Börja skattningen'

  return (
    <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              isParticipantDone ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600',
            )}
          >
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-900 text-sm">Min skattning</span>
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                  isParticipantDone && 'bg-emerald-50 text-emerald-700',
                  isStarted && !isParticipantDone && 'bg-sky-50 text-sky-700',
                  !isStarted && 'bg-stone-100 text-stone-600',
                )}
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-stone-700 mt-1">
              34 frågor om hur du själv ser på din arbetsförmåga. Du gör dem i din egen takt.
              {consultantFirstName} gör sin egen skattning vid sidan om — sen pratar ni om vad ni ser.
            </p>
            {isStarted && (
              <div className="h-1.5 rounded-full mt-2 overflow-hidden bg-stone-100">
                <div className="h-full" style={{ width: `${progress.pct}%`, background: 'var(--c-solid)' }} />
              </div>
            )}
          </div>
        </div>
        <Button size="sm" variant={isParticipantDone ? 'ghost' : 'primary'} onClick={onOpen}>
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}

function CurrentWeekCard({ week, currentDay }: { week: WeekTheme; currentDay: number }) {
  const daysIntoWeek = week.days.indexOf(currentDay) + 1
  const totalDaysInWeek = week.days.length

  return (
    <Card variant="flat" padding="lg" className="border-l-4" style={{ borderLeftColor: 'var(--c-solid)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium flex items-center gap-2">
            <span>Vecka {week.weekNumber} av 3</span>
            <span className="text-stone-400">•</span>
            <span>Dag {daysIntoWeek} av {totalDaysInWeek}</span>
          </div>
          <h3 className="text-xl font-semibold text-stone-900 mt-1">{week.title}</h3>
          <p className="text-sm text-stone-600 mt-0.5">{week.subtitle}</p>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
          style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
        >
          <Target size={12} />
          Veckans fokus
        </span>
      </div>

      <p className="text-sm text-stone-700 leading-relaxed">{week.arbetsmarknadKoppling}</p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-stone-50">
          <div className="text-[11px] uppercase tracking-wide font-medium text-stone-500 mb-1">
            Reflektera över
          </div>
          <ul className="text-sm text-stone-700 space-y-1">
            {week.reflektionsfragor.map((q) => (
              <li key={q} className="flex items-start gap-1.5">
                <span
                  className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                  style={{ background: 'var(--c-solid)' }}
                />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg)' }}>
          <div className="text-[11px] uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--c-text)' }}>
            När veckan är slut
          </div>
          <p className="text-sm text-stone-700">{week.veckansResultat}</p>
        </div>
      </div>
    </Card>
  )
}

function WeekGroup({
  week,
  exercises,
  selectedDay,
  onSelectDay,
  isCurrentWeek,
}: {
  week: WeekTheme
  exercises: DailyExercise[]
  selectedDay: number | null
  onSelectDay: (day: number) => void
  isCurrentWeek: boolean
}) {
  const completedCount = exercises.filter((e) => e.status === 'completed').length
  const totalCount = exercises.length

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold"
            style={{
              background: isCurrentWeek ? 'var(--c-solid)' : '#ECEAE3',
              color: isCurrentWeek ? 'white' : '#6A6864',
            }}
          >
            {week.weekNumber}
          </span>
          <div>
            <div className="font-semibold text-stone-900 text-sm">
              Vecka {week.weekNumber} — {week.title}
            </div>
            <div className="text-xs text-stone-500">{week.subtitle}</div>
          </div>
        </div>
        <div className="text-xs text-stone-500 flex items-center gap-2">
          <span>{completedCount}/{totalCount} klara</span>
          <div className="h-1.5 w-16 rounded-full overflow-hidden bg-stone-100">
            <div
              className="h-full"
              style={{
                width: `${(completedCount / totalCount) * 100}%`,
                background: 'var(--c-solid)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {exercises.map((d) => (
          <DayCell
            key={d.day}
            exercise={d}
            isSelected={selectedDay === d.day}
            onSelect={() => onSelectDay(d.day)}
          />
        ))}
      </div>
    </div>
  )
}

function DayCell({
  exercise,
  isSelected,
  onSelect,
}: {
  exercise: DailyExercise
  isSelected: boolean
  onSelect: () => void
}) {
  const isCompleted = exercise.status === 'completed'
  const isToday = exercise.status === 'today'
  const isTomorrow = exercise.status === 'tomorrow'

  // Låst dag — vi öppnar en dag i taget. Visas men går inte att öppna än.
  if (exercise.locked) {
    return (
      <div
        className="block w-full text-center p-3 rounded-lg border border-dashed border-stone-200 bg-stone-50/60 cursor-not-allowed select-none"
        aria-disabled="true"
        title={`Öppnas ${exercise.unlockLabel ?? 'senare'}`}
      >
        <div className="text-[10px] font-medium uppercase tracking-wide text-stone-400">Dag {exercise.day}</div>
        <div className="text-xs mt-1 text-stone-400">{exercise.shortTitle}</div>
        <div className="text-[10px] text-stone-400 mt-1 inline-flex items-center gap-1">
          <Lock size={10} />
          Öppnas {exercise.unlockLabel ?? 'senare'}
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        'block w-full text-center p-3 rounded-lg border transition-all hover:shadow-sm',
        isCompleted && !isSelected && 'bg-emerald-50 border-emerald-200',
        isToday && 'border-2',
        !isCompleted && !isToday && !isSelected && 'bg-white border-stone-200',
        isSelected && 'ring-2 ring-offset-1',
      )}
      style={{
        background: isToday ? 'var(--c-bg)' : undefined,
        borderColor: isToday ? 'var(--c-solid)' : undefined,
        ...(isSelected ? { ['--tw-ring-color' as string]: 'var(--c-solid)' } : {}),
      }}
    >
      <div
        className={cn(
          'text-[10px] font-medium uppercase tracking-wide',
          isCompleted && 'text-emerald-700',
          !isCompleted && !isToday && 'text-stone-500',
        )}
        style={isToday ? { color: 'var(--c-text)' } : undefined}
      >
        Dag {exercise.day}
      </div>
      <div
        className={cn(
          'text-xs mt-1',
          isToday && 'font-medium text-stone-900',
          !isToday && 'text-stone-700',
        )}
      >
        {exercise.shortTitle}
      </div>
      {isCompleted && (
        <div className="text-[10px] text-emerald-700 mt-1 inline-flex items-center gap-1">
          <CheckCircle2 size={10} />
          Klar
        </div>
      )}
      {isToday && (
        <div className="text-[10px] mt-1" style={{ color: 'var(--c-text)' }}>
          Idag
        </div>
      )}
      {isTomorrow && <div className="text-[10px] text-stone-500 mt-1">Imorgon</div>}
    </button>
  )
}

function DayResourcePanel({
  day,
  exercise,
  enrollmentId,
  onMarkDayComplete,
}: {
  day: number
  exercise?: DailyExercise
  enrollmentId?: string | null
  onMarkDayComplete?: (activityKey: string, reflection?: string) => Promise<unknown>
}) {
  const [marking, setMarking] = useState(false)
  const [reflection, setReflection] = useState('')
  const resources = DAY_RESOURCES[day] ?? []
  const articles = resources.filter((r) => r.kind === 'article')
  const exercises = resources.filter((r) => r.kind === 'exercise')

  if (!exercise) return null

  const isDone = exercise.status === 'completed'

  const handleMarkDone = async () => {
    if (!enrollmentId || !onMarkDayComplete) return
    setMarking(true)
    try {
      await onMarkDayComplete(`dag-${day}`, reflection.trim() || undefined)
      setReflection('')
    } finally {
      setMarking(false)
    }
  }

  return (
    <div
      id="sta-dagens-ovning"
      className="mt-5 p-5 rounded-xl border scroll-mt-24"
      style={{ background: 'var(--c-bg)', borderColor: 'var(--c-accent)' }}
    >
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--c-text)' }}>
            Dag {day}
          </div>
          <h4 className="text-lg font-semibold text-stone-900 mt-0.5">{exercise.title}</h4>
          {exercise.scheduledFor && (
            <p className="text-sm text-stone-700 mt-1 flex items-center gap-1">
              <Clock size={12} />
              {exercise.scheduledFor} · ca {exercise.durationMin} min
            </p>
          )}
          {KNOWLEDGE_ONLY_DAYS.has(day) && (
            <div
              className="mt-2 inline-flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs"
              style={{ background: 'var(--header-bg)', color: 'var(--c-text)' }}
              role="note"
            >
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span className="text-stone-700">
                <strong>Kunskapsövning, inte fysisk träning.</strong> Du sitter och läser/reflekterar
                — ingen kroppsövning ingår. Insatsen har inte försäkring för det.
              </span>
            </div>
          )}
          {exercise.reflection && (
            <p className="text-sm text-stone-600 italic mt-2">
              Din reflektion: <span className="text-stone-700">"{exercise.reflection}"</span>
            </p>
          )}
        </div>
      </div>

      {articles.length > 0 && (
        <div className="mt-4">
          <h5 className="text-xs uppercase tracking-wide font-medium text-stone-500 mb-2 flex items-center gap-1">
            <BookOpen size={12} />
            Läs om dagens tema
          </h5>
          <div className="space-y-2">
            {articles.map((r) => (
              <ResourceLink key={r.id} resource={r} />
            ))}
          </div>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="mt-4">
          <h5 className="text-xs uppercase tracking-wide font-medium text-stone-500 mb-2 flex items-center gap-1">
            <Activity size={12} />
            Övning för dagen
          </h5>
          <div className="space-y-2">
            {exercises.map((r) => (
              <ResourceLink key={r.id} resource={r} />
            ))}
          </div>
        </div>
      )}

      {resources.length === 0 && (
        <p className="text-sm text-stone-600 mt-2">
          Inget extra material för den här dagen. Prata med din konsulent om du vill ha tips.
        </p>
      )}

      {/* Markera-klar-knapp + reflektion (endast om vi har riktig enrollment och dagen ej redan klar) */}
      {enrollmentId && !isDone && (
        <div className="mt-4 p-3 rounded-lg bg-white border border-stone-200">
          <h5 className="text-xs uppercase tracking-wide font-medium text-stone-500 mb-2">
            När du är klar
          </h5>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="En kort reflektion (frivilligt) — vad tar du med dig från dagen?"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
          <Button variant="primary" size="sm" onClick={handleMarkDone} isLoading={marking} leftIcon={<CheckCircle2 size={14} />}>
            Markera Dag {day} som klar
          </Button>
        </div>
      )}

      {enrollmentId && isDone && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 size={14} />
          Klart — fortsätt i din egen takt.
        </div>
      )}
    </div>
  )
}

function ResourceLink({ resource }: { resource: DayResource }) {
  const href =
    resource.kind === 'article'
      ? `/knowledge-base/article/${resource.id}`
      : `/exercises?id=${resource.id}`

  return (
    <Link
      to={href}
      className="flex items-start gap-3 p-3 rounded-lg bg-white border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
      >
        {resource.kind === 'article' ? <BookOpen size={16} /> : <Activity size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-stone-900 text-sm">{resource.label}</div>
        {resource.context && <div className="text-xs text-stone-600 mt-0.5">{resource.context}</div>}
        <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
          <Clock size={10} />
          {resource.estimate}
          {resource.kind === 'article' ? ' · läsning' : ' · övning'}
        </div>
      </div>
      <ChevronRight size={16} className="text-stone-400 flex-shrink-0 mt-1" />
    </Link>
  )
}

function HealthCard({ icon, title, subtitle, href }: { icon: React.ReactNode; title: string; subtitle: string; href: string }) {
  return (
    <Link
      to={href}
      className="block text-left p-4 rounded-lg bg-white border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
        style={{ background: 'var(--wellbeing-bg)', color: 'var(--wellbeing-text)' }}
      >
        {icon}
      </div>
      <div className="font-medium text-sm text-stone-900">{title}</div>
      <div className="text-xs text-stone-500">{subtitle}</div>
    </Link>
  )
}

// ===========================================================================
// DEL 2 — Prova på
// ===========================================================================

function STaDel2({
  mock,
  enrollmentId,
  activities,
  onActivityChanged,
}: {
  mock: ParticipantViewModel
  enrollmentId?: string | null
  activities: StaActivity[]
  onActivityChanged: () => void
}) {
  // Mappa varje arbetsstation till en aktivitet (om finns)
  const stationActivities = new Map<string, StaActivity>()
  for (const a of activities) {
    if (a.activity_type === 'arbetsstation' && a.activity_key) {
      stationActivities.set(a.activity_key, a)
    }
  }
  const triedCount = Array.from(stationActivities.values()).filter((a) => a.completed_at).length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PartIntro
          part={2}
          customText="När du är klar med Del 1 går vi vidare till att prova olika arbetsuppgifter i en lugn miljö. Det är okej att inte gilla allt — vi letar efter vad som funkar för dig."
        />

        {/* Stations */}
        <ActivitySection
          icon={<Activity size={18} style={{ color: 'var(--c-text)' }} />}
          title="Mina arbetsstationer"
          subtitle={`${triedCount} av 4 stationer prövade · prova alla för att hitta vad som passar`}
          iconBgStyle={{ background: 'var(--c-accent)' }}
          defaultOpen
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {mock.workStations.map((s) => (
              <ArbetsstationCard
                key={s.id}
                station={s}
                activity={stationActivities.get(`station-${s.id}`) ?? null}
                enrollmentId={enrollmentId ?? null}
                onChange={onActivityChanged}
              />
            ))}
          </div>
        </ActivitySection>

        {/* Mina reflektioner — sammanställning av station-reflektioner */}
        {triedCount > 0 && (
          <ActivitySection
            icon={<MessageSquare size={18} style={{ color: 'var(--c-text)' }} />}
            title="Mina reflektioner"
            subtitle="Vad du har upptäckt när du provat olika arbetsuppgifter"
            iconBgStyle={{ background: 'var(--c-accent)' }}
            defaultOpen
          >
            <div className="space-y-2">
              {Array.from(stationActivities.values())
                .filter((a) => a.participant_reflection && a.completed_at)
                .map((a) => {
                  const station = mock.workStations.find((s) => `station-${s.id}` === a.activity_key)
                  if (!station) return null
                  return (
                    <div key={a.id} className="p-3 rounded-lg bg-stone-50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{station.icon}</span>
                        <span className="text-sm font-medium text-stone-900">{station.name}</span>
                      </div>
                      <p className="text-sm text-stone-700 italic">"{a.participant_reflection}"</p>
                    </div>
                  )
                })}
            </div>
          </ActivitySection>
        )}
      </div>

      <PartSidebar nextPart={STA_PARTS[2]} consultantFirstName={mock.consultant.name.split(' ')[0]} />
    </div>
  )
}

function ArbetsstationCard({
  station,
  activity,
  enrollmentId,
  onChange,
}: {
  station: WorkStationDef
  activity: StaActivity | null
  enrollmentId: string | null
  onChange: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [reflection, setReflection] = useState(activity?.participant_reflection ?? '')
  const [saving, setSaving] = useState(false)
  const isTried = !!activity?.completed_at

  const handleSave = async (markComplete: boolean) => {
    if (!enrollmentId) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      const { staActivitiesApi } = await import('@/services/staApi')
      await staActivitiesApi.upsertByKey({
        enrollment_id: enrollmentId,
        part: 2,
        activity_type: 'arbetsstation',
        activity_key: `station-${station.id}`,
        participant_reflection: reflection.trim() || null,
        markComplete,
      })
      onChange()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 rounded-lg border border-stone-200 bg-white">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'var(--c-bg)' }}
        >
          {station.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-stone-900">{station.name}</div>
          <div className="text-xs text-stone-500">{station.desc}</div>
        </div>
        {isTried && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={11} />
            Prövad
          </span>
        )}
      </div>

      {!editing && activity?.participant_reflection && (
        <p className="mt-3 text-sm text-stone-600 italic">
          "{activity.participant_reflection}"
        </p>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <textarea
            rows={2}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Vad var roligt eller svårt? (Frivilligt)"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
            disabled={saving}
          />
          <div className="flex flex-wrap gap-2">
            {!isTried && (
              <Button size="sm" variant="primary" onClick={() => handleSave(true)} isLoading={saving}>
                Markera prövad
              </Button>
            )}
            {isTried && (
              <Button size="sm" variant="primary" onClick={() => handleSave(false)} isLoading={saving}>
                Spara reflektion
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {!editing && (
        <Button
          size="sm"
          variant={isTried ? 'ghost' : 'secondary'}
          className="mt-3"
          onClick={() => {
            setReflection(activity?.participant_reflection ?? '')
            setEditing(true)
          }}
        >
          {isTried ? 'Ändra reflektion' : 'Jag har provat'}
        </Button>
      )}
    </div>
  )
}

// ===========================================================================
// DEL 3 — Stärka och utveckla
// ===========================================================================

function STaDel3({
  mock,
  enrollmentId,
  focusOccupation,
  onReloadEnrollment,
}: {
  mock: ParticipantViewModel
  enrollmentId: string | null
  focusOccupation: string | null
  onReloadEnrollment: () => Promise<void> | void
}) {
  const { workplaces, loading } = useStaWorkplaces(enrollmentId)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PartIntro
          part={3}
          customText="Nu vet vi mer om vad som passar dig. Vi hittar ett yrkesområde att prova och du får testa på en riktig arbetsplats. Vi finns med hela tiden."
        />

        <Del3PortalIntegration
          enrollmentId={enrollmentId}
          currentFocusOccupation={focusOccupation}
          onFocusUpdated={() => {
            void onReloadEnrollment()
          }}
        />

        <ActivitySection
          icon={<Target size={18} style={{ color: 'var(--c-text)' }} />}
          title="Mitt yrkesområde"
          subtitle="Väljs under karriärvägledningen"
          iconBgStyle={{ background: 'var(--c-accent)' }}
          defaultOpen
        >
          {focusOccupation ? (
            <div>
              <p className="text-sm text-stone-700">
                Du och {mock.consultant.name.split(' ')[0]} har valt:
              </p>
              <div
                className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
              >
                <Target size={14} />
                <span className="text-sm font-semibold">{focusOccupation}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-600">
              Här kommer det yrkesområde du och {mock.consultant.name.split(' ')[0]} kommer fram till tillsammans.
            </p>
          )}
        </ActivitySection>

        <ActivitySection
          icon={<Building2 size={18} style={{ color: 'var(--c-text)' }} />}
          title="Min arbetsprövning"
          subtitle={`${workplaces.length} arbetsplats${workplaces.length === 1 ? '' : 'er'} ${loading ? '· laddar…' : 'aktuella'}`}
          iconBgStyle={{ background: 'var(--c-accent)' }}
          defaultOpen
        >
          {workplaces.length === 0 ? (
            <p className="text-sm text-stone-600">
              När din konsulent registrerar en arbetsplats syns företaget, kontaktpersonen och veckans uppföljningar här.
            </p>
          ) : (
            <div className="space-y-3">
              {workplaces.map((w) => (
                <WorkplaceCard key={w.id} workplace={w} consultantView={false} />
              ))}
            </div>
          )}
        </ActivitySection>

        {/* Arbetsdagbok per arbetsplats — strukturerad daglig logg */}
        {workplaces.map((w) => (
          <WorkDiary key={`diary-${w.id}`} enrollmentId={enrollmentId} workplace={w} part={3} />
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ToolShortcut icon={<FileUser size={18} />} title="CV-byggare" href="/cv" />
          <ToolShortcut icon={<Mic size={18} />} title="Intervjuträning" href="/interview-simulator" />
          <ToolShortcut icon={<BookOpen size={18} />} title="Allmän dagbok" href="/diary" />
        </div>
      </div>

      <PartSidebar nextPart={STA_PARTS[3]} consultantFirstName={mock.consultant.name.split(' ')[0]} />
    </div>
  )
}

// ===========================================================================
// DEL 4 — Hitta arbetsplats
// ===========================================================================

function STaDel4({
  mock,
  enrollmentId,
  focusOccupation,
}: {
  mock: ParticipantViewModel
  enrollmentId: string | null
  focusOccupation: string | null
}) {
  const { workplaces, loading } = useStaWorkplaces(enrollmentId)
  // I Del 4 är vanligtvis fokus på "introducerande" arbetsprövning
  const introducerande = workplaces.filter((w) => w.inriktning === 'introducerande')
  const shownWorkplaces = introducerande.length > 0 ? introducerande : workplaces

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PartIntro
          part={4}
          customText="Sista delen — vi letar tillsammans efter en arbetsplats där du kan landa. Du provar först, så att både du och företaget är säkra innan en anställning."
        />

        <ActivitySection
          icon={<MapPin size={18} style={{ color: 'var(--c-text)' }} />}
          title="Min arbetsplats"
          subtitle={loading ? 'Laddar…' : `${shownWorkplaces.length} introducerande arbetsprövning${shownWorkplaces.length === 1 ? '' : 'ar'}`}
          iconBgStyle={{ background: 'var(--c-accent)' }}
          defaultOpen
        >
          {shownWorkplaces.length === 0 ? (
            <p className="text-sm text-stone-600">
              Här syns företaget, din kontaktperson och planen för uppföljningarna när det är dags.
            </p>
          ) : (
            <div className="space-y-3">
              {shownWorkplaces.map((w) => (
                <WorkplaceCard key={w.id} workplace={w} consultantView={false} />
              ))}
            </div>
          )}
        </ActivitySection>

        {shownWorkplaces.map((w) => (
          <WorkDiary key={`diary-${w.id}`} enrollmentId={enrollmentId} workplace={w} part={4} />
        ))}

        <Del4PortalIntegration focusOccupation={focusOccupation} />

        <ActivitySection
          icon={<Award size={18} style={{ color: 'var(--c-text)' }} />}
          title="Mitt mål: en stabil anställning"
          subtitle="Steg för steg, i din takt"
          iconBgStyle={{ background: 'var(--c-accent)' }}
        >
          <p className="text-sm text-stone-600">
            {mock.consultant.name.split(' ')[0]} hjälper dig planera vad du behöver för att en anställning ska kännas
            stabil — anpassningar, lönebidrag eller hjälpmedel om det behövs.
          </p>
        </ActivitySection>
      </div>

      <aside className="space-y-5">
        <Card variant="flat" padding="lg">
          <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 font-medium">Härnäst</div>
          <h3 className="text-base font-semibold text-stone-900">Anställning</h3>
          <p className="text-sm text-stone-700 mt-2">
            När du är redo skriver du på ett anställningsavtal. {mock.consultant.name.split(' ')[0]} följer upp
            ändå under en period.
          </p>
        </Card>

        <Card variant="flat" padding="lg" style={{ background: 'var(--wellbeing-bg)' }}>
          <div className="text-xs uppercase tracking-wide mb-2 font-medium" style={{ color: 'var(--wellbeing-text)' }}>
            Påminnelse
          </div>
          <p className="text-sm text-stone-800">
            Du har kommit långt. Det är okej att fira de små stegen — inte bara mållinjen.
          </p>
        </Card>
      </aside>
    </div>
  )
}

// ===========================================================================
// SHARED PIECES
// ===========================================================================

function PartIntro({
  part,
  day,
  totalDays,
  customText,
}: {
  part: StaPart
  day?: number
  totalDays?: number
  customText?: string
}) {
  const partDef = STA_PARTS.find((p) => p.id === part)!
  return (
    <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ background: 'var(--c-solid)' }}
        >
          Del {part}
        </span>
        <span className="text-xs text-stone-600">
          {partDef.duration}
          {day !== undefined && totalDays !== undefined && ` · du är dag ${day} av ${totalDays}`}
        </span>
      </div>
      <h2 className="text-xl font-semibold text-stone-900">
        {part === 1 && 'Just nu lär vi känna varandra'}
        {part === 2 && 'Nu får du prova på'}
        {part === 3 && 'Vi stärker och utvecklar tillsammans'}
        {part === 4 && 'Du och din arbetsplats'}
      </h2>
      <p className="text-stone-700 mt-2 max-w-2xl">{customText ?? partDef.description}</p>
    </Card>
  )
}

function ActivitySection({
  icon,
  title,
  subtitle,
  iconBg = 'bg-stone-100',
  iconBgStyle,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  iconBg?: string
  iconBgStyle?: React.CSSProperties
  defaultOpen?: boolean
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card variant="flat" padding="lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', iconBg)}
            style={iconBgStyle}
          >
            {icon}
          </div>
          <div>
            <div className="font-semibold text-stone-900">{title}</div>
            <div className="text-xs text-stone-500">{subtitle}</div>
          </div>
        </div>
        <ChevronRight
          size={18}
          className={cn('text-stone-400 transition-transform', open && 'rotate-90')}
        />
      </button>
      {open && children && <div className="mt-4 text-sm text-stone-700">{children}</div>}
    </Card>
  )
}

function PartSidebar({
  nextPart,
  consultantFirstName,
  showLanguageSupport,
  consultantEmail,
}: {
  nextPart?: typeof STA_PARTS[number]
  consultantFirstName: string
  showLanguageSupport?: boolean
  consultantEmail?: string | null
}) {
  return (
    <aside className="space-y-5">
      {nextPart && (
        <Card variant="flat" padding="lg">
          <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 font-medium">Härnäst</div>
          <h3 className="text-base font-semibold text-stone-900">Del {nextPart.id} — {nextPart.shortLabel}</h3>
          <p className="text-sm text-stone-700 mt-2">{nextPart.description}</p>
        </Card>
      )}

      <Card variant="flat" padding="lg" style={{ background: 'var(--wellbeing-bg)' }}>
        <div className="text-xs uppercase tracking-wide mb-2 font-medium" style={{ color: 'var(--wellbeing-text)' }}>
          Påminnelse
        </div>
        <p className="text-sm text-stone-800">
          Det är okej att ha jobbiga dagar. Säg till {consultantFirstName} — hen hjälper dig anpassa.
        </p>
      </Card>

      {showLanguageSupport && (
        <Card variant="flat" padding="lg">
          <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 font-medium">Behöver du språkstöd?</div>
          <p className="text-sm text-stone-700">
            Vi kan översätta material eller ge stöd på arabiska, somaliska, tigrinja, dari eller pashtu.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={!consultantEmail}
            title={consultantEmail ? `Mejla ${consultantEmail}` : 'Ingen e-postadress finns — prata med din konsulent'}
            onClick={() => {
              if (consultantEmail) {
                window.location.href = `mailto:${consultantEmail}?subject=${encodeURIComponent('Steg till arbete — önskemål om språkstöd')}&body=${encodeURIComponent('Hej!\n\nJag skulle vilja ha språkstöd. Mitt språk är: ')}`
              }
            }}
          >
            Be om språkstöd
          </Button>
        </Card>
      )}
    </aside>
  )
}

function ToolShortcut({ icon, title, href }: { icon: React.ReactNode; title: string; href: string }) {
  return (
    <a
      href={href}
      className="block p-3 rounded-lg bg-white border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
        style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
      >
        {icon}
      </div>
      <div className="font-medium text-sm text-stone-900">{title}</div>
      <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
        Öppna <ChevronRight size={10} />
      </div>
    </a>
  )
}
