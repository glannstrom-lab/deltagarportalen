/**
 * ParticipantsTab — deltagarlistan, en rad per människa (omtaget "Kvarter",
 * steg 4, 2026-10-11).
 *
 * Förslagets principer: "Personen är enheten" (en rad om Jonas, inte tre kort),
 * "Ord före siffror" ("Läget" är en mening) och "Lugn täthet" (raka rader på EN
 * yta — inga kort i kort). Det som stod i rutor förut (CV-procent, sparade
 * jobb, antal anteckningar) står kvar på deltagarsidan, där det hör hemma.
 *
 * Läget och veckoremsan härleds i lib/deltagarlage.ts ur planen och veckans
 * pass — bara det datan bär. Under laddning står kontakten (som redan finns),
 * aldrig ett påstående om veckan; vid läsfel står en rad om felet.
 *
 * Kryssrutorna för massåtgärder (BulkActionsDialog) ligger bakom "Välj flera":
 * de används några gånger i månaden och ska inte ta plats varje dag.
 *
 * Möteskadensen är Rusta och matcha-avtalets regel och visas bara när
 * `useOrgTypVisning().visaAvtalskrav` (slipningen 2026-10-11).
 *
 * KA2 (2026-08-31): sök, filter och sortering lever i URL:en (q/filter/status/
 * sort) så att de överlever navigering till en deltagare och tillbaka.
 *
 * Konsulentvyn är svensk med flit (DESIGN.md §2).
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useConsultantParticipants } from './consultantParticipantsQuery'
import { Button } from '@/components/ui/Button'
import { PersonRad } from '@/components/ui/PersonRad'
import { Veckoremsa } from '@/components/ui/Veckoremsa'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { KVARTER_FOKUS, statusFarg, type Status } from '@/components/ui/kvarterStatus'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users, Search } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { BulkActionsDialog } from '@/components/consultant/BulkActionsDialog'
import { InviteParticipantDialog } from '@/components/consultant/InviteParticipantDialog'
import { useOrgTypVisning } from '@/components/consultant/useRegelverk'
import { DELTAGAR_STATUSAR, STATUS_ORD, STATUS_PLURAL, type DeltagarStatus } from '@/components/consultant/deltagarStatus'
import { STATUS_ORD_LEVERANTOR } from '@/components/consultant/franvaroFakta'
import { getTagLabel } from '@/components/consultant/participantTags'
import { senasteKontakt } from '@/services/senasteKontakt'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { hamtaMotenForKonsulent, kadens as raknaKadens, kadensText, KADENS_REGEL, type Kadens, type KadensLage } from '@/services/moteskadens'
import { DYGN_MS, deltagarLage, hamtaVeckansUnderlag, kontaktText, type DeltagarLage } from '@/lib/deltagarlage'

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
  /** Senaste journalanteckning (vyn consultant_dashboard_participants). */
  last_note_date?: string | null
  next_meeting_scheduled: string | null
  last_login: string | null
  tags: string[] | null
}

type SortField = 'lage' | 'name' | 'last_contact' | 'status' | 'priority'
type Snabbfilter = 'all' | 'attention' | 'franvaro' | 'utan-plan'
type StatusFilter = 'all' | Participant['status']
type BulkTyp = 'message' | 'tag' | 'export' | 'status'

const SORTERINGAR: readonly SortField[] = ['lage', 'name', 'last_contact', 'status', 'priority']
// Beslut 2026-10-11: FOLLOW_UP ("I uppföljning") — se components/consultant/deltagarStatus.ts.
const STATUSAR = DELTAGAR_STATUSAR

/** Det som väntar på konsulenten först. Ingen status = inget väntar. */
const LAGE_ORDNING: Record<Status, number> = { ogiltig: 0, vantar: 1, sjuk: 2, giltig: 3, planerat: 4, narvarande: 5 }

