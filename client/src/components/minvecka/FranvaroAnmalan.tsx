/**
 * FranvaroAnmalan — "Jag kan inte komma" på ett kommande pass i Min vecka (F1).
 *
 * Tre lägen: knapp → formulär (orsak + vad det gäller + valfri rad) → bekräftat
 * ("Anmält: sjuk. Din konsulent har fått besked."). Inga hot, inga konsekvenser
 * uppräknade — det är konsulenten som bedömer skälet, och det står så. Ton:
 * lugn vän (DESIGN.md §2). Texterna finns också i Lätt svenska (sv-latt.json).
 *
 * RD27 (rollspelet 2026-09-27): den som är sjuk är sjuk hela dagen, ofta flera.
 * Anmälan frågar därför vad den gäller — bara passet, hela dagen eller flera
 * dagar — och anmäler alla pass i perioden på en gång, också eget jobbsökande.
 * RD26: ett fel behåller allt hon valt och skrivit, och erbjuder Försök igen.
 *
 * Omtaget steg 6 (2026-10-11): formuläret är förslagets skärm "Anmäl frånvaro".
 * Bilden "hemma i regn" överst, frågorna numrerade och en i taget nedåt, och
 * valen är stora tryckytor (minst 56 px) i stället för små radioknappar.
 * Radioknapparna finns kvar i DOM:en — tangentbord och skärmläsare får en
 * riktig radiogrupp, ögat får rutorna.
 */

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SkrivFel } from '@/components/ui/SkrivFel'
import { useSkrivning } from '@/components/ui/useSkrivning'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import type { KvarterNamn } from '@/components/ui/icons/kvarter/ritningar'
import { cn } from '@/lib/utils'
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
import type { PlanensRegelverk } from './planensRegelverk'

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

/** Bilden överst i formuläret (public/hemma, gjord i Jobin-stadens stil). */
export const HEMMA_REGN = '/hemma/hemma-regn.webp'
const HEMMA_REGN_LITEN = '/hemma/hemma-regn-560.webp'

const ORSAK_IKON: Record<FranvaroOrsak, KvarterNamn> = {
  sick: 'sjuk',
  child_care: 'hem',
  authority_meeting: 'handlaggare',
  other: 'meddelande',
}

