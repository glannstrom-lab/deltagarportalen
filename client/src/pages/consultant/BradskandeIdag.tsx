/**
 * BradskandeIdag — nästa steg + en rad per människa i konsulentens Min dag.
 *
 * Omtaget "Kvarter", steg 3 (2026-10-11). Det som tidigare var tre listor —
 * Att göra i dag (RK35/RR26), det brådskande (RR3/RK7) och Kräver
 * uppmärksamhet — är en lista: EN rad per person (PersonRad), med det mest
 * brådskande först och "+N till" efter, och den enda viktigaste saken lyft
 * till ett nästa steg (NastaSteg) överst. Reglerna och ordningen bor i
 * oversiktRegler.ts (minDagPersoner, valjNastaSteg) — här finns bara formen
 * och åtgärderna.
 *
 * Varje punkt har sin åtgärd där den står: skriv raden om frånvaron, ta
 * ställning till en förklaring, bedöm en anmälan, kvittera, markera, boka det
 * fysiska mötet. Åtgärderna går genom samma API som förut (markAttendance,
 * saveAttendanceNote) via OverviewTab.
 *
 * Ärlighet: komponenten ritas bara när datan är hämtad (OverviewTab), och
 * nästa steg visas inte när underlaget inte kunde läsas (`visaNastaSteg`).
 * Konsulentvyn översätts inte (DESIGN.md §2).
 */

import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Attendance } from '@/services/aktivitetSchema'
import type { AttendanceInput } from '@/services/aktivitetApi'
import { NastaSteg, type NastaStegHandling } from '@/components/ui/NastaSteg'
import { PersonRad } from '@/components/ui/PersonRad'
import { NarvaroVal } from '@/components/ui/NarvaroVal'
import { Button } from '@/components/ui/Button'
import { NARVARO_STANDARDVAL } from '@/components/ui/kvarterStatus'
import { gruppLank } from '@/lib/gruppnarvaro'
import {
  passMening,
  radSammanfattning,
  talOrd,
  utanNastaSteg,
  valjNastaSteg,
  type AttGoraPass,
  type MinDagPerson,
  type MinDagPunkt,
  type NastaStegVal,
  type PassAttMarkera,
} from './oversiktRegler'

interface Props {
  personer: readonly MinDagPerson[]
  /** Dagens pass att markera nu (passAttMarkera). */
  pass?: readonly PassAttMarkera[]
  /** Falskt när underlaget inte kunde läsas — då påstås inget nästa steg. */
  visaNastaSteg?: boolean
  nu?: Date
  namnFor: (participantId: string) => string
  onMarkera?: (pass: AttGoraPass, input: AttendanceInput) => Promise<void>
  onSparaAnteckning?: (pass: AttGoraPass, anteckning: string) => Promise<void>
  /** Öppnar mötesdialogen på deltagaren; `fysiskt` förväljer ett fysiskt möte (RR26). */
  onBokaMote?: (participantId: string, fysiskt: boolean) => void
  onLoggaKontakt?: (participantId: string) => Promise<void>
}

type Kor = (fn: () => Promise<void>) => Promise<void>

function useKor() {
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const kor: Kor = async (fn) => {
    setSparar(true)
    setFel(null)
    try {
      await fn()
    } catch (e) {
      setFel(e instanceof Error ? e.message : 'Det gick inte att spara. Försök igen.')
    } finally {
      setSparar(false)
    }
  }
  return { sparar, fel, kor }
}

const fornamn = (namn: string) => namn.trim().split(/\s+/)[0] || namn
/** Svensk genitiv: "Leilas", men "Jonas" (slutar redan på s, x eller z). */
const genitiv = (namn: string) => (/[sxz]$/i.test(namn) ? namn : `${namn}s`)
const forstaLiten = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** Det en punkt gör, oberoende av var den ritas (nästa steg eller raden). */
interface Atgard {
  /** Kräver ett val eller en text innan något sparas → fälls ut i raden. */
  kontroll: 'anteckning' | 'narvaro' | 'val' | null
  primar: NastaStegHandling
  sekundar?: NastaStegHandling
  /** Text eller "Öppna" (tertiär) i stället för ramad knapp i raden. */
  tertiar?: boolean
}

