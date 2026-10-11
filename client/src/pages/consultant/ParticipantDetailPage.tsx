/**
 * ParticipantDetailPage — konsulentens sida för en deltagare.
 *
 * Omtaget "Kvarter", steg 5 (2026-10-11): förslaget "Deltagarsidan: plan och
 * närvaro som en vecka, inte som rutor".
 *   - Huvudet: namn, läget i en mening (deltagarLaget.ts), Skicka meddelande
 *     som EN primärknapp, Boka möte och Logga samtal ramade, resten i Mer.
 *   - Översikt: veckan först (också på mobilen), sedan mål och anteckning;
 *     möten, placering och "Om deltagaren" (CV-poäng, sparade jobb) i spalten.
 *   - Aktivitet: planen som en vecka med närvaron på raden, och en högerspalt
 *     per kundtyp (kommun: underlag till handläggaren; Rusta och matcha:
 *     mötesklockan, avvikelser till Arbetsförmedlingen, placering).
 *   - Flikarna är kvar, lugnare. `?flik=` fungerar som förut (Kom igång-guiden).
 *
 * Planen hämtas EN gång här (useAktivitetsplan) och delas av huvudet,
 * Översikt och Aktivitet. Konsulentvyn översätts inte (DESIGN.md §2): nya
 * texter är svenska literaler; befintliga nycklar läses som förut.
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Target } from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { MerMeny, type MerMenyVal } from '@/components/ui/MerMeny'
import { StatusChip } from '@/components/ui/StatusChip'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { KVARTER_FOKUS, type Status } from '@/components/ui/kvarterStatus'
import { ReportDraftDialog } from '@/components/consultant/ReportDraftDialog'
import { GoalCreationDialog } from '@/components/consultant/GoalCreationDialog'
import { orgApi } from '@/services/orgApi'
import { MeetingSchedulerDialog } from '@/components/consultant/MeetingSchedulerDialog'
import { PlacementDialog } from '@/components/consultant/PlacementDialog'
import { ParticipantJournal, type JournalEntry, type NoteCategory, type JournalMutationResult } from '@/components/consultant/ParticipantJournal'
import type { Avsnitt } from '@/services/laslogg'
import { journalKolumner, journalMetaFranRad, type JournalSolFalt } from '@/services/journalSol'
import { laslogg } from '@/services/laslogg'
import { AktivitetsplanSektion } from '@/components/consultant/AktivitetsplanSektion'
import { useAktivitetsplan } from '@/components/consultant/aktivitetsplan/useAktivitetsplan'
import { VeckanKort } from '@/components/consultant/aktivitetsplan/VeckanKort'
import { SpaltYta } from '@/components/consultant/SpaltYta'
import { Tidslinje } from '@/components/consultant/Tidslinje'
import { useRegelverk, useRegelverkForPlan } from '@/components/consultant/useRegelverk'
import { Motesklocka } from '@/components/consultant/Motesklocka'
import { motesklocka } from '@/components/consultant/motesklockaRegel'
import { useOrgAiSparr } from '@/hooks/useOrgAiSparr'
import { useAuthStore } from '@/stores/authStore'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { consultantService } from '@/services/consultantService'
import { cn } from '@/lib/utils'
import { flikEfterTangent } from './flikTangenter'
import { notifications } from '@/lib/toast'
import { MotesKort, type MotenLage } from '@/components/consultant/MotesKort'
import { GroupMessageDialog } from '@/components/consultant/GroupMessageDialog'
import { langtDatum } from '@/components/consultant/aktivitetEtiketter'
import { PlaceringDeltagareKort, type PlaceringarLage } from '@/components/consultant/PlaceringDeltagareKort'
import { ResultatUppfoljningDialog } from '@/components/consultant/ResultatUppfoljningDialog'
import { forvaldMotestyp, hamtaMotenForDeltagare, kadensForMoten } from '@/services/moteskadens'
import { KONTAKT_KALLA_TEXT, kontaktAlderText, senasteKontakt } from '@/services/senasteKontakt'
import { placeringRubrik } from '@/services/placeringUtfall'
import { formatLocalDate, veckosaldo } from '@/services/aktivitetSchema'
import type { Placement } from '@/services/consultantService'
import type { Uppfoljning } from './placeringsmatt'
import { DeltagarHuvud } from './DeltagarHuvud'
import { lastText, type Lasbart } from '@/components/consultant/meddelandeLast'
import type { DeltagarStatus } from '@/components/consultant/deltagarStatus'
import { deltagarLaget, type LagetMoten, type LagetPlan } from './deltagarLaget'

import { anvandareFranSession } from '@/lib/anvandareFranSession'
interface Participant {
  participant_id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  status: DeltagarStatus
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
  /** null = inget slutdatum. Förr fick ett sådant mål en påhittad deadline 30 dagar fram (slipningen 2026-10-11). */
  deadline: string | null
  progress: number
  /** KS2 b: vem som skapade målet; skiljer sig från den inloggade efter en överlämning. */
  consultantId?: string
  authorName?: string
}

