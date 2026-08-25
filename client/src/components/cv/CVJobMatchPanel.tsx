/**
 * "Vilket av mina CV passar det här jobbet bäst?"
 *
 * Kör AI-matchningen (`cv-jobbmatchning` i client/api/ai.js — samma funktion
 * som JobAdaptPanel i CV-byggaren) mot VARJE sparat CV och rangordnar dem mot
 * en och samma annons. Annonsen hämtas antingen från personens sparade jobb
 * eller klistras in.
 *
 * Fyra saker som är avsiktliga:
 *
 * 1. **Ett CV som inte kunde granskas visas som just det** — aldrig som 0 %.
 *    Ett fel och ett dåligt CV får inte se likadana ut.
 * 2. **Takgränsen sägs ut.** `cv-jobbmatchning` har 10 anrop per 15 minuter.
 *    Har personen fler CV än så granskas de senaste och resten namnges — tyst
 *    avkortning läser som "alla är granskade".
 * 3. **Anropen körs ett i taget**, inte parallellt. Tio samtidiga anrop hade
 *    slagit i samma tak direkt och gett halva listan fel.
 * 4. **Matchningen är AI:ns bedömning, inte ett betyg på personen.** Texten
 *    säger det, och procenten står aldrig ensam utan sina nyckelord.
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target, Loader2, Bookmark, ClipboardPaste, ChevronDown, ChevronUp,
  AlertCircle, Check, X, Sparkles
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { callAI } from '@/services/aiApi'
import { showToast } from '@/components/Toast'
import { jamforMotAnnons } from '@/services/atsNyckelord'
import type { CVData } from '@/services/supabaseApi'

/** Taket i client/api/ai.js: 10 anrop per 15 minuter för cv-jobbmatchning. */
const MAX_CV_PER_OMGANG = 10

interface CvForMatchning {
  id: string
  name: string
  data: CVData
}

interface CVJobMatchPanelProps {
  cvs: CvForMatchning[]
}

interface AiSvar {
  matchScore?: number
  foundKeywords?: string[]
  missingKeywords?: string[]
  suggestedSummaryAdditions?: string[]
  jobTitle?: string
  companyName?: string
}

/** Ett resultat per CV. `status` skiljer "granskad" från "gick inte att granska". */
interface Matchning {
  cvId: string
  cvNamn: string
  status: 'ok' | 'fel'
  poang?: number
  finns: string[]
  saknas: string[]
}

type Lage = 'sparat' | 'klistra'

/**
 * Bygger den text AI:n får se av ett CV. Samma sammanställning som
 * JobAdaptPanel använder, så poängen blir jämförbar mellan de två vyerna.
 */
function cvTillText(data: CVData): string {
  return [
    data.title || '',
    data.summary || '',
    (data.skills || []).map((s) => s.name).join(' '),
    (data.workExperience || []).map((w) => `${w.title || ''} ${w.company || ''} ${w.description || ''}`).join(' '),
    (data.education || []).map((e) => `${e.degree || ''} ${e.field || ''} ${e.school || ''}`).join(' '),
  ].join(' ').trim()
}

function poangfarg(poang: number): string {
  if (poang >= 70) return 'bg-emerald-600'
  if (poang >= 45) return 'bg-amber-600'
  return 'bg-stone-400'
}

