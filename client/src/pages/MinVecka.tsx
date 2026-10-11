/**
 * Min vecka — deltagarens vy av sin aktivitetsplan (KM3/KM6).
 *
 * Läser activity_plans och activity_sessions direkt via minVeckaApi. Passen
 * genereras och närvaron sätts av konsulenten; deltagaren kan bara checka in
 * (self_checkin_at, vaktat av trigger i databasen). Ingen AI, inga
 * prestationsord — tonen är "lugn vän" (DESIGN.md §2). Ett tomt schema är
 * en invit, inte en nolla.
 *
 * Omtaget steg 6 (2026-10-11, "Jobin i lugnare form"): sidan svarar på EN
 * fråga — "Vad förväntas av mig i dag?" — i den ordning hon behöver svaret:
 *   1. Passet i dag och "Jag är här" (NastaPass → NastaSteg). Kan hon inte
 *      komma öppnas frånvaroanmälan på samma plats, med bilden "hemma i regn".
 *   2. Veckan som en remsa (Veckoremsa, stor) med timmarna under.
 *   3. "Vad förväntas av mig?" — tre korta meningar (VadForvantas).
 *   4. Passen dag för dag, en rad per pass.
 *   5. "Mer om din vecka": planen, jobbsökandet och närvarointyget — en rad var.
 * Platsbandet och rådgivarens hälsning ritas av PageLayout och rörs inte här.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck } from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusChip } from '@/components/ui/StatusChip'
import { Veckoremsa, type VeckoremsaDag } from '@/components/ui/Veckoremsa'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { minVeckaApi, type ActivitySession } from '@/services/aktivitetApi'
import { MIN_VECKA_OLASTA_KEY, MIN_VECKA_PLAN_KEY, minVeckaSessionsKey } from '@/services/minVeckaKeys'
import { jobbsokAktivitetApi, harNagot } from '@/services/jobbsokAktivitet'
import { konsulentMeddelandeApi } from '@/services/konsulentMeddelandeApi'
import { franvaroAv } from '@/services/franvaroApi'
// F1 (2026-09-12): deltagaren anmäler frånvaro på kommande pass
import { FranvaroAnmalan } from '@/components/minvecka/FranvaroAnmalan'
import { NarvaroIntyg } from '@/components/minvecka/NarvaroIntyg'
// RD4 (rollspelet 2026-09-27): konsulentens möten i veckan
import { MoteKort } from '@/components/minvecka/MoteKort'
import { hamtaMoten, motesDatum, motesStart, type KonsulentMote } from '@/components/minvecka/konsulentMoten'
// RD3 (rollspelet 2026-09-27): kommunens juridik bara när planen belagt kommer från en kommun
import { hamtaPlanensOrganisation, regelverkNycklar } from '@/components/minvecka/planensRegelverk'
// RD25: "Din plan" — vem hon är hos, vem som beslutat, vad som räknas
import { MinPlan } from '@/components/minvecka/MinPlan'
// 2026-10-11: "Vad förväntas av mig?"
import { VadForvantas } from '@/components/minvecka/VadForvantas'
import { NastaPass } from '@/components/minvecka/NastaPass'
import { PassRad } from '@/components/minvecka/PassRad'
import { TYP_NYCKEL } from '@/components/minvecka/passTyp'
import { MerLista, MerRad } from '@/components/minvecka/MerRad'
import { dagensStatus, veckonummer } from '@/components/minvecka/veckansStatus'
import { nuSteg, type PassMedAnmalan } from '@/components/minvecka/forvantasRegler'
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
} from '@/services/aktivitetSchema'

function idag(): string {
  return formatLocalDate(new Date())
}

function nuKlockslag(): string {
  const nu = new Date()
  return `${String(nu.getHours()).padStart(2, '0')}:${String(nu.getMinutes()).padStart(2, '0')}`
}

/** Planens skäl utan avslutande punkt — texten runt om sätter egen ("aktivitetskravet.." i rollspelet). */
function utanSlutpunkt(s: string): string {
  return s.trim().replace(/[.\s]+$/, '')
}

type DagPost = { slag: 'pass'; tid: string; pass: ActivitySession } | { slag: 'mote'; tid: string; mote: KonsulentMote }

