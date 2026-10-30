/**
 * AIX4 — bygg en intervjuberättelse av ett eget minne.
 *
 * Tillståndet bor här, inte i `InterviewSimulatorInner` (där den pågående
 * övningen bor): att bygga en berättelse är ett eget flöde som ska överleva att
 * övningen startas och avslutas. Till simulatorn går bara ett enda anrop,
 * `onOva`, med den färdiga berättelsen.
 *
 * Det som visas är det servern lämnar. Saknas ett steg står det "Saknas", inte
 * en gissning — och framför allt aldrig ett påhittat resultat.
 */
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AIGeneratedWatermark } from '@/components/ai/AIBadge'
import { RefreshCw, Save, Play } from '@/components/ui/icons'
import {
  STAR_STEG,
  STAR_ARTIKEL_SLUG,
  HANDELSE_MAX,
  SVAR_MAX,
  byggBerattelse,
  lasBerattelser,
  raderaBerattelse,
  sparaBerattelse,
  type BerattelseResultat,
  type BerattelseSvar,
  type SparadBerattelse,
  type StarSteg,
  type StarStegText,
} from '@/services/berattelseApi'

export interface OvningsBerattelse {
  steg: StarStegText
}

interface Props {
  /** Startar en övning på berättelsen. Simulatorn äger övningen. */
  onOva: (b: OvningsBerattelse) => void
  disabled?: boolean
}

