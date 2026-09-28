/**
 * AvtalskravKort — aktivitetsloggen mot avtalskravet (RM4).
 *
 * Rusta och matcha, FFU §4.1.1: minst 1 timme aktivitet per vecka månad 1–6
 * och 2 timmar per vecka månad 7–12, räknat från planens start. Minst 50 %
 * av aktiviteterna fysiska, per deltagare, i den periodiska rapporten.
 * Räkningen bor i `services/aktivitetslogg.ts`; kortet väljer månad, hämtar
 * planer och pass, och visar en rad per plan som var aktiv i månaden.
 *
 * Bara avslutade veckor bedöms — en påbörjad vecka kan inte ha uppfyllt
 * något, och en vecka är avslutad först när söndagen passerat (RR22).
 * Eget jobbsökande räknas inte som aktivitet (RR1) — regeln står på kortet.
 * Ett värde utan underlag visar — och en rad om varför, aldrig 0.
 *
 * Kravet gäller leverantörer i Rusta och matcha. För kommunens
 * aktivitetskrav (KM-spåret) är måttet veckomålet i planen, inte det här.
 *
 * RR24 (rollspelet 2026-09-27): "Underlag för rapporten" (RR8) är MSFA-vyn —
 * samma ordning som Mina sidor för fristående aktörer, kopiering per fält,
 * AF:s ärende-id överst (RK40) och markeringen "förd över" per plan och
 * månad (PENDING_20260927d_resultat_och_msfa).
 * RR27: fysisk/digital räknas på passets märkning när den finns; raden säger
 * hur många pass som fortfarande bygger på härledningen.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ClipboardList } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { aktivitetsplanApi, type ActivityPlan, type ActivitySession } from '@/services/aktivitetApi'
import { avtalskravPerDeltagare, manadGranser, periodiskaFalt, senasteAvslutadeSondag, veckogranser, type Avtalskrav, type MoteIPeriod, type Period } from '@/services/aktivitetslogg'
import { hamtaMotenIPeriod } from '@/services/moteskadens'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { fetchCachedConsultantParticipants } from '@/pages/consultant/consultantParticipantsQuery'
import { langtDatum, kortDatum } from './aktivitetEtiketter'
import { ARENDE_ETIKETT, PLAN_PASS_KOLUMNER_FINNS, planensArende } from '@/services/planMarkning'
import { RESULTAT_MSFA_FINNS, msfaApi, type MsfaOverforing } from '@/services/resultatklocka'
import { useAuthStore } from '@/stores/authStore'
import { deltagarEtikett } from './rapportOmfang'
import { useRapportOmfang } from './useRapportOmfang'
import { OmfangRad } from './OmfangRad'

type Lage =
  | { status: 'laddar' }
  | { status: 'fel'; nyckel: string; fel: string }
  | { status: 'klart'; nyckel: string; plans: ActivityPlan[]; sessions: ActivitySession[]; namn: Map<string, string>; moten: MoteIPeriod[] | null; overforda: MsfaOverforing[] | null }

const MANAD_NAMN = ['', 'januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

function manadEtikett(ym: string): string {
  const [ar, manad] = ym.split('-').map(Number)
  return `${MANAD_NAMN[manad]} ${ar}`
}

/** Innevarande månad och de tolv före, nyast först. */
function manadAlternativ(idag: Date): { value: string; label: string }[] {
  const ut: { value: string; label: string }[] = []
  for (let i = 0; i < 13; i++) {
    const d = new Date(idag.getFullYear(), idag.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    ut.push({ value, label: manadEtikett(value) })
  }
  return ut
}

function procent(andel: number): string {
  return `${Math.round(andel * 100)} %`
}

export function AvtalskravKort() {
  const queryClient = useQueryClient()
  const { omfang, orgNamn, kollegor } = useRapportOmfang()
  const [hamtat, setHamtat] = useState<Lage>({ status: 'laddar' })
  const [omgang, setOmgang] = useState(0)
  const alternativ = useMemo(() => manadAlternativ(new Date()), [])
  const [val, setVal] = useState(() => alternativ[0].value)

  const idag = formatLocalDate(new Date())
  const { period, harAvslutadVecka, hamtning } = useMemo(() => {
    const granser = manadGranser(val)
    // Bara avslutade veckor: klipp vid senaste söndag som redan passerat.
    const sistaSondag = senasteAvslutadeSondag(idag)
    const p = { from: granser.from, to: granser.to < sistaSondag ? granser.to : sistaSondag }
    return { period: p, harAvslutadVecka: p.from <= p.to, hamtning: veckogranser(granser) }
  }, [val, idag])

  // Ny månad = nytt underlag. Svaret bär sin nyckel, så förra månadens rader
  // visas aldrig medan nästa hämtas — utan att effekten sätter state själv.
  const nyckel = `${val}:${hamtning.from}:${hamtning.to}:${omgang}`
  const lage = useMemo<Lage>(
    () => (hamtat.status !== 'laddar' && hamtat.nyckel !== nyckel ? { status: 'laddar' } : hamtat),
    [hamtat, nyckel],
  )

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const [plans, sessions, deltagare, moten, overforda] = await Promise.all([
          aktivitetsplanApi.listAll(),
          aktivitetsplanApi.listSessionsBetween(hamtning.from, hamtning.to),
          fetchCachedConsultantParticipants(queryClient).catch(() => []),
          // RR8: mötena behövs bara till rapportunderlaget — ett fel här fäller
          // inte tabellen, underlaget säger i stället att mötena saknas.
          hamtaMotenIPeriod(hamtning.from, hamtning.to).catch(() => null),
          // RR24: markeringarna "förd över" — ett fel fäller inte tabellen.
          msfaApi.listForManad(val).catch(() => null),
        ])
        if (!aktiv) return
        const namn = new Map<string, string>()
        for (const d of deltagare) {
          namn.set(d.participant_id, `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim())
        }
        setHamtat({ status: 'klart', nyckel, plans, sessions, namn, moten, overforda })
      } catch (err) {
        if (aktiv) setHamtat({ status: 'fel', nyckel, fel: err instanceof Error ? err.message : 'Aktivitetsloggen kunde inte hämtas.' })
      }
    })()
    return () => { aktiv = false }
  }, [val, hamtning.from, hamtning.to, omgang, nyckel, queryClient])

  const sattOverforda = (f: (o: MsfaOverforing[]) => MsfaOverforing[]) =>
    setHamtat((prev) => (prev.status === 'klart' && prev.overforda ? { ...prev, overforda: f(prev.overforda) } : prev))

  const rader = useMemo(() => {
    if (lage.status !== 'klart' || !harAvslutadVecka) return []
    return lage.plans
      .map((p) => ({ plan: p, krav: avtalskravPerDeltagare(p, lage.sessions, period) }))
      .filter((r) => r.krav.veckorTotalt > 0)
      .map((r) => ({ ...r, namn: deltagarEtikett(r.plan, lage.namn, kollegor) }))
      .sort((a, b) => a.namn.localeCompare(b.namn, 'sv') || a.plan.start_date.localeCompare(b.plan.start_date))
  }, [lage, period, harAvslutadVecka, kollegor])

  // RR8: en deltagares rapportunderlag åt gången, utfällt under raden.
  const [oppenPlan, setOppenPlan] = useState<string | null>(null)

  const flerPlanerForSamma = useMemo(() => {
    const antal = new Map<string, number>()
    for (const r of rader) antal.set(r.plan.participant_id, (antal.get(r.plan.participant_id) ?? 0) + 1)
    return antal
  }, [rader])

  return (
    // RR12: scroll-mt så att en hopp-länk hit inte hamnar under det klibbiga toppfältet på mobil.
    <Card className="p-5 space-y-5 scroll-mt-28" id="avtalskrav">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Aktivitetsloggen mot avtalskravet</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Rusta och matcha, FFU §4.1.1: timkravet per vecka och andelen fysiska aktiviteter, per deltagare.
          </p>
          <OmfangRad omfang={omfang} orgNamn={orgNamn} />
        </div>
        <ClipboardList className="w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <Select
          id="avtalskrav-manad"
          label="Månad"
          options={alternativ}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <p className="text-sm text-stone-500 dark:text-stone-400 sm:col-span-3">
          {harAvslutadVecka
            ? <>Avslutade veckor {langtDatum(period.from)} – {langtDatum(period.to)}</>
            : <>Ingen vecka i {manadEtikett(val)} är avslutad än.</>}
        </p>
      </div>

      {lage.status === 'laddar' && <LoadingState message="Räknar aktivitetsloggen…" size="sm" />}
      {lage.status === 'fel' && (
        <ErrorState title="Aktivitetsloggen kunde inte hämtas" message={lage.fel} onRetry={() => setOmgang((n) => n + 1)} />
      )}

      {lage.status === 'klart' && (
        <>
          {rader.length === 0 ? (
            <p className="text-sm text-stone-600 dark:text-stone-300" role="status">
              {harAvslutadVecka
                ? <>Ingen plan var aktiv i en avslutad vecka i {manadEtikett(val)} — underlaget visar <span aria-hidden="true">—</span><span className="sr-only">inget värde</span>.</>
                : <>Bedömningen görs när första veckan i månaden är slut.</>}
            </p>
          ) : (
            // RR12 (rollspelet 2026-09-27): tabellen var 602 px bred i 316 px och
            // scrollade i sidled utan ledtråd — "Andel fysiska" syntes inte. Under
            // sm staplas varje rad som ett kort med etiketten framför värdet.
            <div className="sm:overflow-x-auto">
              <table className="w-full text-sm block sm:table">
                <thead className="hidden sm:table-header-group">
                  <tr className="text-left text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700">
                    <th className="py-2 pr-3 font-medium">Deltagare</th>
                    <th className="py-2 px-3 font-medium text-right">Veckor med uppfyllt timkrav</th>
                    <th className="py-2 px-3 font-medium text-right">Andel fysiska</th>
                    <th className="py-2 px-3 font-medium">Krav just nu</th>
                    <th className="py-2 pl-3 font-medium"><span className="sr-only">Rapportunderlag</span></th>
                  </tr>
                </thead>
                <tbody className="block sm:table-row-group">
                  {rader.map(({ plan, krav, namn }) => (
                    <AvtalskravRad
                      key={plan.id}
                      namn={namn}
                      plan={plan}
                      krav={krav}
                      visaPlanstart={(flerPlanerForSamma.get(plan.participant_id) ?? 0) > 1}
                      overford={lage.overforda?.find((o) => o.plan_id === plan.id) ?? null}
                      oppen={oppenPlan === plan.id}
                      onVaxla={() => setOppenPlan((v) => (v === plan.id ? null : plan.id))}
                      underlag={oppenPlan === plan.id ? (
                        <RapportUnderlag
                          namn={namn}
                          manad={manadEtikett(val)}
                          krav={krav}
                          sessions={lage.sessions}
                          moten={lage.moten}
                          period={period}
                          plan={plan}
                          manadYm={val}
                          overforda={lage.overforda}
                          onOverford={(o) => sattOverforda((lista) => [...lista.filter((x) => x.id !== o.id), o])}
                          onAngrad={(id) => sattOverforda((lista) => lista.filter((x) => x.id !== id))}
                        />
                      ) : null}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-prose">
            Närvarotid är pass markerade närvarande eller extern aktivitet. <strong>Eget jobbsökande räknas inte</strong> — varken mot
            timkravet eller i andelen fysiska — eftersom avtalet räknar aktiviteter som leverantören håller i. En vecka bedöms först
            när den är slut (efter söndagen). {PLAN_PASS_KOLUMNER_FINNS
              ? <>Fysiskt och leverantörsledd = passets märkning. Pass utan märkning (lagda före märkningen fanns) räknas på
                härledningen — arbetsplats eller ifyllt platsfält är fysiskt — och antalet står som "härledda" på raden.</>
              : <>Fysiskt = aktivitetstypen arbetsplats eller ett ifyllt platsfält — passen har ingen egen märkning för
                fysiskt/digitalt än.</>} Kravet gäller Rusta och matcha-avtalet; kommunens aktivitetskrav mäts mot planens veckomål.
          </p>

          {/* GG4 (2026-09-20): sammanställningen ovan är ett underlag, inte den
              periodiska rapporten. FFU §5.1.1 kopplar utbetalningen av
              grundersättningen till en godkänd rapport i avtalets format via
              AF:s systemstöd — och det formatet finns inte i portalen (RM6).
              Utan raden kan kortet läsas som "det här räcker", och den
              felläsningen kostar pengar, inte bara tid. */}
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-300 max-w-prose">
            <strong>Detta är ett underlag, inte den periodiska rapporten.</strong> Grundersättningen betalas enligt
            FFU §5.1.1 inte ut utan godkänd periodisk rapport i avtalets format, registrerad i Mina sidor för
            fristående aktörer. Det finns inget öppet leverantörs-API mot Arbetsförmedlingen, så portalen kan
            varken skapa eller skicka den rapporten — siffrorna här för du över för hand.
          </p>
        </>
      )}
    </Card>
  )
}

/** Mobil: cellen blir en rad med etiketten före värdet (data-label). */
const CELL_MOBIL = 'flex justify-between gap-3 py-1 sm:table-cell sm:py-2 before:content-[attr(data-label)] before:text-xs before:text-stone-500 before:font-normal sm:before:content-none'

function AvtalskravRad({ namn, plan, krav, visaPlanstart, overford, oppen, onVaxla, underlag }: {
  namn: string
  plan: ActivityPlan
  krav: Avtalskrav
  visaPlanstart: boolean
  overford: MsfaOverforing | null
  oppen: boolean
  onVaxla: () => void
  underlag: React.ReactNode
}) {
  const allaVeckor = krav.veckorUppfyllda === krav.veckorTotalt
  const underHalften = krav.andelFysiska !== null && krav.andelFysiska < 0.5
  const senasteKrav = krav.veckor[krav.veckor.length - 1]
  const varning = 'text-amber-800 dark:text-amber-300 font-semibold'
  const panelId = `rapportunderlag-${plan.id}`
  return (
    <Fragment>
    <tr className="block sm:table-row border-b border-stone-100 dark:border-stone-800 py-2 sm:py-0">
      <td className="block sm:table-cell py-1 sm:py-2 pr-3 font-medium sm:font-normal text-stone-800 dark:text-stone-100">
        {namn}
        {visaPlanstart && <span className="text-stone-500 dark:text-stone-400"> · plan från {langtDatum(plan.start_date)}</span>}
      </td>
      <td data-label="Veckor med uppfyllt timkrav" className={`${CELL_MOBIL} sm:px-3 text-right tabular-nums ${allaVeckor ? '' : varning}`}>
        {krav.veckorUppfyllda} av {krav.veckorTotalt}
        {!allaVeckor && <span className="sr-only"> — timkravet är inte uppfyllt alla veckor</span>}
      </td>
      <td data-label="Andel fysiska" className={`${CELL_MOBIL} sm:px-3 text-right tabular-nums ${underHalften ? varning : ''}`}>
        {krav.andelFysiska === null ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">inget närvaropass i perioden</span>
          </>
        ) : (
          <>
            {procent(krav.andelFysiska)}
            <span className="text-stone-500 dark:text-stone-400 font-normal"> ({krav.passFysiska} av {krav.passNarvaro} pass)</span>
            {PLAN_PASS_KOLUMNER_FINNS && krav.passHarleddFysisk > 0 && (
              <span className="block text-xs text-stone-500 dark:text-stone-400 font-normal" data-testid="harledda">
                varav {krav.passHarleddFysisk} härledda
              </span>
            )}
            {underHalften && <span className="sr-only"> — under 50 %</span>}
          </>
        )}
      </td>
      <td data-label="Krav just nu" className={`${CELL_MOBIL} sm:px-3 text-stone-600 dark:text-stone-300`}>
        {senasteKrav ? `${senasteKrav.kravTimmar} h/vecka (månad ${senasteKrav.planManad})` : '—'}
      </td>
      <td className="block sm:table-cell py-1 sm:py-2 sm:pl-3 sm:text-right">
        <button
          type="button"
          className="text-sm underline text-stone-700 dark:text-stone-200 whitespace-nowrap"
          aria-expanded={oppen}
          aria-controls={panelId}
          onClick={onVaxla}
        >
          {oppen ? 'Dölj underlag' : 'Underlag för rapporten'}
          <span className="sr-only"> — {namn}</span>
        </button>
        {overford && (
          <span className="block text-xs text-emerald-800 dark:text-emerald-200" data-testid="overford">
            Förd över {kortDatum(new Date(overford.transferred_at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }))}
          </span>
        )}
      </td>
    </tr>
    {oppen && (
      <tr className="block sm:table-row">
        <td colSpan={5} id={panelId} className="block sm:table-cell pb-4">{underlag}</td>
      </tr>
    )}
    </Fragment>
  )
}

/**
 * RR8: fälten till den periodiska rapporten för en deltagare och månad, med en
 * kopieringsknapp per fält. Portalen skickar ingenting till Arbetsförmedlingen.
 */
function RapportUnderlag({ namn, manad, krav, sessions, moten, period, plan, manadYm, overforda, onOverford, onAngrad }: {
  namn: string
  manad: string
  krav: Avtalskrav
  sessions: ActivitySession[]
  moten: MoteIPeriod[] | null
  period: Period
  plan: ActivityPlan
  manadYm: string
  overforda: MsfaOverforing[] | null
  onOverford: (o: MsfaOverforing) => void
  onAngrad: (id: string) => void
}) {
  const [kopierat, setKopierat] = useState<string | null>(null)
  const [kopieringsfel, setKopieringsfel] = useState(false)
  const arende = planensArende(plan)
  // RK40: AF:s ärende-id överst, så raden hittas i Mina sidor utan personnummer.
  const arendeFalt = PLAN_PASS_KOLUMNER_FINNS
    ? [{ id: 'arende', etikett: ARENDE_ETIKETT.leverantor, text: arende ?? '— (inte angivet på planen)' }]
    : []
  const falt = [...arendeFalt, ...periodiskaFalt(krav, sessions, moten ?? [], period).map((f) =>
    f.id === 'moten' && moten === null ? { ...f, text: 'Mötena kunde inte hämtas — fyll i dem för hand eller ladda om sidan.' } : f,
  )]
  const kopiera = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setKopierat(id)
      setKopieringsfel(false)
    } catch {
      setKopieringsfel(true)
    }
  }
  const allt = falt.map((f) => `${f.etikett}:\n${f.text}`).join('\n\n')
  return (
    <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-4 space-y-3" data-testid="rapportunderlag">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Underlag för {namn}, {manad}</p>
        <button type="button" className="text-sm underline text-stone-700 dark:text-stone-200" onClick={() => void kopiera('allt', allt)}>
          {kopierat === 'allt' ? 'Kopierat' : 'Kopiera allt'}
        </button>
      </div>
      <dl className="space-y-3">
        {falt.map((f) => (
          <div key={f.id}>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs font-medium text-stone-600 dark:text-stone-300">{f.etikett}</dt>
              <button
                type="button"
                className="text-xs underline text-stone-600 dark:text-stone-300"
                onClick={() => void kopiera(f.id, f.text)}
                aria-label={`Kopiera ${f.etikett.toLowerCase()}`}
              >
                {kopierat === f.id ? 'Kopierat' : 'Kopiera'}
              </button>
            </div>
            <dd className="text-sm text-stone-800 dark:text-stone-100 whitespace-pre-wrap tabular-nums">{f.text}</dd>
          </div>
        ))}
      </dl>
      {kopieringsfel && (
        <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">Webbläsaren tillät inte kopiering — markera texten och kopiera den för hand.</p>
      )}
      {RESULTAT_MSFA_FINNS && (
        <OverforingRad plan={plan} manadYm={manadYm} overforda={overforda} onOverford={onOverford} onAngrad={onAngrad} />
      )}
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Portalen kan inte skicka något till Arbetsförmedlingen. Kopiera fälten till den periodiska rapporten i Mina sidor
        för fristående aktörer. Bara genomförda möten och avslutade veckor räknas.
      </p>
    </div>
  )
}

/** RR24: "förd över till MSFA" — konsulentens egen markering per plan och månad. */
function OverforingRad({ plan, manadYm, overforda, onOverford, onAngrad }: {
  plan: ActivityPlan
  manadYm: string
  overforda: MsfaOverforing[] | null
  onOverford: (o: MsfaOverforing) => void
  onAngrad: (id: string) => void
}) {
  const egetId = useAuthStore((s) => s.profile?.id ?? null)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  if (overforda === null) {
    return <p className="text-xs text-rose-700 dark:text-rose-300" role="status">Markeringen "förd över" kunde inte hämtas — ladda om sidan.</p>
  }
  const rad = overforda.find((o) => o.plan_id === plan.id)
  const markera = async () => {
    setSparar(true)
    setFel(null)
    try { onOverford(await msfaApi.markera(plan, manadYm)) } catch (err) { setFel(err instanceof Error ? err.message : 'Markeringen kunde inte sparas') } finally { setSparar(false) }
  }
  const angra = async (id: string) => {
    setSparar(true)
    setFel(null)
    try { await msfaApi.angra(id); onAngrad(id) } catch (err) { setFel(err instanceof Error ? err.message : 'Markeringen kunde inte ångras') } finally { setSparar(false) }
  }
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm" data-testid="msfa-overforing">
      {rad ? (
        <>
          <span className="text-emerald-800 dark:text-emerald-200">
            Förd över till MSFA {langtDatum(new Date(rad.transferred_at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }))} av {rad.transferred_by === egetId ? 'dig' : 'en kollega'}
          </span>
          {rad.transferred_by === egetId && (
            <button type="button" className="text-xs underline text-stone-600 dark:text-stone-300" disabled={sparar} onClick={() => void angra(rad.id)}>Ångra</button>
          )}
        </>
      ) : (
        <button type="button" className="underline text-stone-800 dark:text-stone-100 font-medium" disabled={sparar} onClick={() => void markera()}>
          Markera som förd över till MSFA
        </button>
      )}
      {fel && <span role="alert" className="text-xs text-rose-700 dark:text-rose-300">{fel}</span>}
    </div>
  )
}
