/**
 * Din bild utåt — en checklista över hur man syns för en arbetsgivare.
 *
 * Vad som togs bort 2026-08-21, och varför:
 *
 * · **Poängen på personen.** En 96 px ring med `strokeDashoffset`, talet i
 *   `text-2xl font-bold` mitt i, och under den en etikett med emoji:
 *   `🚀 Behöver arbete` i rosa, `💪 Potential att utveckla`, `👍 Bra grund`.
 *   Nämnaren var alla sexton frågor och täljaren bara de ikryssade, så den
 *   som ärligt gått igenom två frågor och svarat ja på båda fick **13 %**.
 *   Kortet slog dessutom upp så fort `Object.keys(answers).length > 0` — och
 *   `toggleAnswer` lämnar kvar `false`-poster, så det räckte att kryssa i
 *   och ur en enda ruta för att mötas av "0 % 🚀 Behöver arbete".
 *   DESIGN.md §2 regel 3 och Manifestet §1 förbjuder båda delarna.
 *   Kategorimärkena visade samma sak: fyra `0 %` i rad innan man börjat.
 *
 * · **Ett tillstånd bara seende kunde uppfatta.** De sexton frågorna var
 *   `<button onClick={toggleAnswer}>` utan `aria-pressed`, `role="checkbox"`
 *   eller `aria-checked`. Tillståndet bars av bakgrundsfärg och en ikon som
 *   lucide auto-sätter `aria-hidden` på. En skärmläsare hörde alltså
 *   "Har du en uppdaterad LinkedIn-profil?, knapp" — identiskt oavsett svar,
 *   för alla sexton, för alltid. Sidans kärninteraktion (SC 4.1.2).
 *
 * · **En `<Link>` inuti en `<button>`.** Ogiltig HTML; `stopPropagation`
 *   löste musklicket men inte nästlingen. Åtgärdslänken ligger nu utanför.
 *
 * · **"Återställ audit" återställde ingenting.** Knappen körde `setAnswers({})`,
 *   men spar-effekten inleds med `if (… Object.keys(answers).length === 0) return`
 *   — ett tomt objekt tog alltså den tidiga returen, molnraden behöll de
 *   gamla svaren, och vid nästa laddning kom alla kryss tillbaka. Användaren
 *   hade bekräftat "Vill du återställa alla svar?" och fått ett nej utan att
 *   få veta det.
 *
 * · **En historikrad per klick.** `personalBrandAuditsApi.create` låg inne i
 *   500 ms-debouncen, alltså en INSERT per ikryssad fråga — upp till sexton
 *   rader per genomgång, var och en med ett poängbetyg på personen. Hubbens
 *   "Senast idag" pekade på ett kryssklick, inte på en genomgång. Skrivs nu
 *   vid en uttrycklig handling.
 *
 * · **"Dina svar sparas automatiskt i molnet"** var osant: upserten mot
 *   `personal_brand_audit` angav `onConflict: 'user_id'` mot en tabell utan
 *   unikt index på den kolumnen, så Postgres svarade 42P10 varje gång och
 *   felet sväljdes. Se `cloudStorage.saveAuditAnswers`.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck, CheckCircle, Circle, Sparkles, Linkedin, FileText, Users,
  Target, ChevronRight, RefreshCw, AlertCircle, Loader2
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { showToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import { personalBrandApi } from '@/services/cloudStorage'
import { personalBrandAuditsApi } from '@/services/personalBrandAuditsApi'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AUDIT_FRAGOR, AUDIT_KATEGORIER, antalFragor, antalIkryssade, harBorjat,
  type AuditKategori,
} from './auditFragor'

const KATEGORI_IKON: Record<AuditKategori, typeof Linkedin> = {
  online: Linkedin,
  content: FileText,
  network: Users,
  consistency: Target,
}

export default function BrandAuditTab() {
  const { t } = useTranslation()
  const { confirm } = useConfirmDialog()

  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [laddningsfel, setLaddningsfel] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sparfel, setSparfel] = useState(false)
  const [expandedTip, setExpandedTip] = useState<string | null>(null)
  const [sparadGenomgang, setSparadGenomgang] = useState(false)

  const laddaSvar = useCallback(async () => {
    setIsLoading(true)
    setLaddningsfel(false)
    try {
      setAnswers(await personalBrandApi.getAuditAnswers())
    } catch (err) {
      // `try/finally` utan `catch` gjorde ett läsfel till en tom checklista
      // utan ett ord — samma sak som "du har inte börjat".
      console.error('Varumärkeskollen: kunde inte hämta svaren', err)
      setLaddningsfel(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void laddaSvar() }, [laddaSvar])

  /** Sparar svaren. Anropas explicit, inte av en effekt på varje ändring. */
  const spara = useCallback(async (nya: Record<string, boolean>) => {
    setIsSaving(true)
    setSparfel(false)
    try {
      const kategoripoang = Object.fromEntries(
        AUDIT_KATEGORIER.map(k => [k, antalIkryssade(nya, k)])
      )
      await personalBrandApi.saveAuditAnswers(nya, antalIkryssade(nya), kategoripoang)
      return true
    } catch (err) {
      console.error('Varumärkeskollen: kunde inte spara', err)
      setSparfel(true)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Autospar med debounce — men bara av SVAREN. Historikraden skrivs inte här.
  useEffect(() => {
    if (isLoading || laddningsfel) return
    const timeout = setTimeout(() => { void spara(answers) }, 500)
    return () => clearTimeout(timeout)
  }, [answers, isLoading, laddningsfel, spara])

  const toggleAnswer = (id: string) => {
    setSparadGenomgang(false)
    setAnswers(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const ikryssade = antalIkryssade(answers)
  const borjat = harBorjat(answers)

  /**
   * Historikraden skrivs när användaren säger att hon är klar för nu — inte
   * vid varje kryss. Det är den raden hubbarna läser som "senaste
   * genomgången".
   */
  const sparaGenomgang = async () => {
    const ok = await spara(answers)
    if (!ok) return
    try {
      await personalBrandAuditsApi.create({
        score: ikryssade,
        dimensions: Object.fromEntries(AUDIT_KATEGORIER.map(k => [k, antalIkryssade(answers, k)])),
        summary: undefined,
      })
      setSparadGenomgang(true)
      showToast.success(t('personalBrand.audit.savedRound'))
    } catch (err) {
      console.error('Varumärkeskollen: kunde inte spara genomgången', err)
      showToast.error(t('personalBrand.audit.saveFailed'))
    }
  }

  const aterstall = async () => {
    const bekraftat = await confirm({
      title: t('personalBrand.audit.resetTitle'),
      message: t('personalBrand.audit.resetBody'),
      confirmText: t('personalBrand.audit.resetConfirm'),
      variant: 'danger',
    })
    if (!bekraftat) return

    // Skriv tomt till molnet FÖRE state-uppdateringen. Den gamla knappen
    // satte bara `setAnswers({})`, och den tomma mängden tog den tidiga
    // returen i spar-effekten — molnraden rördes aldrig.
    const ok = await spara({})
    if (!ok) {
      showToast.error(t('personalBrand.audit.resetFailed'))
      return
    }
    setAnswers({})
    setSparadGenomgang(false)
    showToast.success(t('personalBrand.audit.resetDone'))
  }

  /**
   * Förslag härleds ur frågor användaren INTE kryssat i — vilket bara säger
   * något när hon faktiskt svarat. Före rättelsen stod tre konkreta
   * rekommendationer överst för någon som inte rört en enda ruta, alltså ett
   * påstående om henne innan hon sagt något.
   */
  const forslag = useMemo(
    () => (borjat ? AUDIT_FRAGOR.filter(f => !answers[f.id] && f.actionLink).slice(0, 3) : []),
    [answers, borjat]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--c-solid)]" aria-hidden="true" />
        <span className="sr-only">{t('personalBrand.audit.loading')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-[var(--c-solid)] rounded-xl flex items-center justify-center shrink-0">
            {/* Vit på `--c-solid` mäter 2,03:1 i mörkt läge (.dark sätter
                coaching-solid till ljusrosa #E8A4AE). */}
            <ClipboardCheck className="w-6 h-6 text-white dark:text-stone-900" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              {t('personalBrand.audit.title')}
            </h2>
            <p className="text-stone-700 dark:text-stone-300 mt-1">
              {t('personalBrand.audit.intro', { antal: antalFragor() })}
            </p>
          </div>
          {isSaving && (
            <span className="text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1 shrink-0">
              <RefreshCw className="w-3 h-3 animate-spin" aria-hidden="true" />
              {t('personalBrand.audit.saving')}
            </span>
          )}
        </div>
      </Card>

      {laddningsfel && (
        <Card className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="alert">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-stone-600 dark:text-stone-300 shrink-0" aria-hidden="true" />
            <p className="text-sm text-stone-800 dark:text-stone-100 flex-1">
              {t('personalBrand.audit.loadFailed')}
            </p>
            <Button variant="outline" onClick={laddaSvar}>{t('common.tryAgain')}</Button>
          </div>
        </Card>
      )}

      {sparfel && !laddningsfel && (
        <Card className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-stone-600 dark:text-stone-300 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-stone-800 dark:text-stone-100">
              {t('personalBrand.audit.saveFailed')}
            </p>
          </div>
        </Card>
      )}

      {/* Sammanfattning — ett räknat antal, ingen procent och inget omdöme */}
      <AnimatePresence>
        {borjat && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-white dark:bg-stone-800">
              <p className="text-stone-800 dark:text-stone-100">
                {t('personalBrand.audit.summary', { klara: ikryssade, totalt: antalFragor() })}
              </p>
              <ul className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 list-none p-0 m-0">
                {AUDIT_KATEGORIER.map((k) => {
                  const Ikon = KATEGORI_IKON[k]
                  return (
                    <li key={k} className="text-center p-3 rounded-xl bg-stone-50 dark:bg-stone-700">
                      <Ikon className="w-5 h-5 mx-auto mb-2 text-[var(--c-solid)]" aria-hidden="true" />
                      <div className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                        {t('personalBrand.audit.categoryCount', {
                          klara: antalIkryssade(answers, k),
                          totalt: antalFragor(k),
                        })}
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300">
                        {t(`personalBrand.audit.categories.${k}`)}
                      </p>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700 flex flex-col sm:flex-row gap-2">
                <Button onClick={sparaGenomgang} disabled={isSaving} className="bg-[var(--c-solid)] text-white dark:text-stone-900">
                  {sparadGenomgang
                    ? t('personalBrand.audit.roundSavedCta')
                    : t('personalBrand.audit.saveRoundCta')}
                </Button>
                <Button variant="ghost" onClick={aterstall} disabled={isSaving}>
                  <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
                  {t('personalBrand.audit.reset')}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {forslag.length > 0 && (
        <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
          <h3 className="font-semibold text-[var(--c-text)] dark:text-stone-100 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" aria-hidden="true" />
            {t('personalBrand.audit.suggestionsTitle')}
          </h3>
          <ul className="space-y-2 list-none p-0 m-0">
            {forslag.map((f) => (
              <li key={f.id}>
                <Link
                  to={f.actionLink!}
                  className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-xl border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 hover:border-[var(--c-accent)] transition-all group"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-stone-800 dark:text-stone-100">
                      {t(`personalBrand.audit.questions.${f.id}.action`)}
                    </span>
                    <span className="block text-sm text-stone-700 dark:text-stone-300">
                      {t(`personalBrand.audit.questions.${f.id}.question`)}
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-stone-600 dark:text-stone-300 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {AUDIT_KATEGORIER.map((kategori) => {
        const Ikon = KATEGORI_IKON[kategori]
        return (
          <Card key={kategori} className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Ikon className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
                {t(`personalBrand.audit.categories.${kategori}`)}
              </span>
              {/* Stod tidigare som `0%` i rosa på varje kategori innan man
                  börjat — fyra underkända prov i rad. */}
              {borjat && (
                <span className="text-sm font-medium px-3 py-1 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-stone-100">
                  {t('personalBrand.audit.categoryCount', {
                    klara: antalIkryssade(answers, kategori),
                    totalt: antalFragor(kategori),
                  })}
                </span>
              )}
            </h3>

            <ul className="space-y-3 list-none p-0 m-0">
              {AUDIT_FRAGOR.filter(f => f.category === kategori).map((fraga) => {
                const ikryssad = !!answers[fraga.id]
                const tipsId = `tips-${fraga.id}`
                return (
                  <li key={fraga.id}>
                    <button
                      type="button"
                      onClick={() => toggleAnswer(fraga.id)}
                      aria-pressed={ikryssad}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                        ikryssad
                          ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]'
                          : 'bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                      )}
                    >
                      {ikryssad
                        ? <CheckCircle className="w-5 h-5 text-[var(--c-solid)] shrink-0" aria-hidden="true" />
                        : <Circle className="w-5 h-5 text-stone-500 dark:text-stone-400 shrink-0" aria-hidden="true" />}
                      <span className="flex-1 text-sm text-stone-800 dark:text-stone-100">
                        {t(`personalBrand.audit.questions.${fraga.id}.question`)}
                      </span>
                    </button>

                    {/* Åtgärdslänken låg INUTI knappen ovan — interaktivt
                        element i interaktivt element. Nu på egen rad. */}
                    <div className="ml-8 mt-1 flex flex-wrap items-center gap-3">
                      {!ikryssad && fraga.actionLink && (
                        <Link
                          to={fraga.actionLink}
                          className="text-xs px-2 py-1 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-stone-100 rounded-full hover:bg-[var(--c-accent)]/60 transition-colors"
                        >
                          {t(`personalBrand.audit.questions.${fraga.id}.action`)}
                        </Link>
                      )}
                      {!ikryssad && (
                        <button
                          type="button"
                          onClick={() => setExpandedTip(expandedTip === fraga.id ? null : fraga.id)}
                          aria-expanded={expandedTip === fraga.id}
                          aria-controls={tipsId}
                          className="text-xs text-stone-700 dark:text-stone-300 hover:text-[var(--c-text)] dark:hover:text-[var(--c-solid)] underline"
                        >
                          {expandedTip === fraga.id
                            ? t('personalBrand.audit.hideTip')
                            : t('personalBrand.audit.showTip')}
                        </button>
                      )}
                    </div>

                    {!ikryssad && expandedTip === fraga.id && (
                      <div
                        id={tipsId}
                        className="ml-8 mt-2 p-3 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-lg border border-[var(--c-accent)]/40"
                      >
                        {/* `dark:text-[var(--c-text)]` stod här och mäter
                            1,55:1 i mörkt läge — i praktiken osynlig. */}
                        <p className="text-sm text-[var(--c-text)] dark:text-stone-100">
                          {t(`personalBrand.audit.questions.${fraga.id}.tip`)}
                        </p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        )
      })}
    </div>
  )
}