export function BerattelseByggare({ onOva, disabled }: Props) {
  const { t } = useTranslation()
  const id = useId()
  const [oppen, setOppen] = useState(false)
  const [handelse, setHandelse] = useState('')
  const [svar, setSvar] = useState<BerattelseSvar[]>([])
  const [nuSvar, setNuSvar] = useState('')
  const [resultat, setResultat] = useState<BerattelseResultat | null>(null)
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [sparade, setSparade] = useState<SparadBerattelse[]>(() => lasBerattelser())
  const [sparat, setSparat] = useState(false)

  const stegNamn: Record<StarSteg, string> = {
    situation: t('interviewSimulator.story.step.situation', 'Situationen'),
    uppgift: t('interviewSimulator.story.step.uppgift', 'Din uppgift'),
    handling: t('interviewSimulator.story.step.handling', 'Det du gjorde'),
    resultat: t('interviewSimulator.story.step.resultat', 'Vad som hände efteråt'),
  }

  const kor = async (nyaSvar: BerattelseSvar[]) => {
    setLaddar(true)
    setFel(null)
    try {
      const r = await byggBerattelse(handelse, nyaSvar)
      setSvar(nyaSvar)
      setResultat(r)
      setNuSvar('')
      setSparat(false)
    } catch {
      setFel(t('interviewSimulator.story.error', 'Det gick inte att bygga berättelsen just nu. Det du skrivit finns kvar — försök igen om en stund.'))
    } finally {
      setLaddar(false)
    }
  }

  const borja = () => {
    if (handelse.trim().length < 20 || laddar) return
    void kor([])
  }

  const svara = () => {
    if (!nuSvar.trim() || laddar || !resultat) return
    void kor([...svar, { steg: resultat.fragaSteg ?? undefined, text: nuSvar.trim() }])
  }

  const nollstall = () => {
    setHandelse('')
    setSvar([])
    setNuSvar('')
    setResultat(null)
    setFel(null)
    setSparat(false)
  }

  const spara = () => {
    if (!resultat) return
    setSparade(sparaBerattelse(resultat))
    setSparat(true)
  }

  const harHandling = !!resultat?.steg.handling
  const klar = !!resultat && STAR_STEG.every((k) => resultat.steg[k])

  return (
    <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm">
      <button
        type="button"
        onClick={() => setOppen((o) => !o)}
        aria-expanded={oppen}
        aria-controls={`${id}-innehall`}
        className="w-full text-left"
      >
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
          {t('interviewSimulator.story.title', 'Gör ett minne till en intervjuberättelse')}
        </h2>
        <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">
          {t('interviewSimulator.story.intro', 'Berätta om något du varit med om. Vi ställer en fråga i taget och sätter dina egna ord i ordning — vi lägger inte till något.')}
        </p>
      </button>

      {oppen && (
        <div id={`${id}-innehall`} className="mt-5 space-y-5">
          {!resultat && (
            <div>
              <label htmlFor={`${id}-handelse`} className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                {t('interviewSimulator.story.eventLabel', 'En gång då du löste något, hjälpte någon eller lärde dig något')}
              </label>
              <textarea
                id={`${id}-handelse`}
                value={handelse}
                onChange={(e) => setHandelse(e.target.value)}
                maxLength={HANDELSE_MAX}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                placeholder={t('interviewSimulator.story.eventPlaceholder', 'Skriv som du pratar. Det behöver inte vara snyggt.')}
              />
              <p className="text-sm text-stone-700 dark:text-stone-300 mt-2">
                {t('interviewSimulator.story.privacy', 'Berättelsen sparas bara i den här webbläsaren. Skriv inte namn på andra personer.')}
              </p>
              <Button
                onClick={borja}
                disabled={handelse.trim().length < 20 || laddar || disabled}
                aria-busy={laddar}
                className="mt-3 bg-[var(--c-solid)] hover:brightness-[1.08] text-white font-medium rounded-xl"
              >
                {laddar
                  ? <RefreshCw className="w-5 h-5 animate-spin" aria-label={t('common.loadingStatus', 'Laddar')} />
                  : t('interviewSimulator.story.start', 'Gå vidare')}
              </Button>
            </div>
          )}

          {resultat && (
            <div className="space-y-4" aria-live="polite">
              <ol className="space-y-2 list-none p-0 m-0">
                {STAR_STEG.map((k) => {
                  const text = resultat.steg[k]
                  return (
                    <li key={k} className="p-3 rounded-lg bg-stone-50 dark:bg-stone-700">
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{stegNamn[k]}</p>
                      {text ? (
                        <p className="text-stone-800 dark:text-stone-100">{text}</p>
                      ) : (
                        <p className="text-sm text-stone-700 dark:text-stone-300">
                          {t('interviewSimulator.story.missing', 'Saknas ännu — det du skriver här blir ditt eget svar, inte vårt.')}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ol>

              {resultat.struket.length > 0 && (
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {t('interviewSimulator.story.struck', 'Vi tog bort något som inte stod i det du skrivit. Bara dina egna ord får vara med.')}
                </p>
              )}

              {resultat.fraga && (
                <div>
                  <label htmlFor={`${id}-svar`} className="block font-medium text-stone-800 dark:text-stone-100 mb-2">
                    {resultat.fraga}
                  </label>
                  <textarea
                    id={`${id}-svar`}
                    value={nuSvar}
                    onChange={(e) => setNuSvar(e.target.value)}
                    maxLength={SVAR_MAX}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      onClick={svara}
                      disabled={!nuSvar.trim() || laddar}
                      aria-busy={laddar}
                      className="bg-[var(--c-solid)] hover:brightness-[1.08] text-white font-medium rounded-xl"
                    >
                      {laddar
                        ? <RefreshCw className="w-5 h-5 animate-spin" aria-label={t('common.loadingStatus', 'Laddar')} />
                        : t('interviewSimulator.story.answer', 'Svara')}
                    </Button>
                  </div>
                </div>
              )}

              {klar && resultat.sammanstallning && (
                <div className="p-4 rounded-xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/25 border border-[var(--c-accent)]">
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">
                    {t('interviewSimulator.story.summaryTitle', 'Din berättelse, i ordning')}
                  </h3>
                  <p className="text-stone-800 dark:text-stone-100">{resultat.sammanstallning}</p>
                  <p className="text-sm text-stone-700 dark:text-stone-300 mt-2">
                    {resultat.kalla === 'ai'
                      ? t('interviewSimulator.story.summaryAi', 'Ordnad av AI av det du skrivit. Läs igenom — stämmer inget, så gäller det du själv sa.')
                      : t('interviewSimulator.story.summaryOwn', 'Det här är dina egna meningar, i ordning.')}
                  </p>
                  {resultat.kalla === 'ai' && <AIGeneratedWatermark contentType="text" />}
                </div>
              )}

              {!klar && harHandling && (
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {t('interviewSimulator.story.partial', 'Du kan öva redan nu. Det som saknas kan du fylla i själv när du berättar.')}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => resultat && onOva({ steg: resultat.steg })}
                  disabled={!harHandling || laddar || disabled}
                  className="bg-[var(--c-solid)] hover:brightness-[1.08] text-white font-medium rounded-xl"
                >
                  <Play className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t('interviewSimulator.story.practice', 'Öva den här berättelsen')}
                </Button>
                <Button variant="outline" onClick={spara} disabled={sparat} className="rounded-xl">
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                  {sparat ? t('interviewSimulator.story.saved', 'Sparad') : t('interviewSimulator.story.save', 'Spara i webbläsaren')}
                </Button>
                <Button variant="outline" onClick={nollstall} className="rounded-xl">
                  {t('interviewSimulator.story.startOver', 'Börja om med ett nytt minne')}
                </Button>
              </div>
              <Link
                to={'/knowledge-base/article/' + STAR_ARTIKEL_SLUG}
                className="inline-block text-sm text-[var(--c-text)] dark:text-stone-200 underline"
              >
                {t('interviewSimulator.story.readMore', 'Läs om STAR-metoden')}
              </Link>
            </div>
          )}

          {fel && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>
          )}

          {sparade.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-2">
                {t('interviewSimulator.story.savedTitle', 'Dina sparade berättelser')}
              </h3>
              <ul className="space-y-2 list-none p-0 m-0">
                {sparade.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 p-3 rounded-lg bg-stone-50 dark:bg-stone-700">
                    <p className="flex-1 text-sm text-stone-800 dark:text-stone-100 line-clamp-2">
                      {b.steg.situation || b.steg.handling || ''}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOva({ steg: b.steg })}
                      disabled={disabled}
                      className="rounded-xl"
                    >
                      {t('interviewSimulator.story.practiceShort', 'Öva')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSparade(raderaBerattelse(b.id))}
                      className="rounded-xl"
                    >
                      {t('interviewSimulator.story.delete', 'Ta bort')}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

