/**
 * Svenska — nivåer, var man lär sig, och fraser att ha med sig.
 *
 * Vad som var fel:
 *
 * 1. **"Mellannivå"-knappen gjorde ingenting.** Filtret var
 *    `r.level !== 'advanced'`, och ingen resurs hade `level: 'advanced'` — så
 *    knappen gav exakt samma lista som "Alla nivåer". Filtret är omskrivet till
 *    något som faktiskt filtrerar: kostnad och form.
 * 2. **SFI beskrevs som fritt tillgängligt.** Rätten kräver att du fyllt 16,
 *    bor i kommunen och inte redan kan grundläggande svenska. Villkoret stod
 *    ingenstans, på en flik vars läsare ofta ännu inte är folkbokförd.
 * 3. **"B1 räcker på en svensk arbetsplats"** var ett obelagt påstående om
 *    arbetsmarknaden — och direkt fel för legitimationsyrken, där kravet är
 *    reglerat och högt. Nu delas svaret: arbetsgivaren bestämmer i de flesta
 *    jobb, myndigheten i några.
 * 4. **CEFR presenterades som skalan**, fast sfi har en egen indelning (kurs
 *    A–D, studieväg 1–3) och det inte finns någon officiell översättning
 *    mellan dem. Nu står båda, och att de inte är utbytbara.
 * 5. **Ingen `lang`-märkning på de engelska raderna** — svensk talsyntes läste
 *    engelsk text som svenska. Och tipsen förutsatte att man redan har jobb
 *    ("prata svenska på jobbet", "under pendlingen", "delta i fika") på en
 *    portal för arbetssökande.
 *
 * Länkar kontrollerade 2026-08-20. Folkuniversitetets gamla URL var en 404.
 */
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Headphones, MessageSquare, Volume2, ExternalLink, Info } from '@/components/ui/icons'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { KONTROLLERAD } from '../International'

type Kostnad = 'free' | 'paid' | 'freemium'
type Form = 'course' | 'self'

interface Resurs {
  id: string
  url: string
  kostnad: Kostnad
  form: Form
}

const RESURSER: Resurs[] = [
  { id: 'sfi', url: 'https://www.skolverket.se/undervisning/komvux/komvux-i-svenska-for-invandrare-sfi', kostnad: 'free', form: 'course' },
  { id: 'utbildningsguiden', url: 'https://utbildningsguiden.skolverket.se/', kostnad: 'free', form: 'course' },
  { id: 'folkuniversitetet', url: 'https://www.folkuniversitetet.se/kurser-utbildningar/sprak/', kostnad: 'paid', form: 'course' },
  { id: 'klartext', url: 'https://sverigesradio.se/klartext', kostnad: 'free', form: 'self' },
  { id: 'duolingo', url: 'https://www.duolingo.com/course/sv/en/Learn-Swedish', kostnad: 'freemium', form: 'self' },
  { id: 'swedishpod', url: 'https://www.swedishpod101.com/', kostnad: 'freemium', form: 'self' },
  { id: 'tandem', url: 'https://www.tandem.net/', kostnad: 'freemium', form: 'self' },
]

const NIVAER = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
const FRASER = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'] as const

type Filter = 'all' | 'free' | 'course' | 'self'

