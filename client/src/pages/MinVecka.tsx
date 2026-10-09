/**
 * Min vecka — deltagarens vy av sin aktivitetsplan (KM3/KM6).
 *
 * Läser activity_plans och activity_sessions direkt via minVeckaApi. Passen
 * genereras och närvaron sätts av konsulenten; deltagaren kan bara checka in
 * (self_checkin_at, vaktat av trigger i databasen). Ingen AI, inga
 * prestationsord — tonen är "lugn vän" (DESIGN.md §2). Ett tomt schema är
 * en invit, inte en nolla.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ClipboardCheck, MapPin, CheckCircle, CalendarPlus } from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { minVeckaApi, type ActivitySession } from '@/services/aktivitetApi'
import { MIN_VECKA_PLAN_KEY, minVeckaSessionsKey } from '@/services/minVeckaKeys'
import { jobbsokAktivitetApi, harNagot } from '@/services/jobbsokAktivitet'
import { konsulentMeddelandeApi } from '@/services/konsulentMeddelandeApi'
// F1 (2026-09-12): deltagaren anmäler frånvaro på kommande pass
import { FranvaroAnmalan } from '@/components/minvecka/FranvaroAnmalan'
import { FragaOmPasset } from '@/components/minvecka/FragaOmPasset'
import { NarvaroIntyg } from '@/components/minvecka/NarvaroIntyg'
// RD4 (rollspelet 2026-09-27): konsulentens möten i veckan
import { MoteKort } from '@/components/minvecka/MoteKort'
import { hamtaMoten, motesDatum, motesStart, type KonsulentMote } from '@/components/minvecka/konsulentMoten'
// RD11: förklara en markerad frånvaro i efterhand
import { ForklaraFranvaro } from '@/components/minvecka/ForklaraFranvaro'
// RD3 (rollspelet 2026-09-27): kommunens juridik bara när planen belagt kommer från en kommun
import { hamtaPlanensOrganisation, regelverkNycklar } from '@/components/minvecka/planensRegelverk'
// RD25: "Din plan" — vem hon är hos, vem som beslutat, vad som räknas
import { MinPlan } from '@/components/minvecka/MinPlan'
import { LasMer } from '@/components/ui/LasMer'
// NF1 (2026-09-24): passet till deltagarens egen kalender som .ics
import { byggIcs, icsFilnamn, laddaNerIcs } from '@/lib/ics'
import {
  addDays,
  formatLocalDate,
  veckansMandag,
  veckosaldo,
  veckoampel,
  anvisatVeckomal,
  type ActivityType,
  type Attendance,
} from '@/services/aktivitetSchema'

const TYP_NYCKEL: Record<ActivityType, string> = {
  motivation: 'minVecka.typ.motivation',
  language: 'minVecka.typ.language',
  jobsearch: 'minVecka.typ.jobsearch',
  workplace: 'minVecka.typ.workplace',
  jobsearch_own: 'minVecka.typ.jobsearch_own',
  sfi: 'minVecka.typ.sfi',
  studier: 'minVecka.typ.studier',
  vagledning: 'minVecka.typ.vagledning',
  halsa: 'minVecka.typ.halsa',
}

const NARVARO_NYCKEL: Record<Attendance, string> = {
  present: 'minVecka.narvaro.present',
  absent_valid: 'minVecka.narvaro.absent_valid',
  absent_invalid: 'minVecka.narvaro.absent_invalid',
  sick_certified: 'minVecka.narvaro.sick_certified',
  external: 'minVecka.narvaro.external',
}

function idag(): string {
  return formatLocalDate(new Date())
}

/** Planens skäl utan avslutande punkt — texten runt om sätter egen ("aktivitetskravet.." i rollspelet). */
function utanSlutpunkt(s: string): string {
  return s.trim().replace(/[.\s]+$/, '')
}

type DagPost = { slag: 'pass'; tid: string; pass: ActivitySession } | { slag: 'mote'; tid: string; mote: KonsulentMote }

