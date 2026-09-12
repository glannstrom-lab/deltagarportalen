/**
 * Delningsforslag — deltagarens svar på konsulentens förslag att dela hennes
 * uppgifter med ett företag (AG5/AG8, migrationerna 20260902100000 och
 * 20260913100000). Förslagsraden ÄR samtycket: inget syns för företaget
 * förrän hon sagt ja, och hon kan sluta dela när hon vill.
 *
 * Tillståndsmaskinen (databasen, RPC:n respond_to_share_proposal):
 *   pending  → accepted | declined            ("Ja, dela" / "Nej tack")
 *   accepted → withdrawn                       ("Sluta dela", med bekräftelse)
 *   pending  → expired (av RPC:n när expires_at passerats)
 * Ett pending-förslag vars expires_at redan passerat visas därför som utgånget
 * här, även innan databasen hunnit sätta statusen — annars hade "Ja, dela"
 * bara gett felet "Förslaget har gått ut".
 *
 * Tre lägen: laddar / fel / klart. Har deltagaren aldrig fått ett förslag
 * renderas INGENTING — sektionen ska inte ta plats på Min konsulent för de
 * flesta. Finns historik men inget nytt visas en kort rad om det.
 *
 * Konsulentens namn kommer ur RPC:n get_my_consultant (via
 * konsulentMeddelandeApi). Saknas kopplingen — hon kan ha sagt upp den efter
 * att förslaget skapades — står det "din konsulent". Hennes förslag och
 * hennes rätt att sluta dela försvinner inte med kopplingen.
 *
 * Företaget ser aldrig meddelandet hon skriver, och aldrig ett nej
 * (vyn employer_proposals filtrerar på accepted). Det står i gränssnittet
 * eftersom det är sant — inte som ett löfte.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Handshake, ChevronDown, ChevronUp, Check, ShieldCheck } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { datumSprak } from '@/lib/datumsprak'
import { delningsforslagApi, DELNINGSFALT, type DelningsforslagMedPlats, type DelningsFalt } from '@/services/delningsforslagApi'
import { konsulentMeddelandeApi } from '@/services/konsulentMeddelandeApi'

type Lage =
  | { status: 'laddar' }
  | { status: 'fel' }
  /** `nu` sätts när svaret kommer in, så "har gått ut" räknas en gång och inte vid varje render. */
  | { status: 'klart'; forslag: DelningsforslagMedPlats[]; nu: number }

type Bekraftelse = { id: string; slag: 'ja' | 'nej' | 'slutaDela'; foretag: string }

const FALT_NYCKEL: Record<keyof DelningsFalt, string> = {
  show_contact: 'kontakt',
  show_summary: 'sammanfattning',
  show_skills: 'kompetenser',
  show_experience: 'erfarenhet',
  show_education: 'utbildning',
}

function harGattUt(f: DelningsforslagMedPlats, nu: number): boolean {
  return f.status === 'pending' && !!f.expires_at && new Date(f.expires_at).getTime() <= nu
}

interface Props {
  className?: string
}

