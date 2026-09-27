/**
 * OverviewTab - Consultant Dashboard Overview
 * KPI dashboard with traffic light status, activity feed, and quick actions
 */

import { useState, useEffect, useEffectEvent, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Users,
  FileText,
  Briefcase,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Target,
  Activity,
  ChevronRight,
  Plus,
  Bell,
  RefreshCw,
  Download,
} from '@/components/ui/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notifications } from '@/lib/toast'
import { fetchCachedConsultantParticipants, useInvalidateConsultantParticipants } from './consultantParticipantsQuery'
import { Card } from '@/components/ui/Card'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import { InviteParticipantDialog } from '@/components/consultant/InviteParticipantDialog'
import { MeetingSchedulerDialog } from '@/components/consultant/MeetingSchedulerDialog'
import { GoalCreationDialog } from '@/components/consultant/GoalCreationDialog'
import { GroupMessageDialog } from '@/components/consultant/GroupMessageDialog'
import {
  MinDagSection,
  type MyDayMeeting,
  type MyDayDeadline,
  type MyDayContact,
} from '@/components/consultant/MinDagSection'
import { kontaktText, dagarSedanKontakt } from '@/lib/kontaktText'
import { DagensPass } from '@/components/consultant/DagensPass'
import { consultantService } from '@/services/consultantService'
import { FYSISKT_GRANS_DAGAR, hamtaMotenForKonsulent, type MoteRad } from '@/services/moteskadens'
import { aktivitetsplanApi, type ActivityPlan, type AttendanceInput } from '@/services/aktivitetApi'
import { orgApi, type OrgKind } from '@/services/orgApi'
import { regelverk } from '@/components/consultant/orgTypVisning'
import { senasteKontakt } from '@/services/senasteKontakt'
import {
  attGoraFonster,
  attGoraIdag,
  bradskandePunkter,
  bradskandeUtanDubbletter,
  leverantorsLage,
  veckansGranser,
  type AttGoraPass,
  type Bradskande,
  type PlaceringRad,
} from './oversiktRegler'
import { BradskandeIdag } from './BradskandeIdag'
import { calculateGoalCategories } from './analytics'
import { antal } from './antal'
import { aktivitetstid } from './aktivitetstid'

interface DashboardStats {
  totalParticipants: number
  activeParticipants: number
  needsAttention: number
  completedCV: number
  // KV5: null när ingen deltagare har en ATS-poäng ännu — inte 0. Ett
  // saknat värde är inte samma sak som ett dåligt värde.
  averageProgress: number | null
  meetingsThisWeek: number
  pendingMessages: number
  goalsCompleted: number
  goalsOverdue: number
  /** Antal mål totalt — 0 betyder "inga mål än", inte "0 klara, 0 försenade". */
  goalsTotal: number
}

interface Participant {
  participant_id: string
  email: string
  first_name: string
  last_name: string
  status: string
  has_cv: boolean
  ats_score: number | null
  last_contact_at: string | null
  /** Senaste journalanteckning (vyns max) — en anteckning är en kontakt (RK14/RK38). */
  last_note_date?: string | null
  last_login: string | null
  saved_jobs_count: number
}

/**
 * RK38 (rollspelet 2026-09-27): "Ej kontaktad" på Översikt räknades bara ur
 * `last_contact_at`, som enbart "Logga kontakt" skriver — en journalanteckning
 * om ett samtal flyttade inte Översikten, fast deltagarsidan och listan redan
 * räknade den (senasteKontakt, RK14). Samma regel på alla tre ställena nu.
 */
function senasteKontaktAt(p: Pick<Participant, 'last_contact_at' | 'last_note_date'>): string | null {
  return senasteKontakt({ last_contact_at: p.last_contact_at, last_note_date: p.last_note_date ?? null })?.at ?? null
}

interface RecentActivity {
  id: string
  type: 'cv_updated' | 'job_saved' | 'login' | 'goal_completed' | 'message'
  participantName: string
  participantId: string
  description: string
  timestamp: string
}

// KPI Card Component
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status,
  onClick,
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
  status?: 'green' | 'yellow' | 'red' | 'neutral'
  onClick?: () => void
}) {
  const { t } = useTranslation()
  const statusColors = {
    green: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    yellow: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    red: 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
    neutral: 'bg-stone-50 border-stone-200 dark:bg-stone-800/50 dark:border-stone-700',
  }

  const iconColors = {
    green: 'text-emerald-600 dark:text-emerald-400',
    yellow: 'text-amber-700 dark:text-amber-400',
    red: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-stone-600 dark:text-stone-400',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02]',
        statusColors[status || 'neutral']
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className="text-stone-500 dark:text-stone-400 font-normal">{t('consultant.overview.vsLastWeek')}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          status === 'green' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
          status === 'yellow' ? 'bg-amber-100 dark:bg-amber-900/40' :
          status === 'red' ? 'bg-rose-100 dark:bg-rose-900/40' :
          'bg-stone-100 dark:bg-stone-700'
        )}>
          <Icon className={cn('w-6 h-6', iconColors[status || 'neutral'])} />
        </div>
      </div>
    </button>
  )
}

