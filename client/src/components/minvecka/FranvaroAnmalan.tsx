/**
 * FranvaroAnmalan — "Jag kan inte komma" på ett kommande pass i Min vecka (F1).
 *
 * Tre lägen: knapp → formulär (orsak + valfri rad till konsulenten) → bekräftat
 * ("Anmält: sjuk. Din konsulent har fått besked."). Inga hot, inga konsekvenser
 * uppräknade — det är konsulenten som bedömer skälet, och det står så. Ton:
 * lugn vän (DESIGN.md §2). Texterna finns också i Lätt svenska (sv-latt.json).
 *
 * RD27 (rollspelet 2026-09-27): den som är sjuk är sjuk hela dagen, ofta flera.
 * Anmälan frågar därför vad den gäller — bara passet, hela dagen eller flera
 * dagar — och anmäler alla pass i perioden på en gång, också eget jobbsökande.
 * RD26: ett fel behåller allt hon valt och skrivit, och erbjuder Försök igen.
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SkrivFel } from '@/components/ui/SkrivFel'
import { useSkrivning } from '@/components/ui/useSkrivning'
import type { ActivitySession } from '@/services/aktivitetApi'
import {
  FRANVARO_ORSAKER,
  franvaroApi,
  franvaroAv,
  kanAnmalaFranvaro,
  periodensSistaDag,
  type FranvaroOrsak,
  type Omfattning,
} from '@/services/franvaroApi'
import { konsulentMeddelandeApi } from '@/services/konsulentMeddelandeApi'

/**
 * Ett konsulentmöte (RD4). `tid` = HH:MM lokal tid. `datum` (YYYY-MM-DD) behövs
 * för att RD27:s period ska kunna fråga om möten på andra dagar; utan datum
 * räknas mötet som samma dag som passet.
 */
export interface MoteSammaDag {
  id: string
  tid: string
  datum?: string
}

interface Props {
  session: ActivitySession
  onSaved: (session: ActivitySession) => void
  /**
   * RD4 (rollspelet 2026-09-27): möten med konsulenten. Efter en anmälan frågar
   * komponenten om den gäller mötet också — anmälan på ett pass sa tidigare
   * ingenting om mötet kl 12. RD27: möten inom en anmäld period räknas också.
   */
  motenSammaDag?: readonly MoteSammaDag[]
  /** Datum i läsbar form för meddelandet om mötet (samma som rubriken i Min vecka). */
  datumText?: string
  /**
   * RD27: passen samma dag (inklusive det här). Med fler än ett anmälningsbart
   * pass visas valet "Hela dagen".
   */
  passSammaDag?: readonly ActivitySession[]
  /** RD27: efter en anmälan av flera pass. Saknas den anropas `onSaved` per pass. */
  onSavedFlera?: (sessions: ActivitySession[]) => void
  /** Testkrok: "nu" för att avgöra om passet är kommande. */
  nu?: Date
}

interface Val {
  orsak: FranvaroOrsak
  notering: string
  omfattning: Omfattning
  till: string
}

