import { useTranslation } from 'react-i18next'
import { Search, Brain, Activity, Clock, CheckCircle2, ArrowRight, UserCircle, Info, Briefcase } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { occupations, allQuestions } from '@/services/interestGuideData'

/** Härleds ur datan. Skärmen lovade "80+ yrken"; listan har 142. */
const ANTAL_YRKEN = occupations.length
const ANTAL_FRAGOR = allQuestions.length

interface IntroScreenProps {
  onStart: () => void
  onContinue?: () => void
  hasSavedProgress: boolean
}

const sections = [
  {
    icon: Search,
    key: 'work',
    questions: 6,
  },
  {
    icon: Brain,
    key: 'personality',
    questions: 10,
  },
  {
    icon: UserCircle,
    key: 'interests',
    questions: 10,
  },
  {
    icon: Activity,
    key: 'conditions',
    questions: 8,
  },
]

export function IntroScreen({ onStart, onContinue, hasSavedProgress }: IntroScreenProps) {
  const { t } = useTranslation()
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Rubriken låg här som en egen hjälte — lila ikonruta, "Intresseguide"
          i 30 px och en rad som ordagrant upprepade skenans beskrivning. Efter
          layoutomläggningen står samma två saker i skenan. */}

      {/*
        Designpasset 2026-10-09 ("för texttungt"). Skärmen var tre kort och
        ~170 ord före startknappen: en lista "Detta får du" som sa samma sak som
        avsnitten under den, avsnitten med en fråga var som underrubrik, och
        reservationen som ett helt stycke. Nu: ett kort med de fyra delarna som
        rutor, tiden och knappen. Det yrkesförslaget bygger på står på en rad.

        Löftena är oförändrade i sak — inget "Big Five-analys" eller
        "ICF-bedömning" (2026-08-21), och yrkesantalet härleds ur datan.
      */}
      <section
        aria-labelledby="intro-rubrik"
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-5 sm:p-6"
      >
        <h2 id="intro-rubrik" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {t('interestGuide.intro.heading', 'Fyra delar, i din egen takt')}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" aria-hidden="true" />
            {t('interestGuide.intro.duration')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {t('interestGuide.intro.totalQuestions', { count: ANTAL_FRAGOR })}
          </span>
        </p>

        <ul className="mt-4 grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <li
                key={section.key}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-bg)] dark:bg-stone-900/50"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm text-stone-900 dark:text-stone-100 leading-tight">
                    {t(`interestGuide.intro.sections.${section.key}.name`)}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {t('interestGuide.intro.questionsCount', { count: section.questions })}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        <p className="mt-4 flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
          <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--c-solid)]" aria-hidden="true" />
          {t('interestGuide.intro.get4', { count: ANTAL_YRKEN })}
        </p>

        {/* Action buttons */}
        <div className="mt-5 space-y-3">
          {hasSavedProgress && onContinue ? (
            <>
              <Button
                onClick={onContinue}
                size="lg"
                className="w-full bg-[var(--c-solid)] hover:brightness-110 text-white py-6 text-base rounded-xl"
              >
                {t('interestGuide.intro.continue')}
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Button>
              <Button
                onClick={onStart}
                variant="outline"
                size="lg"
                className="w-full py-6 text-base rounded-xl"
              >
                {t('interestGuide.intro.restart')}
              </Button>
            </>
          ) : (
            <Button
              onClick={onStart}
              size="lg"
              className="w-full bg-[var(--c-solid)] hover:brightness-110 text-white py-6 text-base rounded-xl"
            >
              {t('interestGuide.intro.start')}
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-stone-600 dark:text-stone-400 mt-3">
          {t('interestGuide.intro.footer')}
        </p>
      </section>

      {/*
        Reservationen. Före 2026-08-21 fanns ingen källhänvisning och ingen rad
        om vad resultatet inte är. Kärnmeningen — att det inte är någon
        psykologisk testning — står kvar SYNLIG här, där påståendena görs.
        Bakgrunden (ramverken, vem som skrivit frågorna) ligger bakom ett klick.
      */}
      <div className="rounded-2xl border border-[var(--c-accent)] bg-[var(--c-bg)] p-4 text-sm text-stone-700 dark:text-stone-300">
        <p className="flex items-start gap-2">
          <Info className="w-5 h-5 flex-shrink-0 text-[var(--c-solid)]" aria-hidden="true" />
          <strong className="font-semibold text-stone-900 dark:text-stone-100">
            {t('interestGuide.intro.whatItIsStrong')}
          </strong>
        </p>
        <details className="mt-2 ml-7">
          <summary className="cursor-pointer w-fit text-[var(--c-text)] hover:underline">
            {t('interestGuide.intro.whatItIs')}
          </summary>
          <p className="mt-2">
            {t('interestGuide.intro.whatItIsBody1')}{' '}
            {t('interestGuide.intro.whatItIsBody2')}
          </p>
        </details>
      </div>
    </div>
  )
}