export default function LanguageTab() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')

  const resurser = useMemo(() => {
    switch (filter) {
      case 'free': return RESURSER.filter(r => r.kostnad === 'free')
      case 'course': return RESURSER.filter(r => r.form === 'course')
      case 'self': return RESURSER.filter(r => r.form === 'self')
      default: return RESURSER
    }
  }, [filter])

  /** Uppläsning via webbläsarens egen talsyntes — ingen backend, ingen data. */
  const kanLasaUpp = typeof window !== 'undefined' && 'speechSynthesis' in window
  const lasUpp = (text: string) => {
    if (!kanLasaUpp) return
    window.speechSynthesis.cancel()
    const yttrande = new SpeechSynthesisUtterance(text)
    yttrande.lang = 'sv-SE'
    yttrande.rate = 0.85
    window.speechSynthesis.speak(yttrande)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-700 dark:text-stone-300">
        {t('international.language.description')}
      </p>

      {/* Hur bra svenska behöver du? */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
          {t('international.language.levelsTitle')}
        </h2>
        <p className="text-sm text-stone-700 dark:text-stone-200 mb-4">
          {t('international.language.levelsBody')}
        </p>

        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {t('international.language.sfiTitle')}
        </h3>
        <p className="text-sm text-stone-700 dark:text-stone-200 mb-4">
          {t('international.language.sfiBody')}
        </p>

        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {t('international.language.cefrTitle')}
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NIVAER.map((niva) => (
            <li
              key={niva}
              className="p-3 rounded-lg bg-[var(--c-bg)]/50 dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/40"
            >
              <p className="font-medium text-stone-900 dark:text-stone-100">
                {t(`international.language.levels.${niva}.name`)}
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-200">
                {t(`international.language.levels.${niva}.description`)}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
          {t('international.language.cefrNote')}
        </p>
      </Card>

      {/* Var du kan lära dig */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">
            {t('international.language.resourcesTitle')}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
            {t('international.language.resultCount', { count: resurser.length })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label={t('international.language.resourcesTitle')}>
          {(['all', 'free', 'course', 'self'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'px-3 py-2 rounded-lg text-sm min-h-[44px]',
                filter === f
                  ? 'bg-[var(--c-solid)] text-white font-medium'
                  : 'bg-stone-50 dark:bg-stone-700 text-stone-700 dark:text-stone-200',
              )}
            >
              {t(`international.language.filter${f.charAt(0).toUpperCase()}${f.slice(1)}`)}
            </button>
          ))}
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {resurser.map((r) => (
            <li key={r.id}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full p-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] transition-colors"
              >
                <span className="flex items-center justify-between gap-2 mb-1">
                  <span className="flex items-center gap-2 font-medium text-stone-900 dark:text-stone-100">
                    {r.form === 'course'
                      ? <BookOpen className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
                      : <Headphones className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />}
                    {t(`international.language.resources.${r.id}.name`)}
                  </span>
                  <ExternalLink className="w-3 h-3 text-stone-500 shrink-0" aria-hidden="true" />
                </span>
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-text)] mb-2">
                  {t(`international.language.${r.kostnad}`)}
                </span>
                <span className="block text-sm text-stone-700 dark:text-stone-200">
                  {t(`international.language.resources.${r.id}.description`)}
                </span>
                <span className="sr-only">{t('international.opensInNewTab')}</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>

      {/* Fraser */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100 mb-1">
          <MessageSquare className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
          {t('international.language.phrasesTitle')}
        </h2>
        <p className="text-sm text-stone-700 dark:text-stone-200 mb-4">
          {t('international.language.phrasesIntro')}
        </p>

        <ul className="space-y-2">
          {FRASER.map((nyckel) => {
            const sv = t(`international.language.phrases.${nyckel}.sv`)
            const en = t(`international.language.phrases.${nyckel}.en`)
            const sammanhang = t(`international.language.phrases.${nyckel}.context`)
            return (
              <li
                key={nyckel}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-700"
              >
                <div>
                  {/* lang-märkningen är inte kosmetik: utan den läser svensk
                      talsyntes den engelska raden som svenska. */}
                  <p lang="sv" className="font-medium text-stone-900 dark:text-stone-100">{sv}</p>
                  <p lang="en" className="text-sm text-stone-700 dark:text-stone-300">{en}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-text)]">
                    {sammanhang}
                  </span>
                  {kanLasaUpp && (
                    <button
                      onClick={() => lasUpp(sv)}
                      aria-label={t('international.language.listen', { phrase: sv })}
                      className="p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white dark:hover:bg-stone-600"
                    >
                      <Volume2 className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-[var(--c-bg)]/60 dark:bg-[var(--c-bg)]/20 border-[var(--c-accent)]/60">
        <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
          {t('international.language.tipsTitle')}
        </h2>
        <ul className="space-y-2">
          {(['t1', 't2', 't3', 't4', 't5'] as const).map((nyckel) => (
            <li key={nyckel} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-200">
              <span className="text-[var(--c-text)] dark:text-[var(--c-text)] mt-0.5" aria-hidden="true">·</span>
              {t(`international.language.tips.${nyckel}`)}
            </li>
          ))}
        </ul>
      </Card>

      <p className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        {t('international.checkedNote', { date: KONTROLLERAD })}
      </p>
    </div>
  )
}