/** En yta på sidan: kort-färg, en linje, stor rundning. Platt — inga kort i kort. */
const YTA = 'bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-l)] text-[var(--j-blak)]'

const MAL_STATUS: Record<Goal['status'], { status: Status; nyckel: string }> = {
  NOT_STARTED: { status: 'planerat', nyckel: 'consultant.participantDetail.goalStatus.notStarted' },
  IN_PROGRESS: { status: 'giltig', nyckel: 'consultant.participantDetail.goalStatus.inProgress' },
  COMPLETED: { status: 'narvarande', nyckel: 'consultant.participantDetail.goalStatus.completed' },
  BLOCKED: { status: 'ogiltig', nyckel: 'consultant.participantDetail.goalStatus.blocked' },
}

const PRIORITET_NYCKEL: Record<Goal['priority'], string> = {
  HIGH: 'consultant.participantDetail.priority.high',
  MEDIUM: 'consultant.participantDetail.priority.medium',
  LOW: 'consultant.participantDetail.priority.low',
}

// Ett mål — en rad, inte ett kort i ett kort. Åtgärderna i Mer-menyn (PG17: "Ta bort" sist).
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
  const isOverdue = goal.deadline !== null && new Date(goal.deadline) < new Date() && goal.status !== 'COMPLETED'
  const status = MAL_STATUS[goal.status]
  const val: MerMenyVal[] = [
    {
      etikett: goal.status === 'NOT_STARTED' ? t('consultant.participantDetail.markInProgress') : t('consultant.participantDetail.markNotStarted'),
      ikon: 'uppfoljning',
      onClick: () => onEdit(goal),
    },
    ...(goal.status !== 'COMPLETED'
      ? [{ etikett: t('consultant.participantDetail.markComplete'), ikon: 'klart' as const, onClick: () => onComplete(goal.id) }]
      : []),
    ...(onDelete ? [{ etikett: t('consultant.participantDetail.deleteGoal'), ikon: 'kryss' as const, farlig: true, onClick: () => onDelete(goal.id) }] : []),
  ]

  return (
    <li className="grid gap-2.5 py-4 border-b border-[var(--j-linje)] last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 grid gap-1">
          <h4 className="m-0 text-base font-semibold text-[var(--j-blak)]">{goal.title}</h4>
          {goal.description && <p className="m-0 text-sm text-[var(--j-blak-2)] line-clamp-2">{goal.description}</p>}
          {readOnly && (
            <p className="m-0 text-xs text-[var(--j-blak-3)]" title={t('consultant.handover.readOnlyHint')}>
              {t('consultant.handover.createdBy')} {goal.authorName ?? t('consultant.handover.formerConsultant')}
            </p>
          )}
        </div>
        {!readOnly && <MerMeny baraIkon etikett={t('consultant.participantDetail.goalActions')} val={val} />}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.8125rem] text-[var(--j-blak-3)]">
        <StatusChip status={status.status}>{t(status.nyckel)}</StatusChip>
        <span>{t(PRIORITET_NYCKEL[goal.priority])}</span>
        <span className={cn(isOverdue && 'font-semibold text-[var(--s-ogiltig-text)]')}>
          {goal.deadline
            ? <>{t('consultant.participantDetail.deadline')}: {langtDatum(goal.deadline.slice(0, 10))}{isOverdue ? ' · passerad' : ''}</>
            : 'Inget slutdatum'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="flex-1 h-2 rounded-full bg-[var(--j-sankt)] overflow-hidden"
          role="img"
          aria-label={`${t('common.progress')} ${goal.progress} %`}
        >
          <div className="h-full rounded-full bg-[var(--j-gran)]" style={{ width: `${goal.progress}%` }} />
        </div>
        <span className="text-[0.8125rem] font-semibold tabular-nums text-[var(--j-blak-2)]">{goal.progress} %</span>
      </div>
    </li>
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
  // Kom igång-guiden (2026-10-11) länkar hit med ?flik=aktivitet / ?flik=journal,
  // så knappen "Öppna Journal" landar på journalen och inte på översikten.
  const [sokParametrar] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'aktivitet' | 'goals' | 'journal' | 'timeline'>(() => {
    const flik = sokParametrar.get('flik')
    return flik === 'aktivitet' || flik === 'journal' || flik === 'goals' || flik === 'timeline' ? flik : 'overview'
  })
  const deltagarFlikar = [
    { id: 'overview', label: t('consultant.participantDetail.tabs.overview') },
    // Konsulentvyn översätts inte (DESIGN.md §2) — svenskt literal med flit, ingen sv.json-nyckel.
    // Fliken heter "Aktivitet" (inte förslagets "Plan och närvaro") så länge Kom igång-guidens
    // texter (komIgangSteg.ts) säger "fliken Aktivitet".
    { id: 'aktivitet', label: 'Aktivitet' },
    { id: 'goals', label: t('consultant.participantDetail.tabs.goals') },
    { id: 'journal', label: t('consultant.participantDetail.tabs.journal') },
    { id: 'timeline', label: t('consultant.participantDetail.tabs.timeline') },
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
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [loggarSamtal, setLoggarSamtal] = useState(false)
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
  // Beslut 2026-10-11: är mitt senaste meddelande läst? null = inget skickat / inte inläst.
  const [mittSenaste, setMittSenaste] = useState<Lasbart | null>(null)
  // Omtaget steg 5: planen hämtas här EN gång och delas av huvudet (läget,
  // Mer-menyn), Översikt (veckan) och Aktivitet-fliken.
  const planStyrning = useAktivitetsplan(
    participantId ?? '',
    participant ? `${participant.first_name ?? ''} ${participant.last_name ?? ''}`.trim() : '',
    !!participantId,
  )
  // Kundtypen när det inte finns någon plan att läsa den ur (null medan medlemskapen laddar).
  const kundRegelverk = useRegelverk()
  // KSL21: tidslinjens frånvaroord följer planens organisation.
  const regelverkForPlan = useRegelverkForPlan()

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
    // Best effort: läsraden är en upplysning; vid fel står ingenting, hellre än "oläst".
    consultantService.getMittSenasteTill(participantId)
      .then((m) => { if (aktiv) setMittSenaste(m) })
      .catch((err) => console.warn('[ParticipantDetailPage] läst-status:', err))
    return () => { aktiv = false }
  }, [participantId, showMessageDialog])

  const laddaOmMoten = () => { setMotenLage({ status: 'laddar' }); setMotenOmgang((n) => n + 1) }
  const laddaOmPlaceringar = () => { setPlaceringarLage({ status: 'laddar' }); setPlaceringOmgang((n) => n + 1) }
  // Samtal utanför portalen loggas med ett klick — samma logContact som Min dag (F12).
  const loggaSamtal = async () => {
    if (!participant) return
    setLoggarSamtal(true)
    try {
      await consultantService.logContact(participant.participant_id)
      notifications.success('Samtalet är loggat som kontakt')
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Samtalet kunde inte loggas')
    } finally {
      setLoggarSamtal(false)
    }
  }

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
    setMittSenaste(null)
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

      const { data: { user } } = await anvandareFranSession()
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
          deadline: g.deadline ?? null,
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
          ...journalMetaFranRad(j as Record<string, unknown>),
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
      // SKK1 (skarpt test 2026-09-28): getUser() är ett nätverksanrop mot auth-servern. När det
      // föll (CORS-fel i prod) returnerade funktionen tyst och det nya målet syntes inte förrän
      // fliken öppnades igen. Den inloggade användaren finns redan i authStore.
      const user = useAuthStore.getState().user
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
        deadline: g.deadline ?? null,
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
      const { data: { user } } = await anvandareFranSession()
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
        ...journalMetaFranRad(j as Record<string, unknown>),
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
    category: NoteCategory,
    extra?: JournalSolFalt
  ): Promise<JournalMutationResult> => {
    if (!participantId) {
      return { ok: false, error: 'Ingen deltagare vald.' }
    }
    try {
      const { data: { user } } = await anvandareFranSession()
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
          ...journalKolumner(extra),
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
          { id: data.id, content: data.content, category: data.category, createdAt: data.created_at, ...journalMetaFranRad(data as Record<string, unknown>) },
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
    category: NoteCategory,
    extra?: JournalSolFalt
  ): Promise<JournalMutationResult> => {
    try {
      const { data, error } = await supabase
        .from('consultant_journal')
        .update({ content, category, ...journalKolumner(extra) })
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
      setJournal(prev => prev.map(e => (e.id === id ? { ...e, content: updated.content, category: updated.category, ...journalMetaFranRad(updated as Record<string, unknown>) } : e)))
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
      const { data: { user } } = await anvandareFranSession()
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
      <div className="text-center py-12 text-[var(--j-blak)]" role="alert">
        <KvarterIkon namn="varning" size={40} ton="ogiltig" className="mx-auto mb-3" />
        <p className="font-semibold">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <Button ton="kvarter" variant="secondary" onClick={() => fetchParticipantData(participantId)}>
            {t('consultant.analytics.tryAgain', 'Försök igen')}
          </Button>
          <Button ton="kvarter" variant="tertiary" onClick={() => navigate('/consultant/participants')}>
            {t('consultant.participantDetail.backToParticipants')}
          </Button>
        </div>
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--j-blak-2)]">{t('consultant.participantDetail.notFound')}</p>
        <Button ton="kvarter" variant="secondary" className="mt-4" onClick={() => navigate('/consultant/participants')}>
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
  // RR11: mötestypen dialogen föreslår, ur samma kadens som deltagarlistans chip.
  const kadens = motenLage.status === 'klart' ? kadensForMoten(motenLage.moten, new Date()) : undefined
  const forvaldTyp = forvaldMotestyp(kadens)
  const forvaldSkal = kadens?.dagarSedanFysiskt == null
    ? 'Föreslås som fysiskt: inget genomfört fysiskt möte finns registrerat.'
    : `Föreslås som fysiskt: senaste fysiska mötet var för ${kadens.dagarSedanFysiskt} dagar sedan, och ett fysiskt möte krävs minst var 28:e dag.`
  // RR6: pågående eller kommande placering — i rubriken, bredvid statusen.
  const placeringsrad = placeringarLage.status === 'klart' ? placeringRubrik(placeringarLage.placeringar, formatLocalDate(new Date())) : null

  const aktivaMal = goals.filter(g => g.status !== 'COMPLETED')
  const fullNamn = `${participant.first_name ?? ''} ${participant.last_name ?? ''}`.trim() || participant.email

  // Läget i en mening — bara när allt den bygger på är inläst (deltagarLaget.ts).
  const planLage = planStyrning.lage
  const idagText = formatLocalDate(new Date())
  const lagetPlan: LagetPlan = planLage.status === 'laddar'
    ? { status: 'laddar' }
    : planLage.status === 'fel'
      ? { status: 'fel' }
      : {
          status: 'klart',
          plan: planLage.plan,
          ogiltigaIVeckan: planLage.plan ? veckosaldo(planLage.sessions, idagText).antalOgiltigFranvaro : 0,
        }
  const lagetMoten: LagetMoten = motenLage.status === 'klart' && kadens
    ? { status: 'klart', kadens }
    : motenLage.status === 'fel' ? { status: 'fel' } : { status: 'laddar' }
  const laget = deltagarLaget({
    regelverk: planLage.status === 'klart' && planLage.plan ? planStyrning.regelverk : kundRegelverk,
    plan: lagetPlan,
    moten: lagetMoten,
    placeringsrad: placeringarLage.status === 'laddar' ? undefined : placeringsrad,
    kontakt,
    idag: new Date(),
  })
  const harPlan = planLage.status === 'klart' && !!planLage.plan && planLage.plan.status !== 'ended'
  const goalReadOnly = (goal: Goal) => !!goal.consultantId && !!currentUserId && goal.consultantId !== currentUserId

  const placeringKort = (
    <PlaceringDeltagareKort
      lage={placeringarLage}
      onForsokIgen={laddaOmPlaceringar}
      onRegistrera={(placering, vilken) => setUppfoljning({ placering, vilken })}
      onBetalstatusAndrad={laddaOmPlaceringar}
    />
  )

  return (
    <div className="grid gap-5 sm:gap-6 text-[var(--j-blak)]">
      <Link
        to="/consultant/participants"
        className={cn('inline-flex items-center gap-2 justify-self-start text-sm font-semibold text-[var(--j-blak-2)] hover:text-[var(--j-blak)] rounded-[var(--j-r-s)] min-h-[44px] sm:min-h-0', KVARTER_FOKUS)}
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('consultant.participantDetail.backToParticipants')}
      </Link>

      <DeltagarHuvud
        namn={fullNamn}
        bildUrl={participant.avatar_url}
        epost={participant.email}
        telefon={participant.phone}
        status={participant.status}
        placeringsrad={placeringsrad}
        laget={laget}
        meddelandeLast={mittSenaste ? lastText(mittSenaste) : null}

        loggarSamtal={loggarSamtal}
        onMeddelande={() => setShowMessageDialog(true)}
        onBokaMote={() => setShowMeetingDialog(true)}
        onLoggaSamtal={() => void loggaSamtal()}
        // AG3-rest: en placering blir av när konsulenten står på deltagarens sida.
        onRegistreraPlacering={() => setShowPlacementDialog(true)}
        plan={planLage.status === 'klart' ? {
          harPlan,
          pdfLaddar: planStyrning.pdfLaddar,
          onPdf: () => void planStyrning.laddaNerPdf(),
          onAvsluta: () => void planStyrning.avslutaPlan(),
        } : null}
      />

      {/* Flikarna — ARIA-flikmönster (PG-skav 7) med roving tabindex, pilar och
          Home/End (RK5). Omtaget: utan ikoner, en linje under den valda. */}
      <div
        role="tablist"
        aria-label="Deltagarens avsnitt"
        aria-orientation="horizontal"
        className="flex items-end gap-1 border-b border-[var(--j-linje)] overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
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
              'px-3 sm:px-4 min-h-[44px] -mb-px border-b-[3px] text-[0.9375rem] font-semibold whitespace-nowrap transition-colors rounded-t-[var(--j-r-s)]',
              KVARTER_FOKUS,
              'focus-visible:outline-offset-[-3px]',
              activeTab === tab.id
                ? 'border-[var(--j-gran)] text-[var(--j-blak)]'
                : 'border-transparent text-[var(--j-blak-2)] hover:text-[var(--j-blak)] hover:border-[var(--j-linje-2)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`participant-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`participant-tab-${activeTab}`}
        tabIndex={0}
        className={cn('min-w-0 rounded-[var(--j-r-m)]', KVARTER_FOKUS)}
      >
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
          <div className="grid gap-6 min-w-0">
            <VeckanKort
              lage={planLage}
              participantName={participant.first_name || fullNamn}
              regelverk={planStyrning.regelverk}
              onOppnaPlan={() => setActiveTab('aktivitet')}
              onForsokIgen={planStyrning.ladda}
            />

            <section aria-labelledby="mal-rubrik" className={cn(YTA, 'p-5 sm:p-6')}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="mal-rubrik" className="m-0 font-rubrik text-[1.25rem] font-bold">
                  {t('consultant.participantDetail.activeGoals')}
                </h2>
                {aktivaMal.length > 0 && (
                  <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => setActiveTab('goals')}>
                    {t('common.seeAll')}
                  </Button>
                )}
              </div>
              {/* RR20: utan aktiva mål — ett tomläge med en invit, inte ett tomt kort. */}
              {aktivaMal.length === 0 ? (
                <EmptyState
                  compact
                  icon={Target}
                  title={`${participant.first_name || 'Deltagaren'} har inga aktiva mål`}
                  description="Ett mål ni sätter tillsammans ger samtalen en riktning."
                  action={{ label: 'Sätt ett mål', onClick: () => setShowGoalDialog(true) }}
                />
              ) : (
                <ul className="m-0 mt-1 p-0 list-none">
                  {aktivaMal.slice(0, 2).map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={handleEditGoal}
                      onComplete={handleCompleteGoal}
                      onDelete={handleDeleteGoal}
                      readOnly={goalReadOnly(goal)}
                      t={t}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="snabbanteckning-rubrik" className={cn(YTA, 'p-5 sm:p-6 grid gap-3')}>
              <h2 id="snabbanteckning-rubrik" className="m-0 font-rubrik text-[1.25rem] font-bold">
                {t('consultant.participantDetail.quickNote')}
              </h2>
              <label htmlFor="snabbanteckning" className="sr-only">{t('consultant.participantDetail.quickNote')}</label>
              <textarea
                id="snabbanteckning"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder={t('consultant.participantDetail.notePlaceholder')}
                rows={3}
                className={cn(
                  'w-full px-4 py-3 rounded-[var(--j-r-m)] resize-y',
                  'bg-[var(--j-kort)] text-[var(--j-blak)] border border-[var(--j-linje-2)]',
                  'placeholder:text-[var(--j-blak-3)]',
                  KVARTER_FOKUS,
                )}
              />
              <div>
                <Button ton="kvarter" variant="secondary" onClick={handleAddNote} disabled={!newNote.trim()}>
                  {t('consultant.participantDetail.saveNote')}
                </Button>
              </div>
            </section>
          </div>

          <aside className="grid gap-4 min-w-0" aria-label="Möten och uppgifter">
            <MotesKort
              lage={motenLage}
              onBoka={() => setShowMeetingDialog(true)}
              onForsokIgen={laddaOmMoten}
              onAndrat={(id, status) => setMotenLage((prev) => prev.status === 'klart'
                ? { ...prev, moten: prev.moten.map((m) => (m.id === id ? { ...m, status } : m)) }
                : prev)}
            />
            {placeringKort}
            <SpaltYta ikon="deltagare" rubrik="Om deltagaren" testId="om-deltagaren">
              <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
                <dt className="text-[var(--j-blak-3)]">{t('consultant.participantDetail.lastContact')}</dt>
                {/* RK14: "3" utan enhet blev "3 dagar sedan", med källan bredvid. */}
                <dd className="m-0 grid">
                  {kontakt ? (
                    <>
                      <span className="font-semibold">{kontaktAlderText(kontakt.at)}</span>
                      <span className="text-[var(--j-blak-3)]">{KONTAKT_KALLA_TEXT[kontakt.kalla]}</span>
                    </>
                  ) : (
                    <span className="font-semibold">Ingen kontakt registrerad</span>
                  )}
                </dd>
                <dt className="text-[var(--j-blak-3)]">{t('consultant.participantDetail.cvScore')}</dt>
                <dd className="m-0">
                  {participant.ats_score ? `${participant.ats_score} %` : participant.has_cv ? 'CV finns, inget poäng än' : 'Inget CV än'}
                </dd>
                <dt className="text-[var(--j-blak-3)]">{t('consultant.participantDetail.savedJobs')}</dt>
                <dd className="m-0 tabular-nums">{participant.saved_jobs_count}</dd>
              </dl>
            </SpaltYta>
          </aside>
        </div>
      )}

      {activeTab === 'aktivitet' && participantId && (
        <AktivitetsplanSektion
          participantId={participantId}
          participantName={fullNamn}
          styrning={planStyrning}
          hogerspaltForst={(regelverk) => regelverk === 'leverantor' ? (
            <>
              {/* Rusta och matcha: mötesklockan (14/28 dagar) och placeringen. */}
              <SpaltYta ikon="tid" rubrik="Möten enligt avtalet" testId="motesklocka-yta">
                {motenLage.status === 'klart' && kadens ? (
                  <Motesklocka klocka={motesklocka(kadens, new Date())} />
                ) : motenLage.status === 'fel' ? (
                  <p className="m-0 text-sm text-[var(--s-ogiltig-text)]">
                    Mötena kunde inte hämtas.{' '}
                    <button type="button" className="font-semibold underline underline-offset-2" onClick={laddaOmMoten}>Försök igen</button>
                  </p>
                ) : null}
              </SpaltYta>
              {placeringKort}
            </>
          ) : null}
        />
      )}

      {activeTab === 'goals' && (
        <section aria-labelledby="alla-mal-rubrik" className={cn(YTA, 'p-5 sm:p-6')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="alla-mal-rubrik" className="m-0 font-rubrik text-[1.25rem] font-bold">
              {t('consultant.participantDetail.activeGoalsCount', { count: aktivaMal.length })}
            </h2>
            <Button ton="kvarter" variant="secondary" onClick={() => setShowGoalDialog(true)} leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}>
              {t('consultant.participantDetail.newGoal')}
            </Button>
          </div>
          {goals.length > 0 && (
            <ul className="m-0 mt-1 p-0 list-none">
              {goals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEditGoal}
                  onComplete={handleCompleteGoal}
                  onDelete={handleDeleteGoal}
                  readOnly={goalReadOnly(goal)}
                  t={t}
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'journal' && (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* PG21: fliken hette "Dagbok" men är konsulentens journal — deltagarens dagbok är privat. */}
            <p className="m-0 text-sm text-[var(--j-blak-2)]">
              {t('consultant.participantDetail.journalPrivateNote')}
            </p>
            {aiAv ? (
              <p className="m-0 text-sm text-[var(--j-blak-3)] shrink-0" role="status">
                {t('consultant.participantDetail.reportDraftAiOff')}
              </p>
            ) : (
              <Button ton="kvarter" variant="secondary" onClick={() => setShowReportDraft(true)} leftIcon={<KvarterIkon namn="dokument" size={20} />}>
                {t('consultant.participantDetail.reportDraft')}
              </Button>
            )}
          </div>

          <ParticipantJournal
            participantName={fullNamn}
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
        <Tidslinje participantId={participantId} onGaTill={(sektion) => setActiveTab(sektion)} regelverkFor={regelverkForPlan} />
      )}
      </div>

      {participantId && (
        <ReportDraftDialog
          isOpen={showReportDraft}
          onClose={() => setShowReportDraft(false)}
          participantId={participantId}
        />
      )}

      {/* KA5: möte och mål skapas med deltagaren förvald. */}
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
        <GroupMessageDialog
          isOpen={showMessageDialog}
          onClose={() => setShowMessageDialog(false)}
          preselectedIds={[participant.participant_id]}
        />
      )}

      {participant && (
        <MeetingSchedulerDialog
          isOpen={showMeetingDialog}
          onClose={() => setShowMeetingDialog(false)}
          onSuccess={() => {
            setShowMeetingDialog(false)
            // RR11: bekräftelse, och mötesrutan (och kadensen) visar det bokade mötet direkt.
            notifications.success('Mötet är bokat')
            laddaOmMoten()
          }}
          preselectedParticipant={participant}
          forvaldTyp={forvaldTyp}
          forvaldSkal={forvaldTyp === 'physical' ? forvaldSkal : undefined}
        />
      )}

      {/* AG3/KS1: enda skrivvägen till consultant_placements. Dialogen hoppar över deltagarsökningen. */}
      {participant && (
        <PlacementDialog
          isOpen={showPlacementDialog}
          onClose={() => setShowPlacementDialog(false)}
          onSuccess={() => {
            setShowPlacementDialog(false)
            notifications.success('Placeringen är registrerad')
            laddaOmPlaceringar()
          }}
          onStatusAndrad={(status) => setParticipant((p) => (p ? { ...p, status } : p))}
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