export function Delningsforslag({ className }: Props) {
  const { t, i18n } = useTranslation()
  const { confirm } = useConfirmDialog()
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [konsulentNamn, setKonsulentNamn] = useState<string | null>(null)
  const [bekraftelse, setBekraftelse] = useState<Bekraftelse | null>(null)
  const [historikOppen, setHistorikOppen] = useState(false)

  useEffect(() => {
    let aktiv = true
    delningsforslagApi
      .listaMina()
      .then((forslag) => { if (aktiv) setLage({ status: 'klart', forslag, nu: Date.now() }) })
      .catch(() => { if (aktiv) setLage({ status: 'fel' }) })
    // Namnet är en hjälp, inte ett villkor: går uppslaget fel står "din konsulent".
    konsulentMeddelandeApi
      .minKonsulent()
      .then((k) => { if (aktiv && k) setKonsulentNamn(k.namn) })
      .catch(() => { /* fallback-texten räcker */ })
    return () => { aktiv = false }
  }, [])

  const konsulent = konsulentNamn ?? t('delningsforslag.dinKonsulent')
  const locale = datumSprak(i18n.language)
  const datum = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  const uppdateraRad = useCallback((id: string, patch: Partial<DelningsforslagMedPlats>) => {
    setLage((prev) => prev.status === 'klart'
      ? { ...prev, forslag: prev.forslag.map((f) => (f.id === id ? { ...f, ...patch } : f)) }
      : prev)
  }, [])

  const foretagsnamn = (f: DelningsforslagMedPlats) =>
    f.consultant_work_placements?.company_name || t('delningsforslag.foretagUtanNamn')

  const svara = async (f: DelningsforslagMedPlats, beslut: 'accepted' | 'declined', meddelande?: string) => {
    await delningsforslagApi.svara(f.id, beslut, meddelande)
    uppdateraRad(f.id, { status: beslut, decided_at: new Date().toISOString(), participant_message: meddelande?.trim() || f.participant_message })
    setBekraftelse({ id: f.id, slag: beslut === 'accepted' ? 'ja' : 'nej', foretag: foretagsnamn(f) })
  }

  const slutaDela = async (f: DelningsforslagMedPlats) => {
    const foretag = foretagsnamn(f)
    const ok = await confirm({
      title: t('delningsforslag.delat.bekraftaRubrik', { foretag }),
      message: t('delningsforslag.delat.bekraftaText', { konsulent }),
      confirmText: t('delningsforslag.delat.bekraftaJa'),
      cancelText: t('delningsforslag.delat.bekraftaAvbryt'),
      variant: 'warning',
    })
    if (!ok) return
    await delningsforslagApi.svara(f.id, 'withdrawn')
    uppdateraRad(f.id, { status: 'withdrawn', decided_at: new Date().toISOString() })
    setBekraftelse({ id: f.id, slag: 'slutaDela', foretag })
  }

  if (lage.status === 'klart' && lage.forslag.length === 0) return null

  const nu = lage.status === 'klart' ? lage.nu : 0
  const alla = lage.status === 'klart' ? lage.forslag : []
  const vantande = alla.filter((f) => f.status === 'pending' && !harGattUt(f, nu))
  const delade = alla.filter((f) => f.status === 'accepted')
  const historik = alla.filter((f) => f.status === 'declined' || f.status === 'withdrawn' || f.status === 'expired' || harGattUt(f, nu))

  return (
    <Card className={className} data-testid="delningsforslag">
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2">
          <Handshake className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">
            {t('delningsforslag.rubrik')}
          </h2>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          {t('delningsforslag.beskrivning')}
        </p>
      </div>

      <div className="p-4 space-y-4" aria-live="polite">
        {lage.status === 'laddar' && (
          <p className="text-sm text-stone-500 dark:text-stone-400">{t('delningsforslag.laddar')}</p>
        )}

        {lage.status === 'fel' && (
          <p className="text-sm text-amber-700 dark:text-amber-300" role="alert">
            {t('delningsforslag.fel')}
          </p>
        )}

        {lage.status === 'klart' && (
          <>
            {bekraftelse && (
              <p
                role="status"
                className="flex items-start gap-2 text-sm rounded-xl p-3 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-stone-800 dark:text-stone-100"
              >
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--c-text)]" aria-hidden="true" />
                <span>{t(`delningsforslag.bekraftelse.${bekraftelse.slag}`, { konsulent, foretag: bekraftelse.foretag })}</span>
              </p>
            )}

            {vantande.length === 0 && (
              <p className="text-sm text-stone-600 dark:text-stone-400">{t('delningsforslag.ingaNya')}</p>
            )}

            {vantande.map((f) => (
              <VantandeKort
                key={f.id}
                forslag={f}
                konsulent={konsulent}
                foretag={foretagsnamn(f)}
                datum={datum}
                onSvara={svara}
              />
            ))}

            {delade.length > 0 && (
              <section aria-labelledby="delningsforslag-delat">
                <h3 id="delningsforslag-delat" className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  {t('delningsforslag.delat.rubrik')}
                </h3>
                <ul className="space-y-2">
                  {delade.map((f) => (
                    <DelatRad key={f.id} forslag={f} foretag={foretagsnamn(f)} datum={datum} onSlutaDela={slutaDela} />
                  ))}
                </ul>
              </section>
            )}

            {historik.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setHistorikOppen((v) => !v)}
                  aria-expanded={historikOppen}
                  aria-controls="delningsforslag-historik"
                  className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 min-h-[44px]"
                >
                  {historikOppen
                    ? <ChevronUp className="w-4 h-4" aria-hidden="true" />
                    : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                  {t('delningsforslag.historik.rubrik', { antal: historik.length })}
                </button>
                {historikOppen && (
                  <ul id="delningsforslag-historik" className="mt-1 space-y-1 text-sm text-stone-600 dark:text-stone-400">
                    {historik.map((f) => {
                      const status = f.status === 'pending' ? 'expired' : f.status
                      return (
                        <li key={f.id}>
                          {foretagsnamn(f)} · {t(`delningsforslag.historik.${status}`)}
                          {f.decided_at ? ` · ${datum(f.decided_at)}` : ''}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------

function insatstypEtikett(t: (k: string) => string, typ: string): string {
  switch (typ) {
    case 'praktik': return t('delningsforslag.insatstyp.praktik')
    case 'arbetstraning': return t('delningsforslag.insatstyp.arbetstraning')
    case 'arbetsprovning': return t('delningsforslag.insatstyp.arbetsprovning')
    case 'subventionerad_anstallning': return t('delningsforslag.insatstyp.subventionerad_anstallning')
    default: return typ
  }
}

function VantandeKort({
  forslag: f,
  konsulent,
  foretag,
  datum,
  onSvara,
}: {
  forslag: DelningsforslagMedPlats
  konsulent: string
  foretag: string
  datum: (iso: string) => string
  onSvara: (f: DelningsforslagMedPlats, beslut: 'accepted' | 'declined', meddelande?: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [meddelande, setMeddelande] = useState('')
  const [sparar, setSparar] = useState<'accepted' | 'declined' | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const plats = f.consultant_work_placements
  const roll = plats?.occupation?.trim()

  const svara = async (beslut: 'accepted' | 'declined') => {
    if (sparar) return
    setSparar(beslut)
    setFel(null)
    try {
      await onSvara(f, beslut, meddelande.trim() || undefined)
    } catch (e) {
      setFel(e instanceof Error && e.message ? e.message : t('delningsforslag.kort.svarFel'))
    } finally {
      setSparar(null)
    }
  }

  const synligaFalt = DELNINGSFALT.filter((k) => f[k])
  const meddelandeId = `delningsforslag-medd-${f.id}`

  return (
    <article
      className="rounded-xl border border-[var(--c-accent)]/60 dark:border-stone-600 bg-white dark:bg-stone-800/60 p-4 space-y-4"
      aria-labelledby={`delningsforslag-rubrik-${f.id}`}
    >
      <div>
        <h3 id={`delningsforslag-rubrik-${f.id}`} className="font-semibold text-stone-900 dark:text-stone-100">
          {roll
            ? t('delningsforslag.kort.rubrik', { konsulent, roll, foretag })
            : t('delningsforslag.kort.rubrikUtanRoll', { konsulent, foretag })}
        </h3>
        {plats && (
          <ul className="mt-1 text-sm text-stone-600 dark:text-stone-400 flex flex-wrap gap-x-4 gap-y-0.5">
            <li>{insatstypEtikett(t, plats.placement_type)}</li>
            {plats.start_date && (
              <li>
                {plats.end_date
                  ? t('delningsforslag.kort.period', { fran: datum(plats.start_date), till: datum(plats.end_date) })
                  : t('delningsforslag.kort.periodFran', { fran: datum(plats.start_date) })}
              </li>
            )}
            {plats.hours_per_week != null && <li>{t('delningsforslag.kort.omfattning', { timmar: plats.hours_per_week })}</li>}
            {plats.schedule_days && <li>{t('delningsforslag.kort.dagar', { dagar: plats.schedule_days })}</li>}
          </ul>
        )}
        {f.expires_at && (
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {t('delningsforslag.kort.visasTill', { datum: datum(f.expires_at) })}
          </p>
        )}
      </div>

      {f.presentation_text && (
        <div>
          <h4 className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
            {t('delningsforslag.kort.presentationRubrik')}
          </h4>
          <blockquote className="border-l-4 border-[var(--c-accent)] pl-3 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
            {f.presentation_text}
          </blockquote>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
          {t('delningsforslag.kort.farSeRubrik')}
        </h4>
        <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-1">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[var(--c-text)] shrink-0" aria-hidden="true" />
            {t('delningsforslag.falt.namn')}
          </li>
          {synligaFalt.map((k) => (
            <li key={k} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--c-text)] shrink-0" aria-hidden="true" />
              {t(`delningsforslag.falt.${FALT_NYCKEL[k]}`)}
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-stone-500 dark:text-stone-400" aria-hidden="true" />
          <span>{t('delningsforslag.kort.aldrigSer')}</span>
        </p>
      </div>

      <div>
        <label htmlFor={meddelandeId} className="block text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
          {t('delningsforslag.kort.meddelandeEtikett', { konsulent })}
        </label>
        <textarea
          id={meddelandeId}
          value={meddelande}
          onChange={(e) => setMeddelande(e.target.value)}
          rows={2}
          maxLength={2000}
          aria-describedby={`${meddelandeId}-hjalp`}
          className={cn(
            'w-full resize-y rounded-xl border border-stone-300 dark:border-stone-600',
            'bg-white dark:bg-stone-800 px-3 py-2 text-sm',
            'text-stone-900 dark:text-stone-100 placeholder-stone-500',
            'focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] focus:border-transparent'
          )}
        />
        <p id={`${meddelandeId}-hjalp`} className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {t('delningsforslag.kort.meddelandeHjalp')}
        </p>
      </div>

      {fel && (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{fel}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="button" onClick={() => svara('accepted')} disabled={sparar !== null}>
          {sparar === 'accepted' ? t('delningsforslag.kort.sparar') : t('delningsforslag.kort.ja')}
        </Button>
        <Button type="button" variant="outline" onClick={() => svara('declined')} disabled={sparar !== null}>
          {sparar === 'declined' ? t('delningsforslag.kort.sparar') : t('delningsforslag.kort.nej')}
        </Button>
      </div>
    </article>
  )
}

function DelatRad({
  forslag: f,
  foretag,
  datum,
  onSlutaDela,
}: {
  forslag: DelningsforslagMedPlats
  foretag: string
  datum: (iso: string) => string
  onSlutaDela: (f: DelningsforslagMedPlats) => Promise<void>
}) {
  const { t } = useTranslation()
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const roll = f.consultant_work_placements?.occupation?.trim()

  const klick = async () => {
    if (sparar) return
    setSparar(true)
    setFel(null)
    try {
      await onSlutaDela(f)
    } catch (e) {
      setFel(e instanceof Error && e.message ? e.message : t('delningsforslag.kort.svarFel'))
    } finally {
      setSparar(false)
    }
  }

  const foretagsStatus =
    f.employer_response === 'interested' ? t('delningsforslag.delat.intresserad')
    : f.employer_response === 'declined' ? t('delningsforslag.delat.tackadeNej')
    : t('delningsforslag.delat.vantar')

  return (
    <li className="rounded-xl bg-stone-50 dark:bg-stone-800/50 p-3 flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-medium text-stone-900 dark:text-stone-100">
          {roll ? `${roll} · ${foretag}` : foretag}
        </p>
        {f.decided_at && (
          <p className="text-stone-600 dark:text-stone-400">{t('delningsforslag.delat.sedan', { datum: datum(f.decided_at) })}</p>
        )}
        <p className="text-stone-700 dark:text-stone-300">{foretagsStatus}</p>
        {f.employer_response === 'declined' && (
          <p className="text-stone-600 dark:text-stone-400">{t('delningsforslag.delat.tackadeNejTrost')}</p>
        )}
        {fel && <p role="alert" className="mt-1 text-amber-700 dark:text-amber-300">{fel}</p>}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={klick} disabled={sparar} className="shrink-0">
        {sparar ? t('delningsforslag.kort.sparar') : t('delningsforslag.delat.slutaDela')}
      </Button>
    </li>
  )
}
