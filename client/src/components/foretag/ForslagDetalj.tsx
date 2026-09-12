/**
 * ForslagDetalj — presentationen av EN person som deltagaren godkänt att dela
 * med just detta företag (vyn employer_proposals).
 *
 * Bara fält som är non-null renderas: vyn nollar allt deltagaren inte bockat
 * i (show_contact, show_summary, …), så en null-kolumn betyder "inte delad" —
 * och en sådan rad ska inte synas alls, inte ens som "—".
 *
 * participant_experience / participant_education är jsonb ur CV-byggaren —
 * läses genom cvPoster.ts, som aldrig kraschar på okänd form.
 *
 * Rubrikraden är ett löfte som portalen kan hålla strukturellt: företaget når
 * inga personer utanför den här vyn (migrationens huvud, "VAD FÖRETAGET ALDRIG NÅR").
 */

import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Mail, MapPin, MessageSquare, Phone, ShieldCheck } from '@/components/ui/icons'
import type { Forslag, ForslagKompetens } from '@/services/foretagApi'
import { formateraDatum, fulltNamn } from '@/services/foretagApi'
import { CHIP_KLASS, PLACERING_TYP_LABEL, SVAR_KLASS, SVAR_LABEL } from './foretagEtiketter'
import { cvPoster } from './cvPoster'

interface Props {
  forslag: Forslag
  /** Fel från markeraOppnad (t.ex. "Förslaget kan inte visas fler gånger") — visas, döljer inget. */
  oppnadFel?: unknown
  onSvara: (svar: 'interested' | 'declined') => void
}

function Avsnitt({ rubrik, children }: { rubrik: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">{rubrik}</h3>
      {children}
    </section>
  )
}

function Kompetenser({ lista }: { lista: ForslagKompetens[] }) {
  if (lista.length === 0) return <p className="text-sm text-stone-600 dark:text-stone-300">Inga kompetenser inlagda.</p>
  return (
    <ul className="flex flex-wrap gap-2">
      {lista.map((k, i) => (
        <li key={`${k.name}-${i}`} className="rounded-full bg-[var(--c-bg)] px-3 py-1 text-sm text-[var(--c-text)]">
          {k.name}
          {k.years_experience != null && k.years_experience > 0 && (
            <span className="text-stone-600 dark:text-stone-300"> · {k.years_experience} år</span>
          )}
        </li>
      ))}
    </ul>
  )
}

function CvLista({ varde }: { varde: unknown }) {
  const poster = cvPoster(varde)
  if (poster === null) {
    return <p className="text-sm text-stone-600 dark:text-stone-300">Delat, men i ett format vi inte kan visa här. Fråga konsulenten.</p>
  }
  if (poster.length === 0) return <p className="text-sm text-stone-600 dark:text-stone-300">Inget inlagt.</p>
  return (
    <ul className="space-y-2">
      {poster.map((p, i) => (
        <li key={i} className="text-sm">
          <p className="font-medium text-stone-900 dark:text-stone-100">{p.rubrik}</p>
          {(p.under || p.period) && (
            <p className="text-stone-600 dark:text-stone-300">{[p.under, p.period].filter(Boolean).join(' · ')}</p>
          )}
          {p.beskrivning && <p className="text-stone-700 dark:text-stone-200 mt-0.5">{p.beskrivning}</p>}
        </li>
      ))}
    </ul>
  )
}

