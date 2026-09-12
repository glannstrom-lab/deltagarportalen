/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + konstant-export (etiketter delas med tester och syskonkomponenter) */
/**
 * ForslagPanel — konsulentens förslag för en plats, med deltagarens svar,
 * företagets svar och företagets avstämningar (AG5/AG6/AG8).
 *
 * Presentationskomponent: hämtar ingenting själv. PlatserTab äger frågorna
 * och handlarna, så panelen kan testas utan React Query och utan supabase.
 *
 * Två svar per rad, två parter:
 *   status            — DELTAGARENS svar (pending/accepted/declined/withdrawn/expired)
 *   employer_response — FÖRETAGETS svar, som bara finns när deltagaren sagt
 *                       ja (företaget ser aldrig ett obesvarat eller nekat
 *                       förslag). Visas därför bara på accepterade rader.
 */

import { Button } from '@/components/ui/Button'
import { MessageSquare, Trash2 } from '@/components/ui/icons'
import type { Delningsforslag, DelningsforslagStatus, ForetagsSvar } from '@/services/delningsforslagApi'
import type { Foretagsavstamning } from '@/services/placeringarApi'
import { DELNINGSFALT_ETIKETT } from './ForeslaDialog'
import { DELNINGSFALT } from '@/services/delningsforslagApi'

export const FORSLAG_STATUS_LABEL: Record<DelningsforslagStatus, string> = {
  pending: 'Väntar på deltagaren',
  accepted: 'Deltagaren sa ja',
  declined: 'Tackade nej',
  withdrawn: 'Återkallat',
  expired: 'Utgånget',
}

export const FORSLAG_STATUS_KLASS: Record<DelningsforslagStatus, string> = {
  pending: 'bg-sky-50 text-sky-800',
  accepted: 'bg-emerald-50 text-emerald-800',
  declined: 'bg-rose-50 text-rose-800',
  withdrawn: 'bg-stone-100 text-stone-700',
  expired: 'bg-stone-100 text-stone-700',
}

export const FORETAGSSVAR_LABEL: Record<ForetagsSvar, string> = {
  pending: 'Väntar på företaget',
  interested: 'Vill gå vidare',
  declined: 'Tackade nej',
}

export const FORETAGSSVAR_KLASS: Record<ForetagsSvar, string> = {
  pending: 'bg-sky-50 text-sky-800',
  interested: 'bg-emerald-50 text-emerald-800',
  declined: 'bg-rose-50 text-rose-800',
}

const FORTSATT_LABEL: Record<'ja' | 'kanske' | 'nej', string> = {
  ja: 'Vill fortsätta',
  kanske: 'Kanske fortsätta',
  nej: 'Vill inte fortsätta',
}

interface Props {
  forslag: Delningsforslag[]
  /** Företagets avstämningar (employer_checkins) — visas bara om det finns rader. */
  avstamningar?: Foretagsavstamning[]
  /** Bara medan förslaget är pending — efter beslut finns ingen raderingsväg (triggern nekar). */
  onTaBortUtkast?: (forslag: Delningsforslag) => void
  /** Bara när deltagaren sagt ja — RLS släpper bara in konsulenten i tråden på accepterade förslag. */
  onOppnaTrad?: (forslag: Delningsforslag) => void
  /** Antal olästa meddelanden från företaget per förslag (valfritt). */
  olastaPerForslag?: Map<string, number>
}

function datum(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function ForslagPanel({ forslag, avstamningar = [], onTaBortUtkast, onOppnaTrad, olastaPerForslag }: Props) {
  if (forslag.length === 0 && avstamningar.length === 0) return null

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 space-y-3">
      {forslag.length > 0 && (
        <section aria-label="Förslag till företaget" className="space-y-2">
          <h5 className="text-xs font-semibold text-stone-700">Förslag till företaget</h5>
          <ul className="space-y-2">
            {forslag.map((f) => {
              const valda = DELNINGSFALT.filter((k) => f[k]).map((k) => DELNINGSFALT_ETIKETT[k].rubrik)
              const olasta = olastaPerForslag?.get(f.id) ?? 0
              return (
                <li key={f.id} className="rounded-lg border border-stone-200 bg-white p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${FORSLAG_STATUS_KLASS[f.status]}`}>
                      {FORSLAG_STATUS_LABEL[f.status]}
                    </span>
                    {f.status === 'accepted' && (
                      <span className={`px-2 py-0.5 rounded-full font-medium ${FORETAGSSVAR_KLASS[f.employer_response]}`}>
                        Företaget: {FORETAGSSVAR_LABEL[f.employer_response]}
                      </span>
                    )}
                    <span className="text-stone-500">
                      Skickat {datum(f.created_at)}
                      {f.decided_at && <> · besvarat {datum(f.decided_at)}</>}
                      {f.status === 'pending' && f.expires_at && <> · gäller till {datum(f.expires_at)}</>}
                    </span>
                  </div>

                  {f.status === 'declined' && f.participant_message && (
                    <p className="text-xs text-stone-700">
                      <span className="font-medium">Deltagarens meddelande:</span> {f.participant_message}
                    </p>
                  )}
                  {f.status === 'accepted' && f.employer_response === 'declined' && f.employer_message && (
                    <p className="text-xs text-stone-700">
                      <span className="font-medium">Företagets meddelande:</span> {f.employer_message}
                    </p>
                  )}
                  {f.status === 'accepted' && f.employer_response === 'interested' && f.employer_message && (
                    <p className="text-xs text-stone-700">
                      <span className="font-medium">Företagets meddelande:</span> {f.employer_message}
                    </p>
                  )}

                  <p className="text-xs text-stone-600">
                    {valda.length > 0 ? <>Föreslaget att dela: {valda.join(', ')}</> : <>Inga fält föreslagna — bara presentationen.</>}
                  </p>

                  {(f.status === 'pending' || f.status === 'accepted') && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {f.status === 'pending' && onTaBortUtkast && (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Trash2 size={13} />}
                          onClick={() => onTaBortUtkast(f)}
                          className="text-rose-700 hover:bg-rose-50"
                        >
                          Ta bort utkast
                        </Button>
                      )}
                      {f.status === 'accepted' && onOppnaTrad && (
                        <Button size="sm" variant="outline" leftIcon={<MessageSquare size={13} />} onClick={() => onOppnaTrad(f)}>
                          Öppna tråd
                          {olasta > 0 && (
                            <span className="ml-1.5 px-1.5 rounded-full bg-amber-100 text-amber-800 text-[11px]">{olasta} nya</span>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {avstamningar.length > 0 && (
        <section aria-label="Företagets avstämningar" className="space-y-2">
          <h5 className="text-xs font-semibold text-stone-700">Företagets avstämningar</h5>
          <ul className="space-y-2">
            {avstamningar.map((a) => (
              <li key={a.id} className="rounded-lg border border-stone-200 bg-white p-3 text-xs space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-stone-900">Vecka {a.milestone_week}</span>
                  <span className="text-stone-500">{datum(a.created_at)}</span>
                  {a.continue_interest && (
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">{FORTSATT_LABEL[a.continue_interest]}</span>
                  )}
                </div>
                {a.going_well && (
                  <p className="text-stone-700">
                    <span className="font-medium">Går bra:</span> {a.going_well}
                  </p>
                )}
                {a.concerns && (
                  <p className="text-stone-700">
                    <span className="font-medium">Bekymmer:</span> {a.concerns}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