// Attention Alert Component
type AttentionTyp = 'no_contact' | 'inactive' | 'no_cv' | 'low_engagement' | 'franvaro' | 'mote'

function AttentionAlert({
  participant,
  type,
  t,
  detalj,
}: {
  participant: Participant
  type: AttentionTyp
  t: (key: string) => string
  /** RR3/RK7: brådskande punkter bär sin egen text (regel + datum). */
  detalj?: string
}) {
  // PG24 (2026-09-12): samma regel och samma ord som deltagarkortet —
  // "Aldrig kontaktad" när last_contact_at saknas, annars dagar sedan.
  const alerts = {
    no_contact: {
      icon: Clock,
      color: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40',
      message: kontaktText(t as (k: string, o?: Record<string, unknown>) => string, dagarSedanKontakt(senasteKontaktAt(participant))),
    },
    inactive: {
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-100',
      message: t('consultant.alerts.inactive'),
    },
    no_cv: {
      icon: FileText,
      color: 'text-blue-600 bg-blue-100',
      message: t('consultant.alerts.noCv'),
    },
    low_engagement: {
      icon: Activity,
      color: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40',
      message: t('consultant.alerts.lowEngagement'),
    },
    franvaro: {
      icon: AlertTriangle,
      color: 'text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/40',
      message: detalj ?? 'Ogiltig frånvaro',
    },
    mote: {
      icon: Calendar,
      color: 'text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/40',
      message: detalj ?? 'Möte över regelns gräns',
    },
  }

  const alert = alerts[type]
  const Icon = alert.icon

  return (
    <Link
      to={`/consultant/participants/${participant.participant_id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
    >
      <div className={cn('p-2 rounded-lg', alert.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
          {participant.first_name} {participant.last_name}
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400">{alert.message}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
    </Link>
  )
}

// Quick Action Button Component
function QuickAction({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200',
        variant === 'primary'
          ? 'bg-[var(--c-solid)] text-[var(--c-on-solid)] hover:brightness-95'
          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  )
}

export function OverviewTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // KK4: mutationer som sker HÄR (t.ex. status/prioritet ändrad via en
  // dialog öppnad från denna flik) ska göra att ParticipantsTab m.fl. inte
  // visar en gammal lista tills staleTime löper ut.
  const invalidateParticipants = useInvalidateConsultantParticipants()
  const [loading, setLoading] = useState(true)
  // KS7: ett fel vid hämtning ska aldrig se ut som "inga deltagare" — eget
  // läge, skilt från loading och från den tomma dashboarden.
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalParticipants: 0,
    activeParticipants: 0,
    needsAttention: 0,
    completedCV: 0,
    averageProgress: null,
    meetingsThisWeek: 0,
    pendingMessages: 0,
    goalsCompleted: 0,
    goalsOverdue: 0,
    goalsTotal: 0,
  })
  const [participants, setParticipants] = useState<Participant[]>([])
  const [attentionList, setAttentionList] = useState<Array<{ participant: Participant; type: AttentionTyp; detalj?: string }>>([])
  // RR3/RK7: det brådskande (ogiltig frånvaro, möte över gränsen) — eget fel-läge
  const [bradskande, setBradskande] = useState<Bradskande[]>([])
  const [bradskandeFel, setBradskandeFel] = useState(false)
  // RK35/RR26: passen bakom "Att göra i dag", och leverantörens underlag.
  // Punkterna räknas om ur passen efter varje åtgärd i listan — utan att hela
  // Översikten läggs i laddningsläge.
  const [attGoraPass, setAttGoraPass] = useState<AttGoraPass[]>([])
  const [egnaPlanIds, setEgnaPlanIds] = useState<Set<string> | null>(null)
  const [levUnderlag, setLevUnderlag] = useState<{ plans: ActivityPlan[]; placeringar: PlaceringRad[]; moten: MoteRad[] } | null>(null)
  const [levFel, setLevFel] = useState(false)
  const [underlagsDag, setUnderlagsDag] = useState<Date | null>(null)
  const [motesDeltagare, setMotesDeltagare] = useState<Participant | null>(null)
  const [attentionCounts, setAttentionCounts] = useState({ franvaro: 0, mote: 0, noContact: 0, inactive: 0, noCv: 0 })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  // Meddelandedialog (gruppmeddelande + direktmeddelande från Min dag)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [messagePreselected, setMessagePreselected] = useState<string[] | undefined>(undefined)

  // Min dag-data
  const [myDayMeetings, setMyDayMeetings] = useState<MyDayMeeting[]>([])
  const [myDayDeadlines, setMyDayDeadlines] = useState<MyDayDeadline[]>([])
  const [myDayContacts, setMyDayContacts] = useState<MyDayContact[]>([])

  // Goal categories for overview
  const [goalCategories, setGoalCategories] = useState<Array<{ category: string; count: number; percentage: number }>>([])

  // Hämtas en gång vid montering; useEffectEvent så att beroendelistan är
  // ärlig utan att fetchDashboardData (som byts varje rendering) utlöser nya
  // hämtningar (react-hooks/exhaustive-deps, 2026-09-24).
  const hamtaOversikt = useEffectEvent(() => { void fetchDashboardData() })
  useEffect(() => {
    hamtaOversikt()
  }, [])

  // F9: namn per deltagar-id ur den redan hämtade listan (samma källa som Min dag)
  const namnForDeltagare = (pid: string) => {
    const p = participants.find((x) => x.participant_id === pid)
    const namn = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : ''
    return namn || p?.email || t('common.unknown')
  }

  // RR26: leverantörens rad bara när alla relevanta organisationer är
  // leverantörer (regelverk) — samma regel som texterna i planen och underlaget.
  const medlemskapQ = useQuery({
    queryKey: ['org-medlemskap'],
    queryFn: () => orgApi.myMemberships(),
    staleTime: 5 * 60_000,
  })
  const arLeverantor = medlemskapQ.isSuccess
    && regelverk(medlemskapQ.data.map((m) => m.organization?.kind).filter((k): k is OrgKind => !!k)) === 'leverantor'

  // Bara pass i konsulentens EGNA planer kan markeras (UPDATE-policyn, ST2) —
  // samma avgränsning som Dagens pass. Utan planlistan visas alla (RLS-urvalet).
  const attGora = useMemo(() => {
    if (!underlagsDag) return []
    const pass = egnaPlanIds ? attGoraPass.filter((p) => !p.plan_id || egnaPlanIds.has(p.plan_id)) : attGoraPass
    return attGoraIdag({ deltagare: participants, pass, idag: underlagsDag })
  }, [attGoraPass, egnaPlanIds, participants, underlagsDag])

  const leverantor = useMemo(() => {
    if (!arLeverantor || !levUnderlag || !underlagsDag) return null
    return leverantorsLage({
      deltagare: participants,
      plans: egnaPlanIds ? levUnderlag.plans.filter((p) => egnaPlanIds.has(p.id)) : levUnderlag.plans,
      pass: attGoraPass,
      moten: levUnderlag.moten,
      placeringar: levUnderlag.placeringar,
      idag: underlagsDag,
    })
  }, [arLeverantor, levUnderlag, underlagsDag, participants, egnaPlanIds, attGoraPass])

  const uppdateraPass = (uppdaterad: AttGoraPass) =>
    setAttGoraPass((prev) => prev.map((p) => (p.id === uppdaterad.id ? { ...p, ...uppdaterad } : p)))

  const markeraPass = async (pass: AttGoraPass, input: AttendanceInput) => {
    uppdateraPass(await aktivitetsplanApi.markAttendance(pass.id, input))
  }

  const sparaPassAnteckning = async (pass: AttGoraPass, anteckning: string) => {
    uppdateraPass(await aktivitetsplanApi.saveAttendanceNote(pass.id, anteckning))
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // KK4: delad cache — se consultantParticipantsQuery.ts. Om
      // ParticipantsTab (eller en annan flik) redan hämtat inom staleTime
      // görs INGET nytt nätverksanrop här. Casten matchar samma implicita
      // `any`-form frågan hade innan (klienten är otypad mot Database).
      const participantsData = (await fetchCachedConsultantParticipants(queryClient)) as unknown as Participant[]

      // Veckans möten. RK6: måndag–söndag i lokal tid — den gamla räkningen
      // (idag − getDay() + 1) gav nästa veckas måndag på en söndag.
      const { start: startOfWeek, slut: endOfWeek } = veckansGranser(new Date())

      // RR3/RK7: underlaget för det brådskande. Hämtas parallellt; ett fel här
      // fäller inte översikten men syns som en egen rad i Min dag.
      // RK35: fönstret täcker både frånvaroregeln (7 dagar), "Att göra i dag"
      // (14 bakåt, 7 framåt) och leverantörens senaste avslutade vecka.
      const idagNu = new Date()
      const { fran: passFran, till: passTill } = attGoraFonster(idagNu)
      const bradskandeUnderlag = Promise.allSettled([
        hamtaMotenForKonsulent(idagNu),
        aktivitetsplanApi.listSessionsBetween(passFran, passTill),
      ])
      const planUnderlag = Promise.allSettled([
        aktivitetsplanApi.listAll(),
        consultantService.getMinaPlaceringar(),
      ])

      // Varje fråga nedan kontrolleras. Förr lästes bara `data`: ett fel gav
      // null → [] → Min dag sa "Inga brådskande punkter idag" och korten
      // "0 möten"/"0 försenade mål" till en konsulent som kanske hade tre
      // möten. Ett fel går nu till samma felläge som deltagarlistan (KS7).
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('consultant_meetings')
        .select('*')
        .eq('consultant_id', user.id)
        .gte('scheduled_at', startOfWeek.toISOString())
        .lte('scheduled_at', endOfWeek.toISOString())
        .eq('status', 'scheduled')
      if (meetingsError) throw meetingsError

      // Fetch unread messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('consultant_messages')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
      if (messagesError) throw messagesError

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('consultant_goals')
        .select('*')
        .eq('consultant_id', user.id)
      if (goalsError) throw goalsError

      // Fetch recent journal entries for activity feed
      const { data: journalData, error: journalError } = await supabase
        .from('consultant_journal')
        .select('*, profiles!consultant_journal_participant_id_fkey(first_name, last_name)')
        .eq('consultant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (journalError) throw journalError

      if (participantsData) {
        setParticipants(participantsData)

        // Calculate stats
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

        const active = participantsData.filter(p => p.status === 'ACTIVE')

        // PG3 (persona-genomgång 2026-09-12): kortet "Kräver uppmärksamhet" räknade
        // bara "ej kontaktad 7 dagar" medan listan under det också tog med
        // inaktivitet och "CV saknas" — demot visade 0 i kortet ovanför fem
        // rader. Nu räknas kortet ur SAMMA mängd som listan: unika deltagare
        // med minst ett skäl, och undertexten säger vilka skäl.
        const attention: Array<{ participant: Participant; type: AttentionTyp; detalj?: string }> = []
        // RR3/RK7: det brådskande först — listan visar bara fem rader.
        const [motenUtfall, passUtfall] = await bradskandeUnderlag
        const underlagFel = motenUtfall.status === 'rejected' || passUtfall.status === 'rejected'
        const punkter = underlagFel
          ? []
          : bradskandePunkter({
              deltagare: participantsData,
              moten: motenUtfall.value,
              pass: passUtfall.value,
              idag: idagNu,
            })
        if (underlagFel) {
          console.warn('[OverviewTab] möten eller pass kunde inte hämtas', motenUtfall.status === 'rejected' ? motenUtfall.reason : (passUtfall as PromiseRejectedResult).reason)
        }
        setBradskande(punkter)
        setBradskandeFel(underlagFel)
        setAttGoraPass(passUtfall.status === 'fulfilled' ? (passUtfall.value as AttGoraPass[]) : [])
        setUnderlagsDag(idagNu)
        const [planUtfall, placeringUtfall] = await planUnderlag
        setEgnaPlanIds(planUtfall.status === 'fulfilled'
          ? new Set(planUtfall.value.filter((p) => p.consultant_id === user.id).map((p) => p.id))
          : null)
        const levOk = !underlagFel && planUtfall.status === 'fulfilled' && placeringUtfall.status === 'fulfilled'
        setLevUnderlag(levOk
          ? { plans: planUtfall.value, placeringar: placeringUtfall.value, moten: (motenUtfall as PromiseFulfilledResult<MoteRad[]>).value }
          : null)
        setLevFel(!levOk)
        for (const b of punkter) {
          const p = participantsData.find(x => x.participant_id === b.participantId)
          if (p) attention.push({ participant: p, type: b.typ, detalj: b.text })
        }
        participantsData.forEach(p => {
          const kontakt = senasteKontaktAt(p)
          if (!kontakt || new Date(kontakt) < sevenDaysAgo) {
            attention.push({ participant: p, type: 'no_contact' })
          }
          if (p.last_login && new Date(p.last_login) < fourteenDaysAgo) {
            attention.push({ participant: p, type: 'inactive' })
          }
          if (!p.has_cv) {
            attention.push({ participant: p, type: 'no_cv' })
          }
        })
        const attentionUnique = new Set(attention.map(a => a.participant.participant_id))
        const attentionCounts = {
          franvaro: attention.filter(a => a.type === 'franvaro').length,
          mote: attention.filter(a => a.type === 'mote').length,
          noContact: attention.filter(a => a.type === 'no_contact').length,
          inactive: attention.filter(a => a.type === 'inactive').length,
          noCv: attention.filter(a => a.type === 'no_cv').length,
        }
        const completedCV = participantsData.filter(p =>
          p.has_cv && (p.ats_score || 0) >= 70
        )

        // KV5: snittet ska tas över dem som FAKTISKT har en ATS-poäng — en
        // deltagare utan CV eller utan analyserat CV har `ats_score: null`,
        // och att räkna null som 0 drar ner snittet mot noll ju fler
        // ej-startade deltagare konsulenten har, vilket inte säger något om
        // CV-kvaliteten hos dem som faktiskt skickat in ett CV.
        const participantsWithAtsScore = participantsData.filter(p => p.ats_score != null)
        const averageAtsScore = participantsWithAtsScore.length > 0
          ? Math.round(
              participantsWithAtsScore.reduce((acc, p) => acc + (p.ats_score || 0), 0) /
              participantsWithAtsScore.length
            )
          : null

        // Calculate goals stats
        const completedGoals = goalsData?.filter(g => g.status === 'COMPLETED').length || 0
        const overdueGoals = goalsData?.filter(g =>
          g.deadline && new Date(g.deadline) < now && g.status !== 'COMPLETED'
        ).length || 0

        setStats({
          totalParticipants: participantsData.length,
          activeParticipants: active.length,
          needsAttention: attentionUnique.size,
          completedCV: completedCV.length,
          averageProgress: averageAtsScore,
          meetingsThisWeek: meetingsData?.length || 0,
          pendingMessages: messagesData?.length || 0,
          goalsCompleted: completedGoals,
          goalsOverdue: overdueGoals,
          goalsTotal: goalsData?.length ?? 0,
        })

        setAttentionList(attention.slice(0, 5))
        setAttentionCounts(attentionCounts)

        // ==================== Min dag ====================
        const nameOf = (pid: string) => {
          const p = participantsData.find(x => x.participant_id === pid)
          if (!p) return t('common.unknown')
          const name = [p.first_name, p.last_name].filter(Boolean).join(' ')
          return name || p.email || t('common.unknown')
        }

        // Dagens möten (ur veckans redan hämtade möten)
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
        const todaysMeetings = (meetingsData || []).filter(m => {
          const at = new Date(m.scheduled_at)
          return at >= todayStart && at <= todayEnd
        })

        // Mötesförberedelse: senaste journalanteckning per mötesdeltagare
        const meetingPids = [...new Set(todaysMeetings.map(m => m.participant_id))]
        let prepNotes: Array<{ participant_id: string; content: string; category: string; created_at: string }> = []
        if (meetingPids.length > 0) {
          const { data: prepData, error: prepError } = await supabase
            .from('consultant_journal')
            .select('participant_id, content, category, created_at')
            .eq('consultant_id', user.id)
            .in('participant_id', meetingPids)
            .order('created_at', { ascending: false })
            .limit(30)
          // Utan kontrollen stod det "Inga anteckningar" vid mötet — fel.
          if (prepError) throw prepError
          prepNotes = prepData || []
        }
        const latestNoteFor = (pid: string) => {
          const note = prepNotes.find(n => n.participant_id === pid)
          return note ? { content: note.content, category: note.category, createdAt: note.created_at } : null
        }

        setMyDayMeetings(
          todaysMeetings
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
            .map(m => ({
              id: m.id,
              participantId: m.participant_id,
              participantName: nameOf(m.participant_id),
              scheduledAt: m.scheduled_at,
              meetingType: m.meeting_type || null,
              meetingLink: m.meeting_link || null,
              latestNote: latestNoteFor(m.participant_id),
            }))
        )

        // Måldeadlines: förfallna + inom 7 dagar (ej slutförda)
        const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        setMyDayDeadlines(
          (goalsData || [])
            .filter(g => g.status !== 'COMPLETED' && g.deadline && new Date(g.deadline) <= sevenDaysAhead)
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .slice(0, 6)
            .map(g => ({
              goalId: g.id,
              goalTitle: g.title,
              participantId: g.participant_id,
              participantName: nameOf(g.participant_id),
              deadline: g.deadline,
              daysLeft: Math.floor((new Date(g.deadline).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
            }))
        )

        // Behöver kontakt: topp 3 ur attention-listan (kontakt/inaktivitet)
        setMyDayContacts(
          attention
            .filter(a => a.type === 'no_contact' || a.type === 'inactive')
            .slice(0, 3)
            .map(a => ({
              participantId: a.participant.participant_id,
              participantName: nameOf(a.participant.participant_id),
              reason: a.type as 'no_contact' | 'inactive',
              daysSinceContact: dagarSedanKontakt(senasteKontaktAt(a.participant)),
            }))
        )

        // Build recent activity from real data
        const activityTypes: Record<string, RecentActivity['type']> = {
          GENERAL: 'message',
          PROGRESS: 'cv_updated',
          CONCERN: 'message',
          GOAL: 'goal_completed',
        }

        const activityDescriptions: Record<string, string> = {
          GENERAL: t('consultant.overview.activity.newNote'),
          PROGRESS: t('consultant.overview.activity.progressNoted'),
          // RK23 (rollspelet 2026-09-27): nyckeln sa "Fråga uppmärksammad" om en
          // Oro-anteckning. Konsulentvyn översätts inte — kategorins eget namn.
          CONCERN: 'Oro noterad',
          GOAL: t('consultant.overview.activity.goalRelated'),
        }

        const activities: RecentActivity[] = (journalData || []).map((entry: { id: string; category: string; participant_id: string; created_at: string; profiles?: { first_name?: string; last_name?: string } }) => ({
          id: entry.id,
          type: activityTypes[entry.category] || 'message',
          participantName: entry.profiles ? `${entry.profiles.first_name} ${entry.profiles.last_name}` : t('common.unknown'),
          participantId: entry.participant_id,
          description: activityDescriptions[entry.category] || t('consultant.overview.activity.activity'),
          timestamp: entry.created_at,
        }))

        // If no journal entries, show participant login activity
        if (activities.length === 0 && participantsData.length > 0) {
          const recentLogins = participantsData
            .filter(p => p.last_login)
            .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime())
            .slice(0, 5)
            .map((p, i) => ({
              id: `login-${i}`,
              type: 'login' as const,
              participantName: `${p.first_name} ${p.last_name}`,
              participantId: p.participant_id,
              // KV6-S: `last_login` kommer ur vyns `p.updated_at AS last_login`
              // (profiles.updated_at) — INTE en riktig inloggningslogg. "Loggade
              // in" påstod något portalen inte kan mäta. Se title på raden nedan.
              description: 'Profilen ändrades senast',
              timestamp: p.last_login!,
            }))
          setRecentActivity(recentLogins)
        } else {
          setRecentActivity(activities)
        }

        // RK24 (rollspelet 2026-09-27): målkategorierna räknas med SAMMA regel
        // som Rapporter och PDF:en (calculateGoalCategories). Översikten hade
        // egna nyckelord och visade därför andra kategorier i en annan ordning
        // ur samma mål.
        const totalGoals = goalsData?.length ?? 0
        setGoalCategories(
          calculateGoalCategories(goalsData || []).map(({ category, count }) => ({
            category,
            count,
            percentage: totalGoals > 0 ? Math.round((count / totalGoals) * 100) : 0,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      notifications.error(t('consultant.analytics.loadError'))
      // KS7: ett fel får aldrig se ut som "inga deltagare" — utan det här
      // stannar `stats` på sina initiala nollor och renderar en dashboard
      // som ser exakt ut som en konsulent utan deltagare.
      setError('Översikten kunde inte hämtas. Kontrollera anslutningen och försök igen.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState fullHeight />
  }

  // Fel är ett eget läge, skilt från laddning och från en verkligt tom
  // dashboard (KS7) — samma mönster som ParticipantDetailPage (KV1).
  if (error) {
    return (
      <Card className="p-8">
        <ErrorState
          title="Översikten kunde inte hämtas"
          message={error}
          onRetry={fetchDashboardData}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Min dag — prioriterad dagsvy */}
      <MinDagSection
        meetings={myDayMeetings}
        deadlines={myDayDeadlines}
        contacts={myDayContacts}
        onMessage={(participantId) => {
          setMessagePreselected([participantId])
          setShowMessageDialog(true)
        }}
        // F12 (2026-09-12): samtal utanför portalen loggas med ett klick — samma
        // logContact som massåtgärden (KA4); listan räknas om ur färsk data.
        onLogContact={async (participantId) => {
          try {
            await consultantService.logContact(participantId)
            notifications.success(t('consultant.overview.myDay.contactLogged'))
            invalidateParticipants()
            await fetchDashboardData()
          } catch (err) {
            notifications.error(err instanceof Error ? err.message : t('common.genericError'))
          }
        }}
        // F9 (2026-09-12): dagens pass överst i Min dag
        pass={
          <>
            <BradskandeIdag
              punkter={bradskandeUtanDubbletter(bradskande, attGora)}
              attGora={attGora}
              leverantor={leverantor}
              fel={bradskandeFel}
              namnFor={namnForDeltagare}
              onMarkera={markeraPass}
              onSparaAnteckning={sparaPassAnteckning}
              onBokaFysiskt={(pid) => {
                const p = participants.find((x) => x.participant_id === pid)
                if (!p) return
                setMotesDeltagare(p)
                setShowMeetingDialog(true)
              }}
            />
            {arLeverantor && levFel && !bradskandeFel && (
              <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">
                Planer eller placeringar kunde inte hämtas — veckan mot avtalet visas inte just nu.
              </p>
            )}
            <DagensPass namnFor={namnForDeltagare} />
          </>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('consultant.overview.totalParticipants')}
          value={stats.totalParticipants}
          subtitle={antal(stats.activeParticipants, 'aktiv', 'aktiva')}
          icon={Users}
          status="neutral"
          onClick={() => navigate('/consultant/participants')}
        />
        <KPICard
          title={t('consultant.overview.needsAttention')}
          value={stats.needsAttention}
          subtitle={[
            attentionCounts.franvaro > 0 ? `${attentionCounts.franvaro} ogiltig frånvaro` : null,
            attentionCounts.mote > 0 ? `${attentionCounts.mote} möte över gränsen` : null,
            attentionCounts.noContact > 0 ? `${attentionCounts.noContact} ${t('consultant.alerts.noContact').toLowerCase()}` : null,
            attentionCounts.inactive > 0 ? `${attentionCounts.inactive} ${t('consultant.alerts.inactive').toLowerCase()}` : null,
            attentionCounts.noCv > 0 ? `${attentionCounts.noCv} ${t('consultant.alerts.noCv')}` : null,
          ].filter(Boolean).join(' · ') || t('consultant.overview.noAttentionNeeded')}
          icon={AlertTriangle}
          status={stats.needsAttention === 0 ? 'green' : stats.needsAttention <= 3 ? 'yellow' : 'red'}
          onClick={() => navigate('/consultant/participants?filter=attention')}
        />
        {/* KV5: "CV-kvalitet" delades med AnalyticsTab, som visar ett HELT
            annat tal (andelen med CV) under samma ord. Det här kortet mäter
            snittet av ATS-poäng bland dem som faktiskt HAR en — hårdkodad
            etikett i stället för den delade i18n-nyckeln, så de två inte
            längre kan se ut som samma mätvärde. */}
        <KPICard
          title="Snitt ATS-poäng"
          value={stats.averageProgress !== null ? `${stats.averageProgress}%` : '—'}
          subtitle={
            stats.averageProgress !== null
              ? antal(stats.completedCV, 'komplett', 'kompletta')
              : 'Ingen ATS-poäng ännu'
          }
          icon={FileText}
          status={
            stats.averageProgress === null ? 'neutral' :
            stats.averageProgress >= 70 ? 'green' : stats.averageProgress >= 50 ? 'yellow' : 'red'
          }
          onClick={() => navigate('/consultant/analytics')}
        />
        <KPICard
          title={t('consultant.overview.meetingsThisWeek')}
          value={stats.meetingsThisWeek}
          subtitle={stats.pendingMessages > 0 ? antal(stats.pendingMessages, 'oläst meddelande', 'olästa meddelanden') : t('consultant.overview.scheduled')}
          icon={Calendar}
          status={stats.meetingsThisWeek > 0 ? 'green' : 'neutral'}
          onClick={() => navigate('/consultant/communication')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attention Alerts */}
        <Card className="lg:col-span-2">
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--c-solid)]" />
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                  {t('consultant.overview.attentionAlerts')}
                </h3>
              </div>
              <Link
                to="/consultant/participants?filter=attention"
                className="text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:text-[var(--c-solid)] dark:hover:text-[var(--c-text)] font-medium"
              >
                {t('consultant.overview.viewAll')}
              </Link>
            </div>
          </div>
          <div className="p-2">
            {attentionList.length > 0 ? (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {attentionList.map((item, i) => (
                  <AttentionAlert
                    key={`${item.participant.participant_id}-${item.type}-${i}`}
                    participant={item.participant}
                    type={item.type}
                    detalj={item.detalj}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {t('consultant.overview.allCaughtUp')}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {t('consultant.overview.noAttentionNeeded')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('consultant.overview.quickActions')}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <QuickAction
              icon={Plus}
              label={t('consultant.overview.inviteParticipant')}
              onClick={() => setShowInviteDialog(true)}
              variant="primary"
            />
            <QuickAction
              icon={Mail}
              label={t('consultant.overview.sendGroupMessage')}
              onClick={() => {
                setMessagePreselected(undefined)
                setShowMessageDialog(true)
              }}
            />
            <QuickAction
              icon={Calendar}
              label={t('consultant.overview.scheduleMeeting')}
              onClick={() => setShowMeetingDialog(true)}
            />
            <QuickAction
              icon={Download}
              label={t('consultant.overview.exportReport')}
              // RK19 (rollspelet 2026-09-27): rapporten tas ut på Rapporter, där
              // placeringstid, månadsserie och kohorter faktiskt räknas. Översikten
              // byggde en egen, tunnare kopia (placeringstid "—", tom månadsserie)
              // och renderade dialogen bara när den kopian fanns — annars hände
              // ingenting alls vid klick.
              onClick={() => navigate('/consultant/analytics?rapport=1')}
            />
            <QuickAction
              icon={Target}
              label={t('consultant.overview.createGoal')}
              onClick={() => setShowGoalDialog(true)}
            />
          </div>
        </Card>
      </div>

      {/* Recent Activity & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                  {t('consultant.overview.recentActivity')}
                </h3>
              </div>
              <button aria-label="Uppdatera översikten"
                onClick={fetchDashboardData}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              </button>
            </div>
          </div>
          <div className="p-2">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {recentActivity.map(activity => (
                  <Link
                    key={activity.id}
                    to={`/consultant/participants/${activity.participantId}`}
                    className="flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      {activity.type === 'cv_updated' && <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />}
                      {activity.type === 'job_saved' && <Briefcase className="w-4 h-4 text-amber-700 dark:text-amber-400" />}
                      {activity.type === 'login' && <Users className="w-4 h-4 text-amber-700 dark:text-amber-400" />}
                      {activity.type === 'goal_completed' && <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      {activity.type === 'message' && <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                        {activity.participantName}
                      </p>
                      <p
                        className="text-sm text-stone-500 dark:text-stone-400"
                        title={activity.type === 'login' ? 'Visar när profilen senast ändrades — portalen har ingen riktig inloggningslogg.' : undefined}
                      >
                        {activity.description}
                      </p>
                    </div>
                    {/* RK26: dag + klockslag — listan spänner över flera dagar. */}
                    <time dateTime={activity.timestamp} className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      {aktivitetstid(activity.timestamp)}
                    </time>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-stone-500">
                {t('consultant.overview.noActivity')}
              </div>
            )}
          </div>
        </Card>

        {/* Goals Overview */}
        <Card>
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                  {t('consultant.overview.goalsOverview')}
                </h3>
              </div>
              <Link
                to="/consultant/analytics"
                className="text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:text-[var(--c-solid)] dark:hover:text-[var(--c-text)] font-medium"
              >
                {t('consultant.overview.seeDetails')}
              </Link>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {/* Inga mål alls: en invit, inte "0 avklarade / 0 försenade" i stor
                grön och röd siffra (drift 2026-09-22 — ett tomt fält är inte en nolla). */}
            {stats.goalsTotal === 0 ? (
              <div className="text-center py-2">
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Inga mål satta än. Mål som du och deltagarna sätter visas här.
                </p>
                <button
                  type="button"
                  onClick={() => setShowGoalDialog(true)}
                  className="mt-3 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] hover:underline"
                >
                  Sätt ett mål
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-3xl font-bold text-emerald-600">{stats.goalsCompleted}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {t('consultant.overview.completedGoals')}
                </p>
              </div>
              <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                <p className="text-3xl font-bold text-rose-600">{stats.goalsOverdue}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {t('consultant.overview.overdueGoals')}
                </p>
              </div>
            </div>
            )}

            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
              <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                {t('consultant.overview.topGoalCategories')}
              </h4>
              <div className="space-y-2">
                {goalCategories.length > 0 ? (
                  goalCategories.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        {cat.category} <span className="text-stone-500 dark:text-stone-400">({antal(cat.count, 'mål', 'mål')})</span>
                      </span>
                      <div className="w-24 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--c-solid)] rounded-full transition-all"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  // Persona-genomgång 2026-09-12 (K1): här låg tre staplar med fasta
                  // bredder 75/60/45 % som "exempel" när inga mål fanns — en påhittad
                  // siffra i konsulentens första vy. Ett tomt underlag visar en invit.
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {t('consultant.overview.noGoalCategoriesYet')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      <InviteParticipantDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onSuccess={() => {
          setShowInviteDialog(false)
          // KK4: en ny tilldelning ändrar consultant_dashboard_participants —
          // andra flikar (ParticipantsTab m.fl.) ska inte visa en gammal lista.
          invalidateParticipants()
          fetchDashboardData()
        }}
      />

      <MeetingSchedulerDialog
        isOpen={showMeetingDialog}
        onClose={() => {
          setShowMeetingDialog(false)
          setMotesDeltagare(null)
        }}
        // RR26: "Boka fysiskt möte" i Att göra i dag öppnar dialogen på rätt
        // deltagare och föreslår fysiskt — det är det kravet raden gäller.
        preselectedParticipant={motesDeltagare ?? undefined}
        forvaldTyp={motesDeltagare ? 'physical' : undefined}
        forvaldSkal={motesDeltagare ? `Mötesregeln: ett fysiskt möte minst var ${FYSISKT_GRANS_DAGAR}:e dag.` : undefined}
        onSuccess={() => {
          setShowMeetingDialog(false)
          setMotesDeltagare(null)
          // KK4: vyn bär next_meeting_scheduled — samma skäl som ovan.
          invalidateParticipants()
          fetchDashboardData()
        }}
      />

      <GoalCreationDialog
        isOpen={showGoalDialog}
        onClose={() => setShowGoalDialog(false)}
        onSuccess={() => {
          setShowGoalDialog(false)
          fetchDashboardData()
        }}
      />

      <GroupMessageDialog
        isOpen={showMessageDialog}
        onClose={() => {
          setShowMessageDialog(false)
          setMessagePreselected(undefined)
        }}
        preselectedIds={messagePreselected}
      />
    </div>
  )
}
