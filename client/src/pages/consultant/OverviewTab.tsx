/**
 * OverviewTab — konsulentens Översikt: Min dag som EN vy (omtaget "Kvarter",
 * steg 3, 2026-10-11).
 *
 * Före omtaget stod fem saker med samma vikt: Min dag (möten, mål, kontakter),
 * Att göra i dag, Kräver uppmärksamhet (som kort OCH lista), fem
 * snabbåtgärder och nyckeltalskort. Nu: hälsning, ETT nästa steg, en rad per
 * människa, dagens pass. Snabbåtgärderna ligger i Mer-menyn. Nyckeltalen,
 * Målöversikt och Senaste aktivitet finns under Rapporter (OversiktSiffror).
 *
 * Den här filen hämtar och räknar; formen bor i MinDagSection (skalet) och
 * BradskandeIdag (nästa steg + raderna), reglerna i oversiktRegler.ts.
 *
 * Regler som följt med (se testerna):
 *   - KS7: ett hämtfel får aldrig se ut som "inga deltagare" — eget felläge.
 *   - Varje fråga kontrolleras; ett fel i möten eller mål går till felläget,
 *     inte till en tom dag.
 *   - RR3/RK7/RK35/RR26: det brådskande och Att göra räknas ur passen och
 *     mötena; ett fel där är en rad om felet, aldrig "allt klart".
 *   - RK38: en journalanteckning är en kontakt (senasteKontakt).
 *   - ST2: bara pass i konsulentens egna planer blir punkter.
 */

import { useState, useEffect, useEffectEvent, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notifications } from '@/lib/toast'
import { fetchCachedConsultantParticipants, useInvalidateConsultantParticipants } from './consultantParticipantsQuery'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/LoadingState'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { InviteParticipantDialog } from '@/components/consultant/InviteParticipantDialog'
import { MeetingSchedulerDialog } from '@/components/consultant/MeetingSchedulerDialog'
import { GoalCreationDialog } from '@/components/consultant/GoalCreationDialog'
import { GroupMessageDialog } from '@/components/consultant/GroupMessageDialog'
import { MinDagSection } from '@/components/consultant/MinDagSection'
import { kontaktText, dagarSedanKontakt } from '@/lib/kontaktText'
import { DagensPass } from '@/components/consultant/DagensPass'
import { consultantService } from '@/services/consultantService'
import { FYSISKT_GRANS_DAGAR, hamtaMotenForKonsulent, type MoteRad } from '@/services/moteskadens'
import { aktivitetsplanApi, type ActivityPlan, type AttendanceInput } from '@/services/aktivitetApi'
import { orgApi, type OrgKind } from '@/services/orgApi'
import { MottagnaUnderlag } from '@/components/consultant/MottagnaUnderlag'
import { orgTypVisning, regelverk, regelverkForPlan } from '@/components/consultant/orgTypVisning'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { senasteKontakt } from '@/services/senasteKontakt'
import {
  attGoraFonster,
  attGoraIdag,
  bradskandePunkter,
  fornaManadensStart,
  leverantorSammanfattning,
  leverantorsLage,
  antalSaker,
  minDagPersoner,
  passAttMarkera,
  veckanIEnMening,
  type AttGoraPass,
  type AvvikelsePass,
  type Bradskande,
  type KontaktPunkt,
  type MalDeadline,
  type MoteIdag,
  type PlaceringRad,
} from './oversiktRegler'
import { BradskandeIdag } from './BradskandeIdag'
import { KomIgangGuide } from '@/components/consultant/KomIgangGuide'
import { anvandareFranSession } from '@/lib/anvandareFranSession'

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

/** Hur många "behöver kontakt" Min dag visar — samma tak som förut. */
const KONTAKT_MAX = 3
/** Ej kontaktad på så här många dagar → en rad (samma gräns som förut). */
const KONTAKT_DAGAR = 7

function senasteKontaktAt(p: Pick<Participant, 'last_contact_at' | 'last_note_date'>): string | null {
  return senasteKontakt({ last_contact_at: p.last_contact_at, last_note_date: p.last_note_date ?? null })?.at ?? null
}

