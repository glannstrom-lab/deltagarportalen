import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { PageLayout } from '@/components/layout/index'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  useParticipantEnrollment,
  useStaPulseChecks,
  useStaWeeklyCheckin,
  useStaActivities,
  getCurrentWeekMonday,
} from '@/hooks/useSta'
import { PulseCheckWidget } from './components/PulseCheckWidget'
import { WeeklyCheckinForm } from './components/WeeklyCheckinForm'
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
  GraduationCap,
  Building2,
  Target,
  Award,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import {
  STA_PARTS,
  PARTICIPANT_MOCK,
  DAY_RESOURCES,
  WEEK_THEMES,
  getWeekForDay,
  type StaPart,
  type DailyExercise,
  type DayResource,
  type WeekTheme,
} from './mockData'

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
  const firstName = profile?.first_name || PARTICIPANT_MOCK.firstName
  const [tab, setTab] = useState<TabId>('oversikt')

  // Försök hämta riktig enrollment
  const { enrollment } = useParticipantEnrollment()

  // För nu: räkna ut antal klara dagar från riktig aktivitetslogg om vi har den,
  // annars använd mock. Andra fält (week plan, today activity, strengths)
  // genereras härefter — i en senare iteration kommer dessa också från DB.
  const { activities, markDayComplete } = useStaActivities(enrollment?.id ?? null, 1)
  const completedKeys = useMemo(
    () => new Set(activities.filter((a) => a.completed_at).map((a) => a.activity_key)),
    [activities],
  )

  // Bygg viewModel: om enrollment finns, härled current_day från completed-count;
  // annars använd mock (Anna är på dag 8 av 21).
  const viewModel = useMemo(() => {
    if (!enrollment) {
      return { ...PARTICIPANT_MOCK, firstName }
    }
    const completedDays = activities.filter(
      (a) => a.completed_at && a.activity_key?.startsWith('dag-'),
    ).length
    return {
      ...PARTICIPANT_MOCK,
      firstName,
      currentPart: enrollment.current_part,
      currentDay: Math.min(completedDays + 1, 21),
      focusOccupation: enrollment.focus_occupation,
      // Uppdatera dagsslingan-statusar baserat på vad som är klart i DB
      dailyExercises: PARTICIPANT_MOCK.dailyExercises.map((d) => {
        const key = `dag-${d.day}`
        if (completedKeys.has(key)) return { ...d, status: 'completed' as const }
        if (d.day === completedDays + 1) return { ...d, status: 'today' as const }
        if (d.day === completedDays + 2) return { ...d, status: 'tomorrow' as const }
        return { ...d, status: 'upcoming' as const }
      }),
    }
  }, [enrollment, activities, completedKeys, firstName])

  const mock = viewModel

  return (
    <PageLayout title="Steg till arbete" showTabs={false} domain="action" showHeader={false}>
      <STaHero mock={mock} />
      <STaTabs current={tab} onChange={setTab} currentPart={mock.currentPart} />

      <div className="mt-6">
        {tab === 'oversikt' && (
          <STaOverview mock={mock} onJumpToTab={setTab} enrollmentId={enrollment?.id ?? null} />
        )}
        {tab === 'del-1' && (
          <STaDel1
            mock={mock}
            enrollmentId={enrollment?.id ?? null}
            onMarkDayComplete={markDayComplete}
          />
        )}
        {tab === 'del-2' && <STaDel2 mock={mock} />}
        {tab === 'del-3' && <STaDel3 mock={mock} />}
        {tab === 'del-4' && <STaDel4 mock={mock} />}
      </div>
    </PageLayout>
  )
}

// ===========================================================================
// HERO + TIMELINE
// ===========================================================================

function STaHero({ mock }: { mock: typeof PARTICIPANT_MOCK }) {
  const partLabel = STA_PARTS.find((p) => p.id === mock.currentPart)?.shortLabel ?? ''
  const progressPct = Math.round((mock.currentDay / mock.totalDays) * 100)

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
          <h1 className="text-2xl lg:text-3xl font-semibold text-stone-900">Din resa, {mock.firstName}</h1>
          <p className="text-stone-700 mt-1 max-w-xl">
            Det är okej att gå i din egen takt. Här ser du var du är just nu och vad som väntar — utan tidspress.
          </p>
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

      <Timeline currentPart={mock.currentPart} />
    </Card>
  )
}