export function FranvaroAnmalan({
  session,
  onSaved,
  motenSammaDag = [],
  datumText,
  passSammaDag = [],
  onSavedFlera,
  nu,
}: Props) {
  const { t, i18n } = useTranslation()
  const gruppId = useId()
  const [oppen, setOppen] = useState(false)
  const [orsak, setOrsak] = useState<FranvaroOrsak | null>(null)
  const [notering, setNotering] = useState('')
  const [omfattning, setOmfattning] = useState<Omfattning>('pass')
  const [till, setTill] = useState('')
  const [angrar, setAngrar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  // RD4: frågan om mötet visas en gång, direkt efter anmälan.
  const [moteFraga, setMoteFraga] = useState<'fraga' | 'skickar' | 'skickat' | 'fel' | null>(null)
  // Perioden som anmäldes — för frågan om möten efteråt.
  const [anmald, setAnmald] = useState({ fran: session.date, till: session.date })

  const anmalan = franvaroAv(session)
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'sv-SE'
  const dagensAnmalbara = passSammaDag.filter((s) => s.date === session.date && kanAnmalaFranvaro(s, nu))
  const kanHelaDagen = dagensAnmalbara.length > 1
  const sistaDag = periodensSistaDag(session.date)
  const langtDatum = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })

  const motenInom = (fran: string, slut: string) =>
    motenSammaDag.filter((m) => {
      const d = m.datum ?? session.date
      return d >= fran && d <= slut
    })

  // RD26: skrivningen går genom useSkrivning — ett fel kan inte sväljas, och
  // "Försök igen" gör samma anmälan en gång till med samma val.
  const anmalning = useSkrivning(async (val: Val) => {
    const fran = session.date
    const slut = val.omfattning === 'period' ? val.till : fran
    if (val.omfattning === 'pass') {
      onSaved(await franvaroApi.anmal(session.id, { orsak: val.orsak, notering: val.notering }))
    } else {
      const uppdaterade = await franvaroApi.anmalPeriod(fran, slut, { orsak: val.orsak, notering: val.notering }, nu)
      if (uppdaterade.length === 0) throw new Error('Inga pass att anmäla i perioden')
      if (onSavedFlera) onSavedFlera(uppdaterade)
      else uppdaterade.forEach(onSaved)
    }
    setAnmald({ fran, till: slut })
    setOppen(false)
    if (motenInom(fran, slut).length > 0) setMoteFraga('fraga')
  })
  const skickar = anmalning.lage === 'skickar'

  if (anmalan) {
    // Redan anmält — konsulenten bekräftar; deltagaren kan ångra tills dess.
    const nar = new Date(anmalan.reportedAt).toLocaleString(locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    const berorda = motenInom(anmald.fran, anmald.till)
    const flerDagar = anmald.till > anmald.fran
    const motesText = berorda
      .map((m) =>
        flerDagar
          ? t('minVecka.mote.dagOchTid', { defaultValue: '{{dag}} kl {{tid}}', dag: langtDatum(m.datum ?? session.date), tid: m.tid })
          : m.tid,
      )
      .join(` ${t('minVecka.mote.och', 'och')} `)
    return (
      <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-3 text-sm">
        <p className="text-stone-800 dark:text-stone-200">
          {t('minVecka.franvaro.anmalt', {
            defaultValue: 'Anmält: {{orsak}}. Din konsulent har fått besked ({{nar}}).',
            orsak: t(`minVecka.franvaro.orsak.${anmalan.reason}`),
            nar,
          })}
        </p>
        {anmalan.note && <p className="mt-1 text-stone-600 dark:text-stone-400">„{anmalan.note}”</p>}
        {!session.attendance && (
          <button
            type="button"
            className="mt-2 text-xs underline underline-offset-2 text-stone-700 dark:text-stone-300"
            disabled={angrar}
            onClick={async () => {
              setAngrar(true); setFel(null)
              try { onSaved(await franvaroApi.angra(session.id)) }
              catch { setFel(t('minVecka.franvaro.fel', 'Det gick inte att spara. Försök igen, eller skriv till din konsulent.')) }
              finally { setAngrar(false) }
            }}
          >
            {t('minVecka.franvaro.angra', 'Ångra anmälan')}
          </button>
        )}
        {fel && <p role="alert" className="mt-1 text-red-700 dark:text-red-300">{fel}</p>}
        {moteFraga && berorda.length > 0 && (
          <MoteFraga
            tid={motesText}
            flerDagar={flerDagar}
            lage={moteFraga}
            onJa={async (tid) => {
              setMoteFraga('skickar')
              try {
                await konsulentMeddelandeApi.skickaTillMinKonsulent(
                  flerDagar
                    ? t('minVecka.mote.meddelandePeriod', {
                        defaultValue: 'Hej! Jag har anmält att jag inte kan komma från {{fran}} till {{till}}. Det gäller också vårt möte {{tid}}.',
                        fran: langtDatum(anmald.fran),
                        till: langtDatum(anmald.till),
                        tid,
                      })
                    : t('minVecka.mote.meddelande', {
                        defaultValue: 'Hej! Jag har anmält att jag inte kan komma till {{titel}} på {{datum}}. Det gäller också vårt möte kl {{tid}} samma dag.',
                        titel: session.title,
                        datum: datumText ?? session.date,
                        tid,
                      }),
                )
                setMoteFraga('skickat')
              } catch {
                setMoteFraga('fel')
              }
            }}
            onNej={() => setMoteFraga(null)}
          />
        )}
      </div>
    )
  }

  if (!kanAnmalaFranvaro(session, nu)) return null

  if (!oppen) {
    return (
      <Button variant="outline" className="min-h-12 w-full sm:w-auto" onClick={() => setOppen(true)}>
        {t('minVecka.franvaro.knapp', 'Jag kan inte komma')}
      </Button>
    )
  }

  const skicka = async () => {
    if (!orsak) { setFel(t('minVecka.franvaro.valjOrsak', 'Välj vad som hindrar dig.')); return }
    if (omfattning === 'period' && (!till || till <= session.date || till > sistaDag)) {
      setFel(t('minVecka.franvaro.valjTill', { defaultValue: 'Välj ett datum efter {{fran}}, högst två veckor fram.', fran: langtDatum(session.date) }))
      return
    }
    setFel(null)
    await anmalning.kor({ orsak, notering, omfattning, till })
  }

  const omfattningar: Omfattning[] = kanHelaDagen ? ['pass', 'dag', 'period'] : ['pass', 'period']

  return (
    <form
      className="rounded-lg border border-stone-200 dark:border-stone-700 p-3 space-y-3"
      aria-labelledby={`${gruppId}-rubrik`}
      onSubmit={(e) => { e.preventDefault(); void skicka() }}
    >
      <p id={`${gruppId}-rubrik`} className="text-sm text-stone-800 dark:text-stone-200">
        {t('minVecka.franvaro.rubrik', 'Vad hindrar dig? Din konsulent får besked direkt.')}
      </p>
      <div role="radiogroup" aria-labelledby={`${gruppId}-rubrik`} className="grid gap-2 sm:grid-cols-2">
        {FRANVARO_ORSAKER.map((o) => (
          <label key={o} className="flex items-center gap-2 rounded-md border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm cursor-pointer has-[:checked]:border-[var(--c-solid)]">
            <input type="radio" name={`${gruppId}-orsak`} value={o} checked={orsak === o} onChange={() => setOrsak(o)} className="accent-[var(--c-solid)]" />
            <span>{t(`minVecka.franvaro.orsak.${o}`)}</span>
          </label>
        ))}
      </div>

      {/* RD27: vad anmälan gäller */}
      <fieldset className="space-y-2">
        <legend className="text-sm text-stone-800 dark:text-stone-200">
          {t('minVecka.franvaro.omfattning.rubrik', 'Vad gäller det?')}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {omfattningar.map((o) => (
            <label key={o} className="flex items-center gap-2 rounded-md border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm cursor-pointer has-[:checked]:border-[var(--c-solid)]">
              <input
                type="radio"
                name={`${gruppId}-omfattning`}
                value={o}
                checked={omfattning === o}
                onChange={() => setOmfattning(o)}
                className="accent-[var(--c-solid)]"
              />
              <span>
                {o === 'pass'
                  ? t('minVecka.franvaro.omfattning.pass', 'Bara det här passet')
                  : o === 'dag'
                    ? t('minVecka.franvaro.omfattning.dag', { defaultValue: 'Hela dagen ({{count}} pass)', count: dagensAnmalbara.length })
                    : t('minVecka.franvaro.omfattning.period', 'Flera dagar')}
              </span>
            </label>
          ))}
        </div>
        {omfattning === 'period' && (
          <div>
            <label htmlFor={`${gruppId}-till`} className="block text-xs text-stone-600 dark:text-stone-400 mb-1">
              {t('minVecka.franvaro.omfattning.till', 'Till och med')}
            </label>
            <input
              id={`${gruppId}-till`}
              type="date"
              value={till}
              min={session.date}
              max={sistaDag}
              onChange={(e) => setTill(e.target.value)}
              className="min-h-11 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 text-sm text-stone-900 dark:text-stone-100"
            />
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              {t('minVecka.franvaro.omfattning.periodHjalp', 'Alla dina pass de dagarna anmäls, också eget jobbsökande. Du kan ångra varje pass för sig.')}
            </p>
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor={`${gruppId}-notering`} className="block text-xs text-stone-600 dark:text-stone-400 mb-1">
          {t('minVecka.franvaro.noteringEtikett', 'Vill du säga något mer? (frivilligt)')}
        </label>
        <textarea
          id={`${gruppId}-notering`}
          value={notering}
          onChange={(e) => setNotering(e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
        />
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        {t('minVecka.franvaro.bedomning', 'Det är din konsulent som avgör om skälet är giltigt. Anmäl hellre en gång för mycket än en gång för lite.')}
      </p>
      {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
      {anmalning.lage === 'fel' && (
        <SkrivFel
          extra={t('skrivfel.minKonsulent', 'Du kan också skriva eller ringa till din konsulent från sidan Min konsulent.')}
          onForsokIgen={() => { void anmalning.forsokIgen() }}
          forsoker={skickar}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="min-h-12" disabled={skickar}>
          {t('minVecka.franvaro.skicka', 'Skicka till min konsulent')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-12"
          onClick={() => { setOppen(false); setFel(null); anmalning.nollstall() }}
          disabled={skickar}
        >
          {t('minVecka.franvaro.avbryt', 'Avbryt')}
        </Button>
      </div>
    </form>
  )
}

interface MoteFragaProps {
  tid: string
  /** RD27: anmälan gäller flera dagar — `tid` innehåller då dag och klockslag. */
  flerDagar?: boolean
  lage: 'fraga' | 'skickar' | 'skickat' | 'fel'
  onJa: (tid: string) => void
  onNej: () => void
}

/** "Gäller det också mötet kl 12?" — två lugna val, inget förvalt. */
function MoteFraga({ tid, flerDagar = false, lage, onJa, onNej }: MoteFragaProps) {
  const { t } = useTranslation()
  if (lage === 'skickat') {
    return (
      <p role="status" className="mt-2 text-emerald-700 dark:text-emerald-300">
        {t('minVecka.mote.skickat', 'Din konsulent har fått besked om mötet också.')}
      </p>
    )
  }
  return (
    <div className="mt-3 border-t border-stone-200 dark:border-stone-700 pt-3 space-y-2">
      <p className="text-stone-800 dark:text-stone-200">
        {flerDagar
          ? t('minVecka.mote.fragaPeriod', { defaultValue: 'Gäller det också mötet med din konsulent {{tid}}?', tid })
          : t('minVecka.mote.fraga', { defaultValue: 'Gäller det också mötet med din konsulent kl {{tid}}?', tid })}
      </p>
      {lage === 'fel' && (
        <p role="alert" className="text-red-700 dark:text-red-300">
          {t('minVecka.mote.fel', 'Beskedet om mötet gick inte att skicka just nu. Du kan skriva eller ringa till din konsulent från sidan Min konsulent.')}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11" disabled={lage === 'skickar'} onClick={() => onJa(tid)}>
          {t('minVecka.mote.ja', 'Ja, meddela om mötet också')}
        </Button>
        <Button variant="ghost" className="min-h-11" disabled={lage === 'skickar'} onClick={onNej}>
          {t('minVecka.mote.nej', 'Nej, jag kommer till mötet')}
        </Button>
      </div>
    </div>
  )
}