function useAtgarder(props: Props) {
  const navigate = useNavigate()
  const oppna = (pid: string) => navigate(`/consultant/participants/${pid}`)

  return (punkt: MinDagPunkt, kor: Kor, anteckning: string): Atgard => {
    const pid = punkt.participantId
    const pass = punkt.pass
    // Anteckningen och intygsstatusen följer med vid en ommarkering — markAttendance skriver över dem annars.
    const markera = (attendance: Attendance, extra: Partial<AttendanceInput> = {}) => () => {
      if (!pass || !props.onMarkera) return
      void kor(() => props.onMarkera!(pass, {
        attendance,
        note: pass.attendance_note ?? null,
        sickCertificateReceived: attendance === 'sick_certified' ? !!pass.sick_certificate_received : false,
        ...extra,
      }))
    }
    switch (punkt.typ) {
      case 'franvaro_utan_anteckning':
        return {
          kontroll: 'anteckning',
          primar: {
            etikett: 'Spara raden',
            disabled: !anteckning.trim(),
            onClick: () => {
              if (pass && props.onSparaAnteckning && anteckning.trim()) void kor(() => props.onSparaAnteckning!(pass, anteckning.trim()))
            },
          },
        }
      case 'forklaring':
        return pass?.attendance === 'absent_invalid'
          ? { kontroll: 'val', primar: { etikett: 'Godta, ändra till giltig', onClick: markera('absent_valid') }, sekundar: { etikett: 'Behåll ogiltig', onClick: markera('absent_invalid') } }
          : { kontroll: 'val', primar: { etikett: 'Behåll giltig', onClick: markera('absent_valid') } }
      case 'anmald_franvaro':
        return { kontroll: 'val', primar: { etikett: 'Giltig frånvaro', onClick: markera('absent_valid') }, sekundar: { etikett: 'Ogiltig frånvaro', onClick: markera('absent_invalid') } }
      case 'sjuk_utan_intyg':
        return { kontroll: null, primar: { etikett: 'Intyget har kommit', onClick: markera('sick_certified', { sickCertificateReceived: true }) } }
      case 'kvittera':
        return { kontroll: null, primar: { etikett: 'Kvittera', onClick: markera('present') } }
      case 'omarkerat':
        return {
          kontroll: 'narvaro',
          primar: { etikett: 'Markera hela passet', onClick: () => pass && navigate(gruppLank({ date: pass.date, start_time: pass.start_time.slice(0, 5), end_time: pass.end_time.slice(0, 5), title: pass.title })) },
        }
      case 'mote_over_gransen':
        return { kontroll: null, primar: { etikett: 'Boka möte', onClick: () => props.onBokaMote?.(pid, false) } }
      case 'utan_fysiskt':
        return { kontroll: null, primar: { etikett: 'Boka fysiskt möte', onClick: () => props.onBokaMote?.(pid, true) } }
      case 'under_timkravet':
        return { kontroll: null, primar: { etikett: 'Se aktivitetsloggen', onClick: () => navigate('/consultant/analytics#avtalskrav') } }
      case 'uppfoljning':
        return { kontroll: null, primar: { etikett: 'Registrera uppföljningen', onClick: () => oppna(pid) } }
      case 'mote_idag':
        return punkt.mote?.meetingLink
          ? { kontroll: null, primar: { etikett: 'Anslut till mötet', onClick: () => window.open(punkt.mote!.meetingLink!, '_blank', 'noopener,noreferrer') } }
          : { kontroll: null, primar: { etikett: 'Öppna', onClick: () => oppna(pid) }, tertiar: true }
      case 'kontakt':
        return props.onLoggaKontakt
          ? { kontroll: null, primar: { etikett: 'Logga kontakt', onClick: () => void kor(() => props.onLoggaKontakt!(pid)) } }
          : { kontroll: null, primar: { etikett: 'Öppna', onClick: () => oppna(pid) }, tertiar: true }
      case 'franvaro':
      case 'deadline':
        return { kontroll: null, primar: { etikett: 'Öppna', onClick: () => oppna(pid) }, tertiar: true }
    }
  }
}