function Timeline({ currentPart }: { currentPart: StaPart }) {
  return (
    <div className="mt-6 flex items-center">
      {STA_PARTS.map((part, idx) => {
        const isActive = part.id === currentPart
        const isPast = part.id < currentPart
        const isFuture = part.id > currentPart
        return (
          <div key={part.id} className="flex items-center flex-1 last:flex-initial">
            <div className={cn('flex flex-col items-center flex-shrink-0', isFuture && 'opacity-50')}>
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold ring-4 ring-[var(--header-bg)]',
                  isActive || isPast ? 'text-white' : 'text-stone-600 bg-stone-300',
                )}
                style={isActive || isPast ? { background: 'var(--c-solid)' } : undefined}
              >
                {isPast ? <CheckCircle2 className="w-5 h-5" /> : part.id}
              </div>
              <div className="text-xs mt-2 font-medium text-stone-900 text-center max-w-[110px]">{part.shortLabel}</div>
              <div className="text-[11px] text-stone-500">{part.duration}</div>
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
}: {
  current: TabId
  onChange: (tab: TabId) => void
  currentPart: StaPart
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2" role="tablist">
      {TABS.map((t) => {
        const isActive = t.id === current
        const isFuturePart = t.partIndex !== undefined && t.partIndex > currentPart
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
              !isActive && isFuturePart && 'opacity-60',
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
}: {
  mock: typeof PARTICIPANT_MOCK
  onJumpToTab: (tab: TabId) => void
  enrollmentId: string | null
}) {
  const { hasToday, submitToday } = useStaPulseChecks(enrollmentId)
  const { checkins, submitForWeek } = useStaWeeklyCheckin(enrollmentId)
  const currentMonday = getCurrentWeekMonday()
  const existingThisWeek = checkins.find((c) => c.week_starts === currentMonday)

  // Visa veckoavslutning från och med torsdag eftermiddag
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=sön 1=mån ... 4=tor 5=fre 6=lör
  const showWeeklyCheckin = dayOfWeek >= 4 || dayOfWeek === 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Today */}
      <Card variant="flat" padding="lg" className="lg:col-span-2" style={{ background: 'var(--c-bg)' }}>
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
          <Button variant="primary" onClick={() => onJumpToTab('del-1')}>
            Öppna dagens övning
          </Button>
          <Button variant="secondary">Skjut upp till imorgon</Button>
        </div>
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
          <Button variant="secondary" size="sm" className="flex-1" leftIcon={<MessageSquare size={14} />}>
            Meddelande
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Phone size={14} />}>
            Ring
          </Button>
        </div>
      </Card>

      {/* Week plan */}
      <Card variant="flat" padding="lg" className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-stone-900">Veckans plan</h3>
          <span className="text-xs text-stone-500">v.20 · 12–16 maj</span>
        </div>
        <ul className="space-y-2">
          {mock.weekPlan.map((item) => (
            <WeekPlanRow key={item.weekday} item={item} />
          ))}
        </ul>
      </Card>

      {/* Strengths */}
      <Card variant="flat" padding="lg">
        <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 font-medium">Det här ser vi hos dig</div>
        <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Sparkles size={18} style={{ color: 'var(--c-solid)' }} />
          Styrkor som växer fram
        </h3>
        <ul className="space-y-2 text-sm">
          {mock.strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--c-solid)' }}
              />
              <span className="text-stone-700">{s.text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-500 mt-3">{mock.consultant.name.split(' ')[0]} fyller på listan när ni pratas vid.</p>
      </Card>

      {/* Reflection */}
      <Card variant="flat" padding="lg" className="lg:col-span-2" style={{ background: 'var(--wellbeing-bg)' }}>
        <div className="text-xs uppercase tracking-wide font-medium mb-2" style={{ color: 'var(--wellbeing-text)' }}>
          Dagens reflektion
        </div>
        <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Heart size={18} style={{ color: 'var(--wellbeing-text)' }} />
          Hur har dagen känts?
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { emoji: '🌤️', label: 'Riktigt bra' },
            { emoji: '🙂', label: 'Okej' },
            { emoji: '😐', label: 'Sådär' },
            { emoji: '😞', label: 'Tungt' },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              className="px-3 py-2 rounded-full bg-white border-2 border-stone-200 text-sm hover:border-stone-300 transition-colors"
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
        <textarea
          rows={2}
          placeholder="Vad har varit roligt eller jobbigt idag? Kan vara så kort eller långt du vill."
          className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        />
        <p className="text-xs text-stone-600 mt-2">
          Bara du och {mock.consultant.name.split(' ')[0]} ser detta. Du bestämmer själv när du vill skriva.
        </p>
      </Card>

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

function WeekPlanRow({ item }: { item: typeof PARTICIPANT_MOCK.weekPlan[number] }) {
  const isToday = item.status === 'today'
  const isDone = item.status === 'done'
  return (
    <li
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        isToday && '',
        !isToday && 'bg-stone-50',
      )}
      style={isToday ? { background: 'var(--c-bg)' } : undefined}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0',
          isToday && 'bg-white',
          !isToday && !isDone && 'bg-stone-200 text-stone-600',
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
      {!isToday && !isDone && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-600 flex-shrink-0">
          {item.date}
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
  onMarkDayComplete,
}: {
  mock: typeof PARTICIPANT_MOCK
  enrollmentId?: string | null
  onMarkDayComplete?: (activityKey: string, reflection?: string) => Promise<unknown>
}) {
  // Default: visa idag som vald dag, om den finns
  const initialDay = mock.dailyExercises.find((d) => d.status === 'today')?.day ?? null
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDay)

  const currentWeek = getWeekForDay(mock.currentDay)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PartIntro part={1} day={mock.currentDay} totalDays={mock.totalDays} />

        {currentWeek && <CurrentWeekCard week={currentWeek} currentDay={mock.currentDay} />}

        {/* Startsamtal */}
        <ActivitySection
          icon={<CheckCircle2 size={18} className="text-emerald-700" />}
          title="Startsamtal"
          subtitle="Klart · 30 april"
          iconBg="bg-emerald-100"
          defaultOpen
        >
          <p>
            Du och {mock.consultant.name.split(' ')[0]} gick igenom hur tjänsten fungerar, ditt schema och vad du behöver
            för att det ska kännas bra. Du nämnde att du vill ha lugna miljöer och korta pauser oftare.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-stone-50">
            <div className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-1">Anpassningar vi planerat</div>
            <ul className="text-sm text-stone-700 space-y-0.5">
              {mock.adaptations.map((a) => (
                <li key={a}>• {a}</li>
              ))}
            </ul>
          </div>
        </ActivitySection>

        {/* Kartläggning */}
        <ActivitySection
          icon={<CheckCircle2 size={18} className="text-emerald-700" />}
          title="Vi pratar om dig och arbete"
          subtitle="Klart · 6 maj · två samtal à 1 timme"
          iconBg="bg-emerald-100"
        >
          <p>
            Vi pratade om vad som har funkat bra för dig tidigare, vad du tycker är meningsfullt, och hur du
            mår just nu. {mock.consultant.name.split(' ')[0]} skrev ner det som var viktigast för dig.
          </p>
        </ActivitySection>

        {/* Kompetenskartläggning */}
        <ActivitySection
          icon={<Clock size={18} style={{ color: 'var(--c-text)' }} />}
          title="Dina kompetenser och intressen"
          subtitle="Pågående · 5 av 8 frågor klara"
          iconBg=""
          iconBgStyle={{ background: 'var(--c-accent)' }}
          defaultOpen
        >
          <p>
            Vi sammanställer vad du redan kan och vad du tycker om att göra. Du fyller på i din egen takt — det är
            ingen brådska.
          </p>
          <div className="h-2 rounded-full mt-3 overflow-hidden bg-stone-100">
            <div className="h-full" style={{ width: '62%', background: 'var(--c-solid)' }} />
          </div>
          <Button variant="primary" className="mt-3">
            Fortsätt där du var
          </Button>
        </ActivitySection>

        {/* Dagsslinga — grupperad veckovis */}
        <ActivitySection
          icon={<Calendar size={18} style={{ color: 'var(--c-text)' }} />}
          title="Resan i tre veckor"
          subtitle={`${mock.dailyExercises.filter((d) => d.status === 'completed').length} av 14 dagar avklarade · klicka på en dag för material`}
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
            <HealthCard icon={<Moon size={18} />} title="Bättre sömn" subtitle="Övningar och guide" />
            <HealthCard icon={<Sun size={18} />} title="Stresshantering" subtitle="Korta verktyg" />
            <HealthCard icon={<Coffee size={18} />} title="Vardagsstruktur" subtitle="Hitta din rytm" />
          </div>
        </ActivitySection>
      </div>

      <PartSidebar
        nextPart={STA_PARTS[1]}
        consultantFirstName={mock.consultant.name.split(' ')[0]}
        showLanguageSupport
      />
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
      className="mt-5 p-5 rounded-xl border"
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
          Mer material för den här dagen kommer snart. Prata med {' '}
          {PARTICIPANT_MOCK.consultant.name.split(' ')[0]} om du vill ha tips.
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

function HealthCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <button
      type="button"
      className="text-left p-4 rounded-lg bg-white border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
        style={{ background: 'var(--wellbeing-bg)', color: 'var(--wellbeing-text)' }}
      >
        {icon}
      </div>
      <div className="font-medium text-sm text-stone-900">{title}</div>
      <div className="text-xs text-stone-500">{subtitle}</div>
    </button>
  )
}

// ===========================================================================
// DEL 2 — Prova på
// ===========================================================================

function STaDel2({ mock }: { mock: typeof PARTICIPANT_MOCK }) {
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
          subtitle="Du kommer prova fyra olika typer av arbete"
          iconBgStyle={{ background: 'var(--c-accent)' }}
          defaultOpen
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {mock.workStations.map((s) => (
              <div key={s.id} className="p-4 rounded-lg border border-stone-200 bg-white">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'var(--c-bg)' }}
                  >
                    {s.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-stone-900">{s.name}</div>
                    <div className="text-xs text-stone-500">{s.desc}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-stone-500">
                  {s.tried ? '✓ Du har provat den här stationen' : 'Du har inte provat än'}
                </div>
              </div>
            ))}
          </div>
        </ActivitySection>

        {/* Mina reflektioner */}
        <ActivitySection
          icon={<MessageSquare size={18} style={{ color: 'var(--c-text)' }} />}
          title="Mina reflektioner"
          subtitle="Vad var roligt? Svårt? Överraskande?"
          iconBgStyle={{ background: 'var(--c-accent)' }}
        >
          <p className="text-sm text-stone-600">
            Här samlar vi det du har upptäckt om dig själv när du provar olika arbetsuppgifter.
          </p>
        </ActivitySection>
      </div>

      <PartSidebar nextPart={STA_PARTS[2]} consultantFirstName={mock.consultant.name.split(' ')[0]} />
    </div>
  )
}

