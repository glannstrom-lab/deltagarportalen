/**
 * ParticipantDetailPage - Detailed View for a Single Participant
 * Profile, progress tracker, goals, journal, and communication
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  FileText,
  Briefcase,
  Target,
  MessageSquare,
  Clock,
  MoreVertical,
  Plus,
  AlertTriangle,
  CheckCircle,
  Activity,
  Send,
  Sparkles,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReportDraftDialog } from '@/components/consultant/ReportDraftDialog'
import { GoalCreationDialog } from '@/components/consultant/GoalCreationDialog'
import { orgApi } from '@/services/orgApi'
import { MeetingSchedulerDialog } from '@/components/consultant/MeetingSchedulerDialog'
import { PlacementDialog } from '@/components/consultant/PlacementDialog'
import { ParticipantJournal, type JournalEntry, type NoteCategory, type JournalMutationResult } from '@/components/consultant/ParticipantJournal'
import type { Avsnitt } from '@/services/laslogg'
import { laslogg } from '@/services/laslogg'
import { AktivitetsplanSektion } from '@/components/consultant/AktivitetsplanSektion'
import { Tidslinje } from '@/components/consultant/Tidslinje'
import { useOrgAiSparr } from '@/hooks/useOrgAiSparr'
import { useAuthStore } from '@/stores/authStore'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { consultantService } from '@/services/consultantService'
import { cn } from '@/lib/utils'
import { flikEfterTangent } from './flikTangenter'
import { notifications } from '@/lib/toast'
import { MotesKort, type MotenLage } from '@/components/consultant/MotesKort'
import { PlaceringDeltagareKort, type PlaceringarLage } from '@/components/consultant/PlaceringDeltagareKort'
import { ResultatUppfoljningDialog } from '@/components/consultant/ResultatUppfoljningDialog'
import { forvaldMotestyp, hamtaMotenForDeltagare, kadensForMoten } from '@/services/moteskadens'
import { KONTAKT_KALLA_TEXT, kontaktAlderText, senasteKontakt } from '@/services/senasteKontakt'
import { placeringRubrik } from '@/services/placeringUtfall'
import { formatLocalDate } from '@/services/aktivitetSchema'
import type { Placement } from '@/services/consultantService'
import type { Uppfoljning } from './placeringsmatt'

interface Participant {
  participant_id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ON_HOLD'
  priority: number
  has_cv: boolean
  ats_score: number | null
  completed_interest_test: boolean
  holland_code: string | null
  saved_jobs_count: number
  notes_count: number
  last_contact_at: string | null
  /** Senaste journalanteckning — vyn consultant_dashboard_participants (RK14). */
  last_note_date?: string | null
  next_meeting_scheduled: string | null
  last_login: string | null
  created_at?: string
}

interface Goal {
  id: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  deadline: string
  progress: number
  /** KS2 b: vem som skapade målet; skiljer sig från den inloggade efter en överlämning. */
  consultantId?: string
  authorName?: string
}