const OMFATTNING_IKON: Record<Omfattning, KvarterNamn> = {
  pass: 'kalender',
  dag: 'tid',
  period: 'plan',
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
  /** Omtaget: formuläret öppet direkt (när "Jag kan inte komma" trycktes i nästa steg). */
  startaOppen?: boolean
  /** Anropas när formuläret stängs utan anmälan. */
  onAvbryt?: () => void
  /** Testkrok: "nu" för att avgöra om passet är kommande. */
  nu?: Date
  /**
   * KSL21: planens regelverk. Hos en Rusta och matcha-leverantör avgör
   * Arbetsförmedlingen om skälet godtas — inte konsulenten. Okänt: texten som förut.
   */
  regelverk?: PlanensRegelverk | null
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
  startaOppen = false,
  onAvbryt,
  nu,
  regelverk = null,
}: Props) {
  const { t, i18n } = useTranslation()
  const gruppId = useId()
  const [oppen, setOppen] = useState(startaOppen)
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
  const rubrikRef = useRef<HTMLHeadingElement>(null)

  // Formuläret som öppnas får fokus på sin rubrik, så skärmläsaren börjar där.
  useEffect(() => {
    if (oppen) rubrikRef.current?.focus()
  }, [oppen])

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
      <div className="rounded-j-m bg-s-vantar-bg p-4 text-[0.9375rem] text-j-blak" data-testid="franvaro-anmald">
        <p className="m-0 flex items-start gap-2.5">
          <KvarterIkon namn="franvaro" size={22} ton="vantar" className="mt-px shrink-0" />
          <span>
            {t('minVecka.franvaro.anmalt', {
              defaultValue: 'Anmält: {{orsak}}. Din konsulent har fått besked ({{nar}}).',
              orsak: t(`minVecka.franvaro.orsak.${anmalan.reason}`),
              nar,
            })}
          </span>
        </p>
        {anmalan.note && <p className="m-0 mt-1 pl-[34px] text-j-blak-2">„{anmalan.note}”</p>}
        {!session.attendance && (
          <Button
            ton="kvarter"
            variant="tertiary"
            size="sm"
            className="mt-1 ml-[22px] underline underline-offset-2"
            disabled={angrar}
            onClick={async () => {
              setAngrar(true); setFel(null)
              try { onSaved(await franvaroApi.angra(session.id)) }
              catch { setFel(t('minVecka.franvaro.fel', 'Det gick inte att spara. Försök igen, eller skriv till din konsulent.')) }
              finally { setAngrar(false) }
            }}
          >
            {t('minVecka.franvaro.angra', 'Ångra anmälan')}
          </Button>
        )}
        {fel && <p role="alert" className="m-0 mt-1 font-semibold text-s-ogiltig">{fel}</p>}
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
      <Button
        ton="kvarter"
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={() => setOppen(true)}
        leftIcon={<KvarterIkon namn="franvaro" size={20} ton="vantar" />}
      >
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

  const stang = () => {
    setOppen(false); setFel(null); anmalning.nollstall()
    onAvbryt?.()
  }

  const omfattningar: Omfattning[] = kanHelaDagen ? ['pass', 'dag', 'period'] : ['pass', 'period']

  return (
    <form
      className="overflow-hidden rounded-j-m border border-j-linje bg-j-kort text-j-blak shadow-j"
      aria-labelledby={`${gruppId}-titel`}
      data-testid="franvaro-formular"
      onSubmit={(e) => { e.preventDefault(); void skicka() }}
    >
      <img
        src={HEMMA_REGN}
        srcSet={`${HEMMA_REGN_LITEN} 560w, ${HEMMA_REGN} 900w`}
        sizes="(min-width: 700px) 640px, 100vw"
        alt=""
        aria-hidden="true"
        decoding="async"
        className="block h-28 w-full object-cover sm:h-36"
      />
      <div className="space-y-5 p-4 sm:p-5">
        <div>
          <h3
            id={`${gruppId}-titel`}
            ref={rubrikRef}
            tabIndex={-1}
            className="m-0 font-rubrik text-[1.375rem] font-bold leading-tight focus:outline-none"
          >
            {t('minVecka.franvaro.titel', 'Kan du inte komma?')}
          </h3>
          <p className="m-0 mt-1 text-[0.9375rem] leading-[1.45] text-j-blak-2">
            {t('minVecka.franvaro.galler', {
              defaultValue: 'Det gäller {{titel}}, {{dag}} kl {{tid}}. Berätta för din konsulent vad som hindrar dig. Det tar en minut.',
              titel: session.title,
              dag: langtDatum(session.date),
              tid: session.start_time.slice(0, 5),
            })}
          </p>
        </div>

        <Fraga nr={1} id={`${gruppId}-rubrik`} text={t('minVecka.franvaro.rubrik', 'Vad hindrar dig?')}>
          <div role="radiogroup" aria-labelledby={`${gruppId}-rubrik`} className="grid grid-cols-2 gap-2">
            {FRANVARO_ORSAKER.map((o) => (
              <Ruta
                key={o}
                namn={`${gruppId}-orsak`}
                varde={o}
                vald={orsak === o}
                onVal={() => { setOrsak(o); setFel(null) }}
                ikon={ORSAK_IKON[o]}
                etikett={t(`minVecka.franvaro.orsak.${o}`)}
              />
            ))}
          </div>
        </Fraga>

        {/* RD27: vad anmälan gäller */}
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 flex items-center gap-2 p-0 text-base font-semibold">
            <Nummer nr={2} />
            {t('minVecka.franvaro.omfattning.rubrik', 'Vad gäller det?')}
          </legend>
          <div className={cn('grid gap-2', omfattningar.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2')}>
            {omfattningar.map((o) => (
              <Ruta
                key={o}
                namn={`${gruppId}-omfattning`}
                varde={o}
                vald={omfattning === o}
                onVal={() => setOmfattning(o)}
                ikon={OMFATTNING_IKON[o]}
                etikett={
                  o === 'pass'
                    ? t('minVecka.franvaro.omfattning.pass', 'Bara det här passet')
                    : o === 'dag'
                      ? t('minVecka.franvaro.omfattning.dag', { defaultValue: 'Hela dagen ({{count}} pass)', count: dagensAnmalbara.length })
                      : t('minVecka.franvaro.omfattning.period', 'Flera dagar')
                }
              />
            ))}
          </div>
          {omfattning === 'period' && (
            <div className="mt-3">
              <label htmlFor={`${gruppId}-till`} className="mb-1 block">
                <span className="text-[0.9375rem] font-semibold">{t('minVecka.franvaro.omfattning.till', 'Till och med')}</span>
              </label>
              <input
                id={`${gruppId}-till`}
                type="date"
                value={till}
                min={session.date}
                max={sistaDag}
                onChange={(e) => setTill(e.target.value)}
                className="min-h-12 rounded-j-s border border-j-linje-2 bg-j-kort px-3 text-base text-j-blak focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--j-fokus)]"
              />
              <p className="m-0 mt-1 text-[0.9375rem] text-j-blak-2">
                {t('minVecka.franvaro.omfattning.periodHjalp', 'Alla dina pass de dagarna anmäls, också eget jobbsökande. Du kan ångra varje pass för sig.')}
              </p>
            </div>
          )}
        </fieldset>

        <div>
          <label htmlFor={`${gruppId}-notering`} className="mb-2 block text-base font-semibold">
            <span className="flex items-center gap-2 text-base font-semibold">
              <Nummer nr={3} />
              {t('minVecka.franvaro.noteringEtikett', 'Vill du säga något mer? (frivilligt)')}
            </span>
          </label>
          <textarea
            id={`${gruppId}-notering`}
            value={notering}
            onChange={(e) => setNotering(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full rounded-j-s border border-j-linje-2 bg-j-kort px-3 py-2.5 text-base text-j-blak focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--j-fokus)]"
          />
        </div>

        {fel && <p role="alert" className="m-0 font-semibold text-s-ogiltig">{fel}</p>}
        {anmalning.lage === 'fel' && (
          <SkrivFel
            extra={t('skrivfel.minKonsulent', 'Du kan också skriva eller ringa till din konsulent från sidan Min konsulent.')}
            onForsokIgen={() => { void anmalning.forsokIgen() }}
            forsoker={skickar}
          />
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button ton="kvarter" variant="primary" type="submit" className="w-full sm:w-auto" disabled={skickar}>
            {t('minVecka.franvaro.skicka', 'Skicka till min konsulent')}
          </Button>
          <Button ton="kvarter" variant="tertiary" type="button" className="w-full sm:w-auto" onClick={stang} disabled={skickar}>
            {t('minVecka.franvaro.avbryt', 'Avbryt')}
          </Button>
        </div>
        <p className="m-0 flex gap-2 text-[0.9375rem] leading-[1.45] text-j-blak-2">
          <KvarterIkon namn="klart" size={20} ton="gran" className="mt-px shrink-0" />
          {regelverk === 'leverantor'
            ? t('minVecka.franvaro.bedomningLeverantor', 'Din konsulent skriver ner det du anmäler. Det är Arbetsförmedlingen som avgör om skälet godtas. Anmäl hellre en gång för mycket än en gång för lite.')
            : t('minVecka.franvaro.bedomning', 'Det är din konsulent som avgör om skälet är giltigt. Anmäl hellre en gång för mycket än en gång för lite.')}
        </p>
      </div>
    </form>
  )
}

function Nummer({ nr }: { nr: number }) {
  return (
    <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-j-gran-mjuk text-[0.875rem] font-bold text-j-gran-text">
      {nr}
    </span>
  )
}

function Fraga({ nr, id, text, children }: { nr: number; id: string; text: string; children: ReactNode }) {
  return (
    <div>
      <p id={id} className="m-0 mb-2 flex items-center gap-2 text-base font-semibold">
        <Nummer nr={nr} />
        {text}
      </p>
      {children}
    </div>
  )
}

/** En stor valruta. Radioknappen finns kvar (sr-only) — rutan är dess etikett. */
function Ruta({ namn, varde, vald, onVal, ikon, etikett }: {
  namn: string
  varde: string
  vald: boolean
  onVal: () => void
  ikon: KvarterNamn
  etikett: string
}) {
  return (
    <label
      className={cn(
        'relative flex min-h-[56px] cursor-pointer items-center gap-2.5 rounded-j-m border px-3 py-2.5 text-[0.9375rem] font-semibold leading-5',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--j-fokus)]',
        vald ? 'border-2 border-j-gran bg-j-gran-mjuk text-j-blak' : 'border-j-linje-2 bg-j-kort text-j-blak hover:bg-j-sankt',
      )}
    >
      <input type="radio" name={namn} value={varde} checked={vald} onChange={onVal} className="sr-only" />
      {/* Inre flex: globala formulärregler på mobil kan göra label till block. */}
      <span className="flex w-full items-center gap-2.5 text-[0.9375rem] font-semibold leading-5">
        <KvarterIkon namn={ikon} size={22} ton={vald ? 'gran' : undefined} className="shrink-0" />
        <span className="min-w-0 flex-1">{etikett}</span>
        {vald ? <KvarterIkon namn="bock" size={18} className="shrink-0 text-j-gran-text" /> : null}
      </span>
    </label>
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
      <p role="status" className="m-0 mt-2 font-semibold text-s-narvarande">
        {t('minVecka.mote.skickat', 'Din konsulent har fått besked om mötet också.')}
      </p>
    )
  }
  return (
    <div className="mt-3 space-y-2 border-t border-j-linje pt-3">
      <p className="m-0">
        {flerDagar
          ? t('minVecka.mote.fragaPeriod', { defaultValue: 'Gäller det också mötet med din konsulent {{tid}}?', tid })
          : t('minVecka.mote.fraga', { defaultValue: 'Gäller det också mötet med din konsulent kl {{tid}}?', tid })}
      </p>
      {lage === 'fel' && (
        <p role="alert" className="m-0 font-semibold text-s-ogiltig">
          {t('minVecka.mote.fel', 'Beskedet om mötet gick inte att skicka just nu. Du kan skriva eller ringa till din konsulent från sidan Min konsulent.')}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button ton="kvarter" variant="secondary" disabled={lage === 'skickar'} onClick={() => onJa(tid)}>
          {t('minVecka.mote.ja', 'Ja, meddela om mötet också')}
        </Button>
        <Button ton="kvarter" variant="tertiary" disabled={lage === 'skickar'} onClick={onNej}>
          {t('minVecka.mote.nej', 'Nej, jag kommer till mötet')}
        </Button>
      </div>
    </div>
  )
}