export function ForslagDetalj({ forslag: f, oppnadFel, onSvara }: Props) {
  const fornamn = f.participant_first_name?.trim() || 'personen'
  const namn = fulltNamn(f.participant_first_name, f.participant_last_name) || 'Personen'
  const konsulent = fulltNamn(f.consultant_first_name, f.consultant_last_name) || 'Konsulenten'
  const plats = f.place_title || f.occupation || PLACERING_TYP_LABEL[f.placement_type]
  const harKontakt = !!(f.participant_email || f.participant_phone || f.participant_location)
  const besvarat = f.employer_response !== 'pending'

  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 rounded-xl bg-[var(--c-bg)] p-3 text-sm text-[var(--c-text)]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Det här ser ni för att {fornamn} har godkänt att just de här uppgifterna delas med er. Ni ser aldrig en lista över personer.
        </span>
      </p>

      {oppnadFel != null && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {oppnadFel instanceof Error ? oppnadFel.message : String(oppnadFel)}
        </p>
      )}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">{namn}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Föreslagen för <span className="font-medium text-stone-800 dark:text-stone-100">{plats}</span> · {PLACERING_TYP_LABEL[f.placement_type]}
            </p>
          </div>
          <span className={`${CHIP_KLASS} ${SVAR_KLASS[f.employer_response]}`}>{SVAR_LABEL[f.employer_response]}</span>
        </div>

        {f.presentation_text && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Konsulentens presentation</p>
            <p className="whitespace-pre-line text-stone-800 dark:text-stone-100">{f.presentation_text}</p>
          </div>
        )}

        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {f.start_date && (
            <div><dt className="text-stone-500 dark:text-stone-400">Tänkt start</dt><dd className="text-stone-800 dark:text-stone-100">{formateraDatum(f.start_date)}</dd></div>
          )}
          {f.end_date && (
            <div><dt className="text-stone-500 dark:text-stone-400">Tänkt slut</dt><dd className="text-stone-800 dark:text-stone-100">{formateraDatum(f.end_date)}</dd></div>
          )}
          {f.hours_per_week != null && (
            <div><dt className="text-stone-500 dark:text-stone-400">Omfattning</dt><dd className="text-stone-800 dark:text-stone-100">{f.hours_per_week} timmar per vecka</dd></div>
          )}
          {f.schedule_days && (
            <div><dt className="text-stone-500 dark:text-stone-400">Dagar och tider</dt><dd className="text-stone-800 dark:text-stone-100">{f.schedule_days}</dd></div>
          )}
          {f.expires_at && (
            <div><dt className="text-stone-500 dark:text-stone-400">Visas till</dt><dd className="text-stone-800 dark:text-stone-100">{formateraDatum(f.expires_at)}</dd></div>
          )}
        </dl>
      </Card>

      {(harKontakt || f.participant_summary || f.participant_skills || f.participant_experience != null || f.participant_education != null) && (
        <Card className="space-y-5">
          {harKontakt && (
            <Avsnitt rubrik="Kontakt">
              <ul className="space-y-1 text-sm text-stone-800 dark:text-stone-100">
                {f.participant_email && (
                  <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-stone-500" aria-hidden="true" /><a className="underline" href={`mailto:${f.participant_email}`}>{f.participant_email}</a></li>
                )}
                {f.participant_phone && (
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-stone-500" aria-hidden="true" /><a className="underline" href={`tel:${f.participant_phone}`}>{f.participant_phone}</a></li>
                )}
                {f.participant_location && (
                  <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-stone-500" aria-hidden="true" />{f.participant_location}</li>
                )}
              </ul>
            </Avsnitt>
          )}
          {f.participant_summary && (
            <Avsnitt rubrik={`${fornamn} om sig själv`}>
              <p className="whitespace-pre-line text-sm text-stone-800 dark:text-stone-100">{f.participant_summary}</p>
            </Avsnitt>
          )}
          {f.participant_skills && (
            <Avsnitt rubrik="Kompetenser"><Kompetenser lista={f.participant_skills} /></Avsnitt>
          )}
          {f.participant_experience != null && (
            <Avsnitt rubrik="Erfarenhet"><CvLista varde={f.participant_experience} /></Avsnitt>
          )}
          {f.participant_education != null && (
            <Avsnitt rubrik="Utbildning"><CvLista varde={f.participant_education} /></Avsnitt>
          )}
        </Card>
      )}

      <Card>
        <Avsnitt rubrik="Konsulent">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{konsulent}</p>
          <ul className="space-y-1 text-sm text-stone-800 dark:text-stone-100">
            {f.consultant_email && (
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-stone-500" aria-hidden="true" /><a className="underline" href={`mailto:${f.consultant_email}`}>{f.consultant_email}</a></li>
            )}
            {f.consultant_phone && (
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-stone-500" aria-hidden="true" /><a className="underline" href={`tel:${f.consultant_phone}`}>{f.consultant_phone}</a></li>
            )}
          </ul>
        </Avsnitt>
      </Card>

      {besvarat ? (
        <Card className="space-y-3">
          <p className="text-stone-800 dark:text-stone-100">
            <span className="font-medium">{SVAR_LABEL[f.employer_response]}</span>
            {f.employer_responded_at && <span className="text-stone-600 dark:text-stone-300"> · {formateraDatum(f.employer_responded_at)}</span>}
          </p>
          {f.employer_message && (
            <p className="whitespace-pre-line text-sm text-stone-700 dark:text-stone-200">Ert meddelande: {f.employer_message}</p>
          )}
          <Link to={`/foretag/meddelanden?forslag=${f.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--c-text)] underline">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Öppna tråden med {konsulent}
          </Link>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onSvara('interested')}>Vi vill gå vidare</Button>
          <Button variant="outline" onClick={() => onSvara('declined')}>Tacka nej</Button>
        </div>
      )}
    </div>
  )
}
