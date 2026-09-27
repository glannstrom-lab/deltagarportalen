/**
 * BradskandeIdag — "Att göra i dag" överst i Min dag.
 *
 * RR3/RK7: ogiltig frånvaro senaste 7 dagarna och deltagare över
 * möteskadensens gräns. RK35/RR26 (rollspelet 2026-09-27): dessutom det som
 * väntar på konsulentens beslut — frånvaro utan anteckning, sjuk utan intyg,
 * omarkerade pass, egenrapporter att kvittera, frånvaro anmäld i förväg och
 * deltagarens förklaringar — och för en leverantör veckan mot avtalet.
 * Varje rad har sin åtgärd i raden: markera, kvittera, skriv anteckningen,
 * boka det fysiska mötet. Reglerna bor i oversiktRegler.ts.
 *
 * Tre lägen, aldrig ett tyst "inget": listan, en rad om att underlaget inte
 * kunde hämtas, eller ingenting alls när inget väntar.
 * Konsulentvyn översätts inte (DESIGN.md §2).
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, ClipboardList } from '@/components/ui/icons'
import type { Attendance } from '@/services/aktivitetSchema'
import type { AttendanceInput } from '@/services/aktivitetApi'
import { NARVARO_ETIKETT } from '@/lib/dagensPass'
import {
  leverantorSammanfattning,
  type AttGora,
  type AttGoraPass,
  type Bradskande,
  type LeverantorLage,
} from './oversiktRegler'

interface Props {
  punkter: readonly Bradskande[]
  /** Passen som väntar på ett beslut (attGoraIdag). */
  attGora?: readonly AttGora[]
  /** Leverantörens vecka mot avtalet — bara för leverantörer (orgTypVisning). */
  leverantor?: LeverantorLage | null
  /** Underlaget (möten eller pass) kunde inte hämtas. */
  fel: boolean
  namnFor: (participantId: string) => string
  onMarkera?: (pass: AttGoraPass, input: AttendanceInput) => Promise<void>
  onSparaAnteckning?: (pass: AttGoraPass, anteckning: string) => Promise<void>
  onBokaFysiskt?: (participantId: string) => void
}

const knapp =
  'text-xs px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50'

const OMARKERAT_VAL: readonly Attendance[] = ['present', 'absent_valid', 'absent_invalid', 'sick_certified']

function Deltagarlank({ id, namn }: { id: string; namn: string }) {
  return (
    <Link to={`/consultant/participants/${id}`} className="font-medium text-sm text-stone-900 dark:text-stone-100 hover:underline">
      {namn}
    </Link>
  )
}

function AttGoraRad({
  punkt,
  namn,
  onMarkera,
  onSparaAnteckning,
}: {
  punkt: AttGora
  namn: string
  onMarkera?: Props['onMarkera']
  onSparaAnteckning?: Props['onSparaAnteckning']
}) {
  const { pass } = punkt
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [anteckning, setAnteckning] = useState('')

  const kor = async (fn: () => Promise<void>) => {
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
  // Anteckningen och intygsstatusen följer med vid en ommarkering — markAttendance skriver över dem annars.
  const markera = (attendance: Attendance, extra: Partial<AttendanceInput> = {}) =>
    onMarkera && kor(() => onMarkera(pass, {
      attendance,
      note: pass.attendance_note ?? null,
      sickCertificateReceived: attendance === 'sick_certified' ? !!pass.sick_certificate_received : false,
      ...extra,
    }))

  let atgard: React.ReactNode = null
  if (punkt.typ === 'franvaro_utan_anteckning' && onSparaAnteckning) {
    const id = `anteckning-${pass.id}`
    atgard = (
      <form
        className="mt-2 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (anteckning.trim()) void kor(() => onSparaAnteckning(pass, anteckning.trim()))
        }}
      >
        <label htmlFor={id} className="sr-only">Anteckning om frånvaron för {namn}</label>
        <input
          id={id}
          value={anteckning}
          onChange={(e) => setAnteckning(e.target.value)}
          placeholder="Vad hände? T.ex. kom inte, svarade inte i telefon"
          className="flex-1 min-w-[12rem] text-sm px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
        />
        <button type="submit" className={knapp} disabled={sparar || !anteckning.trim()}>Spara anteckning</button>
      </form>
    )
  } else if (onMarkera) {
    const knappar: Array<{ etikett: string; gor: () => void }> = []
    if (punkt.typ === 'forklaring') {
      const nu = pass.attendance === 'absent_invalid' ? 'ogiltig' : 'giltig'
      knappar.push({ etikett: `Behåll ${nu}`, gor: () => void markera(pass.attendance as Attendance) })
      if (pass.attendance === 'absent_invalid') knappar.push({ etikett: 'Ändra till giltig', gor: () => void markera('absent_valid') })
    } else if (punkt.typ === 'sjuk_utan_intyg') {
      knappar.push({ etikett: 'Intyget har kommit', gor: () => void markera('sick_certified', { sickCertificateReceived: true }) })
    } else if (punkt.typ === 'anmald_franvaro') {
      knappar.push({ etikett: NARVARO_ETIKETT.absent_valid, gor: () => void markera('absent_valid') })
      knappar.push({ etikett: NARVARO_ETIKETT.absent_invalid, gor: () => void markera('absent_invalid') })
    } else if (punkt.typ === 'kvittera') {
      knappar.push({ etikett: 'Kvittera', gor: () => void markera('present') })
    } else if (punkt.typ === 'omarkerat') {
      for (const a of OMARKERAT_VAL) knappar.push({ etikett: NARVARO_ETIKETT[a], gor: () => void markera(a) })
    }
    atgard = (
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={`Åtgärd för ${namn}`}>
        {knappar.map((k) => (
          <button key={k.etikett} type="button" className={knapp} disabled={sparar} onClick={k.gor}>
            {k.etikett}
          </button>
        ))}
      </div>
    )
  }

  return (
    <li className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
      <Deltagarlank id={punkt.participantId} namn={namn} />
      <p className="text-xs text-stone-600 dark:text-stone-300">{punkt.text}</p>
      {atgard}
      {fel && <p role="alert" className="mt-1 text-xs text-rose-700 dark:text-rose-300">{fel}</p>}
    </li>
  )
}