// ===========================================================================
// DEL 3 — Stärka och utveckla
// ===========================================================================

function STaDel3({ mock }: { mock: typeof PARTICIPANT_MOCK }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PartIntro
          part={3}
          customText="Nu vet vi mer om vad som passar dig. Vi hittar ett yrkesområde att prova och du får testa på en riktig arbetsplats. Vi finns med hela tiden."
        />

        <ActivitySection
          icon={<Target size={18} style={{ color: 'var(--c-text)' }} />}
          title="Mitt yrkesområde"
          subtitle="Väljs under karriärvägledningen"
          iconBgStyle={{ background: 'var(--c-accent)' }}
          defaultOpen
        >
          <p className="text-sm text-stone-600">
            Här kommer det yrkesområde du och {mock.consultant.name.split(' ')[0]} kommer fram till tillsammans.
          </p>
        </ActivitySection>

        <ActivitySection
          icon={<Building2 size={18} style={{ color: 'var(--c-text)' }} />}
          title="Min arbetsprövning"
          subtitle="Företag, kontaktperson, mål"
          iconBgStyle={{ background: 'var(--c-accent)' }}
        >
          <p className="text-sm text-stone-600">När du har en arbetsplats syns företaget och din kontaktperson här.</p>
        </ActivitySection>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ToolShortcut icon={<FileUser size={18} />} title="CV-byggare" href="/cv" />
          <ToolShortcut icon={<Mic size={18} />} title="Intervjuträning" href="/interview-simulator" />
          <ToolShortcut icon={<BookOpen size={18} />} title="Arbetsdagbok" href="/diary" />
        </div>
      </div>

      <PartSidebar nextPart={STA_PARTS[3]} consultantFirstName={mock.consultant.name.split(' ')[0]} />
    </div>
  )
}

// ===========================================================================
// DEL 4 — Hitta arbetsplats
// ===========================================================================

function STaDel4({ mock }: { mock: typeof PARTICIPANT_MOCK }) {
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
          subtitle="Introducerande arbetsprövning inför anställning"
          iconBgStyle={{ background: 'var(--c-accent)' }}
          defaultOpen
        >
          <p className="text-sm text-stone-600">
            Här syns företaget, din kontaktperson och planen för uppföljningarna när det är dags.
          </p>
        </ActivitySection>

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
}: {
  nextPart?: typeof STA_PARTS[number]
  consultantFirstName: string
  showLanguageSupport?: boolean
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
          <Button variant="secondary" size="sm" className="mt-3">
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