export function CVJobMatchPanel({ cvs }: CVJobMatchPanelProps) {
  const { t } = useTranslation()
  const { savedJobs, isLoaded: sparadeLaddade } = useSavedJobs()

  const [oppen, setOppen] = useState(false)
  const [lage, setLage] = useState<Lage>('sparat')
  const [annonstext, setAnnonstext] = useState('')
  const [valtJobb, setValtJobb] = useState<string | null>(null)
  const [korning, setKorning] = useState<{ klara: number; totalt: number } | null>(null)
  const [resultat, setResultat] = useState<Matchning[] | null>(null)
  const [utfalltCv, setUtfalltCv] = useState<string | null>(null)
  const [utfalltOrdCv, setUtfalltOrdCv] = useState<string | null>(null)

  /**
   * O4 (2026-08-25): den lokala nyckelordskontrollen.
   *
   * Körs i webbläsaren, utan AI, så fort en annons är vald — alla CV, inte
   * bara de tio som ryms i AI-omgången, och även för den som stängt av AI.
   * Ingen text lämnar enheten och det finns ingen poäng: bara vilka av
   * annonsens ord som finns i CV:t och vilka som inte gör det.
   */
  const ordkontroll = useMemo(() => {
    const annons = annonstext.trim()
    if (!annons) return null
    return cvs
      .map((cv) => ({
        cvId: cv.id,
        cvNamn: cv.name,
        ...jamforMotAnnons(cvTillText(cv.data), annons),
      }))
      .sort((a, b) => b.finns.length - a.finns.length || a.cvNamn.localeCompare(b.cvNamn, 'sv'))
  }, [cvs, annonstext])

  // De CV som ryms i omgången — nyast först (listan kommer redan sorterad).
  const iOmgang = cvs.slice(0, MAX_CV_PER_OMGANG)
  const utanfor = cvs.length - iOmgang.length

  const granska = async () => {
    const annons = annonstext.trim()
    if (!annons || korning) return

    setResultat(null)
    setKorning({ klara: 0, totalt: iOmgang.length })

    const samlat: Matchning[] = []
    for (const cv of iOmgang) {
      try {
        const svar = await callAI<AiSvar>('cv-jobbmatchning', {
          jobDescription: annons.substring(0, 4000),
          cvText: cvTillText(cv.data).substring(0, 4000),
        })
        const analys = (svar as { analys?: AiSvar }).analys
        if (!analys || typeof analys.matchScore !== 'number') {
          throw new Error('Ogiltigt AI-svar')
        }
        samlat.push({
          cvId: cv.id,
          cvNamn: cv.name,
          status: 'ok',
          poang: Math.max(0, Math.min(100, Math.round(analys.matchScore))),
          finns: Array.isArray(analys.foundKeywords) ? analys.foundKeywords.slice(0, 10) : [],
          saknas: Array.isArray(analys.missingKeywords) ? analys.missingKeywords.slice(0, 10) : [],
        })
      } catch (e) {
        console.error(`Kunde inte matcha CV ${cv.name}:`, e)
        // Inget poängvärde sätts. Ett CV utan svar har ingen siffra — det är
        // hela skillnaden mot att skriva 0 och låta det se ut som en dom.
        samlat.push({ cvId: cv.id, cvNamn: cv.name, status: 'fel', finns: [], saknas: [] })
      }
      setKorning((f) => (f ? { ...f, klara: f.klara + 1 } : f))
    }

    // Granskade först, högsta poäng överst. De som föll hamnar sist.
    samlat.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'ok' ? -1 : 1
      return (b.poang ?? 0) - (a.poang ?? 0)
    })

    setResultat(samlat)
    setKorning(null)

    const misslyckade = samlat.filter((r) => r.status === 'fel').length
    if (misslyckade === samlat.length) {
      showToast.error(t('cv.jobMatch.allFailed', 'Ingen av granskningarna gick igenom. Försök igen om en stund.'))
    } else if (misslyckade > 0) {
      showToast.info(t('cv.jobMatch.someFailed', '{{antal}} av dina CV kunde inte granskas den här gången.', { antal: misslyckade }))
    }
  }

  const basta = resultat?.find((r) => r.status === 'ok')

  return (
    <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700/50 overflow-hidden">
      <button
        onClick={() => setOppen((v) => !v)}
        aria-expanded={oppen}
        aria-controls="cv-jobbmatchning-innehall"
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--c-bg)] flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('cv.jobMatch.title', 'Se vilket CV som passar ett jobb bäst')}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('cv.jobMatch.subtitle', 'Välj en annons så jämför vi alla dina sparade CV mot den.')}
            </p>
          </div>
        </div>
        {oppen
          ? <ChevronUp className="w-5 h-5 text-stone-500 flex-shrink-0" aria-hidden="true" />
          : <ChevronDown className="w-5 h-5 text-stone-500 flex-shrink-0" aria-hidden="true" />}
      </button>

      {oppen && (
        <div id="cv-jobbmatchning-innehall" className="px-5 pb-5 space-y-4 border-t border-stone-200 dark:border-stone-700/50 pt-4">
          {/* Var kommer annonsen ifrån? */}
          <div className="flex gap-2" role="tablist" aria-label={t('cv.jobMatch.sourceLabel', 'Välj annons')}>
            {([
              { id: 'sparat' as Lage, ikon: Bookmark, text: t('cv.jobMatch.fromSaved', 'Från sparade jobb') },
              { id: 'klistra' as Lage, ikon: ClipboardPaste, text: t('cv.jobMatch.paste', 'Klistra in annons') },
            ]).map((flik) => {
              const Ikon = flik.ikon
              const aktiv = lage === flik.id
              return (
                <button
                  key={flik.id}
                  role="tab"
                  aria-selected={aktiv}
                  onClick={() => setLage(flik.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    aktiv
                      ? 'bg-[var(--c-bg)] text-[var(--c-text)] border border-[var(--c-solid)]/40'
                      : 'text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                  )}
                >
                  <Ikon className="w-4 h-4" aria-hidden="true" />
                  {flik.text}
                </button>
              )
            })}
          </div>

          {lage === 'klistra' ? (
            <div>
              <label htmlFor="cv-match-annons" className="block text-sm font-medium text-stone-800 dark:text-stone-200 mb-1.5">
                {t('cv.jobMatch.pasteLabel', 'Klistra in hela jobbannonsen')}
              </label>
              <textarea
                id="cv-match-annons"
                rows={5}
                value={annonstext}
                onChange={(e) => { setAnnonstext(e.target.value); setValtJobb(null) }}
                placeholder={t('cv.jobMatch.pastePlaceholder', 'Klistra in annonstexten här…')}
                className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>
          ) : (
            <div>
              {!sparadeLaddade ? (
                <p className="text-sm text-stone-600 dark:text-stone-400 py-4 text-center">
                  {t('cv.jobMatch.loadingJobs', 'Hämtar dina sparade jobb…')}
                </p>
              ) : savedJobs.length === 0 ? (
                <p className="text-sm text-stone-600 dark:text-stone-400 py-4 text-center">
                  {t('cv.jobMatch.noSavedJobs', 'Du har inga sparade jobb än. Klistra in en annons i stället, eller spara ett jobb från Jobbsökningen.')}
                </p>
              ) : (
                <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {savedJobs.map((jobb) => {
                    const vald = valtJobb === jobb.id
                    const text = jobb.jobData?.description?.text || jobb.jobData?.headline || ''
                    return (
                      <li key={jobb.id}>
                        <button
                          onClick={() => { setValtJobb(jobb.id); setAnnonstext(text) }}
                          aria-pressed={vald}
                          className={cn(
                            'w-full text-left p-3 rounded-xl border transition-colors',
                            vald
                              ? 'border-[var(--c-solid)] bg-[var(--c-bg)]'
                              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                          )}
                        >
                          <span className="block font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                            {jobb.jobData?.headline || t('cv.jobMatch.untitledJob', 'Sparat jobb')}
                          </span>
                          <span className="block text-xs text-stone-600 dark:text-stone-400 truncate">
                            {jobb.jobData?.employer?.name || ''}
                            {jobb.jobData?.workplace_address?.municipality
                              ? ` • ${jobb.jobData.workplace_address.municipality}`
                              : ''}
                          </span>
                          {!text && (
                            <span className="block text-xs text-amber-700 dark:text-amber-400 mt-1">
                              {t('cv.jobMatch.noAdText', 'Den här annonsen saknar text — matchningen blir osäker.')}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Hur många CV som faktiskt granskas */}
          {utanfor > 0 && (
            <p className="text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
              {t('cv.jobMatch.capped', 'Du har {{totalt}} sparade CV. AI-granskningen klarar {{max}} åt gången, så de {{max}} senaste granskas nu.', { totalt: cvs.length, max: MAX_CV_PER_OMGANG })}
            </p>
          )}

          {ordkontroll && ordkontroll.length > 0 && ordkontroll[0].provade > 0 && (
            <section className="rounded-xl border border-stone-200 dark:border-stone-700 p-4">
              <h3 className="font-medium text-stone-900 dark:text-stone-100">
                {t('cv.jobMatch.keywords.title', 'Orden i annonsen')}
              </h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {t(
                  'cv.jobMatch.keywords.intro',
                  'Vi har jämfört annonsens {{antal}} vanligaste ord med dina CV. Räkningen sker i din webbläsare och är ingen bedömning — den visar bara vilka ord som saknas.',
                  { antal: ordkontroll[0].provade }
                )}
              </p>

              <ul className="mt-3 space-y-2">
                {ordkontroll.map((rad) => {
                  const utfalld = utfalltOrdCv === rad.cvId
                  return (
                    <li key={rad.cvId} className="rounded-lg border border-stone-200 dark:border-stone-700">
                      <button
                        onClick={() => setUtfalltOrdCv(utfalld ? null : rad.cvId)}
                        aria-expanded={utfalld}
                        aria-controls={`ordkontroll-${rad.cvId}`}
                        className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-lg"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                          {rad.cvNamn}
                        </span>
                        <span className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm tabular-nums text-stone-700 dark:text-stone-300">
                            {t('cv.jobMatch.keywords.count', '{{finns}} av {{totalt}} ord finns', {
                              finns: rad.finns.length,
                              totalt: rad.provade,
                            })}
                          </span>
                          {utfalld
                            ? <ChevronUp className="w-4 h-4 text-stone-500" aria-hidden="true" />
                            : <ChevronDown className="w-4 h-4 text-stone-500" aria-hidden="true" />}
                        </span>
                      </button>

                      {utfalld && (
                        <div id={`ordkontroll-${rad.cvId}`} className="px-3 pb-3 space-y-2">
                          {rad.saknas.length > 0 ? (
                            <div>
                              <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                                {t('cv.jobMatch.keywords.missing', 'Finns i annonsen men inte i det här CV:t')}
                              </p>
                              <ul className="mt-1 flex flex-wrap gap-1.5">
                                {rad.saknas.map((ord) => (
                                  <li key={ord} className="text-xs px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                    {ord}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm text-stone-700 dark:text-stone-300">
                              {t('cv.jobMatch.keywords.noneMissing', 'Alla ord vi tittade på finns redan i det här CV:t.')}
                            </p>
                          )}
                          <p className="text-xs text-stone-600 dark:text-stone-400">
                            {t('cv.jobMatch.keywords.caveat', 'Lägg bara till ord som stämmer på dig. Ett ord i CV:t som du inte kan svara på i en intervju hjälper ingen.')}
                          </p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <button
            onClick={granska}
            disabled={!annonstext.trim() || !!korning}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] text-white rounded-xl font-medium hover:brightness-110 disabled:opacity-50"
          >
            {korning
              ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              : <Sparkles className="w-4 h-4" aria-hidden="true" />}
            {korning
              ? t('cv.jobMatch.running', 'Granskar {{klara}} av {{totalt}}…', korning)
              : t('cv.jobMatch.start', 'Granska mina CV mot annonsen')}
          </button>

          {korning && (
            <p className="sr-only" role="status" aria-live="polite">
              {t('cv.jobMatch.running', 'Granskar {{klara}} av {{totalt}}…', korning)}
            </p>
          )}

          {/* Resultat */}
          {resultat && resultat.length > 0 && (
            <div className="space-y-3 pt-2">
              {basta && (
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {t('cv.jobMatch.bestMatch', 'Bäst träff just nu: {{namn}}. Siffran är AI:ns bedömning av hur väl CV:t täcker annonsens krav — inte ett betyg på dig.', { namn: basta.cvNamn })}
                </p>
              )}

              <ul className="space-y-2">
                {resultat.map((rad) => {
                  const utfalld = utfalltCv === rad.cvId
                  return (
                    <li key={rad.cvId} className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                      <button
                        onClick={() => setUtfalltCv(utfalld ? null : rad.cvId)}
                        aria-expanded={utfalld}
                        disabled={rad.status === 'fel'}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 disabled:hover:bg-transparent"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                            {rad.cvNamn}
                          </span>
                          {rad.status === 'ok' ? (
                            <span className="mt-1.5 flex items-center gap-2">
                              <span className="h-2 flex-1 max-w-[160px] rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                                <span
                                  className={cn('block h-full rounded-full', poangfarg(rad.poang ?? 0))}
                                  style={{ width: `${rad.poang ?? 0}%` }}
                                />
                              </span>
                              <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                                {rad.poang}%
                              </span>
                            </span>
                          ) : (
                            <span className="mt-1 flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
                              <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                              {t('cv.jobMatch.notReviewed', 'Kunde inte granskas den här gången')}
                            </span>
                          )}
                        </span>
                        {rad.status === 'ok' && (utfalld
                          ? <ChevronUp className="w-4 h-4 text-stone-500 flex-shrink-0" aria-hidden="true" />
                          : <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0" aria-hidden="true" />)}
                      </button>

                      {utfalld && rad.status === 'ok' && (
                        <div className="px-3 pb-3 space-y-3 border-t border-stone-200 dark:border-stone-700 pt-3">
                          <div>
                            <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                              {t('cv.jobMatch.found', 'Finns i CV:t')}
                            </h3>
                            {rad.finns.length > 0 ? (
                              <ul className="flex flex-wrap gap-1.5">
                                {rad.finns.map((ord) => (
                                  <li key={ord} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs">
                                    <Check className="w-3 h-3" aria-hidden="true" />{ord}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-stone-600 dark:text-stone-400">
                                {t('cv.jobMatch.noneFound', 'AI:n hittade inga av annonsens nyckelord i det här CV:t.')}
                              </p>
                            )}
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                              {t('cv.jobMatch.missing', 'Saknas — lägg gärna till om det stämmer på dig')}
                            </h3>
                            {rad.saknas.length > 0 ? (
                              <ul className="flex flex-wrap gap-1.5">
                                {rad.saknas.map((ord) => (
                                  <li key={ord} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs">
                                    <X className="w-3 h-3" aria-hidden="true" />{ord}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-stone-600 dark:text-stone-400">
                                {t('cv.jobMatch.noneMissing', 'AI:n hittade inget viktigt som saknas.')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default CVJobMatchPanel