export default function MinVecka() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mandag, setMandag] = useState(() => veckansMandag(idag()))
  const [status, setStatus] = useState<string | null>(null)
  const [kvitto, setKvitto] = useState<string | null>(null)
  const [checkinFel, setCheckinFel] = useState<string | null>(null)
  const [pagar, setPagar] = useState<string | null>(null)
  /** Passet vars frånvaroanmälan är öppen överst (från "Jag kan inte komma" i nästa steg). */
  const [franvaroFor, setFranvaroFor] = useState<string | null>(null)

  const dagens = idag()
  const idagsMandag = veckansMandag(dagens)
  const visarDennaVecka = mandag === idagsMandag

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
  // Nästa steg gäller alltid DEN HÄR veckan, även när hon bläddrar. Samma nyckel
  // som ovan när hon står i innevarande vecka — då är det en och samma fråga.
  const dennaVeckanQuery = useQuery({
    queryKey: minVeckaSessionsKey(idagsMandag),
    queryFn: () => minVeckaApi.listMySessions(idagsMandag, addDays(idagsMandag, 6)),
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
  const dennaVeckansMoten = useQuery({
    queryKey: ['min-vecka', 'moten', idagsMandag],
    queryFn: () => hamtaMoten(idagsMandag, addDays(idagsMandag, 6)),
    enabled: !!planQuery.data,
  })

  // KM9: deltagarens eget jobbsökande ur portalens data — egen redovisning, aldrig kontroll.
  const jobbsokQuery = useQuery({
    queryKey: ['min-vecka', 'jobbsok', mandag],
    queryFn: () => jobbsokAktivitetApi.minaJobbsok(mandag),
    enabled: !!planQuery.data,
  })

  // NY6: utan plan skiljer vi på "ingen konsulent" och "konsulent men ingen plan".
  // Bara läsning. Ett fel ger den neutrala texten, inte ett påstående åt något håll.
  // Omtaget: namnet behövs också i "Nästa möte", så frågan körs alltid (delad cache med VadForvantas).
  const saknarPlan = planQuery.isSuccess && !planQuery.data
  const konsulentQuery = useQuery({
    queryKey: ['min-vecka', 'min-konsulent'],
    queryFn: () => konsulentMeddelandeApi.minKonsulent(),
    enabled: planQuery.isSuccess,
    staleTime: 60_000,
  })

  // Beslut 2026-10-11: ett oläst meddelande från konsulenten är nästa steg. Hämtas om
  // varje gång sidan visas (staleTime 0) — Min konsulent markerar läst. Vid fel räknas
  // inget: passet i dag ska aldrig skymmas av en räknefråga som gick fel.
  const olastaQuery = useQuery({
    queryKey: MIN_VECKA_OLASTA_KEY,
    queryFn: () => konsulentMeddelandeApi.antalOlasta(),
    staleTime: 0,
  })

  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'sv-SE'
  // "15,9 h" på svenska, inte "15.9 h"
  const tal = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 })

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

  // Det enda som står överst: samma regler som "Vad förväntas" alltid haft.
  const steg = useMemo(
    () =>
      nuSteg({
        pass: (dennaVeckanQuery.data ?? []) as PassMedAnmalan[],
        // Ett fel på mötena gör inte passet i dag osynligt — då räknas bara passen.
        moten: dennaVeckansMoten.data ?? [],
        idag: dagens,
        nuTid: nuKlockslag(),
        olasta: olastaQuery.data ?? 0,
      }),
    [dennaVeckanQuery.data, dennaVeckansMoten.data, dagens, olastaQuery.data],
  )
  const iFokus = steg.typ === 'passIdag' ? steg.pass.id : null

  const uppdateraPass = (uppd: ActivitySession[]) => {
    const perId = new Map(uppd.map((u) => [u.id, u]))
    for (const nyckel of new Set([mandag, idagsMandag])) {
      queryClient.setQueryData<ActivitySession[]>(minVeckaSessionsKey(nyckel), (gamla) =>
        gamla ? gamla.map((x) => perId.get(x.id) ?? x) : gamla,
      )
    }
  }

  const handleCheckin = async (session: ActivitySession) => {
    setPagar(session.id)
    setCheckinFel(null)
    setKvitto(null)
    try {
      await minVeckaApi.checkin(session.id)
      await queryClient.invalidateQueries({ queryKey: minVeckaSessionsKey(session.date >= idagsMandag && session.date <= addDays(idagsMandag, 6) ? idagsMandag : mandag) })
      await queryClient.invalidateQueries({ queryKey: minVeckaSessionsKey(mandag) })
      const tack = t('minVecka.incheckadStatus', 'Tack, du är incheckad.')
      setStatus(tack)
      setKvitto(tack)
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
  const kortdatum = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' }).replace('.', '')

  const efterFlera = (uppdaterade: ActivitySession[]) => {
    uppdateraPass(uppdaterade)
    // En period kan gå in i nästa vecka — de veckorna hämtas om när hon bläddrar dit.
    void queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] === 'min-vecka' && q.queryKey[1] === 'sessions' && q.queryKey[2] !== mandag && q.queryKey[2] !== idagsMandag,
    })
    setStatus(t('minVecka.franvaro.statusFlera', {
      defaultValue: 'Anmält för {{count}} pass. Din konsulent har fått besked.',
      count: uppdaterade.length,
    }))
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
    const utanKonsulent = saknarPlan && konsulentQuery.isSuccess && konsulentQuery.data === null
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
        <div className="mx-auto mt-4 max-w-md text-center text-[0.9375rem] text-j-blak-2" data-testid="ingenplan-medan-du-vantar">
          <p className="font-semibold text-j-blak">{t('minVecka.ingenPlan.medanTitel', 'Medan du väntar')}</p>
          <p className="mt-1">
            {t('minVecka.ingenPlan.medanText', 'Du kan läsa om aktivitetskravet, till exempel vad som gäller och vad du kan göra om du inte kan komma till ett pass. Du kan också fylla i ditt CV eller titta på jobb.')}
          </p>
          <p className="mt-2">
            <a
              href="/guider/aktivitetskrav-forsorjningsstod/"
              className="inline-flex min-h-[44px] items-center font-semibold text-j-gran-text underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--j-fokus)]"
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
    const veckansMoten = moten.map((m) => ({ id: m.id, tid: motesStart(m), datum: motesDatum(m) }))

    // Remsan: måndag–fredag i den visade veckan.
    const remsa: VeckoremsaDag[] = [0, 1, 2, 3, 4].map((n) => {
      const datum = addDays(mandag, n)
      const dagensPass = sessions.filter((s) => s.date === datum)
      const anmalda = dagensPass.filter((s) => !s.attendance && franvaroAv(s)).length
      const detaljer = [
        ...dagensPass.map((s) => s.title),
        ...(anmalda > 0 ? [t('minVecka.remsa.anmald', 'Du har anmält frånvaro')] : []),
      ]
      return { datum, status: dagensStatus(dagensPass), detalj: detaljer.join(', ') || undefined }
    })

    const franvaroPass = franvaroFor ? (dennaVeckanQuery.data ?? []).find((s) => s.id === franvaroFor) ?? null : null

    innehall = (
      <div className="max-w-2xl space-y-6 text-j-blak">
        {/* 1. Nästa steg — eller frånvaroanmälan på samma plats */}
        {franvaroPass ? (
          <div className="space-y-3" data-testid="franvaro-overst">
            <FranvaroAnmalan
              session={franvaroPass}
              startaOppen
              onAvbryt={() => setFranvaroFor(null)}
              motenSammaDag={(dennaVeckansMoten.data ?? []).map((m) => ({ id: m.id, tid: motesStart(m), datum: motesDatum(m) }))}
              passSammaDag={(dennaVeckanQuery.data ?? []).filter((x) => x.date === franvaroPass.date)}
              datumText={rubrikdatum(franvaroPass.date)}
              regelverk={regelverk}
              onSaved={(uppd) => {
                uppdateraPass([uppd])
                setStatus(t('minVecka.franvaro.status', 'Din konsulent har fått besked.'))
              }}
              onSavedFlera={efterFlera}
            />
            {franvaroAv(franvaroPass) && (
              <Button ton="kvarter" variant="secondary" onClick={() => setFranvaroFor(null)}
                leftIcon={<KvarterIkon namn="tillbaka" size={20} />}>
                {t('minVecka.nasta.tillbaka', 'Tillbaka till veckan')}
              </Button>
            )}
          </div>
        ) : (
          (dennaVeckanQuery.isSuccess) && (
            <NastaPass
              steg={steg}
              konsulentNamn={konsulentQuery.data?.namn ?? null}
              dagText={rubrikdatum}
              pagar={pagar}
              onCheckin={handleCheckin}
              onKanInte={(p) => setFranvaroFor(p.id)}
            />
          )
        )}

        <div role="status" aria-live="polite" className="sr-only">{status ?? ''}</div>
        {kvitto && !franvaroPass && (
          <p className="m-0" data-testid="incheckad-kvitto"><StatusChip status="narvarande">{kvitto}</StatusChip></p>
        )}
        {checkinFel && <p role="alert" className="m-0 font-semibold text-s-ogiltig">{checkinFel}</p>}

        {/* 2. Veckan */}
        <section aria-labelledby="min-vecka-remsa" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => setMandag(addDays(mandag, -7))} aria-label={t('minVecka.forraVeckan', 'Förra veckan')}
              className="!px-2.5">
              <KvarterIkon namn="tillbaka" size={22} />
            </Button>
            <h2 id="min-vecka-remsa" className="m-0 text-center font-rubrik text-lg font-bold leading-tight">
              {visarDennaVecka
                ? t('minVecka.remsa.dennaVecka', 'Den här veckan')
                : t('minVecka.remsa.veckaNr', { defaultValue: 'Vecka {{nr}}', nr: veckonummer(mandag) })}
              <span className="block text-[0.9375rem] font-normal text-j-blak-2 font-text">
                {kortdatum(mandag)} – {kortdatum(addDays(mandag, 4))}
              </span>
            </h2>
            <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => setMandag(addDays(mandag, 7))} aria-label={t('minVecka.nastaVeckan', 'Nästa vecka')}
              className="!px-2.5">
              <KvarterIkon namn="pil" size={22} />
            </Button>
          </div>
          <Veckoremsa
            storlek="stor"
            // 390 px ger 70 px per dag: "Närvarande" och "Ogiltig frånvaro" får brytas med bindestreck.
            className="gap-1 [&>li]:min-w-0 [&>li]:px-0.5 [&>li]:hyphens-auto [&>li]:[overflow-wrap:anywhere]"
            dagar={remsa}
            idag={dagens}
            // KSL21: hos en Rusta och matcha-leverantör är frånvaron fakta, inte giltig/ogiltig.
            statusOrd={regelverk === 'leverantor'
              ? {
                  giltig: t('minVecka.remsa.franvaroAnmald', 'Frånvaro, anmäld i förväg'),
                  ogiltig: t('minVecka.remsa.franvaro', 'Frånvaro'),
                }
              : undefined}
            rubrik={t('minVecka.remsa.rubrik', 'Dina dagar, måndag till fredag')}
          />
          {!visarDennaVecka && (
            <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => setMandag(idagsMandag)}>
              {t('minVecka.remsa.tillbakaIdag', 'Till den här veckan')}
            </Button>
          )}

          <div className="space-y-1">
            <p className="m-0 text-base leading-6">
              {ampel === 'inga_pass'
                ? t('minVecka.saldo.ingaPass', 'Inget inplanerat den här veckan.')
                : saldo.planeradeTimmar > anvisatMal + 0.05
                  // Skav (rollspelet 2026-09-27): "11 av 8 timmar" läser som en del av
                  // en helhet. Över målet sägs det rakt ut i stället.
                  ? t('minVecka.saldo.radOver', {
                      defaultValue: 'Du har {{planerade}} timmar i anvisade pass den här veckan, mer än målet på {{mal}}.',
                      planerade: tal(saldo.planeradeTimmar),
                      mal: anvisatMal,
                      count: saldo.planeradeTimmar,
                    })
                  // Slipningen 2026-10-11 (R&M A11): "1 av 1 timme" lästes som klart fast
                  // deltagaren var frånvarande. Talet är inbokat, inte genomfört — och närvaron
                  // står på en egen rad när något pass är markerat.
                  : t('minVecka.saldo.radAnvisat', {
                    defaultValue: 'Du har {{planerade}} h inbokade i anvisade pass den här veckan. Målet är {{mal}} timmar.',
                    planerade: tal(saldo.planeradeTimmar),
                    mal: anvisatMal,
                    // RD24: pluralformen följer målet — "1 av 1 timme", inte "1 timmar".
                    count: anvisatMal,
                  })}
            </p>
            {ampel !== 'inga_pass' && saldo.antalPass > saldo.antalOmarkerade && (
              <p className="m-0 text-[0.9375rem] text-j-blak-2" data-testid="narvaro-hittills">
                {t('minVecka.saldo.narvaroHittills', { defaultValue: 'Närvaro hittills: {{narvaro}} h.', narvaro: tal(saldo.narvaroTimmar) })}
              </p>
            )}
            {ampel !== 'inga_pass' && (
              // Förslaget: "Förklara en gång, sedan tyst". Talet syns; hur det
              // räknas ligger ett klick bort. Texten är kvar i DOM:en (RD12/PG7 håller).
              <LasMer etikett={t('minVecka.saldo.lasMer', 'Så räknas timmarna')}>
                <p>
                  {egetJobbsok > 0
                    ? t('minVecka.saldo.vadRaknasJobbsok', {
                        defaultValue: 'Här räknas bara pass som din konsulent har planerat. Eget jobbsökande räknas för sig: {{count}} timmar i veckan enligt planen.',
                        count: egetJobbsok,
                      })
                    : t('minVecka.saldo.vadRaknas', 'Här räknas bara pass som din konsulent har planerat.')}
                </p>
                {/* PG7 (2026-09-12): talen är planens eget mål (satt av konsulenten,
                    lagens tak 40 h) och passens timmar — aldrig något framräknat. */}
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
                    <a href="/guider/aktivitetskrav-forsorjningsstod/" className="underline underline-offset-2 text-j-gran-text">
                      {t('minVecka.forklaring.guide', 'Läs om aktivitetskravet och vad som gäller för dig')}
                    </a>
                  </p>
                )}
                {regelverk === 'leverantor' && (
                  <p>
                    <a href="/guider/rusta-och-matcha/" className="underline underline-offset-2 text-j-gran-text">
                      {t('minVecka.forklaring.guideLeverantor')}
                    </a>
                  </p>
                )}
              </LasMer>
            )}
          </div>
        </section>

        {/* 3. Vad förväntas — vänta in regelverket: texten skiljer kommun och Rusta och matcha. */}
        {!regelverkQuery.isPending && (
          <VadForvantas regelverk={regelverk} jobbsokTimmar={egetJobbsok} passTimmar={anvisatMal} />
        )}

        {/* 4. Passen dag för dag */}
        <section aria-labelledby="min-vecka-pass" className="space-y-3" data-testid="veckans-pass">
          <h2 id="min-vecka-pass" className="m-0 px-1 font-rubrik text-lg font-bold">
            {t('minVecka.passRubrik', 'Dina pass')}
          </h2>
          {motenQuery.isError && (
            <p className="m-0 text-[0.9375rem] text-j-blak-2">
              {t('minVecka.mote.hamtFel', 'Dina möten med konsulenten kunde inte hämtas just nu. Du ser dem på sidan Min konsulent.')}
            </p>
          )}
          {perDag.length === 0 ? (
            <p className="m-0 rounded-j-m border border-dashed border-j-linje-2 p-4 text-j-blak-2">
              {/* PG-skav (persona 2026-09-12): en tom vecka sa samma sak oavsett
                  orsak. Den enda skillnad vi ÄRLIGT kan läsa ur datan är om veckan
                  ligger FÖRE dagens vecka eller efter — pass genereras framåt i
                  tiden, aldrig bakåt. */}
              {mandag > veckansMandag(dagens)
                ? t('minVecka.tomVecka.framtid', 'Inga pass inplanerade än den här veckan — din konsulent lägger till fler pass efter hand.')
                : t('minVecka.tomVecka.ledig', 'Inga pass den här veckan. En ledig vecka enligt planen — hör av dig till din konsulent om du är osäker.')}
            </p>
          ) : (
            perDag.map(([dag, poster]) => (
              <section key={dag} aria-labelledby={`dag-${dag}`} className="space-y-1.5">
                <h3 id={`dag-${dag}`} className="m-0 px-1 text-base font-semibold text-j-blak first-letter:uppercase">
                  {rubrikdatum(dag)}{dag === dagens ? ` · ${t('minVecka.idag', 'i dag')}` : ''}
                </h3>
                <ul className="m-0 list-none divide-y divide-j-linje overflow-hidden rounded-j-m border border-j-linje bg-j-kort p-0">
                  {poster.map((post) =>
                    post.slag === 'mote' ? (
                      <MoteKort
                        key={`mote-${post.mote.id}`}
                        mote={post.mote}
                        datumText={rubrikdatum(dag)}
                        passerat={new Date(post.mote.scheduled_at).getTime() < Date.now()}
                        onStatus={setStatus}
                      />
                    ) : (
                      <PassRad
                        key={post.pass.id}
                        pass={post.pass}
                        idag={dagens}
                        locale={locale}
                        datumText={rubrikdatum(dag)}
                        iFokus={post.pass.id === iFokus && !franvaroPass}
                        pagar={pagar}
                        // RD27: veckans alla möten med datum — en anmälan av flera dagar frågar om dem också
                        motenSammaDag={veckansMoten}
                        passSammaDag={sessions.filter((x) => x.date === post.pass.date)}
                        regelverk={regelverk}
                        onCheckin={handleCheckin}
                        onKalender={handleKalender}
                        onUppdaterat={(uppd) => {
                          uppdateraPass([uppd])
                          setStatus(t('minVecka.franvaro.status', 'Din konsulent har fått besked.'))
                        }}
                        onUppdateradeFlera={efterFlera}
                        onForklarat={(uppd) => {
                          uppdateraPass([uppd])
                          setStatus(t('minVecka.forklara.status', 'Din förklaring är skickad till din konsulent.'))
                        }}
                        onFragat={(namn) => setStatus(t('minVecka.fraga.skickat', { defaultValue: 'Skickat till {{namn}}.', namn }))}
                      />
                    ),
                  )}
                </ul>
              </section>
            ))
          )}
        </section>

        {/* 5. Mer om din vecka — ett klick bort */}
        <MerLista rubrik={t('minVecka.mer.rubrik', 'Mer om din vecka')} rubrikId="min-vecka-mer">
          <MerRad ikon="plan" rubrik={t('minVecka.plan.rubrik', 'Din plan')} text={t('minVecka.mer.planText', 'Var du är, vem som har bestämt och vad som räknas.')}>
            <MinPlan regelverk={regelverk} orgNamn={orgNamn} />
          </MerRad>
          <MerRad ikon="jobb" rubrik={t('minVecka.jobbsok.rubrik', 'Ditt jobbsökande den här veckan')} text={t('minVecka.mer.jobbsokText', 'Det du har gjort i Jobin, som din egen översikt.')}>
            {jobbsokQuery.isLoading || (!jobbsokQuery.data && !jobbsokQuery.isError) ? (
              <p className="m-0 text-[0.9375rem] text-j-blak-3">…</p>
            ) : jobbsokQuery.isError ? (
              <p className="m-0 text-[0.9375rem] text-j-blak-2">{t('minVecka.jobbsok.fel', 'Ditt jobbsökande kunde inte hämtas just nu.')}</p>
            ) : !harNagot(jobbsokQuery.data) ? (
              <p className="m-0 text-[0.9375rem] text-j-blak-2">
                {t('minVecka.jobbsok.tomt', 'Inget registrerat än den här veckan. Det syns här när du sparar ett jobb eller skickar en ansökan.')}
              </p>
            ) : (
              <p className="m-0 text-base text-j-blak">
                {[
                  jobbsokQuery.data.sparadeJobb > 0 && t('minVecka.jobbsok.sparade', { count: jobbsokQuery.data.sparadeJobb, defaultValue: '{{count}} jobb sparade' }),
                  jobbsokQuery.data.ansokningar > 0 && t('minVecka.jobbsok.ansokningar', { count: jobbsokQuery.data.ansokningar, defaultValue: '{{count}} ansökningar skickade' }),
                  jobbsokQuery.data.cvUppdaterad && t('minVecka.jobbsok.cv', 'CV uppdaterat'),
                  jobbsokQuery.data.brev > 0 && t('minVecka.jobbsok.brev', { count: jobbsokQuery.data.brev, defaultValue: '{{count}} personliga brev' }),
                  jobbsokQuery.data.intervjutraningar > 0 && t('minVecka.jobbsok.intervju', { count: jobbsokQuery.data.intervjutraningar, defaultValue: '{{count}} intervjuövningar' }),
                ].filter(Boolean).join(' · ')}
              </p>
            )}
            <p className="m-0 mt-2 text-[0.9375rem] text-j-blak-2">
              {t('minVecka.jobbsok.egenRedovisning', 'Det här är din egen översikt. Din konsulent ser bara sparade jobb och ansökningar.')}
            </p>
          </MerRad>
          {/* F5: deltagarens eget närvarointyg — kvitto till handläggaren, utan omväg via konsulenten */}
          <MerRad ikon="underlag" rubrik={t('minVecka.intyg.rubrik', 'Närvarointyg')} text={t('minVecka.mer.intygText', 'Ladda ner ett intyg för en månad.')}>
            <NarvaroIntyg plan={plan} regelverk={regelverk} />
          </MerRad>
        </MerLista>
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