/** Rubriken i nästa steg, per sort. Namnet bär meningen. */
function nastaRubrik(punkt: MinDagPunkt, namn: string): { rubrik: string; text?: string; tid?: string } {
  const f = fornamn(namn)
  switch (punkt.typ) {
    case 'franvaro_utan_anteckning':
      return { rubrik: `Skriv en rad om ${genitiv(f)} frånvaro`, text: `${namn} ${forstaLiten(punkt.lage)}. En rad räcker, den följer med till underlaget.` }
    case 'forklaring':
      return { rubrik: `Ta ställning till ${genitiv(f)} förklaring`, text: punkt.detalj }
    case 'anmald_franvaro':
      return { rubrik: `Bedöm ${genitiv(f)} anmälda frånvaro`, text: `${punkt.lage}. ${punkt.detalj ?? ''}`.trim() }
    case 'sjuk_utan_intyg':
      return { rubrik: `Har sjukintyget från ${f} kommit?`, text: `${punkt.lage}. ${punkt.detalj ?? ''}`.trim() }
    case 'kvittera':
      return { rubrik: `Kvittera ${genitiv(f)} ${punkt.pass?.activity_type === 'jobsearch_own' ? 'jobbsökande' : 'incheckning'}`, text: `${punkt.lage}, ${punkt.detalj}.` }
    case 'omarkerat':
      return { rubrik: `Markera ${genitiv(f)} pass`, text: `${punkt.lage}.` }
    case 'franvaro':
      return { rubrik: `Se över ${genitiv(f)} frånvaro`, text: `${punkt.lage}. ${punkt.detalj ?? ''}`.trim() }
    case 'mote_over_gransen':
      return { rubrik: `Boka ett möte med ${f}`, text: punkt.lage }
    case 'utan_fysiskt':
      return { rubrik: `Boka ett fysiskt möte med ${f}`, text: punkt.lage }
    case 'under_timkravet':
      return { rubrik: `${f} är under timkravet`, text: punkt.lage }
    case 'uppfoljning':
      return { rubrik: `Följ upp ${genitiv(f)} placering`, text: punkt.lage }
    case 'mote_idag': {
      const d = punkt.mote ? new Date(punkt.mote.scheduledAt) : null
      const tid = d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : undefined
      return { rubrik: `Möte med ${namn}`, text: `${punkt.lage}. ${punkt.detalj ?? ''}`.trim(), tid }
    }
    case 'deadline':
      return { rubrik: `Titta på ${genitiv(f)} mål`, text: punkt.lage }
    case 'kontakt':
      return { rubrik: `Hör av dig till ${f}`, text: `${punkt.lage}. ${punkt.detalj ?? ''}`.trim() }
  }
}