// Status Badge Component
function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const badges = {
    ACTIVE: { label: t('consultant.participants.status.active'), color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    INACTIVE: { label: t('consultant.participants.status.inactive'), color: 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300' },
    COMPLETED: { label: t('consultant.participants.status.completed'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    ON_HOLD: { label: t('consultant.participants.status.onHold'), color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  }
  const badge = badges[status as keyof typeof badges] || badges.INACTIVE

  return (
    <span className={cn('px-3 py-1 rounded-full text-sm font-medium', badge.color)}>
      {badge.label}
    </span>
  )
}

// Quick Stat Card
function QuickStat({
  icon: Icon,
  label,
  value,
  status,
  detalj,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  status?: 'good' | 'warning' | 'bad'
  /** RK14: en rad under talet, t.ex. varifrån "senaste kontakt" kommer. */
  detalj?: string
}) {
  const statusColors = {
    good: 'text-emerald-600',
    warning: 'text-amber-600',
    bad: 'text-rose-600',
    undefined: 'text-stone-900 dark:text-stone-100',
  }

  return (
    <div className="text-center p-4 bg-stone-50 dark:bg-stone-800 rounded-xl">
      <Icon className="w-6 h-6 text-stone-500 dark:text-stone-400 mx-auto mb-2" />
      <p className={cn(typeof value === 'string' && value.length > 4 ? 'text-lg' : 'text-2xl', 'font-bold', statusColors[status || 'undefined'])}>
        {value}
      </p>
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{label}</p>
      {detalj && <p className="text-xs text-stone-500 dark:text-stone-400">{detalj}</p>}
    </div>
  )
}

// Goal Card Component
function GoalCard({
  goal,
  onEdit,
  onComplete,
  onDelete,
  readOnly = false,
  t,
}: {
  goal: Goal
  onEdit: (goal: Goal) => void
  onComplete: (id: string) => void
  /** PG17 (2026-09-12): ett mål gick inte att ta bort i UI:t — konsulenten fick radera via SQL. */
  onDelete?: (id: string) => void
  /** KS2 b: målet är skapat av en företrädare — läsbart, inte ändringsbart. */
  readOnly?: boolean
  t: (key: string) => string
}) {
  // Åtgärdsmenyn var tidigare en död knapp utan onClick — nu kopplad.
  const [showMenu, setShowMenu] = useState(false)
  const statusColors = {
    NOT_STARTED: 'bg-stone-100 text-stone-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-600',
    COMPLETED: 'bg-emerald-100 text-emerald-600',
    BLOCKED: 'bg-rose-100 text-rose-600',
  }

  const priorityColors = {
    HIGH: 'text-rose-600',
    MEDIUM: 'text-amber-600',
    LOW: 'text-stone-500',
  }

  const isOverdue = new Date(goal.deadline) < new Date() && goal.status !== 'COMPLETED'

  return (
    <div className={cn(
      'p-4 rounded-xl border-2 transition-colors',
      isOverdue ? 'border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-900/10' : 'border-stone-200 dark:border-stone-700'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-stone-900 dark:text-stone-100">
              {goal.title}
            </h4>
            {isOverdue && (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2">
            {goal.description}
          </p>
          {readOnly && (
            <p
              className="text-xs text-stone-500 dark:text-stone-400 mt-1"
              title={t('consultant.handover.readOnlyHint')}
            >
              {t('consultant.handover.createdBy')} {goal.authorName ?? t('consultant.handover.formerConsultant')}
            </p>
          )}
        </div>
        {!readOnly && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            aria-label={t('consultant.participantDetail.goalActions')}
            aria-haspopup="menu"
            aria-expanded={showMenu}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg"
          >
            <MoreVertical className="w-4 h-4 text-stone-600" aria-hidden="true" />
          </button>
          {showMenu && (
            <>
              <button
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                onClick={() => setShowMenu(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div
                role="menu"
                className="absolute right-0 top-8 z-20 w-56 py-1 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700"
              >
                <button
                  role="menuitem"
                  onClick={() => { setShowMenu(false); onEdit(goal) }}
                  className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  {goal.status === 'NOT_STARTED'
                    ? t('consultant.participantDetail.markInProgress')
                    : t('consultant.participantDetail.markNotStarted')}
                </button>
                {goal.status !== 'COMPLETED' && (
                  <button
                    role="menuitem"
                    onClick={() => { setShowMenu(false); onComplete(goal.id) }}
                    className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    {t('consultant.participantDetail.markComplete')}
                  </button>
                )}
                {onDelete && (
                  <button
                    role="menuitem"
                    onClick={() => { setShowMenu(false); onDelete(goal.id) }}
                    className="w-full px-4 py-2 text-left text-sm text-rose-700 dark:text-rose-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    {t('consultant.participantDetail.deleteGoal')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColors[goal.status])}>
          {goal.status === 'NOT_STARTED' ? t('consultant.participantDetail.goalStatus.notStarted') :
           goal.status === 'IN_PROGRESS' ? t('consultant.participantDetail.goalStatus.inProgress') :
           goal.status === 'COMPLETED' ? t('consultant.participantDetail.goalStatus.completed') : t('consultant.participantDetail.goalStatus.blocked')}
        </span>
        <span className={cn('text-xs font-medium', priorityColors[goal.priority])}>
          {goal.priority === 'HIGH' ? t('consultant.participantDetail.priority.high') :
           goal.priority === 'MEDIUM' ? t('consultant.participantDetail.priority.medium') : t('consultant.participantDetail.priority.low')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-stone-500">{t('common.progress')}</span>
          <span className="font-medium text-stone-700 dark:text-stone-300">{goal.progress}%</span>
        </div>
        <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              goal.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-[var(--c-solid)]'
            )}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={cn(
          'text-xs',
          isOverdue ? 'text-rose-600 font-medium' : 'text-stone-500'
        )}>
          <Clock className="w-3 h-3 inline mr-1" />
          {t('consultant.participantDetail.deadline')}: {new Date(goal.deadline).toLocaleDateString('sv-SE')}
        </span>
        {goal.status !== 'COMPLETED' && (
          <Button size="sm" variant="ghost" onClick={() => onComplete(goal.id)}>
            <CheckCircle className="w-4 h-4 mr-1" />
            {t('consultant.participantDetail.markComplete')}
          </Button>
        )}
      </div>
    </div>
  )
}

export function ParticipantDetailPage() {
  const { participantId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])
  // KS2 b: den inloggade konsulentens id avgör vilka rader som går att ändra;
  // kollegornas namn (organization_colleagues, redan läsbar för konsulenten)
  // ger "Skriven av …" på företrädarens rader. Namnen är best effort — utan
  // organisation blir det "en tidigare konsulent".
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const kollegaNamnRef = useRef<Record<string, string>>({})
  const [journalLoadError, setJournalLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'aktivitet' | 'goals' | 'journal' | 'timeline'>('overview')
  const deltagarFlikar = [
    { id: 'overview', label: t('consultant.participantDetail.tabs.overview'), icon: Activity },
    // Konsulentvyn översätts inte (DESIGN.md §2) — svenskt literal med flit, ingen sv.json-nyckel.
    { id: 'aktivitet', label: 'Aktivitet', icon: Calendar },
    { id: 'goals', label: t('consultant.participantDetail.tabs.goals'), icon: Target },
    { id: 'journal', label: t('consultant.participantDetail.tabs.journal'), icon: MessageSquare },
    { id: 'timeline', label: t('consultant.participantDetail.tabs.timeline'), icon: Clock },
  ] as const
  const [newNote, setNewNote] = useState('')
  const [showReportDraft, setShowReportDraft] = useState(false)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  // PG22 (2026-09-12): "Rapportutkast (AI)" visades fast organisationens AI var av
  // (demot) — bannern sa "ingen AI", knappen sa motsatsen. Båda brytarna läses:
  // organisationens (my_ai_policy) och konsulentens egen (profiles.ai_enabled).
  const orgAiSparr = useOrgAiSparr()
  const egenAiAv = useAuthStore((st) => st.profile?.ai_enabled === false)
  const aiAv = orgAiSparr != null || egenAiAv
  const { confirm } = useConfirmDialog()
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [showPlacementDialog, setShowPlacementDialog] = useState(false)
  // RR11: deltagarens möten — för mötesrutan, förvald mötestyp och RK14.
  const [motenLage, setMotenLage] = useState<MotenLage>({ status: 'laddar' })
  const [motenOmgang, setMotenOmgang] = useState(0)
  // RR6: deltagarens placeringar — visas på sidan och påverkar rubriken.
  const [placeringarLage, setPlaceringarLage] = useState<PlaceringarLage>({ status: 'laddar' })
  const [placeringOmgang, setPlaceringOmgang] = useState(0)
  const [uppfoljning, setUppfoljning] = useState<{ placering: Placement; vilken: Uppfoljning } | null>(null)
  // RK14: senaste meddelandet åt något håll; null = inga eller inte hämtat.
  const [senasteMeddelande, setSenasteMeddelande] = useState<string | null>(null)

  // Hämtningarna skriver tillstånd först efter await — laddar-läget sätts av
  // den som begär en ny omgång (samma mönster som AktivitetsplanSektion).
  useEffect(() => {
    if (!participantId) return
    let aktiv = true
    hamtaMotenForDeltagare(participantId)
      .then((moten) => { if (aktiv) setMotenLage({ status: 'klart', moten }) })
      .catch((err) => { if (aktiv) setMotenLage({ status: 'fel', fel: err instanceof Error ? err.message : 'Mötena kunde inte hämtas.' }) })
    return () => { aktiv = false }
  }, [participantId, motenOmgang])

  useEffect(() => {
    if (!participantId) return
    let aktiv = true
    consultantService.getPlacementsForParticipant(participantId)
      .then((placeringar) => { if (aktiv) setPlaceringarLage({ status: 'klart', placeringar }) })
      .catch((err) => { if (aktiv) setPlaceringarLage({ status: 'fel', fel: err instanceof Error ? err.message : 'Placeringarna kunde inte hämtas.' }) })
    return () => { aktiv = false }
  }, [participantId, placeringOmgang])

  useEffect(() => {
    if (!participantId) return
    let aktiv = true
    // Best effort: utan meddelanden räknas kontakten ur journal, möten och loggad kontakt.
    consultantService.getSenasteMeddelande(participantId)
      .then((at) => { if (aktiv) setSenasteMeddelande(at) })
      .catch((err) => console.warn('[ParticipantDetailPage] senaste meddelande:', err))
    return () => { aktiv = false }
  }, [participantId])

  const laddaOmMoten = () => { setMotenLage({ status: 'laddar' }); setMotenOmgang((n) => n + 1) }
  const laddaOmPlaceringar = () => { setPlaceringarLage({ status: 'laddar' }); setPlaceringOmgang((n) => n + 1) }

  // KV1/KK1: håller reda på VILKEN deltagare som senast begärdes. Varje
  // asynkron etapp i fetchParticipantData jämför mot den här innan den
  // skriver till state — hinner ett svar från en övergiven deltagare fram
  // efter att man bytt sida ignoreras det i stället för att skriva över
  // den nya deltagarens uppgifter.
  const activeParticipantIdRef = useRef<string | undefined>(participantId)

  useEffect(() => {
    activeParticipantIdRef.current = participantId
    // Nollställ allt tillstånd vid varje deltagarbyte. Utan det här kunde
    // förra deltagarens namn, mål och anteckningar stå kvar under den nya
    // URL:en tills (eller om) hämtningen lyckades.
    setParticipant(null)
    setGoals([])
    setJournal([])
    setJournalLoadError(null)
    setError(null)
    setMotenLage({ status: 'laddar' })
    setPlaceringarLage({ status: 'laddar' })
    setSenasteMeddelande(null)
    fetchParticipantData(participantId)
    // ÖV1: deltagaren ska kunna se vem som öppnat hens uppgifter. En rad per
    // deltagare och webbläsarsession; fel sväljs i laslogg (console.warn) och
    // får aldrig fälla sidan.
    if (participantId) void laslogg.loggaVisningEnGang(participantId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId])

  // PG15 (2026-09-12): läsloggen ska säga VAD som öppnades, inte bara att sidan
  // öppnades. En rad per deltagare, avsnitt och webbläsarsession (laslogg håller
  // sessionsnyckeln). Flikarnas id → loggens avsnittsnamn.
  useEffect(() => {
    if (!participantId) return
    const avsnitt: Record<typeof activeTab, Avsnitt> = {
      overview: 'oversikt', aktivitet: 'aktivitet', goals: 'mal', journal: 'journal', timeline: 'tidslinje',
    }
    void laslogg.loggaVisningEnGang(participantId, avsnitt[activeTab])
  }, [participantId, activeTab])

  const fetchParticipantData = async (requestedId: string | undefined) => {
    const isStale = () => activeParticipantIdRef.current !== requestedId

    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (isStale()) return

      if (!user || !requestedId) {
        setError(t('consultant.participantDetail.loadError', 'Det gick inte att hämta deltagarens uppgifter.'))
        return
      }
      setCurrentUserId(user.id)
      try {
        const kollegor = await orgApi.colleagues()
        kollegaNamnRef.current = Object.fromEntries(
          kollegor.map((k) => [k.user_id, `${k.first_name ?? ''} ${k.last_name ?? ''}`.trim() || (k.email ?? '')])
        )
      } catch {
        // Ingen organisation eller fel vid uppslag — raderna visas ändå, utan namn.
      }
      if (isStale()) return

      // Fetch participant
      const { data: participantData, error: participantError } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)
        .eq('participant_id', requestedId)
        .single()

      if (isStale()) return

      if (participantError || !participantData) {
        console.error('Error fetching participant:', participantError)
        setError(t('consultant.participantDetail.loadError', 'Det gick inte att hämta deltagarens uppgifter.'))
        return
      }

      setParticipant(participantData)

      // Fetch real goals from database
      const { data: goalsData, error: goalsError } = await supabase
        .from('consultant_goals')
        .select('*')
        .eq('participant_id', requestedId)
        .order('created_at', { ascending: false })

      if (isStale()) return

      if (goalsError) {
        console.error('Error fetching goals:', goalsError)
      } else {
        setGoals((goalsData || []).map(g => ({
          id: g.id,
          title: g.title,
          description: g.description || '',
          status: g.status,
          priority: g.priority,
          deadline: g.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          progress: g.progress || 0,
          consultantId: g.consultant_id,
          authorName: kollegaNamnRef.current[g.consultant_id],
        })))
      }

      // Fetch real journal entries from database
      const { data: journalData, error: journalFetchError } = await supabase
        .from('consultant_journal')
        .select('*')
        .eq('participant_id', requestedId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (isStale()) return

      if (journalFetchError) {
        console.error('Error fetching journal:', journalFetchError)
        setJournalLoadError('Anteckningarna kunde inte hämtas. Försök igen.')
      } else if (journalData) {
        setJournal(journalData.map(j => ({
          id: j.id,
          content: j.content,
          category: j.category,
          createdAt: j.created_at,
          consultantId: j.consultant_id,
          authorName: kollegaNamnRef.current[j.consultant_id],
        })))
        setJournalLoadError(null)
      }

      // Timeline: tidigare visades hårdkodad mock-data ("Sparade 3 jobb",
      // "Uppföljningsmöte" osv) som lurade konsulenten att tro att det var
      // riktig aktivitet. Borttaget 2026-05-09 (P1-skuld).
      // user_activities-tabellen finns men RLS:en tillåter bara user_id =
      // auth.uid() — konsulenter behöver en separat policy för att läsa
      // sina deltagare. Spårad i docs/teknisk-skuld-2026-05/.
      } catch (err) {
      if (!isStale()) {
        console.error('Error fetching participant:', err)
        setError(t('consultant.participantDetail.loadError', 'Det gick inte att hämta deltagarens uppgifter.'))
      }
    } finally {
      if (!isStale()) {
        setLoading(false)
      }
    }
  }

  // Uppdaterar bara mållistan (t.ex. efter att "Nytt mål" skapats via dialogen)
  // utan att lägga hela sidan i laddningsläge eller nollställa profil/journal.
  // Samma delta-vaktar mot activeParticipantIdRef som fetchParticipantData.
  const refetchGoals = async () => {
    const requestedId = participantId
    if (!requestedId) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || activeParticipantIdRef.current !== requestedId) return

      const { data: goalsData, error: goalsError } = await supabase
        .from('consultant_goals')
        .select('*')
        .eq('participant_id', requestedId)
        .order('created_at', { ascending: false })

      if (activeParticipantIdRef.current !== requestedId) return

      if (goalsError) {
        console.error('Error refetching goals:', goalsError)
        return
      }

      setGoals((goalsData || []).map(g => ({
        id: g.id,
        title: g.title,
        description: g.description || '',
        status: g.status,
        priority: g.priority,
        deadline: g.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        progress: g.progress || 0,
        consultantId: g.consultant_id,
        authorName: kollegaNamnRef.current[g.consultant_id],
      })))
    } catch (err) {
      console.error('Error refetching goals:', err)
    }
  }

  // Egen omhämtning för journalen (samma delta-vakt som refetchGoals), så en
  // "Försök igen" i ParticipantJournal inte behöver lägga hela sidan i
  // laddningsläge eller nollställa profil/mål.
  const refetchJournal = async () => {
    const requestedId = participantId
    if (!requestedId) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || activeParticipantIdRef.current !== requestedId) return

      const { data: journalData, error: journalFetchError } = await supabase
        .from('consultant_journal')
        .select('*')
        .eq('participant_id', requestedId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (activeParticipantIdRef.current !== requestedId) return

      if (journalFetchError) {
        console.error('Error refetching journal:', journalFetchError)
        setJournalLoadError('Anteckningarna kunde inte hämtas. Försök igen.')
        return
      }

      setJournal((journalData || []).map(j => ({
        id: j.id,
        content: j.content,
        category: j.category,
        createdAt: j.created_at,
        consultantId: j.consultant_id,
        authorName: kollegaNamnRef.current[j.consultant_id],
      })))
      setJournalLoadError(null)
    } catch (err) {
      console.error('Error refetching journal:', err)
      setJournalLoadError('Anteckningarna kunde inte hämtas. Försök igen.')
    }
  }

  // KS4-migrationen (20260831140000_ks_consultant_rls.sql, körd) kräver en
  // AKTIV rad i consultant_participants för INSERT/UPDATE/DELETE på
  // consultant_journal. En konsulent utan aktiv relation får ett synligt
  // 42501-fel på INSERT (WITH CHECK) — men UPDATE/DELETE ger INGET fel från
  // Postgrest när USING-villkoret filtrerar bort raden, bara ett tomt svar.
  // Alla tre handlers räknar därför "inga rader påverkade" som ett fel, inte
  // som "inget att göra", annars ser en nekad ändring ut som en lyckad.
  const addJournalEntry = async (
    content: string,
    category: NoteCategory
  ): Promise<JournalMutationResult> => {
    if (!participantId) {
      return { ok: false, error: 'Ingen deltagare vald.' }
    }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { ok: false, error: 'Du är inte inloggad. Ladda om sidan och försök igen.' }
      }

      const { data, error } = await supabase
        .from('consultant_journal')
        .insert({
          consultant_id: user.id,
          participant_id: participantId,
          content,
          category,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding journal entry:', error)
        const message = error.code === '42501'
          ? 'Anteckningen kunde inte sparas — du har troligen inte längre en aktiv koppling till den här deltagaren.'
          : 'Anteckningen kunde inte sparas. Försök igen.'
        return { ok: false, error: message }
      }

      if (data) {
        setJournal(prev => [
          { id: data.id, content: data.content, category: data.category, createdAt: data.created_at },
          ...prev,
        ])
        // RK14: en anteckning är en kontakt — "Senaste kontakt" följer med direkt.
        setParticipant(prev => (prev ? { ...prev, last_note_date: data.created_at } : prev))
      }
      return { ok: true }
    } catch (err) {
      console.error('Error adding journal entry:', err)
      return { ok: false, error: 'Anteckningen kunde inte sparas. Försök igen.' }
    }
  }

  const updateJournalEntry = async (
    id: string,
    content: string,
    category: NoteCategory
  ): Promise<JournalMutationResult> => {
    try {
      const { data, error } = await supabase
        .from('consultant_journal')
        .update({ content, category })
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error updating journal entry:', error)
        return { ok: false, error: 'Anteckningen kunde inte uppdateras. Försök igen.' }
      }

      if (!data || data.length === 0) {
        return {
          ok: false,
          error: 'Anteckningen kunde inte uppdateras — du har troligen inte längre en aktiv koppling till den här deltagaren.',
        }
      }

      const updated = data[0]
      setJournal(prev => prev.map(e => (e.id === id ? { ...e, content: updated.content, category: updated.category } : e)))
      return { ok: true }
    } catch (err) {
      console.error('Error updating journal entry:', err)
      return { ok: false, error: 'Anteckningen kunde inte uppdateras. Försök igen.' }
    }
  }

  const deleteJournalEntry = async (id: string): Promise<JournalMutationResult> => {
    try {
      const { data, error } = await supabase
        .from('consultant_journal')
        .delete()
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error deleting journal entry:', error)
        return { ok: false, error: 'Anteckningen kunde inte tas bort. Försök igen.' }
      }

      if (!data || data.length === 0) {
        return {
          ok: false,
          error: 'Anteckningen kunde inte tas bort — du har troligen inte längre en aktiv koppling till den här deltagaren.',
        }
      }

      setJournal(prev => prev.filter(e => e.id !== id))
      return { ok: true }
    } catch (err) {
      console.error('Error deleting journal entry:', err)
      return { ok: false, error: 'Anteckningen kunde inte tas bort. Försök igen.' }
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !participantId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('consultant_journal')
        .insert({
          consultant_id: user.id,
          participant_id: participantId,
          content: newNote,
          category: 'GENERAL',
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const newEntry: JournalEntry = {
          id: data.id,
          content: data.content,
          category: data.category,
          createdAt: data.created_at,
          consultantId: user.id,
        }
        setJournal(prev => [newEntry, ...prev])
        setParticipant(prev => (prev ? { ...prev, last_note_date: data.created_at } : prev))
      }
      setNewNote('')
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  // OBS (KK3, ej åtgärdat här): duplicerar consultantService.completeGoal utan
  // dess auth-guards. consultantService.ts ägs av en annan agent i den här
  // omgången — flaggat men medvetet orört.
  const handleCompleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('consultant_goals')
        .update({
          status: 'COMPLETED',
          progress: 100,
          completed_at: new Date().toISOString(),
        })
        .eq('id', goalId)

      if (error) throw error

      setGoals(prev => prev.map(g =>
        g.id === goalId ? { ...g, status: 'COMPLETED', progress: 100 } : g
      ))
    } catch (error) {
      console.error('Error completing goal:', error)
    }
  }

  // PG17: "Ta bort" med bekräftelse via portalens dialog (aldrig window.confirm).
  const handleDeleteGoal = async (goalId: string) => {
    const ok = await confirm({
      title: t('consultant.participantDetail.deleteGoalTitle'),
      message: t('consultant.participantDetail.deleteGoalBody'),
      confirmText: t('consultant.participantDetail.deleteGoal'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await consultantService.deleteGoal(goalId)
      setGoals(prev => prev.filter(g => g.id !== goalId))
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const handleEditGoal = async (goal: Goal) => {
    // For now, just toggle status between IN_PROGRESS and NOT_STARTED
    const newStatus = goal.status === 'NOT_STARTED' ? 'IN_PROGRESS' : 'NOT_STARTED'

    try {
      const { error } = await supabase
        .from('consultant_goals')
        .update({ status: newStatus })
        .eq('id', goal.id)

      if (error) throw error

      setGoals(prev => prev.map(g =>
        g.id === goal.id ? { ...g, status: newStatus } : g
      ))
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  if (loading) {
    return <LoadingState fullHeight />
  }

  // Fel är ett eget läge, skilt från "hittades inte" och skilt från laddning
  // (isLoading || !data) — annars kan ett fel se ut som tom data, eller värre,
  // som en tidigare deltagares kvarblivna uppgifter (KV1).
  if (error) {
    return (
      <div className="text-center py-12" role="alert">
        <AlertTriangle className="w-10 h-10 mx-auto text-rose-500 mb-3" aria-hidden="true" />
        <p className="text-stone-700 dark:text-stone-200 font-medium">{error}</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="outline" onClick={() => fetchParticipantData(participantId)}>
            {t('consultant.analytics.tryAgain', 'Försök igen')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/consultant/participants')}>
            {t('consultant.participantDetail.backToParticipants')}
          </Button>
        </div>
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">{t('consultant.participantDetail.notFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/consultant/participants')}>
          {t('consultant.participantDetail.backToParticipants')}
        </Button>
      </div>
    )
  }

  // RK14: senaste kontakt ur loggad kontakt, journal, genomförda möten och meddelanden.
  const kontakt = senasteKontakt({
    last_contact_at: participant.last_contact_at,
    last_note_date: participant.last_note_date,
    moten: motenLage.status === 'klart' ? motenLage.moten : [],
    senasteMeddelande,
  })
  const kontaktDagar = kontakt ? Math.floor((Date.now() - new Date(kontakt.at).getTime()) / (24 * 60 * 60 * 1000)) : null
  // RR11: mötestypen dialogen föreslår, ur samma kadens som deltagarlistans chip.
  const kadens = motenLage.status === 'klart' ? kadensForMoten(motenLage.moten, new Date()) : undefined
  const forvaldTyp = forvaldMotestyp(kadens)
  const forvaldSkal = kadens?.dagarSedanFysiskt == null
    ? 'Föreslås som fysiskt: inget genomfört fysiskt möte finns registrerat.'
    : `Föreslås som fysiskt: senaste fysiska mötet var för ${kadens.dagarSedanFysiskt} dagar sedan, och ett fysiskt möte krävs minst var 28:e dag.`
  // RR6: pågående eller kommande placering — i rubriken, bredvid statusen.
  const placeringsrad = placeringarLage.status === 'klart' ? placeringRubrik(placeringarLage.placeringar, formatLocalDate(new Date())) : null

  const aktivaMal = goals.filter(g => g.status !== 'COMPLETED')

  const getInitials = () => {
    return `${participant.first_name?.[0] || ''}${participant.last_name?.[0] || ''}`.toUpperCase() ||
      participant.email[0].toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/consultant/participants"
        className="inline-flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('consultant.participantDetail.backToParticipants')}
      </Link>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 flex items-center justify-center text-2xl font-bold text-[var(--c-text)] dark:text-[var(--c-solid)] flex-shrink-0">
            {getInitials()}
          </div>

          {/* Info */}
          <div className="flex-1">
            {/* RK17 (rollspelet 2026-09-27): på 390 px klipptes "Boka möte"
                utanför skärmen — raden radbryts nu under namnet på mobil. */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {participant.first_name} {participant.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-stone-500 dark:text-stone-400">
                  <span className="flex items-center gap-1 min-w-0 break-all">
                    <Mail className="w-4 h-4" />
                    {participant.email}
                  </span>
                  {participant.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {participant.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end" data-testid="deltagare-atgarder">
                <StatusBadge status={participant.status} t={t} />
                {placeringsrad && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100" data-testid="placering-status">
                    {placeringsrad}
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowMeetingDialog(true)}>
                  <Calendar className="w-4 h-4 mr-1" />
                  {t('consultant.communication.bookMeeting', 'Boka möte')}
                </Button>
                {/* AG3-rest (2026-09-02): knappen låg på analysfliken, där
                    konsulenten fick söka fram samma person hon just lämnat.
                    En placering blir av när hon står på deltagarens sida. */}
                <Button variant="outline" size="sm" onClick={() => setShowPlacementDialog(true)}>
                  <Briefcase className="w-4 h-4 mr-1" aria-hidden="true" />
                  Registrera placering
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <QuickStat
                icon={FileText}
                label={t('consultant.participantDetail.cvScore')}
                value={participant.ats_score ? `${participant.ats_score}%` : '—'}
                // RR6: en placerad deltagare flaggas inte rött för att CV saknas.
                status={
                  placeringsrad ? undefined :
                  (participant.ats_score || 0) >= 70 ? 'good' :
                  (participant.ats_score || 0) >= 50 ? 'warning' : 'bad'
                }
              />
              <QuickStat
                icon={Briefcase}
                label={t('consultant.participantDetail.savedJobs')}
                value={participant.saved_jobs_count}
              />
              <QuickStat
                icon={Target}
                label={t('consultant.participantDetail.activeGoals')}
                value={goals.filter(g => g.status !== 'COMPLETED').length}
              />
              <QuickStat
                icon={Clock}
                label={t('consultant.participantDetail.lastContact')}
                // RK14: "3" utan enhet, räknat bara ur last_contact_at. Nu
                // "3 dagar sedan" ur verklig senaste kontakt, med källan under.
                value={kontakt ? kontaktAlderText(kontakt.at) : '—'}
                detalj={kontakt ? KONTAKT_KALLA_TEXT[kontakt.kalla] : 'Ingen kontakt registrerad'}
                status={
                  kontaktDagar === null ? 'bad' :
                  kontaktDagar > 7 ? 'warning' : 'good'
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation — ARIA-flikmönster (PG-skav 7, persona-genomgången
          2026-09-12): tidigare vanliga <button> utan tab-semantik, så en
          skärmläsare varken hörde vilken sektion som var aktiv eller att
          knapparna hörde ihop som en flikrad.
          RK5 (rollspelet 2026-09-27): rättelsen gav de inaktiva flikarna
          tabIndex=-1 men ingen tangenthantering — Aktivitet, Mål, Journal och
          Tidslinje gick då inte att nå utan mus (WCAG 2.1.1). Nu hela
          WAI-ARIA-mönstret: roving tabindex, pil vänster/höger (runt), Home/End,
          automatisk aktivering. */}
      <div
        role="tablist"
        aria-label="Deltagarens avsnitt"
        aria-orientation="horizontal"
        className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-700 overflow-x-auto"
      >
        {deltagarFlikar.map(tab => (
          <button
            key={tab.id}
            id={`participant-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`participant-tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            onKeyDown={(e) => {
              const nasta = flikEfterTangent(deltagarFlikar.map((f) => f.id), tab.id, e.key)
              if (!nasta) return
              e.preventDefault()
              setActiveTab(nasta as typeof activeTab)
              document.getElementById(`participant-tab-${nasta}`)?.focus()
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'text-[var(--c-text)] dark:text-[var(--c-solid)] border-b-2 border-[var(--c-solid)]'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            )}
          >
            <tab.icon className="w-5 h-5" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        id={`participant-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`participant-tab-${activeTab}`}
        tabIndex={0}
      >
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlaceringDeltagareKort
            lage={placeringarLage}
            onForsokIgen={laddaOmPlaceringar}
            onRegistrera={(placering, vilken) => setUppfoljning({ placering, vilken })}
          />
          <MotesKort
            lage={motenLage}
            onBoka={() => setShowMeetingDialog(true)}
            onForsokIgen={laddaOmMoten}
            onAndrat={(id, status) => setMotenLage((prev) => prev.status === 'klart'
              ? { ...prev, moten: prev.moten.map((m) => (m.id === id ? { ...m, status } : m)) }
              : prev)}
          />
          {/* Recent Goals */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {t('consultant.participantDetail.activeGoals')}
              </h3>
              {aktivaMal.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('goals')}>
                  {t('common.seeAll')}
                </Button>
              )}
            </div>
            {/* RR20 (rollspelet 2026-09-27): utan aktiva mål stod rubriken och
                "Se alla" över ett tomt kort. Nu ett tomläge med en invit. */}
            {aktivaMal.length === 0 && (
              <EmptyState
                compact
                icon={Target}
                title={`${participant.first_name || 'Deltagaren'} har inga aktiva mål`}
                description="Ett mål ni sätter tillsammans ger samtalen en riktning."
                action={{ label: 'Sätt ett mål', onClick: () => setShowGoalDialog(true) }}
              />
            )}
            <div className="space-y-3">
              {aktivaMal.slice(0, 2).map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEditGoal}
                  onComplete={handleCompleteGoal}
                  onDelete={handleDeleteGoal}
                  readOnly={!!goal.consultantId && !!currentUserId && goal.consultantId !== currentUserId}
                  t={t}
                />
              ))}
            </div>
          </Card>

          {/* Quick Note */}
          <Card className="p-5">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">
              {t('consultant.participantDetail.quickNote')}
            </h3>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={t('consultant.participantDetail.notePlaceholder')}
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent focus:border-[var(--c-solid)]',
                'text-stone-900 dark:text-stone-100',
                'resize-none'
              )}
            />
            <Button className="mt-3" onClick={handleAddNote} disabled={!newNote.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {t('consultant.participantDetail.saveNote')}
            </Button>
          </Card>
        </div>
      )}

      {activeTab === 'aktivitet' && participantId && (
        <AktivitetsplanSektion
          participantId={participantId}
          participantName={`${participant.first_name} ${participant.last_name}`.trim()}
        />
      )}

      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-stone-500">
              {t('consultant.participantDetail.activeGoalsCount', { count: goals.filter(g => g.status !== 'COMPLETED').length })}
            </p>
            <Button onClick={() => setShowGoalDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('consultant.participantDetail.newGoal')}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onComplete={handleCompleteGoal}
                onDelete={handleDeleteGoal}
                readOnly={!!goal.consultantId && !!currentUserId && goal.consultantId !== currentUserId}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* PG21: fliken hette "Dagbok" men är konsulentens journal — deltagarens dagbok är privat. */}
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t('consultant.participantDetail.journalPrivateNote')}
            </p>
            {aiAv ? (
              <p className="text-sm text-stone-500 dark:text-stone-400 shrink-0" role="status">
                {t('consultant.participantDetail.reportDraftAiOff')}
              </p>
            ) : (
              <Button variant="outline" onClick={() => setShowReportDraft(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                {t('consultant.participantDetail.reportDraft')}
              </Button>
            )}
          </div>

          <ParticipantJournal
            participantName={`${participant.first_name} ${participant.last_name}`}
            entries={journal}
            loadError={journalLoadError}
            onRetryLoad={refetchJournal}
            onAddEntry={addJournalEntry}
            onUpdateEntry={updateJournalEntry}
            onDeleteEntry={deleteJournalEntry}
            currentConsultantId={currentUserId ?? undefined}
          />
        </div>
      )}

      {activeTab === 'timeline' && participantId && (
        <Tidslinje participantId={participantId} onGaTill={(sektion) => setActiveTab(sektion)} />
      )}
      </div>

      {participantId && (
        <ReportDraftDialog
          isOpen={showReportDraft}
          onClose={() => setShowReportDraft(false)}
          participantId={participantId}
        />
      )}

      {/* KA5: möte och mål gick tidigare bara att skapa via en generisk dialog
          på en annan flik, där konsulenten fick söka fram samma person hon
          just tittade på. Båda dialogerna tar emot deltagaren direkt. */}
      {participant && (
        <GoalCreationDialog
          isOpen={showGoalDialog}
          onClose={() => setShowGoalDialog(false)}
          onSuccess={() => {
            setShowGoalDialog(false)
            refetchGoals()
          }}
          preselectedParticipant={participant}
        />
      )}

      {participant && (
        <MeetingSchedulerDialog
          isOpen={showMeetingDialog}
          onClose={() => setShowMeetingDialog(false)}
          onSuccess={() => {
            setShowMeetingDialog(false)
            // RR11: ingen bekräftelse syntes efter bokningen, och mötesrutan
            // (och kadensen) ska visa det bokade mötet direkt.
            notifications.success('Mötet är bokat')
            laddaOmMoten()
          }}
          preselectedParticipant={participant}
          forvaldTyp={forvaldTyp}
          forvaldSkal={forvaldTyp === 'physical' ? forvaldSkal : undefined}
        />
      )}

      {/* AG3/KS1: enda skrivvägen till consultant_placements. Flyttad hit
          från AnalyticsTab 2026-09-02 — dialogen hoppar över deltagarsökningen. */}
      {participant && (
        <PlacementDialog
          isOpen={showPlacementDialog}
          onClose={() => setShowPlacementDialog(false)}
          onSuccess={() => {
            setShowPlacementDialog(false)
            notifications.success('Placeringen är registrerad')
            laddaOmPlaceringar()
          }}
          preselectedParticipant={participant}
        />
      )}

      {/* RR5: 3- och 6-månadersuppföljning med datum, utfall, underlag och anteckning. */}
      {uppfoljning && (
        <ResultatUppfoljningDialog
          placering={uppfoljning.placering}
          vilken={uppfoljning.vilken}
          onClose={() => setUppfoljning(null)}
          onSparat={() => {
            setUppfoljning(null)
            notifications.success('Uppföljningen är registrerad')
            laddaOmPlaceringar()
            void refetchJournal()
          }}
        />
      )}
    </div>
  )
}