function behoverKontakt(p: Participant, nu: number): boolean {
  // I uppföljning efter en placering hålls kontakten vid 3 och 6 månader (placeringen),
  // inte varje vecka — de ska inte fylla "Behöver kontakt".
  if (p.status === 'FOLLOW_UP') return false
  return !p.last_contact_at || new Date(p.last_contact_at).getTime() < nu - 7 * DYGN_MS
}

const fullNamn = (p: Participant) => `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email

export function ParticipantsTab() {
  const navigate = useNavigate()
  // Slipningen 2026-10-11: möteskadensen är Rusta och matcha-avtalets regel —
  // chipet visas inte för en konsulent som bara arbetar i kommun.
  const kundtyp = useOrgTypVisning()
  // KSL21: samma regel som regelverk() — leverantör när ingen organisation är kommun.
  // Då är frånvaron fakta (anmäld / inte anmäld), aldrig giltig/ogiltig.
  const franvaroSomFakta = !!kundtyp && kundtyp.visaAvtalskrav && !kundtyp.visaIvoUnderlag
  // "Nu" fångas en gång per montering (react-hooks/purity). Listan hämtas också
  // vid montering, så tid och data är samma ögonblicksbild.
  const [nu] = useState(() => Date.now())
  const idag = formatLocalDate(new Date(nu))
  const klockan = new Date(nu).toTimeString().slice(0, 5)
  const [searchParams, setSearchParams] = useSearchParams()

  // KK4: delad hämtning — se consultantParticipantsQuery.ts.
  const {
    data: participantsData,
    isLoading: loading,
    error: participantsError,
    refetch: fetchParticipants,
  } = useConsultantParticipants()
  // RK14: en journalanteckning (vyns last_note_date) är också en kontakt — det
  // senaste av de två används för text, sortering och "Behöver kontakt".
  const participants = useMemo(
    () => ((participantsData ?? []) as unknown as Participant[]).map((p) => {
      const senaste = senasteKontakt({ last_contact_at: p.last_contact_at, last_note_date: p.last_note_date })
      return senaste && senaste.at !== p.last_contact_at ? { ...p, last_contact_at: senaste.at } : p
    }),
    [participantsData]
  )
  // KS7: ett misslyckat anrop ska visa ett eget felläge — aldrig samma tomma
  // lista som en konsulent utan deltagare.
  const error = participantsError
    ? 'Deltagarlistan kunde inte hämtas. Kontrollera anslutningen och försök igen.'
    : null

  // Veckans plan och pass. Egen nyckel, en form, en ägare.
  const veckaQ = useQuery({
    queryKey: ['deltagarlistans-vecka', idag],
    queryFn: () => hamtaVeckansUnderlag(idag),
    enabled: participants.length > 0,
    staleTime: 30_000,
  })
  const underlag = veckaQ.data

  // RM3: möteskadens — 14 dagar individuellt, 28 dagar fysiskt. Bara för leverantörer.
  const kadensQ = useQuery({
    queryKey: ['deltagarlistans-moteskadens'],
    queryFn: async () => raknaKadens(await hamtaMotenForKonsulent(), new Date()),
    enabled: participants.length > 0 && !!kundtyp?.visaAvtalskrav,
    staleTime: 30_000,
  })
  const kadensPerDeltagare: Map<string, Kadens> | undefined = kadensQ.data

  const legacyFilter = searchParams.get('filter')
  const [searchQuery, setSearchQueryState] = useState(() => searchParams.get('q') || '')
  const [snabbfilter, setSnabbfilterState] = useState<Snabbfilter>(() =>
    legacyFilter === 'attention' || legacyFilter === 'franvaro' || legacyFilter === 'utan-plan' ? legacyFilter : 'all')
  const [statusFilter, setStatusFilterState] = useState<StatusFilter>(() => {
    const s = searchParams.get('status') || legacyFilter
    return STATUSAR.includes(s as Participant['status']) ? (s as Participant['status']) : 'all'
  })
  const [sortField, setSortFieldState] = useState<SortField>(() => {
    const s = searchParams.get('sort') as SortField
    return SORTERINGAR.includes(s) ? s : 'lage'
  })
  const [valjer, setValjer] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [bulkActionType, setBulkActionType] = useState<BulkTyp | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  /** Uppdaterar URL-parametrar utan att tappa de andra (replace, ingen historik-spam). */
  const updateSearchParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key)
        else next.set(key, value)
      }
      return next
    }, { replace: true })
  }

  const setSearchQuery = (value: string) => {
    setSearchQueryState(value)
    updateSearchParams({ q: value || null })
  }
  const setSnabbfilter = (value: Snabbfilter) => {
    setSnabbfilterState(value)
    updateSearchParams({ filter: value !== 'all' ? value : null })
  }
  const setStatusFilter = (value: StatusFilter) => {
    setStatusFilterState(value)
    updateSearchParams({ status: value !== 'all' ? value : null })
  }
  const setSortField = (value: SortField) => {
    setSortFieldState(value)
    updateSearchParams({ sort: value !== 'lage' ? value : null })
  }

  // Läget per deltagare — bara när veckans underlag finns.
  const lageFor = useMemo(() => {
    const karta = new Map<string, DeltagarLage>()
    if (!underlag) return karta
    for (const p of participants) {
      karta.set(p.participant_id, deltagarLage({ participantId: p.participant_id, underlag, idag, klockan, franvaroSomFakta }))
    }
    return karta
  }, [participants, underlag, idag, klockan, franvaroSomFakta])
  // En konsulent som inte använder aktivitetsplaner (t.ex. bara Rusta och matcha)
  // ska inte få "Ingen aktivitetsplan" på varje rad.
  const anvanderPlaner = !!underlag && underlag.planer.length > 0

  const matcharSnabbfilter = useCallback((p: Participant, f: Snabbfilter): boolean => {
    if (f === 'attention') return behoverKontakt(p, nu)
    const l = lageFor.get(p.participant_id)
    if (f === 'franvaro') return !!l?.franvaroIVeckan
    if (f === 'utan-plan') return p.status === 'ACTIVE' && !!l?.utanPlan
    return true
  }, [lageFor, nu])

  const iStatus = useMemo(
    () => (statusFilter === 'all' ? participants : participants.filter((p) => p.status === statusFilter)),
    [participants, statusFilter],
  )

  const filteredParticipants = useMemo(() => {
    let result = [...iStatus]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.first_name?.toLowerCase().includes(query) ||
        p.last_name?.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
      )
    }
    result = result.filter((p) => matcharSnabbfilter(p, snabbfilter))

    const namnJmf = (a: Participant, b: Participant) => fullNamn(a).localeCompare(fullNamn(b), 'sv')
    result.sort((a, b) => {
      let c = 0
      switch (sortField) {
        case 'lage': {
          const la = lageFor.get(a.participant_id)?.status
          const lb = lageFor.get(b.participant_id)?.status
          c = (la ? LAGE_ORDNING[la] : 9) - (lb ? LAGE_ORDNING[lb] : 9) || b.priority - a.priority
          break
        }
        case 'name':
          c = 0
          break
        case 'status':
          c = a.status.localeCompare(b.status)
          break
        case 'last_contact':
          c = new Date(a.last_contact_at || 0).getTime() - new Date(b.last_contact_at || 0).getTime()
          break
        case 'priority':
          c = b.priority - a.priority
          break
      }
      // En riktning per ordning: det som väntar, A–Ö, äldst kontakt, högst prioritet.
      // Beslut 2026-10-11: de i uppföljning är en egen grupp sist (utom vid ordning
      // efter status, som redan grupperar).
      const grupp = sortField === 'status' ? 0 : Number(a.status === 'FOLLOW_UP') - Number(b.status === 'FOLLOW_UP')
      return grupp || c || namnJmf(a, b)
    })
    return result
  }, [iStatus, searchQuery, snabbfilter, sortField, lageFor, matcharSnabbfilter])

  const antal = (f: Snabbfilter) => iStatus.filter((p) => matcharSnabbfilter(p, f)).length

  const allSelected = filteredParticipants.length > 0 && filteredParticipants.every((p) => selectedParticipants.includes(p.participant_id))
  const someSelected = selectedParticipants.length > 0 && !allSelected

  const toggleSelectAll = () => {
    setSelectedParticipants(allSelected ? [] : filteredParticipants.map(p => p.participant_id))
  }
  const toggleSelect = (id: string) => {
    setSelectedParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }
  const avslutaVal = () => {
    setValjer(false)
    setSelectedParticipants([])
  }

  const handleBulkActionComplete = () => {
    setSelectedParticipants([])
    fetchParticipants()
  }

  const selectedParticipantData = participants.filter(p => selectedParticipants.includes(p.participant_id))

  if (loading) {
    return <LoadingState fullHeight />
  }

  // KS7: eget felläge — skiljer sig i utseende, inte bara i text, från tomlägena.
  if (error) {
    return (
      <div className="p-8 bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-m)]">
        <ErrorState title="Deltagarna kunde inte hämtas" message={error} onRetry={fetchParticipants} />
      </div>
    )
  }

  const faltKlass = cn(
    'min-h-[44px] rounded-[var(--j-r-s)] border border-[var(--j-linje-2)] bg-[var(--j-kort)] text-[var(--j-blak)] text-[0.9375rem]',
    KVARTER_FOKUS,
  )

  const snabbval: Array<{ id: Snabbfilter; etikett: string; kraverVecka: boolean }> = [
    { id: 'all', etikett: 'Alla', kraverVecka: false },
    { id: 'attention', etikett: 'Behöver kontakt', kraverVecka: false },
    { id: 'franvaro', etikett: 'Frånvaro i veckan', kraverVecka: true },
    { id: 'utan-plan', etikett: 'Utan plan', kraverVecka: true },
  ]

  return (
    <div className={cn('grid gap-4 text-[var(--j-blak)]', valjer && 'pb-40 lg:pb-24')}>
      {/* Huvud: rubrik och den enda primärknappen */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-rubrik text-[1.375rem] sm:text-[1.6rem] leading-tight font-bold">Dina deltagare</h2>
        <Button ton="kvarter" variant="primary" onClick={() => setShowInviteDialog(true)} leftIcon={<KvarterIkon namn="deltagare" size={20} />}>
          Bjud in deltagare
        </Button>
      </div>

      {/* Sök, status och sortering — lugnt, på en rad */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] items-end">
        <label className="col-span-2 sm:col-span-1 grid gap-1 text-[0.8125rem] font-semibold text-[var(--j-blak-2)]">
          <span className="sr-only">Sök</span>
          <span className="relative">
            <KvarterIkon namn="sok" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--j-blak-3)] pointer-events-none" />
            <input
              type="search"
              placeholder="Sök på namn eller e-post"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(faltKlass, 'w-full pl-10 pr-3 placeholder:text-[var(--j-blak-3)]')}
            />
          </span>
        </label>
        <div className="grid gap-1 min-w-0 text-[0.8125rem] font-semibold text-[var(--j-blak-2)]">
          <label htmlFor="deltagarlista-status">Visa</label>
          <select
            id="deltagarlista-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className={cn(faltKlass, 'w-full px-3')}
          >
            <option value="all">Alla statusar</option>
            {STATUSAR.map((s) => <option key={s} value={s}>{STATUS_PLURAL[s]}</option>)}
          </select>
        </div>
        <div className="grid gap-1 min-w-0 text-[0.8125rem] font-semibold text-[var(--j-blak-2)]">
          <label htmlFor="deltagarlista-sortering">Ordning</label>
          <select
              id="deltagarlista-sortering"
              value={sortField}
              onChange={e => setSortField(e.target.value as SortField)}
              className={cn(faltKlass, 'w-full px-3')}
            >
              <option value="lage">Väntar först</option>
              <option value="name">Namn</option>
              <option value="last_contact">Längst sedan kontakt</option>
              <option value="priority">Prioritet</option>
              <option value="status">Status</option>
            </select>
        </div>
      </div>

      {/* Snabbfilter — bara det datan redan stödjer */}
      <div role="group" aria-label="Snabbfilter" className="flex flex-wrap gap-2">
        {snabbval
          .filter((s) => !s.kraverVecka || (underlag && (s.id !== 'utan-plan' || anvanderPlaner)))
          .map((s) => {
            const valt = snabbfilter === s.id
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={valt}
                onClick={() => setSnabbfilter(s.id)}
                className={cn(
                  'inline-flex items-center gap-2 min-h-[44px] sm:min-h-[36px] px-3.5 rounded-full border text-[0.875rem] font-semibold',
                  valt
                    ? 'bg-[var(--j-gran)] border-[var(--j-gran)] text-[var(--j-pa-gran)]'
                    : 'bg-[var(--j-kort)] border-[var(--j-linje-2)] text-[var(--j-blak-2)] hover:bg-[var(--j-sankt)]',
                  KVARTER_FOKUS,
                )}
              >
                {valt ? <KvarterIkon namn="bock" size={16} /> : null}
                {s.etikett}
                <span className={cn('tabular-nums', valt ? '' : 'text-[var(--j-blak-3)]')}>{antal(s.id)}</span>
              </button>
            )
          })}
      </div>

      {veckaQ.isError && (
        <p role="alert" className="m-0 text-[0.9375rem] text-[var(--s-ogiltig-text)]">
          Veckans pass kunde inte hämtas — läget och veckan visas inte.{' '}
          <button type="button" onClick={() => void veckaQ.refetch()} className={cn('underline font-semibold rounded-[var(--j-r-s)]', KVARTER_FOKUS)}>
            Försök igen
          </button>
        </p>
      )}
      {kadensQ.isError && (
        <p role="alert" className="m-0 text-[0.9375rem] text-[var(--s-ogiltig-text)]">Mötesdatum kunde inte hämtas — kadensen visas inte.</p>
      )}

      {/* Antal och "Välj flera" */}
      <div className="flex flex-wrap items-center justify-between gap-2 min-h-[44px]">
        <p className="m-0 text-[0.875rem] text-[var(--j-blak-2)]">
          Visar {filteredParticipants.length} av {participants.length} deltagare
        </p>
        {participants.length > 0 && (
          valjer ? (
            <Button ton="kvarter" variant="tertiary" size="sm" onClick={avslutaVal}>Klar med val</Button>
          ) : (
            <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => setValjer(true)} leftIcon={<KvarterIkon namn="bock" size={18} />}>
              Välj flera
            </Button>
          )
        )}
      </div>

      {/* Listan */}
      {filteredParticipants.length === 0 ? (
        participants.length === 0 ? (
          <div className="bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-m)] overflow-hidden">
            <EmptyState
              icon={Users}
              title="Inga deltagare ännu"
              description="Du har inte tilldelat några deltagare ännu."
              action={{ label: 'Bjud in din första deltagare', onClick: () => setShowInviteDialog(true) }}
            />
          </div>
        ) : (
          <div className="bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-m)] overflow-hidden">
            <EmptyState
              icon={Search}
              title="Ingen deltagare matchar"
              description="Prova ett annat namn eller ta bort filtret."
              action={{
                label: 'Visa alla',
                variant: 'outline',
                onClick: () => {
                  setSearchQuery('')
                  setSnabbfilter('all')
                  setStatusFilter('all')
                },
              }}
            />
          </div>
        )
      ) : (
        <ul
          aria-label="Deltagare"
          className="list-none m-0 p-0 bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-m)] overflow-hidden"
        >
          {filteredParticipants.map((p) => {
            const namn = fullNamn(p)
            const lage = lageFor.get(p.participant_id)
            const visaVecka = !!lage && (anvanderPlaner || !!lage.dagar)
            const kontakt = kontaktText(p.last_contact_at, nu)

            const detaljer: string[] = []
            if (lage && visaVecka) {
              if (lage.tillagg) detaljer.push(lage.tillagg)
              if (lage.plan) detaljer.push(lage.plan)
              detaljer.push(kontakt)
            }
            if (p.status !== 'ACTIVE') detaljer.push(STATUS_ORD[p.status])
            if (p.priority === 2) detaljer.push('Prioritet kritisk')
            else if (p.priority === 1) detaljer.push('Prioritet hög')
            for (const tagg of p.tags ?? []) detaljer.push(getTagLabel(tagg))

            // Utan veckans underlag (laddar, fel eller inga planer) bär kontakten meningen.
            const mening = lage && visaVecka ? lage.lage : kontakt

            const mitten: ReactNode[] = []
            if (lage?.dagar && visaVecka) {
              mitten.push(
                <span key="vecka" className="grid gap-1">
                  <Veckoremsa dagar={lage.dagar} rubrik={`${namn}s vecka`} idag={idag} statusOrd={franvaroSomFakta ? STATUS_ORD_LEVERANTOR : undefined} />
                </span>,
              )
            }
            if (lage?.nasta && visaVecka) {
              mitten.push(
                // På mobil hamnar "Nästa" under remsan och Öppna; på dator i en egen kolumn.
                <span key="nasta" className="order-last sm:order-none basis-full sm:basis-auto text-[0.8125rem] leading-5 text-[var(--j-blak-2)] sm:w-40">
                  <span className="sr-only">Nästa pass: </span>{lage.nasta}
                </span>,
              )
            } else if (lage?.dagar && visaVecka) {
              // Håller remsan i samma kolumn på dator när det inte finns något nästa pass.
              mitten.push(<span key="nasta" aria-hidden="true" className="hidden sm:block sm:w-40" />)
            }
            if (kundtyp?.visaAvtalskrav && kadensPerDeltagare) {
              mitten.push(
                <span key="kadens" className="order-last sm:order-none basis-full sm:basis-auto">
                  <KadensChip k={kadensPerDeltagare.get(p.participant_id)} />
                </span>,
              )
            }

            const rad = (
              <PersonRad
                som="div"
                className={valjer ? 'border-b-0 flex-1 min-w-0 pl-1 sm:pl-1' : 'border-b-0'}
                namn={namn}
                lage={mening}
                detalj={detaljer.join(' · ') || undefined}
                fler={lage && visaVecka ? lage.fler : undefined}
                bildUrl={p.avatar_url}
                onOppna={() => navigate(`/consultant/participants/${p.participant_id}`)}
                mitten={mitten.length > 0 ? <>{mitten}</> : undefined}
                handling={{ etikett: 'Öppna', variant: 'tertiary', onClick: () => navigate(`/consultant/participants/${p.participant_id}`) }}
              />
            )

            return (
              <li
                key={p.participant_id}
                data-testid="deltagarrad"
                className={cn(
                  'border-b border-[var(--j-linje)] last:border-b-0',
                  valjer && 'flex items-center pl-3 sm:pl-[18px]',
                  valjer && selectedParticipants.includes(p.participant_id) && 'bg-[var(--j-gran-mjuk)]',
                )}
              >
                {valjer ? (
                  <Kryssruta
                    checked={selectedParticipants.includes(p.participant_id)}
                    onToggle={() => toggleSelect(p.participant_id)}
                    etikett={`Välj ${namn}`}
                  />
                ) : null}
                {rad}
              </li>
            )
          })}
        </ul>
      )}

      {/* Massåtgärder — fäst mot skärmens nederkant så att de syns medan man bockar i
          längre ned (ovanför bottenmenyn på mobil). Listan får luft under sig. */}
      {valjer && (
        <div
          role="region"
          aria-label="Massåtgärder"
          className="fixed left-4 right-4 bottom-[72px] lg:left-auto lg:right-8 lg:bottom-6 lg:max-w-[760px] z-30 flex flex-wrap items-center gap-2 px-4 py-3 rounded-[var(--j-r-m)] border border-[var(--j-gran)] bg-[var(--j-kort)] shadow-[var(--j-skugga)]"
        >
          <Kryssruta
            checked={allSelected ? true : someSelected ? 'mixed' : false}
            onToggle={toggleSelectAll}
            etikett={allSelected ? 'Avmarkera alla' : 'Markera alla'}
          />
          <span className="font-semibold text-[var(--j-gran-text)] mr-auto" aria-live="polite">
            {selectedParticipants.length === 0 ? 'Inga valda än' : `${selectedParticipants.length} valda`}
          </span>
          {([
            ['message', 'Skicka meddelande'],
            ['tag', 'Lägg till tagg'],
            ['status', 'Ändra status'],
            ['export', 'Exportera'],
          ] as Array<[BulkTyp, string]>).map(([typ, etikett]) => (
            <Button
              key={typ}
              ton="kvarter"
              variant={typ === 'message' ? 'secondary' : 'tertiary'}
              size="sm"
              disabled={selectedParticipants.length === 0}
              onClick={() => setBulkActionType(typ)}
            >
              {etikett}
            </Button>
          ))}
        </div>
      )}

      {bulkActionType && (
        <BulkActionsDialog
          isOpen={!!bulkActionType}
          onClose={() => setBulkActionType(null)}
          actionType={bulkActionType}
          selectedParticipants={selectedParticipantData}
          onComplete={handleBulkActionComplete}
        />
      )}

      {/* Invite Participant Dialog (KA1) */}
      <InviteParticipantDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onSuccess={() => {
          setShowInviteDialog(false)
          fetchParticipants()
        }}
      />
    </div>
  )
}

/** En kryssruta med 44 px tryckyta, role="checkbox" (KT2). */
function Kryssruta({ checked, onToggle, etikett }: { checked: boolean | 'mixed'; onToggle: () => void; etikett: string }) {
  const pa = checked === true
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={etikett}
      onClick={onToggle}
      className={cn('flex-none w-11 h-11 grid place-items-center rounded-[var(--j-r-s)]', KVARTER_FOKUS)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'w-6 h-6 rounded-md border-2 grid place-items-center',
          pa || checked === 'mixed'
            ? 'bg-[var(--j-gran)] border-[var(--j-gran)] text-[var(--j-pa-gran)]'
            : 'bg-[var(--j-kort)] border-[var(--j-linje-2)]',
        )}
      >
        {pa ? <KvarterIkon namn="bock" size={16} strokeWidth={2.25} /> : checked === 'mixed' ? <KvarterIkon namn="streck" size={16} /> : null}
      </span>
    </button>
  )
}

/** RM3-chipet: möteskadensen i ord, med regeln för skärmläsare (RR23). */
function KadensChip({ k }: { k: Kadens | undefined }) {
  const laget: KadensLage = k?.laget ?? 'inget'
  const farg = laget === 'over' ? statusFarg('ogiltig') : laget === 'snart' ? statusFarg('vantar') : null
  return (
    <span
      // RR12: chipet klipptes på 390 px — radbryt i stället.
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[0.8125rem] leading-5 font-semibold whitespace-normal bg-[var(--j-sankt)] text-[var(--j-blak-2)]"
      style={farg ? { backgroundColor: farg.bg, color: farg.text } : undefined}
      data-testid="kadens-chip"
      data-lage={laget}
      title={KADENS_REGEL}
    >
      {kadensText(k)}
      <span className="sr-only"> — {KADENS_REGEL}</span>
    </span>
  )
}