function klockslag(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

export default function MinVecka() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mandag, setMandag] = useState(() => veckansMandag(idag()))
  const [status, setStatus] = useState<string | null>(null)
  const [checkinFel, setCheckinFel] = useState<string | null>(null)
  const [pagar, setPagar] = useState<string | null>(null)

  const planQuery = useQuery({
    queryKey: MIN_VECKA_PLAN_KEY,
    queryFn: () => minVeckaApi.getMyPlan(),
  })

  const sondag = addDays(mandag, 6)
  const sessionsQuery = useQuery({
    queryKey: minVeckaSessionsKey(mandag),
    queryFn: () => minVeckaApi.listMySessions(mandag, sondag),
    enabled: !!planQuery.data,
  })

  // RD3: vilken sorts organisation planen kommer från. Tills svaret finns — och
  // om det aldrig kommer (vyn saknar kolumnen före migrationen) — neutral text.
  const regelverkQuery = useQuery({
    queryKey: ['min-vecka', 'organisation', planQuery.data?.org_id ?? null],
    queryFn: () => hamtaPlanensOrganisation(planQuery.data?.org_id),
    enabled: !!planQuery.data,
    staleTime: 10 * 60_000,
  })
  const regelverk = regelverkQuery.data?.regelverk ?? null
  const orgNamn = regelverkQuery.data?.orgNamn ?? null
  const nycklar = regelverkNycklar(regelverk)

  // RD4: konsulentens möten samma vecka. Kastar vid fel — ett fel är inte "inga möten".
  const motenQuery = useQuery({
    queryKey: ['min-vecka', 'moten', mandag],
    queryFn: () => hamtaMoten(mandag, sondag),
    enabled: !!planQuery.data,
  })
  const moten = useMemo(() => motenQuery.data ?? [], [motenQuery.data])

  // KM9: deltagarens eget jobbsökande ur portalens data — egen redovisning, aldrig kontroll.
  const jobbsokQuery = useQuery({
    queryKey: ['min-vecka', 'jobbsok', mandag],
    queryFn: () => jobbsokAktivitetApi.minaJobbsok(mandag),
    enabled: !!planQuery.data,
  })

  // NY6: utan plan skiljer vi på "ingen konsulent" och "konsulent men ingen plan".
  // Bara läsning. Ett fel ger den neutrala texten, inte ett påstående åt något håll.
  const saknarPlan = planQuery.isSuccess && !planQuery.data
  const konsulentQuery = useQuery({
    queryKey: ['min-vecka', 'min-konsulent'],
    queryFn: () => konsulentMeddelandeApi.minKonsulent(),
    enabled: saknarPlan,
    staleTime: 60_000,
  })

  const dagens = idag()
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'sv-SE'

  // Pass och möten per dag, i tidsordning (RD4: mötena låg tidigare bara på Min konsulent).
  const perDag = useMemo(() => {
    const map = new Map<string, DagPost[]>()
    const lagg = (datum: string, post: DagPost) => {
      const list = map.get(datum) ?? []
      list.push(post)
      map.set(datum, list)
    }
    for (const s of sessionsQuery.data ?? []) lagg(s.date, { slag: 'pass', tid: s.start_time, pass: s })
    for (const m of moten) lagg(motesDatum(m), { slag: 'mote', tid: motesStart(m), mote: m })
    for (const list of map.values()) list.sort((a, b) => a.tid.localeCompare(b.tid))
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [sessionsQuery.data, moten])

  const nastaPass = useMemo(() => {
    const nu = new Date()
    const nuTid = `${String(nu.getHours()).padStart(2, '0')}:${String(nu.getMinutes()).padStart(2, '0')}`
    return (sessionsQuery.data ?? []).find((s) => s.date > dagens || (s.date === dagens && s.start_time >= nuTid)) ?? null
  }, [sessionsQuery.data, dagens])

  const handleCheckin = async (session: ActivitySession) => {
    setPagar(session.id)
    setCheckinFel(null)
    try {
      await minVeckaApi.checkin(session.id)
      await queryClient.invalidateQueries({ queryKey: minVeckaSessionsKey(mandag) })
      setStatus(t('minVecka.incheckadStatus', 'Tack, du är incheckad.'))
    } catch {
      setCheckinFel(t('minVecka.incheckningMisslyckades', 'Incheckningen gick inte igenom. Försök igen, eller säg till din konsulent.'))
    } finally {
      setPagar(null)
    }
  }

  // NF1: ett pass → en .ics-fil. UID:t bygger på passets id, så en ny import
  // av samma pass uppdaterar posten i kalendern i stället för att dubblera den.
  const handleKalender = (session: ActivitySession) => {
    setCheckinFel(null)
    try {
      const ics = byggIcs([
        {
          uid: `${session.id}@jobin.se`,
          datum: session.date,
          start: session.start_time,
          slut: session.end_time,
          titel: session.title,
          plats: session.location,
          beskrivning: t(TYP_NYCKEL[session.activity_type]),
        },
      ])
      laddaNerIcs(ics, icsFilnamn(`${session.title} ${session.date}`))
      setStatus(t('minVecka.kalender.status', 'Kalenderfilen är nedladdad. Öppna den för att lägga passet i din kalender.'))
    } catch {
      // Synligt, inte bara i den dolda statusraden (samma rad som incheckningsfelet)
      setCheckinFel(t('minVecka.kalender.fel', 'Kalenderfilen kunde inte skapas. Försök igen om en stund.'))
    }
  }

  const rubrikdatum = (d: string) => {
    const date = new Date(`${d}T12:00:00`)
    return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  }

  let innehall: React.ReactNode

  if (planQuery.isLoading || (planQuery.data && sessionsQuery.isLoading)) {
    innehall = <LoadingState />
  } else if (planQuery.isError) {
    innehall = <ErrorState message={t('minVecka.kundeInteHamta', 'Din vecka kunde inte hämtas just nu.')} onRetry={() => planQuery.refetch()} />
  } else if (!planQuery.data && konsulentQuery.isLoading) {
    // Innan vi vet om det finns en konsulent påstår vi ingenting om en.
    innehall = <LoadingState />
  } else if (!planQuery.data) {
    // data === null = ingen konsulent kopplad. Fel → den neutrala texten.
    const utanKonsulent = konsulentQuery.isSuccess && konsulentQuery.data === null
    innehall = (
      <div>
        <EmptyState
          icon={ClipboardCheck}
          title={utanKonsulent
            ? t('minVecka.ingenPlan.utanKonsulentTitel', 'Din vecka visas här när du har en konsulent')
            : t('minVecka.ingenPlan.title', 'Ingen vecka planerad än')}
          description={utanKonsulent
            ? t('minVecka.ingenPlan.utanKonsulentText', 'Du har ingen konsulent kopplad ännu. När du får en lägger ni upp veckan tillsammans. Tills dess finns det inget du behöver göra här.')
            : t('minVecka.ingenPlan.text', 'Din konsulent lägger upp veckan tillsammans med dig. Tills dess finns det inget du behöver göra här.')}
          action={{
            label: utanKonsulent
              ? t('minVecka.ingenPlan.utanKonsulentCta', 'Se Min konsulent')
              : t('minVecka.ingenPlan.cta', 'Gå till din konsulent'),
            onClick: () => navigate('/my-consultant'),
          }}
        />
        {/* NY6: medan du väntar — vad du kan göra själv. Vanlig <a>: /guider/ är prerenderad utanför HashRouter. */}
        <div className="mx-auto mt-4 max-w-md text-center text-sm text-stone-700 dark:text-stone-300" data-testid="ingenplan-medan-du-vantar">
          <p className="font-medium">{t('minVecka.ingenPlan.medanTitel', 'Medan du väntar')}</p>
          <p className="mt-1">
            {t('minVecka.ingenPlan.medanText', 'Du kan läsa om aktivitetskravet, till exempel vad som gäller och vad du kan göra om du inte kan komma till ett pass. Du kan också fylla i ditt CV eller titta på jobb.')}
          </p>
          <p className="mt-2">
            <a
              href="/guider/aktivitetskrav-forsorjningsstod/"
              className="font-medium underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2"
            >
              {t('minVecka.ingenPlan.guideLank', 'Läs om aktivitetskravet')}
            </a>
          </p>
        </div>
      </div>
    )
  } else if (sessionsQuery.isError) {
    innehall = <ErrorState message={t('minVecka.kundeInteHamta', 'Din vecka kunde inte hämtas just nu.')} onRetry={() => sessionsQuery.refetch()} />
  } else {
    const plan = planQuery.data
    const sessions = sessionsQuery.data ?? []
    const saldo = veckosaldo(sessions, mandag)
    // RK1/RD12: samma mått som konsulentens ampel — den anvisade delen av
    // veckomålet. Talet deltagaren ser ÄR det talet; planens totala mål
    // (inklusive eget jobbsökande) visades tidigare, "8 av 11" när ampeln mätte mot 8.
    const anvisatMal = anvisatVeckomal(plan)
    const egetJobbsok = Number(plan.jobsearch_hours_per_week) || 0
    const ampel = veckoampel(saldo, anvisatMal)

    innehall = (
      <div className="space-y-6 max-w-2xl">
        <Card className="p-5">
          <p className="text-lg text-stone-900 dark:text-stone-100">
            {ampel === 'inga_pass'
              ? t('minVecka.saldo.ingaPass', 'Inget inplanerat den här veckan.')
              : saldo.planeradeTimmar > anvisatMal + 0.05
                // Skav (rollspelet 2026-09-27): "11 av 8 timmar" läser som en del av
                // en helhet. Över målet sägs det rakt ut i stället.
                ? t('minVecka.saldo.radOver', {
                    defaultValue: 'Du har {{planerade}} timmar i anvisade pass den här veckan, mer än målet på {{mal}}.',
                    planerade: saldo.planeradeTimmar,
                    mal: anvisatMal,
                    count: saldo.planeradeTimmar,
                  })
                : t('minVecka.saldo.radAnvisat', {
                  defaultValue: 'Du har {{planerade}} av {{mal}} timmar i anvisade pass den här veckan.',
                  planerade: saldo.planeradeTimmar,
                  mal: anvisatMal,
                  // RD24: pluralformen följer målet — "1 av 1 timme", inte "1 timmar".
                  count: anvisatMal,
                })}
          </p>
          {nastaPass && (
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
              {t('minVecka.nastaPass', {
                defaultValue: 'Nästa: {{titel}}, {{dag}} kl {{tid}}',
                titel: nastaPass.title,
                dag: rubrikdatum(nastaPass.date),
                tid: nastaPass.start_time,
              })}
            </p>
          )}
          {ampel !== 'inga_pass' && (
            // Designpass 2026-10-09: talet och nästa pass syns; hur det räknas
            // ligger ett klick bort. Texten är kvar i DOM:en (RD12/PG7 håller).
            <LasMer etikett={t('minVecka.saldo.lasMer', 'Så räknas timmarna')}>
            <p>
              {egetJobbsok > 0
                ? t('minVecka.saldo.vadRaknasJobbsok', {
                    defaultValue: 'Här räknas bara pass som din konsulent har planerat. Eget jobbsökande räknas för sig: {{count}} timmar i veckan enligt planen.',
                    count: egetJobbsok,
                  })
                : t('minVecka.saldo.vadRaknas', 'Här räknas bara pass som din konsulent har planerat.')}
            </p>
            {/* PG7 (2026-09-12): "15 av 30" utan förklaring. Talen är planens
                eget mål (satt av konsulenten, lagens tak 40 h) och passens timmar —
                aldrig något framräknat som inte står i datan. */}
              <p>
                {t(nycklar.mal, { mal: anvisatMal })}
                {plan.target_reason ? ` ${t('minVecka.forklaring.skal', { defaultValue: 'Skäl: {{skal}}.', skal: utanSlutpunkt(plan.target_reason) })}` : ''}
              </p>
              <p>
                {saldo.planeradeTimmar + 0.05 >= anvisatMal
                  ? t('minVecka.forklaring.full', 'Den här veckan är fullplanerad.')
                  : t('minVecka.forklaring.kvar', {
                      // RD24: de planerade timmarna står redan i saldoraden ovanför; här
                      // bara det som är kvar, så att pluralformen följer ett enda tal.
                      defaultValue: '{{kvar}} timmar återstår att planera — det gör din konsulent tillsammans med dig, det är inget du behöver ordna själv.',
                      kvar: Math.round((anvisatMal - saldo.planeradeTimmar) * 10) / 10,
                      count: Math.round((anvisatMal - saldo.planeradeTimmar) * 10) / 10,
                    })}
              </p>
              {/* Guiden om aktivitetskravet gäller försörjningsstöd — bara för kommunens plan */}
              {regelverk === 'kommun' && (
                <p>
                  <a href="/guider/aktivitetskrav-forsorjningsstod/" className="underline underline-offset-2 text-[var(--c-text)]">
                    {t('minVecka.forklaring.guide', 'Läs om aktivitetskravet och vad som gäller för dig')}
                  </a>
                </p>
              )}
              {regelverk === 'leverantor' && (
                <p>
                  <a href="/guider/rusta-och-matcha/" className="underline underline-offset-2 text-[var(--c-text)]">
                    {t('minVecka.forklaring.guideLeverantor')}
                  </a>
                </p>
              )}
            </LasMer>
          )}
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => setMandag(addDays(mandag, -7))} aria-label={t('minVecka.forraVeckan', 'Förra veckan')}>
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t('minVecka.forraVeckan', 'Förra veckan')}</span>
          </Button>
          <button
            type="button"
            className="text-sm font-medium text-stone-700 dark:text-stone-300 underline-offset-2 hover:underline"
            onClick={() => setMandag(veckansMandag(idag()))}
          >
            {t('minVecka.veckaRubrik', { defaultValue: 'Vecka {{fran}} – {{till}}', fran: rubrikdatum(mandag), till: rubrikdatum(sondag) })}
          </button>
          <Button variant="outline" onClick={() => setMandag(addDays(mandag, 7))} aria-label={t('minVecka.nastaVeckan', 'Nästa vecka')}>
            <span className="sr-only sm:not-sr-only">{t('minVecka.nastaVeckan', 'Nästa vecka')}</span>
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        <div role="status" aria-live="polite" className="sr-only">{status ?? ''}</div>
        {checkinFel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{checkinFel}</p>}
        {motenQuery.isError && (
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {t('minVecka.mote.hamtFel', 'Dina möten med konsulenten kunde inte hämtas just nu. Du ser dem på sidan Min konsulent.')}
          </p>
        )}

        {perDag.length === 0 ? (
          <p className="text-stone-600 dark:text-stone-400">
            {/* PG-skav (persona 2026-09-12): en tom vecka sa samma sak oavsett
                orsak — "ingen plan lagd än" (konsulenten har inte hunnit
                schemalägga så här långt fram) och "planen finns, veckan råkar
                vara ledig" ser likadana ut för deltagaren men betyder olika
                saker. `plan` existerar alltid här (annat gren ovan hanterar
                "ingen plan alls"), så den enda skillnad vi ÄRLIGT kan läsa ur
                datan är om veckan ligger FÖRE dagens vecka eller efter — pass
                genereras framåt i tiden, aldrig bakåt. */}
            {mandag > veckansMandag(dagens)
              ? t('minVecka.tomVecka.framtid', 'Inga pass inplanerade än den här veckan — din konsulent lägger till fler pass efter hand.')
              : t('minVecka.tomVecka.ledig', 'Inga pass den här veckan. En ledig vecka enligt planen — hör av dig till din konsulent om du är osäker.')}
          </p>
        ) : (
          perDag.map(([dag, poster]) => (
            <section key={dag} aria-labelledby={`dag-${dag}`} className="space-y-3">
              <h2 id={`dag-${dag}`} className="text-base font-semibold text-stone-800 dark:text-stone-200 capitalize">
                {rubrikdatum(dag)}{dag === dagens ? ` · ${t('minVecka.idag', 'i dag')}` : ''}
              </h2>
              {poster.map((post) => post.slag === 'mote' ? (
                <MoteKort
                  key={`mote-${post.mote.id}`}
                  mote={post.mote}
                  datumText={rubrikdatum(dag)}
                  passerat={new Date(post.mote.scheduled_at).getTime() < Date.now()}
                  onStatus={setStatus}
                />
              ) : ((s: ActivitySession) => (
                <Card key={s.id} className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-sm text-stone-600 dark:text-stone-400">{s.start_time}–{s.end_time}</span>
                      <span className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">{t(TYP_NYCKEL[s.activity_type])}</span>
                    </div>
                    <h3 className="font-medium text-stone-900 dark:text-stone-100">{s.title}</h3>
                    {s.location && (
                      <p className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
                        <MapPin className="w-4 h-4" aria-hidden="true" />{s.location}
                      </p>
                    )}
                    {s.attendance ? (
                      <p className="text-sm text-stone-700 dark:text-stone-300">{t(NARVARO_NYCKEL[s.attendance])}</p>
                    ) : s.self_checkin_at ? (
                      <p className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
                        <CheckCircle className="w-4 h-4" aria-hidden="true" />
                        {t('minVecka.incheckad', { defaultValue: 'Incheckad kl {{tid}}', tid: klockslag(s.self_checkin_at, locale) })}
                      </p>
                    ) : s.date === dagens ? (
                      <Button
                        className="min-h-12 w-full sm:w-auto"
                        onClick={() => handleCheckin(s)}
                        disabled={pagar === s.id}
                      >
                        {t('minVecka.jagArHar', 'Jag är här')}
                      </Button>
                    ) : null}
                    {/* F1: kommande, omarkerat pass → "Jag kan inte komma"; anmält → status + ångra */}
                    {!s.self_checkin_at && (
                      <FranvaroAnmalan
                        session={s}
                        // RD27: veckans alla möten med datum — en anmälan av flera dagar frågar om dem också
                        motenSammaDag={moten.map((m) => ({ id: m.id, tid: motesStart(m), datum: motesDatum(m) }))}
                        passSammaDag={(sessionsQuery.data ?? []).filter((x) => x.date === s.date)}
                        datumText={rubrikdatum(s.date)}
                        onSaved={(uppd) => {
                          queryClient.setQueryData<ActivitySession[]>(minVeckaSessionsKey(mandag), (gamla) =>
                            (gamla ?? []).map((x) => (x.id === uppd.id ? uppd : x)),
                          )
                          setStatus(t('minVecka.franvaro.status', 'Din konsulent har fått besked.'))
                        }}
                        onSavedFlera={(uppdaterade) => {
                          const perId = new Map(uppdaterade.map((u) => [u.id, u]))
                          queryClient.setQueryData<ActivitySession[]>(minVeckaSessionsKey(mandag), (gamla) =>
                            (gamla ?? []).map((x) => perId.get(x.id) ?? x),
                          )
                          // En period kan gå in i nästa vecka — de veckorna hämtas om när hon bläddrar dit.
                          void queryClient.invalidateQueries({
                            predicate: (q) => q.queryKey[0] === 'min-vecka' && q.queryKey[1] === 'sessions' && q.queryKey[2] !== mandag,
                          })
                          setStatus(t('minVecka.franvaro.statusFlera', {
                            defaultValue: 'Anmält för {{count}} pass. Din konsulent har fått besked.',
                            count: uppdaterade.length,
                          }))
                        }}
                      />
                    )}
                    {/* RD11: en markerad frånvaro kan förklaras i efterhand */}
                    <ForklaraFranvaro
                      session={s}
                      onSaved={(uppd) => {
                        queryClient.setQueryData<ActivitySession[]>(minVeckaSessionsKey(mandag), (gamla) =>
                          (gamla ?? []).map((x) => (x.id === uppd.id ? uppd : x)),
                        )
                        setStatus(t('minVecka.forklara.status', 'Din förklaring är skickad till din konsulent.'))
                      }}
                    />
                    {/* NF1: bara pass som inte redan har varit — ett gammalt pass i kalendern hjälper ingen */}
                    {s.date >= dagens && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto self-start"
                        onClick={() => handleKalender(s)}
                        aria-label={t('minVecka.kalender.knappEtikett', { defaultValue: 'Lägg till {{titel}} i kalendern', titel: s.title })}
                      >
                        <CalendarPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                        {t('minVecka.kalender.knapp', 'Lägg till i kalendern')}
                      </Button>
                    )}
                    {/* F8: frågan uppstår vid passet — samma sändväg som Min konsulent, förifylld */}
                    {s.activity_type !== 'jobsearch_own' && (
                      <FragaOmPasset
                        session={s}
                        datumText={rubrikdatum(s.date)}
                        onSent={(namn) => setStatus(t('minVecka.fraga.skickat', { defaultValue: 'Skickat till {{namn}}.', namn }))}
                      />
                    )}
                  </div>
                </Card>
              ))(post.pass))}
            </section>
          ))
        )}

        {/* Designpass 2026-10-09: veckan först — det hon gör i dag ligger inte
            längre 1 500 px ner. Planen, jobbsökandet och intyget följer efter. */}
        <MinPlan regelverk={regelverk} orgNamn={orgNamn} />

        <Card className="p-5" aria-labelledby="jobbsok-rubrik">
          <h2 id="jobbsok-rubrik" className="text-base font-semibold text-stone-800 dark:text-stone-200">
            {t('minVecka.jobbsok.rubrik', 'Ditt jobbsökande den här veckan')}
          </h2>
          {jobbsokQuery.isLoading || (!jobbsokQuery.data && !jobbsokQuery.isError) ? (
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">…</p>
          ) : jobbsokQuery.isError ? (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{t('minVecka.jobbsok.fel', 'Ditt jobbsökande kunde inte hämtas just nu.')}</p>
          ) : !harNagot(jobbsokQuery.data) ? (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {t('minVecka.jobbsok.tomt', 'Inget registrerat än den här veckan. Det syns här när du sparar ett jobb eller skickar en ansökan.')}
            </p>
          ) : (
            <p className="mt-1 text-stone-900 dark:text-stone-100">
              {[
                jobbsokQuery.data.sparadeJobb > 0 && t('minVecka.jobbsok.sparade', { count: jobbsokQuery.data.sparadeJobb, defaultValue: '{{count}} jobb sparade' }),
                jobbsokQuery.data.ansokningar > 0 && t('minVecka.jobbsok.ansokningar', { count: jobbsokQuery.data.ansokningar, defaultValue: '{{count}} ansökningar skickade' }),
                jobbsokQuery.data.cvUppdaterad && t('minVecka.jobbsok.cv', 'CV uppdaterat'),
                jobbsokQuery.data.brev > 0 && t('minVecka.jobbsok.brev', { count: jobbsokQuery.data.brev, defaultValue: '{{count}} personliga brev' }),
                jobbsokQuery.data.intervjutraningar > 0 && t('minVecka.jobbsok.intervju', { count: jobbsokQuery.data.intervjutraningar, defaultValue: '{{count}} intervjuövningar' }),
              ].filter(Boolean).join(' · ')}
            </p>
          )}
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            {t('minVecka.jobbsok.egenRedovisning', 'Det här är din egen översikt. Din konsulent ser bara sparade jobb och ansökningar.')}
          </p>
        </Card>

        {/* F5: deltagarens eget närvarointyg — kvitto till handläggaren, utan omväg via konsulenten */}
        <NarvaroIntyg plan={plan} regelverk={regelverk} />
      </div>
    )
  }

  return (
    <PageLayout
      title={t('minVecka.title', 'Min vecka')}
      description={t('minVecka.description', 'Dina planerade aktiviteter, vecka för vecka.')}
      icon={ClipboardCheck}
      domain="wellbeing"
    >
      {innehall}
    </PageLayout>
  )
}
