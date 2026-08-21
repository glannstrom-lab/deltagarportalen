/**
 * Synlighet — sätt att bli lättare att hitta, och en plan för när.
 *
 * Vad som var fel till 2026-08-21:
 *
 * · **"0/8 strategier klara" i hjälteposition.** En naken nolla överst på
 *   sidan för en ny användare, och ordet "klara" framställde självrapportering
 *   som utfall — räknaren speglar att någon tryckt på en bock, inte att hon
 *   engagerat sig någonstans. Nu en invit vid noll och ett språk om vad hon
 *   provat.
 *
 * · **Statusen bars enbart av färg och opacitet.** `skipped` hade bara
 *   `opacity-50` — ingen ikon, ingen text, ingen färg — och `completed` och
 *   `in_progress` hade ikoner som lucide auto-döljer för skärmläsare. De fyra
 *   lägena gick alltså inte att skilja åt utan syn (SC 1.4.1 + 1.3.1), och
 *   `opacity-50` sänkte dessutom kontrasten i kortet till 2,34:1.
 *
 * · **Sexton ikonknappar utan tillgängligt namn** (mätt i webbläsaren),
 *   varav flera bara hade `title=`, som inte syns på pekskärm.
 *
 * · **Planerade inlägg gick att skapa men aldrig ta bort eller ens se.**
 *   Vyn visade bara innevarande vecka; ett inlägg planerat till nästa vecka
 *   försvann ur vyn i samma sekund det sparades. `deleteContentItem` fanns i
 *   servicen med noll anropare — kommentaren i koden sa det rakt ut. Nu finns
 *   veckoväxling och en raderaknapp per post.
 *
 * · **Fältet `content` fanns i formulärstate men hade ingen input** — kolumnen
 *   skrevs alltid tom. Borttaget.
 *
 * · **Hela fliken saknade i18n.** Ingen `useTranslation`, ~50 hårdkodade
 *   svenska strängar mitt på en översatt sida.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Eye, TrendingUp, CheckCircle, Lightbulb, Calendar, Plus, Play, Pause,
  SkipForward, Clock, Loader2, RefreshCw, Edit2, Save, Trash2, ChevronRight,
  AlertCircle, ChevronLeft, Circle,
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { showToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import { personalBrandApi, type VisibilityProgressItem, type ContentCalendarItem } from '@/services/cloudStorage'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, startOfWeek, isToday, isSameDay, parseISO } from 'date-fns'
import { sv, enGB } from 'date-fns/locale'
import {
  SYNLIGHETSSATT, SYNLIGHETSKATEGORIER, ANTAL_IDEER,
  type Synlighetskategori,
} from './synlighetData'

type Status = VisibilityProgressItem['status']

const STATUS_IKON: Record<Status, typeof Circle> = {
  not_started: Circle,
  in_progress: Play,
  completed: CheckCircle,
  skipped: SkipForward,
}

export default function VisibilityTab() {
  const { t, i18n } = useTranslation()
  const { confirm } = useConfirmDialog()
  const locale = i18n.language === 'sv' ? sv : enGB

  const [progress, setProgress] = useState<VisibilityProgressItem[]>([])
  const [calendarItems, setCalendarItems] = useState<ContentCalendarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [laddningsfel, setLaddningsfel] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Synlighetskategori | null>(null)
  const [ideIndex, setIdeIndex] = useState(0)
  const [veckoOffset, setVeckoOffset] = useState(0)

  const [showCalendarForm, setShowCalendarForm] = useState(false)
  const [calendarForm, setCalendarForm] = useState({
    title: '',
    platform: 'linkedin' as ContentCalendarItem['platform'],
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setLaddningsfel(false)
    try {
      const [p, c] = await Promise.all([
        personalBrandApi.getVisibilityProgress(),
        personalBrandApi.getContentCalendar(),
      ])
      setProgress(p)
      setCalendarItems(c)
    } catch (err) {
      // `try/finally` utan `catch` gjorde ett läsfel identiskt med "du har
      // inte börjat" — och `getCurrentUser()` gör ett nätverksanrop.
      console.error('Synlighet: kunde inte hämta', err)
      setLaddningsfel(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  const statusFor = (id: string): Status =>
    progress.find(p => p.strategy_id === id)?.status ?? 'not_started'

  const andraStatus = async (strategyId: string, status: Status) => {
    try {
      await personalBrandApi.updateVisibilityProgress({
        strategy_id: strategyId,
        status,
        started_at: status === 'in_progress' ? new Date().toISOString() : undefined,
        // Skickades tidigare bara vid `completed`, så en återställd strategi
        // behöll sitt gamla `completed_at` med status `not_started`.
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      })
      await loadData()
    } catch (err) {
      console.error('Synlighet: kunde inte spara status', err)
      showToast.error(t('personalBrand.visibility.statusFailed'))
    }
  }

  const provade = useMemo(
    () => progress.filter(p => p.status === 'completed' || p.status === 'in_progress').length,
    [progress]
  )

  const synligaSatt = selectedCategory
    ? SYNLIGHETSSATT.filter(s => s.category === selectedCategory)
    : SYNLIGHETSSATT

  const nyIde = () => setIdeIndex(i => (i + 1) % ANTAL_IDEER)

  const veckoStart = useMemo(
    () => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), veckoOffset * 7),
    [veckoOffset]
  )
  const veckoDagar = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(veckoStart, i)),
    [veckoStart]
  )

  const sparaKalenderpost = async () => {
    if (!calendarForm.title.trim()) return
    try {
      await personalBrandApi.addContentItem({
        title: calendarForm.title,
        // `content` låg i formulärstate men hade ingen input — kolumnen
        // skrevs alltid tom.
        content: '',
        platform: calendarForm.platform,
        scheduled_date: calendarForm.scheduled_date,
        status: 'draft',
        tags: [],
      })
      setShowCalendarForm(false)
      setCalendarForm({ title: '', platform: 'linkedin', scheduled_date: format(new Date(), 'yyyy-MM-dd') })
      await loadData()
      showToast.success(t('personalBrand.visibility.planSaved'))
    } catch (err) {
      console.error('Synlighet: kunde inte spara inlägget', err)
      showToast.error(t('personalBrand.visibility.planFailed'))
    }
  }

  const raderaKalenderpost = async (id: string, titel: string) => {
    const bekraftat = await confirm({
      title: t('personalBrand.visibility.deletePlanTitle'),
      message: t('personalBrand.visibility.deletePlanBody', { titel }),
      confirmText: t('common.delete'),
      variant: 'danger',
    })
    if (!bekraftat) return
    try {
      await personalBrandApi.deleteContentItem(id)
      await loadData()
      showToast.success(t('personalBrand.visibility.planDeleted'))
    } catch (err) {
      console.error('Synlighet: kunde inte ta bort inlägget', err)
      showToast.error(t('personalBrand.visibility.planDeleteFailed'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite" aria-busy="true">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-solid)]" aria-hidden="true" />
        <span className="sr-only">{t('personalBrand.visibility.loading')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-[var(--c-solid)] rounded-xl flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6 text-white dark:text-stone-900" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              {t('personalBrand.visibility.title')}
            </h2>
            {/* Stod tidigare som "0/8" i `text-2xl font-bold` med etiketten
                "strategier klara". */}
            <p className="text-stone-700 dark:text-stone-300 mt-1">
              {provade === 0
                ? t('personalBrand.visibility.introEmpty', { antal: SYNLIGHETSSATT.length })
                : t('personalBrand.visibility.introSome', { provade, antal: SYNLIGHETSSATT.length })}
            </p>
          </div>
        </div>
      </Card>

      {laddningsfel && (
        <Card className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="alert">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-stone-600 dark:text-stone-300 shrink-0" aria-hidden="true" />
            <p className="text-sm text-stone-800 dark:text-stone-100 flex-1">
              {t('personalBrand.visibility.loadFailed')}
            </p>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('common.tryAgain')}
            </Button>
          </div>
        </Card>
      )}

      {/* Idé för nästa inlägg */}
      <Card className="border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--c-text)] dark:text-stone-100">
              {t('personalBrand.visibility.ideaTitle')}
            </p>
            {/* `dark:text-[var(--c-accent)]` mätte 1,55:1 här. */}
            <p className="text-[var(--c-text)] dark:text-stone-100 mt-1 text-lg" aria-live="polite">
              {t(`personalBrand.visibility.ideas.${ideIndex}`)}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button variant="ghost" onClick={nyIde}>
                <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
                {t('personalBrand.visibility.newIdea')}
              </Button>
              <Link to="/linkedin-optimizer">
                <Button variant="ghost">
                  <Edit2 className="w-4 h-4 mr-1" aria-hidden="true" />
                  {t('personalBrand.visibility.writePost')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Planerade inlägg */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            {t('personalBrand.visibility.calendarTitle')}
          </h3>
          <Button variant="outline" onClick={() => setShowCalendarForm(true)}>
            <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
            {t('personalBrand.visibility.planPost')}
          </Button>
        </div>

        {/* Veckoväxling — vyn satt tidigare fast på innevarande vecka, så ett
            inlägg planerat till nästa vecka var varken synligt eller
            raderbart. */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Button variant="ghost" onClick={() => setVeckoOffset(v => v - 1)} aria-label={t('personalBrand.visibility.prevWeek')}>
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Button>
          <p className="text-sm text-stone-700 dark:text-stone-300" aria-live="polite">
            {veckoOffset === 0
              ? t('personalBrand.visibility.thisWeek')
              : format(veckoStart, 'd MMMM', { locale })}
          </p>
          <Button variant="ghost" onClick={() => setVeckoOffset(v => v + 1)} aria-label={t('personalBrand.visibility.nextWeek')}>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
          {veckoDagar.map((day) => {
            const dagensPoster = calendarItems.filter(i => isSameDay(parseISO(i.scheduled_date), day))
            const idag = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'p-1 sm:p-2 rounded-lg border min-h-[80px] min-w-0',
                  idag ? 'border-[var(--c-accent)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30' : 'border-stone-200 dark:border-stone-600'
                )}
              >
                {/* "EEE d" ger "mån 17", som kapas till "m…" i en
                    sjukolumnsgrid på 390 px. Bokstaven och siffran får egna
                    rader i stället — dagen syns hela vägen ner. */}
                <p className={cn('text-[10px] sm:text-xs font-medium mb-1 text-center',
                  idag ? 'text-[var(--c-text)] dark:text-stone-100' : 'text-stone-700 dark:text-stone-400')}>
                  <span className="block sm:hidden">{format(day, 'EEEEE', { locale })}</span>
                  <span className="hidden sm:inline">{format(day, 'EEE', { locale })} </span>
                  <span className="block sm:inline">{format(day, 'd', { locale })}</span>
                </p>
                {dagensPoster.map((post) => (
                  <div key={post.id} className="text-[10px] sm:text-xs p-1 rounded mb-1 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-stone-100">
                    <span className="block truncate" title={post.title}>{post.title}</span>
                    <button
                      type="button"
                      onClick={() => post.id && raderaKalenderpost(post.id, post.title)}
                      aria-label={t('personalBrand.visibility.deletePlanAria', { titel: post.title })}
                      className="mt-0.5 text-red-700 dark:text-red-300 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {calendarItems.length === 0 && !showCalendarForm && (
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {t('personalBrand.visibility.calendarEmpty')}
          </p>
        )}

        <AnimatePresence>
          {showCalendarForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-stone-100 dark:border-stone-700 pt-4 mt-4"
            >
              <div className="space-y-3">
                <div>
                  <label htmlFor="pb-plan-titel" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t('personalBrand.visibility.planWhat')}
                  </label>
                  <input
                    id="pb-plan-titel"
                    type="text"
                    value={calendarForm.title}
                    onChange={(e) => setCalendarForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                    placeholder={t('personalBrand.visibility.planPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pb-plan-plattform" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t('personalBrand.visibility.planWhere')}
                    </label>
                    <select
                      id="pb-plan-plattform"
                      value={calendarForm.platform}
                      onChange={(e) => setCalendarForm(p => ({ ...p, platform: e.target.value as ContentCalendarItem['platform'] }))}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="blog">{t('personalBrand.visibility.platformBlog')}</option>
                      <option value="other">{t('personalBrand.visibility.platformOther')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="pb-plan-datum" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t('personalBrand.visibility.planWhen')}
                    </label>
                    <input
                      id="pb-plan-datum"
                      type="date"
                      value={calendarForm.scheduled_date}
                      onChange={(e) => setCalendarForm(p => ({ ...p, scheduled_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={sparaKalenderpost} disabled={!calendarForm.title.trim()}>
                    <Save className="w-4 h-4 mr-1" aria-hidden="true" />
                    {t('personalBrand.visibility.planSave')}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCalendarForm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Kategorifilter */}
      <div className="flex gap-2 flex-wrap" role="group" aria-label={t('personalBrand.visibility.filterAria')}>
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          aria-pressed={selectedCategory === null}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            !selectedCategory
              ? 'bg-[var(--c-solid)] text-white dark:text-stone-900'
              : 'bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600'
          )}
        >
          {t('personalBrand.visibility.filterAll', { antal: SYNLIGHETSSATT.length })}
        </button>
        {SYNLIGHETSKATEGORIER.map((k) => {
          const antal = SYNLIGHETSSATT.filter(s => s.category === k).length
          const vald = selectedCategory === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedCategory(vald ? null : k)}
              aria-pressed={vald}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                // `dark:bg-[var(--c-text)] text-white` gav 1,51:1 här — den
                // valda knappen var i praktiken oläslig i mörkt läge.
                vald
                  ? 'bg-[var(--c-solid)] text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600'
              )}
            >
              {t(`personalBrand.visibility.categories.${k}`)} ({antal})
            </button>
          )
        })}
      </div>

      {/* Sätten */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
          {t('personalBrand.visibility.waysTitle', { antal: SYNLIGHETSSATT.length })}
        </h3>
        <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">
          {t('personalBrand.visibility.waysIntro')}
        </p>

        <ul className="space-y-3 list-none p-0 m-0">
          {synligaSatt.map((satt) => {
            const status = statusFor(satt.id)
            const StatusIkon = STATUS_IKON[status]
            return (
              <li
                key={satt.id}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  status === 'completed' && 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]',
                  status === 'in_progress' && 'bg-stone-50 dark:bg-stone-700 border-[var(--c-accent)]/60',
                  // `opacity-50` sänkte kontrasten i allt inuti kortet till
                  // 2,34:1 och var dessutom statusens enda bärare.
                  status === 'skipped' && 'border-stone-200 dark:border-stone-600 bg-stone-50/50 dark:bg-stone-800',
                  status === 'not_started' && 'border-stone-200 dark:border-stone-600'
                )}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-stone-800 dark:text-stone-100">
                        {t(`personalBrand.visibility.ways.${satt.id}.title`)}
                      </h4>
                      {/* Statusen står nu i TEXT, inte bara i färg. */}
                      {status !== 'not_started' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-600 text-stone-800 dark:text-stone-100">
                          <StatusIkon className="w-3 h-3" aria-hidden="true" />
                          {t(`personalBrand.visibility.status.${status}`)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">
                      {t(`personalBrand.visibility.ways.${satt.id}.description`)}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-stone-100">
                        {t(`personalBrand.visibility.energy.${satt.energi}`)}
                      </span>
                      <span className="text-xs text-stone-700 dark:text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {t(`personalBrand.visibility.time.${satt.tid}`)}
                      </span>
                      {satt.lank && (
                        <Link to={satt.lank} className="text-xs text-[var(--c-text)] dark:text-stone-200 underline">
                          {t('personalBrand.visibility.helpHere')}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {status === 'not_started' && (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => andraStatus(satt.id, 'in_progress')}
                          aria-label={t('personalBrand.visibility.startAria', { titel: t(`personalBrand.visibility.ways.${satt.id}.title`) })}
                        >
                          <Play className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => andraStatus(satt.id, 'skipped')}
                          aria-label={t('personalBrand.visibility.skipAria', { titel: t(`personalBrand.visibility.ways.${satt.id}.title`) })}
                        >
                          <SkipForward className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                    {status === 'in_progress' && (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => andraStatus(satt.id, 'completed')}
                          aria-label={t('personalBrand.visibility.doneAria', { titel: t(`personalBrand.visibility.ways.${satt.id}.title`) })}
                        >
                          <CheckCircle className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => andraStatus(satt.id, 'not_started')}
                          aria-label={t('personalBrand.visibility.pauseAria', { titel: t(`personalBrand.visibility.ways.${satt.id}.title`) })}
                        >
                          <Pause className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                    {(status === 'completed' || status === 'skipped') && (
                      <Button
                        variant="ghost"
                        onClick={() => andraStatus(satt.id, 'not_started')}
                        aria-label={t('personalBrand.visibility.resetAria', { titel: t(`personalBrand.visibility.ways.${satt.id}.title`) })}
                      >
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Snabba saker på LinkedIn */}
      <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
        <h3 className="font-semibold text-[var(--c-text)] dark:text-stone-100 mb-3">
          {t('personalBrand.visibility.quickTitle')}
        </h3>
        <ul className="space-y-2 list-none p-0 m-0">
          {(['headline', 'openToWork', 'recommendations', 'creator'] as const).map((k) => (
            <li key={k} className="flex items-start gap-2">
              {/* Var fyra ifyllda gröna bockar bredvid saker användaren INTE
                  gjort — samma visuella språk som en faktiskt avklarad
                  strategi tjugo rader ovanför. Nu en neutral punkt. */}
              <ChevronRight className="w-4 h-4 text-[var(--c-solid)] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-[var(--c-text)] dark:text-stone-100">
                  {t(`personalBrand.visibility.quick.${k}.title`)}
                </p>
                <p className="text-xs text-[var(--c-text)] dark:text-stone-300">
                  {t(`personalBrand.visibility.quick.${k}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <Link to="/linkedin-optimizer" className="inline-flex items-center gap-1 text-sm mt-4 text-[var(--c-text)] dark:text-stone-200 underline">
          {t('personalBrand.visibility.openLinkedIn')}
        </Link>
      </Card>
    </div>
  )
}