/** Kontrollerna för en punkt som kräver ett val eller en text (raden och nästa steg). */
function Kontroll({
  punkt,
  namn,
  atgard,
  anteckning,
  setAnteckning,
  sparar,
  onMarkera,
  kor,
  visaKnappar,
}: {
  punkt: MinDagPunkt
  namn: string
  atgard: Atgard
  anteckning: string
  setAnteckning: (s: string) => void
  sparar: boolean
  onMarkera?: Props['onMarkera']
  kor: Kor
  /** Raden ritar sina egna knappar; nästa steg har dem i NastaSteg. */
  visaKnappar: boolean
}) {
  const id = useId()
  const pass = punkt.pass
  return (
    <div className="grid gap-2.5">
      {atgard.kontroll === 'anteckning' && (
        <form
          className="grid gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            atgard.primar.onClick()
          }}
        >
          <label htmlFor={id} className="text-[0.875rem] font-semibold text-j-blak">
            Vad hände? <span className="font-normal text-j-blak-3">En rad om frånvaron för {namn}</span>
          </label>
          <input
            id={id}
            value={anteckning}
            onChange={(e) => setAnteckning(e.target.value)}
            placeholder="T.ex. svarade inte i telefon, ringer igen i morgon"
            className="w-full min-h-[44px] px-3 rounded-j-s border border-j-linje-2 bg-j-kort text-j-blak text-[0.9375rem] placeholder:text-j-blak-3 focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[var(--j-fokus)]"
          />
          {visaKnappar && (
            <div>
              <Button ton="kvarter" variant="secondary" size="sm" type="submit" disabled={sparar || !anteckning.trim()}>
                Spara raden
              </Button>
            </div>
          )}
        </form>
      )}
      {atgard.kontroll === 'narvaro' && pass && (
        <NarvaroVal
          etikett={`Närvaro för ${namn}, ${pass.title}`}
          alternativ={NARVARO_STANDARDVAL}
          varde={pass.attendance}
          disabled={sparar || !onMarkera}
          onChange={(v) => {
            if (!onMarkera) return
            void kor(() => onMarkera(pass, {
              attendance: v as Attendance,
              note: pass.attendance_note ?? null,
              sickCertificateReceived: v === 'sick_certified' ? !!pass.sick_certificate_received : false,
            }))
          }}
        />
      )}
      {atgard.kontroll === 'val' && visaKnappar && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Åtgärd för ${namn}`}>
          <Button ton="kvarter" variant="secondary" size="sm" disabled={sparar} onClick={atgard.primar.onClick}>
            {atgard.primar.etikett}
          </Button>
          {atgard.sekundar && (
            <Button ton="kvarter" variant="secondary" size="sm" disabled={sparar} onClick={atgard.sekundar.onClick}>
              {atgard.sekundar.etikett}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function Fel({ fel }: { fel: string | null }) {
  return fel ? <p role="alert" className="text-[0.875rem] text-[var(--s-ogiltig-text)]">{fel}</p> : null
}

/** En punkt i raden som fällts ut (det mest brådskande eller ett av "+N till"). */
function Underpunkt({ punkt, namn, props, forsta }: { punkt: MinDagPunkt; namn: string; props: Props; forsta: boolean }) {
  const { sparar, fel, kor } = useKor()
  const [anteckning, setAnteckning] = useState('')
  const atgard = useAtgarder(props)(punkt, kor, anteckning)
  return (
    <li className="grid gap-2 py-3 border-t border-j-linje first:border-t-0 first:pt-0" data-testid={`mindag-punkt-${punkt.typ}`}>
      {!forsta && (
        <div className="grid gap-0.5">
          <span className="text-[0.9375rem] text-j-blak">{punkt.lage}</span>
          {punkt.detalj && <span className="text-[0.8125rem] text-j-blak-3">{punkt.detalj}</span>}
        </div>
      )}
      {atgard.kontroll ? (
        <Kontroll
          punkt={punkt}
          namn={namn}
          atgard={atgard}
          anteckning={anteckning}
          setAnteckning={setAnteckning}
          sparar={sparar}
          onMarkera={props.onMarkera}
          kor={kor}
          visaKnappar
        />
      ) : (
        <div>
          <Button ton="kvarter" variant={atgard.tertiar ? 'tertiary' : 'secondary'} size="sm" disabled={sparar} onClick={atgard.primar.onClick}>
            {atgard.primar.etikett}
          </Button>
        </div>
      )}
      <Fel fel={fel} />
    </li>
  )
}

function Rad({ person, props }: { person: MinDagPerson; props: Props }) {
  const navigate = useNavigate()
  const panelId = useId()
  const [oppen, setOppen] = useState(false)
  const { sparar, fel, kor } = useKor()
  const namn = props.namnFor(person.participantId)
  const [forsta, ...resten] = person.punkter
  const sammanfattning = radSammanfattning(person)
  const atgard = useAtgarder(props)(forsta, kor, '')
  const fallsUt = !!atgard.kontroll || resten.length > 0
  const etikett = atgard.kontroll === 'anteckning' ? 'Skriv raden'
    : atgard.kontroll === 'narvaro' ? 'Markera'
      : atgard.kontroll === 'val' ? (forsta.typ === 'anmald_franvaro' ? 'Bedöm' : 'Ta ställning')
        : null

  return (
    <li data-testid={`mindag-person-${person.participantId}`} data-typ={forsta.typ} className="border-b border-j-linje last:border-b-0">
      <PersonRad
        som="div"
        className="border-b-0"
        namn={namn}
        lage={sammanfattning.lage}
        detalj={sammanfattning.detalj}
        status={forsta.status}
        statusText={forsta.statusText}
        fler={sammanfattning.fler}
        onOppna={() => navigate(`/consultant/participants/${person.participantId}`)}
        handling={!atgard.kontroll ? { etikett: atgard.primar.etikett, onClick: atgard.primar.onClick, variant: atgard.tertiar ? 'tertiary' : 'secondary' } : undefined}
        mitten={fallsUt ? (
          <Button
            ton="kvarter"
            size="sm"
            variant={etikett ? 'secondary' : 'tertiary'}
            aria-expanded={oppen}
            aria-controls={panelId}
            aria-label={`${etikett ?? (oppen ? 'Dölj' : 'Visa allt')}: ${namn}`}
            onClick={() => setOppen(!oppen)}
            disabled={sparar}
          >
            {etikett ?? (oppen ? 'Dölj' : `Visa ${talOrd(person.punkter.length).toLowerCase()}`)}
          </Button>
        ) : undefined}
      />
      {fel && <div className="px-4 sm:px-[18px] pb-3"><Fel fel={fel} /></div>}
      {fallsUt && oppen && (
        <ul id={panelId} className="mx-4 sm:mx-[18px] mb-3.5 sm:ml-[72px] px-4 py-3 rounded-j-s bg-j-sankt" aria-label={`Allt om ${namn} i dag`}>
          {person.punkter.map((p, i) => (
            <Underpunkt key={`${p.typ}-${p.pass?.id ?? p.mote?.id ?? i}`} punkt={p} namn={namn} props={props} forsta={i === 0 && !!atgard.kontroll} />
          ))}
        </ul>
      )}
    </li>
  )
}

function NastaPunkt({ punkt, props }: { punkt: MinDagPunkt; props: Props }) {
  const { sparar, fel, kor } = useKor()
  const [anteckning, setAnteckning] = useState('')
  const atgard = useAtgarder(props)(punkt, kor, anteckning)
  const namn = props.namnFor(punkt.participantId)
  const { rubrik, text, tid } = nastaRubrik(punkt, namn)
  return (
    <div data-testid="mindag-nasta-steg" data-typ={punkt.typ}>
      <NastaSteg
        rubrik={rubrik}
        text={text}
        tid={tid}
        handling={{ ...atgard.primar, disabled: atgard.primar.disabled || sparar }}
        sekundar={atgard.sekundar ? { ...atgard.sekundar, disabled: sparar } : undefined}
      >
        {atgard.kontroll === 'anteckning' || atgard.kontroll === 'narvaro' ? (
          <Kontroll
            punkt={punkt}
            namn={namn}
            atgard={atgard}
            anteckning={anteckning}
            setAnteckning={setAnteckning}
            sparar={sparar}
            onMarkera={props.onMarkera}
            kor={kor}
            visaKnappar={false}
          />
        ) : null}
        <Fel fel={fel} />
      </NastaSteg>
    </div>
  )
}

function NastaPass({ pass }: { pass: PassAttMarkera }) {
  const navigate = useNavigate()
  return (
    <div data-testid="mindag-nasta-steg" data-typ="pass">
      <NastaSteg
        tid={pass.start_time}
        rubrik={`Markera närvaro för ${pass.title}`}
        text={passMening(pass)}
        handling={{ etikett: 'Markera närvaro', onClick: () => navigate(gruppLank(pass)) }}
      />
    </div>
  )
}

export function BradskandeIdag(props: Props) {
  const { personer, pass = [], visaNastaSteg = true, nu = new Date() } = props
  const val: NastaStegVal | null = visaNastaSteg ? valjNastaSteg(personer, pass, nu) : null
  const lista = utanNastaSteg(personer, val)

  return (
    <>
      {val?.typ === 'punkt' && <NastaPunkt key={`${val.punkt.typ}-${val.punkt.participantId}-${val.punkt.pass?.id ?? ''}`} punkt={val.punkt} props={props} />}
      {val?.typ === 'pass' && <NastaPass pass={val.pass} />}

      {lista.length > 0 && (
        <section aria-labelledby="mindag-lista-rubrik" className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 id="mindag-lista-rubrik" className="font-rubrik text-[1.125rem] font-bold text-j-blak">
              {val ? 'Det här väntar också' : 'Det här väntar'}
            </h2>
            <span className="text-[0.8125rem] font-semibold text-j-blak-3">
              {lista.length === 1 ? 'En person' : `${talOrd(lista.length)} personer`}
            </span>
          </div>
          <ul className="bg-j-kort border border-j-linje rounded-j-m overflow-hidden" data-testid="mindag-lista">
            {lista.map((p) => <Rad key={p.participantId} person={p} props={props} />)}
          </ul>
        </section>
      )}
    </>
  )
}