export function OverviewTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // KK4: mutationer här ska inte lämna en gammal deltagarlista i andra flikar.
  const invalidateParticipants = useInvalidateConsultantParticipants()
  const fornamn = useAuthStore((s) => s.profile?.first_name ?? null)
  const [loading, setLoading] = useState(true)
  // KS7: ett fel är ett eget läge, skilt från laddning och från en tom dag.
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [bradskande, setBradskande] = useState<Bradskande[]>([])
  const [bradskandeFel, setBradskandeFel] = useState(false)
  // Passen bakom Att göra och nästa steg. Punkterna räknas om ur passen efter
  // varje åtgärd — utan att Översikten läggs i laddningsläge.
  const [attGoraPass, setAttGoraPass] = useState<AttGoraPass[]>([])
  const [egnaPlanIds, setEgnaPlanIds] = useState<Set<string> | null>(null)
  const [levUnderlag, setLevUnderlag] = useState<{ plans: ActivityPlan[]; placeringar: PlaceringRad[]; moten: MoteRad[]; avvikelsePass: AvvikelsePass[] | null } | null>(null)
  const [levFel, setLevFel] = useState(false)
  const [underlagsDag, setUnderlagsDag] = useState<Date | null>(null)
  const [moten, setMoten] = useState<MoteIdag[]>([])
  const [deadlines, setDeadlines] = useState<MalDeadline[]>([])
  const [kontakter, setKontakter] = useState<KontaktPunkt[]>([])

  // Dialoger
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [motesDeltagare, setMotesDeltagare] = useState<{ p: Participant; fysiskt: boolean } | null>(null)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)

  // Hämtas en gång vid montering; useEffectEvent så att beroendelistan är ärlig.
  const hamtaOversikt = useEffectEvent(() => { void fetchDashboardData() })
  useEffect(() => {
    hamtaOversikt()
  }, [])

  const namnForDeltagare = (pid: string) => {
    const p = participants.find((x) => x.participant_id === pid)
    const namn = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : ''
    return namn || p?.email || t('common.unknown')
  }

  const medlemskapQ = useQuery({
    queryKey: ['org-medlemskap'],
    queryFn: () => orgApi.myMemberships(),
    staleTime: 5 * 60_000,
  })
  // KH11: handläggaren ser underlagen till henne — det är hennes arbete i portalen.
  const arHandlaggare = medlemskapQ.isSuccess && medlemskapQ.data.some((m) => m.role === 'handlaggare')
  // RR26: leverantörens punkter bara när alla relevanta organisationer är leverantörer.
  const arLeverantor = medlemskapQ.isSuccess
    && regelverk(medlemskapQ.data.map((m) => m.organization?.kind).filter((k): k is OrgKind => !!k)) === 'leverantor'

  // ST2: bara pass i konsulentens EGNA planer kan markeras. Utan planlistan: RLS-urvalet.
  const egnaPass = useMemo(
    () => (egnaPlanIds ? attGoraPass.filter((p) => !p.plan_id || egnaPlanIds.has(p.plan_id)) : attGoraPass),
    [attGoraPass, egnaPlanIds],
  )

  const attGora = useMemo(() => {
    if (!underlagsDag) return []
    return attGoraIdag({ deltagare: participants, pass: egnaPass, idag: underlagsDag, franvaroSomFakta: arLeverantor })
  }, [egnaPass, participants, underlagsDag, arLeverantor])

  const leverantor = useMemo(() => {
    if (!arLeverantor || !levUnderlag || !underlagsDag) return null
    return leverantorsLage({
      deltagare: participants,
      plans: egnaPlanIds ? levUnderlag.plans.filter((p) => egnaPlanIds.has(p.id)) : levUnderlag.plans,
      pass: attGoraPass,
      moten: levUnderlag.moten,
      placeringar: levUnderlag.placeringar,
      avvikelsePass: levUnderlag.avvikelsePass,
      idag: underlagsDag,
    })
  }, [arLeverantor, levUnderlag, underlagsDag, participants, egnaPlanIds, attGoraPass])

  const personer = useMemo(() => {
    if (!underlagsDag) return []
    return minDagPersoner({ attGora, bradskande, leverantor, moten, deadlines, kontakter, idag: underlagsDag, franvaroSomFakta: arLeverantor })
  }, [attGora, bradskande, leverantor, moten, deadlines, kontakter, underlagsDag, arLeverantor])

  const nu = new Date()
  const markeraNu = useMemo(() => (bradskandeFel ? [] : passAttMarkera(egnaPass, new Date())), [egnaPass, bradskandeFel])
  const mina = useMemo(() => new Set(participants.map((p) => p.participant_id)), [participants])
  const dagensPassAntal = underlagsDag
    ? attGoraPass.filter((p) => p.date === formatLocalDate(underlagsDag) && mina.has(p.participant_id)).length
    : 0
  const veckan = useMemo(
    () => (bradskandeFel || !underlagsDag ? null : veckanIEnMening(egnaPass, participants, underlagsDag)),
    [egnaPass, participants, underlagsDag, bradskandeFel],
  )

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
      const { data: { user } } = await anvandareFranSession()
      if (!user) return

      // KK4: delad cache — se consultantParticipantsQuery.ts.
      const participantsData = (await fetchCachedConsultantParticipants(queryClient)) as unknown as Participant[]

      // RR3/RK7/RK35: underlaget för det brådskande och Att göra hämtas parallellt;
      // ett fel här fäller inte Översikten men står som en rad i Min dag.
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

      // Dagens möten. Varje fråga kontrolleras: ett fel gav förr null → [] och
      // en tom dag till en konsulent som kanske hade tre möten (KS7).
      const dagStart = new Date(idagNu.getFullYear(), idagNu.getMonth(), idagNu.getDate())
      const dagSlut = new Date(idagNu.getFullYear(), idagNu.getMonth(), idagNu.getDate(), 23, 59, 59, 999)
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('consultant_meetings')
        .select('*')
        .eq('consultant_id', user.id)
        .gte('scheduled_at', dagStart.toISOString())
        .lte('scheduled_at', dagSlut.toISOString())
        .eq('status', 'scheduled')
      if (meetingsError) throw meetingsError

      const { data: goalsData, error: goalsError } = await supabase
        .from('consultant_goals')
        .select('*')
        .eq('consultant_id', user.id)
      if (goalsError) throw goalsError

      const lista = participantsData ?? []
      setParticipants(lista)

      const [motenUtfall, passUtfall] = await bradskandeUnderlag
      const underlagFel = motenUtfall.status === 'rejected' || passUtfall.status === 'rejected'
      // Slipningen 2026-10-11 (kommun A1): möteskadensen 14/28 dagar är Rusta och
      // matcha-avtalets regel — samma kundtypsregel som deltagarlistans chip.
      const medlemskap = await queryClient.fetchQuery({
        queryKey: ['org-medlemskap'],
        queryFn: () => orgApi.myMemberships(),
        staleTime: 5 * 60_000,
      }).catch(() => [])
      const medMotesregel = orgTypVisning(medlemskap.map((m) => m.organization?.kind).filter((k): k is OrgKind => !!k)).visaAvtalskrav
      if (underlagFel) {
        console.warn('[OverviewTab] möten eller pass kunde inte hämtas', motenUtfall.status === 'rejected' ? motenUtfall.reason : (passUtfall as PromiseRejectedResult).reason)
      }
      setBradskande(underlagFel ? [] : bradskandePunkter({
        deltagare: lista,
        moten: (motenUtfall as PromiseFulfilledResult<MoteRad[]>).value,
        pass: (passUtfall as PromiseFulfilledResult<AttGoraPass[]>).value,
        idag: idagNu,
        medMotesregel,
        // KSL21: leverantörens frånvaro är fakta (inte anmäld), inte "ogiltig".
        franvaroSomFakta: regelverk(medlemskap.map((m) => m.organization?.kind).filter((k): k is OrgKind => !!k)) === 'leverantor',
      }))
      setBradskandeFel(underlagFel)
      setAttGoraPass(passUtfall.status === 'fulfilled' ? (passUtfall.value as AttGoraPass[]) : [])
      setUnderlagsDag(idagNu)
      const [planUtfall, placeringUtfall] = await planUnderlag
      setEgnaPlanIds(planUtfall.status === 'fulfilled'
        ? new Set(planUtfall.value.filter((p) => p.consultant_id === user.id).map((p) => p.id))
        : null)
      // KSL14: avvikelserna sträcker sig från förra månadens början — längre än Att göra-fönstret —
      // och finns bara hos leverantören (AF-rapporteringen), så passen hämtas bara där.
      const avvikelseUtfall = regelverk(medlemskap.map((m) => m.organization?.kind).filter((k): k is OrgKind => !!k)) === 'leverantor'
        ? await Promise.allSettled([aktivitetsplanApi.listSessionsBetween(fornaManadensStart(formatLocalDate(idagNu)), formatLocalDate(idagNu))])
        : null
      const levOk = !underlagFel && planUtfall.status === 'fulfilled' && placeringUtfall.status === 'fulfilled'
      setLevUnderlag(levOk
        ? {
            plans: planUtfall.value,
            placeringar: placeringUtfall.value,
            moten: (motenUtfall as PromiseFulfilledResult<MoteRad[]>).value,
            // Misslyckas bara den här hämtningen blir avvikelserna "okända" (null), inte "inga".
            avvikelsePass: avvikelseUtfall && avvikelseUtfall[0].status === 'fulfilled' ? (avvikelseUtfall[0].value as AvvikelsePass[]) : null,
          }
        : null)
      setLevFel(!levOk)

      // Mötesförberedelse: senaste journalanteckning per mötesdeltagare.
      const todaysMeetings = (meetingsData || []) as Array<{ id: string; participant_id: string; scheduled_at: string; meeting_type?: string | null; meeting_link?: string | null }>
      const meetingPids = [...new Set(todaysMeetings.map((m) => m.participant_id))]
      let prepNotes: Array<{ participant_id: string; content: string }> = []
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
      setMoten(
        [...todaysMeetings]
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .map((m) => {
            const not = prepNotes.find((n) => n.participant_id === m.participant_id)
            return {
              id: m.id,
              participantId: m.participant_id,
              scheduledAt: m.scheduled_at,
              meetingType: m.meeting_type || null,
              meetingLink: m.meeting_link || null,
              latestNote: not ? { content: not.content } : null,
            }
          }),
      )

      // Måldeadlines: förfallna + inom 7 dagar (ej slutförda).
      const nuMs = idagNu.getTime()
      const sjuDagar = nuMs + 7 * 24 * 60 * 60 * 1000
      setDeadlines(
        ((goalsData || []) as Array<{ id: string; title: string; participant_id: string; status: string; deadline: string | null }>)
          .filter((g) => g.status !== 'COMPLETED' && g.deadline && new Date(g.deadline).getTime() <= sjuDagar)
          .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
          .slice(0, 6)
          .map((g) => ({
            goalId: g.id,
            goalTitle: g.title,
            participantId: g.participant_id,
            daysLeft: Math.floor((new Date(g.deadline!).getTime() - nuMs) / (24 * 60 * 60 * 1000)),
          })),
      )

      // Behöver kontakt: ej kontaktad på 7 dagar (RK38: en anteckning räknas), högst tre.
      const grans = nuMs - KONTAKT_DAGAR * 24 * 60 * 60 * 1000
      setKontakter(
        lista
          .filter((p) => p.status === 'ACTIVE')
          .filter((p) => {
            const k = senasteKontaktAt(p)
            return !k || new Date(k).getTime() < grans
          })
          .slice(0, KONTAKT_MAX)
          .map((p) => ({
            participantId: p.participant_id,
            text: kontaktText(t as (k: string, o?: Record<string, unknown>) => string, dagarSedanKontakt(senasteKontaktAt(p))),
          })),
      )
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      notifications.error(t('consultant.analytics.loadError'))
      // KS7: ett fel får aldrig se ut som "inga deltagare".
      setError('Översikten kunde inte hämtas. Kontrollera anslutningen och försök igen.')
    } finally {
      setLoading(false)
    }
  }

  // Fel är ett eget läge, skilt från laddning och från en tom dag (KS7).
  if (error) {
    return (
      <Card className="p-8">
        <ErrorState title="Översikten kunde inte hämtas" message={error} onRetry={fetchDashboardData} />
      </Card>
    )
  }

  const klart = !loading && !!underlagsDag
  const nyKonsulent = klart && participants.length === 0
  const felRad = !klart ? null
    : bradskandeFel
      ? 'Möten och frånvaro kunde inte hämtas — det som ska göras i dag visas inte just nu. Ladda om sidan för att försöka igen.'
      : arLeverantor && levFel
        ? 'Planer eller placeringar kunde inte hämtas — veckan mot avtalet visas inte just nu.'
        : null
  const tomt = klart && !nyKonsulent && personer.length === 0 && markeraNu.length === 0 && dagensPassAntal === 0

  const oppnaMote = (pid: string, fysiskt: boolean) => {
    const p = participants.find((x) => x.participant_id === pid)
    if (!p) return
    setMotesDeltagare({ p, fysiskt })
    setShowMeetingDialog(true)
  }

  return (
    <>
      <MinDagSection
        lage={klart ? 'klart' : 'laddar'}
        nu={nu}
        fornamn={fornamn}
        antalSaker={klart && !nyKonsulent && !bradskandeFel ? antalSaker(personer, markeraNu) : null}
        fel={felRad}
        tomt={tomt}
        onSeAlla={() => navigate('/consultant/participants')}
        veckan={veckan}
        avtal={leverantor ? leverantorSammanfattning(leverantor) : null}
        pass={dagensPassAntal > 0 ? (
          <DagensPass
            namnFor={namnForDeltagare}
            // KSL21: planens organisation avgör om frånvaron är giltig/ogiltig (kommun) eller fakta (leverantör).
            regelverkFor={medlemskapQ.isSuccess ? (orgId) => regelverkForPlan(medlemskapQ.data, orgId) : undefined}
          />
        ) : null}
        meny={[
          { etikett: 'Bjud in deltagare', ikon: 'deltagare', onClick: () => setShowInviteDialog(true) },
          { etikett: 'Skicka gruppmeddelande', ikon: 'meddelande', onClick: () => setShowMessageDialog(true) },
          { etikett: 'Boka möte', ikon: 'kalender', onClick: () => { setMotesDeltagare(null); setShowMeetingDialog(true) } },
          { etikett: 'Sätt ett mål', ikon: 'plan', onClick: () => setShowGoalDialog(true) },
          // RK19: rapporten tas ut på Rapporter, där den faktiskt räknas.
          { etikett: 'Exportera rapport', ikon: 'dokument', onClick: () => navigate('/consultant/analytics?rapport=1') },
        ]}
        // KH11: underlag lämnade till mig — alltid för handläggare, annars bara om något lämnats.
        efter={<MottagnaUnderlag visaTomt={arHandlaggare} />}
        // Kom igång för den som redan har deltagare: i sidospalten, aldrig som ett andra nästa steg.
        sido={klart && !nyKonsulent ? <KomIgangGuide onBjudIn={() => setShowInviteDialog(true)} /> : null}
      >
        {nyKonsulent ? (
          // En ny konsulent har ingen dag än: Kom igång ÄR nästa steg.
          <div className="grid gap-4" data-testid="mindag-ny">
            <KomIgangGuide somNastaSteg onBjudIn={() => setShowInviteDialog(true)} />
            <p className="px-1 text-[0.9375rem] text-j-blak-2">
              Du har inga deltagare än. När du bjudit in den första fylls din dag här.
            </p>
            <div className="px-1">
              <Button ton="kvarter" variant="secondary" onClick={() => setShowInviteDialog(true)}>
                Bjud in deltagare
              </Button>
            </div>
          </div>
        ) : (
          <BradskandeIdag
            personer={personer}
            pass={markeraNu}
            visaNastaSteg={!bradskandeFel}
            nu={nu}
            namnFor={namnForDeltagare}
            onMarkera={markeraPass}
            regelverk={medlemskapQ.isSuccess ? (arLeverantor ? 'leverantor' : 'kommun') : null}
            onSparaAnteckning={sparaPassAnteckning}
            onBokaMote={oppnaMote}
            // F12: ett samtal utanför portalen loggas med ett klick; listan räknas om ur färsk data.
            onLoggaKontakt={async (participantId) => {
              await consultantService.logContact(participantId)
              notifications.success(t('consultant.overview.myDay.contactLogged'))
              invalidateParticipants()
              await fetchDashboardData()
            }}
          />
        )}
      </MinDagSection>

      <InviteParticipantDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onSuccess={() => {
          setShowInviteDialog(false)
          // KK4: en ny tilldelning ändrar consultant_dashboard_participants.
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
        // RR26: "Boka fysiskt möte" öppnar dialogen på rätt deltagare och föreslår fysiskt.
        preselectedParticipant={motesDeltagare?.p}
        forvaldTyp={motesDeltagare?.fysiskt ? 'physical' : undefined}
        forvaldSkal={motesDeltagare?.fysiskt ? `Mötesregeln: ett fysiskt möte minst var ${FYSISKT_GRANS_DAGAR}:e dag.` : undefined}
        onSuccess={() => {
          setShowMeetingDialog(false)
          setMotesDeltagare(null)
          // KK4: vyn bär next_meeting_scheduled.
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
        onClose={() => setShowMessageDialog(false)}
      />
    </>
  )
}