function LeverantorRad({
  punkt,
  namn,
  atgard,
}: {
  punkt: { participantId: string; text: string }
  namn: string
  atgard: React.ReactNode
}) {
  return (
    <li className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
      <Deltagarlank id={punkt.participantId} namn={namn} />
      <p className="text-xs text-stone-600 dark:text-stone-300">{punkt.text}</p>
      <div className="mt-2">{atgard}</div>
    </li>
  )
}

export function BradskandeIdag({ punkter, attGora = [], leverantor = null, fel, namnFor, onMarkera, onSparaAnteckning, onBokaFysiskt }: Props) {
  if (fel) {
    return (
      <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">
        Möten och frånvaro kunde inte hämtas — det som ska göras i dag visas inte just nu. Ladda om sidan för att försöka igen.
      </p>
    )
  }

  // En mötesrad från brådskande-listan och en "utan fysiskt möte"-rad för samma person säger samma sak.
  const moteBradskande = new Set(punkter.filter((p) => p.typ === 'mote').map((p) => p.participantId))
  const utanFysiskt = leverantor?.utanFysisktMote.filter((p) => !moteBradskande.has(p.participantId)) ?? []
  const antal = punkter.length + attGora.length
    + (leverantor ? leverantor.underTimkravet.length + utanFysiskt.length + leverantor.uppfoljningar.length : 0)

  if (antal === 0 && !leverantor) return null

  return (
    <section aria-labelledby="att-gora-rubrik" className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="w-4 h-4 text-stone-500 dark:text-stone-400" aria-hidden="true" />
        <h4 id="att-gora-rubrik" className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Att göra i dag
        </h4>
        <span className="text-xs text-stone-500 dark:text-stone-400">({antal})</span>
      </div>

      {leverantor && (
        <p className="mb-2 text-sm text-stone-700 dark:text-stone-300" aria-label="Veckan mot avtalet">
          {leverantorSammanfattning(leverantor).map((del, i) => (
            <span key={del}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              {del}
            </span>
          ))}
        </p>
      )}

      {antal === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">Inget väntar på dig i dag.</p>
      ) : (
        <ul className="space-y-2">
          {punkter.map((p) => (
            <li key={`${p.participantId}-${p.typ}`}>
              <Link
                to={`/consultant/participants/${p.participantId}`}
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 hover:underline"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" aria-hidden="true" />
                    {namnFor(p.participantId)}
                  </span>
                  <span className="block text-xs text-stone-600 dark:text-stone-300">{p.text}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
          {attGora.map((a) => (
            <AttGoraRad
              key={`${a.pass.id}-${a.typ}`}
              punkt={a}
              namn={namnFor(a.participantId)}
              onMarkera={onMarkera}
              onSparaAnteckning={onSparaAnteckning}
            />
          ))}
          {leverantor?.underTimkravet.map((p) => (
            <LeverantorRad
              key={`tim-${p.participantId}`}
              punkt={p}
              namn={namnFor(p.participantId)}
              atgard={<Link to="/consultant/analytics#avtalskrav" className={knapp}>Se aktivitetsloggen</Link>}
            />
          ))}
          {utanFysiskt.map((p) => (
            <LeverantorRad
              key={`fys-${p.participantId}`}
              punkt={p}
              namn={namnFor(p.participantId)}
              atgard={onBokaFysiskt
                ? <button type="button" className={knapp} onClick={() => onBokaFysiskt(p.participantId)}>Boka fysiskt möte</button>
                : null}
            />
          ))}
          {leverantor?.uppfoljningar.map((p, i) => (
            <LeverantorRad
              key={`uppf-${p.participantId}-${i}`}
              punkt={p}
              namn={namnFor(p.participantId)}
              atgard={<Link to={`/consultant/participants/${p.participantId}`} className={knapp}>Registrera uppföljningen</Link>}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
