import { useTranslation } from 'react-i18next'
import { Search, Brain, Activity, Clock, CheckCircle2, ArrowRight, UserCircle, Info } from '@/components/ui/icons'
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
    color: 'text-[var(--c-solid)]',
    bgColor: 'bg-[var(--c-bg)]',
    questions: 6,
  },
  {
    icon: Brain,
    key: 'personality',
    color: 'text-[var(--c-solid)]',
    bgColor: 'bg-[var(--c-bg)]',
    questions: 10,
  },
  {
    icon: UserCircle,
    key: 'interests',
    color: 'text-[var(--c-solid)]',
    bgColor: 'bg-[var(--c-bg)]',
    questions: 10,
  },
  {
    icon: Activity,
    key: 'conditions',
    color: 'text-[var(--c-solid)]',
    bgColor: 'bg-[var(--c-bg)]',
    questions: 8,
  },
]

export function IntroScreen({ onStart, onContinue, hasSavedProgress }: IntroScreenProps) {
  const { t } = useTranslation()
  return (
    <div className="max-w-2xl mx-auto">
      {/* Rubriken låg här som en egen hjälte — lila ikonruta, "Intresseguide"
          i 30 px och en rad som ordagrant upprepade skenans beskrivning
          ("Upptäck vilka yrken som passar just din profil"). Efter
          layoutomläggningen står samma två saker 200 px till vänster, i
          skenan. Två rubriker för samma sida är en för mycket, och den lila
          var dessutom fel färg på en rosa sida. */}

      {/* What's included */}
      {/* Korten saknade mörkt läge: vit ruta, och rubriken med dark:text-stone-100
          blev vit text på vitt. (2026-09-22) */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
          {t('interestGuide.intro.whatYouGet')}
        </h2>
        
        {/*
          Löftena var fyra anspråk portalen inte kan hålla, alla med bestämd
          artikel: "Big Five-ANALYS av din personlighet" bygger på två frågor
          per drag; "ICF-BEDÖMNING av dina funktionsförutsättningar" är WHO:s
          kliniska klassifikation, här åtta självskattningsfrågor; och "80+
          yrken" stämde inte — listan har 142. Formuleringarna beskriver nu
          vad testet gör, inte vad det vore om det vore validerat.
          Reservationen nedan ersätter det som helt saknades: källa, vem som
          skrivit frågorna, och vad resultatet inte är. (2026-08-21)
        */}
        <div className="space-y-3">
          {[
            t('interestGuide.intro.get1'),
            t('interestGuide.intro.get2'),
            t('interestGuide.intro.get3'),
            t('interestGuide.intro.get4', { count: ANTAL_YRKEN }),
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 dark:text-stone-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections preview */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 mb-6">
        <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('interestGuide.intro.questionsLayout')}</h2>
        
        <div className="space-y-3">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div 
                key={section.key}
                className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-stone-900/50"
              >
                <div className={`w-10 h-10 rounded-xl ${section.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-stone-100 text-sm">{t(`interestGuide.intro.sections.${section.key}.name`)}</h3>
                  <p className="text-xs text-gray-600 dark:text-stone-400">{t(`interestGuide.intro.sections.${section.key}.description`)}</p>
                </div>
                <span className="text-xs text-gray-600 dark:text-stone-400">{t('interestGuide.intro.questionsCount', { count: section.questions })}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/*
        Reservationen. Före 2026-08-21 fanns ingen källhänvisning, inget
        datum och ingen rad om vad resultatet inte är — någonstans i hela
        testflödet. Samtidigt lovade skärmen en "Big Five-analys" och en
        "ICF-bedömning". Rutan står här, där påståendena görs, inte i en
        hopfällbar panel bredvid.
      */}
      <div className="rounded-2xl border border-[var(--c-accent)] bg-[var(--c-bg)] p-5 mb-6">
        <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
          {t('interestGuide.intro.whatItIs')}
        </h2>
        <p className="text-sm text-stone-700 dark:text-stone-300">
          {t('interestGuide.intro.whatItIsBody1')}{' '}
          <strong>{t('interestGuide.intro.whatItIsStrong')}</strong>{' '}
          {t('interestGuide.intro.whatItIsBody2')}
        </p>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-stone-400 mb-8">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{t('interestGuide.intro.duration')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('interestGuide.intro.totalQuestions', { count: ANTAL_FRAGOR })}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {hasSavedProgress && onContinue ? (
          <>
            <Button
              onClick={onContinue}
              size="lg"
              className="w-full bg-[var(--c-solid)] hover:brightness-110 text-white py-6 text-base rounded-xl"
            >
              {t('interestGuide.intro.continue')}
              <ArrowRight className="w-5 h-5 ml-2" />
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
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-center text-gray-600 dark:text-stone-400 mt-6">
        {t('interestGuide.intro.footer')}
      </p>
    </div>
  )
}
