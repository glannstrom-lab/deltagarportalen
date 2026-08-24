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
    name: 'Arbetsintressen',
    description: 'Vilka typer av arbete tilltalar dig?',
    color: 'text-[var(--c-solid)]',
    bgColor: 'bg-[var(--c-bg)]',
    questions: 6,
  },
  {
    icon: Brain,
    name: 'Personlighet',
    description: 'Hur skulle du beskriva dig själv?',
    color: 'text-[var(--c-solid)]',
    bgColor: 'bg-[var(--c-bg)]',
    questions: 10,
  },
  {
    icon: UserCircle,
    name: 'Intresseområden',
    description: 'Vad tycker du är intressant?',
    color: 'text-[var(--c-solid)]',
    bgColor: 'bg-[var(--c-bg)]',
    questions: 10,
  },
  {
    icon: Activity,
    name: 'Dina förutsättningar',
    description: 'Hur upplever du dina kapaciteter?',
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Detta får du
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
            'En bild av vilka typer av arbete som lockar dig',
            'Hur du beskriver dig själv på fem personlighetsdrag',
            'Dina egna svar om vad som fungerar bra och mindre bra för dig i arbete',
            `Förslag bland ${ANTAL_YRKEN} yrken, med anpassningar att prata vidare om`,
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('interestGuide.intro.questionsLayout')}</h2>
        
        <div className="space-y-3">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div 
                key={section.name}
                className="flex items-center gap-4 p-3 rounded-xl bg-gray-50"
              >
                <div className={`w-10 h-10 rounded-xl ${section.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">{section.name}</h3>
                  <p className="text-xs text-gray-500">{section.description}</p>
                </div>
                <span className="text-xs text-gray-400">{section.questions} frågor</span>
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
          Vad det här är, och inte är
        </h2>
        <p className="text-sm text-stone-700 dark:text-stone-300">
          Frågorna är skrivna av oss och inspirerade av tre etablerade ramverk:
          Hollands yrkesvalsteori (RIASEC), femfaktormodellen och WHO:s sätt att
          beskriva funktion i arbete. <strong>Det är ingen psykologisk testning
          och ingen bedömning av dig.</strong> Det är dina egna svar, sammanställda
          så att du får något att utgå från — i ett samtal med din konsulent, eller
          för egen del. Ett annat svar en annan dag ger ett annat resultat, och det
          är inte konstigt.
        </p>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>~10 minuter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>{ANTAL_FRAGOR} frågor totalt</span>
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
              Fortsätt där du slutade
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={onStart}
              variant="outline"
              size="lg"
              className="w-full py-6 text-base rounded-xl"
            >
              Börja om från början
            </Button>
          </>
        ) : (
          <Button
            onClick={onStart}
            size="lg"
            className="w-full bg-[var(--c-solid)] hover:brightness-110 text-white py-6 text-base rounded-xl"
          >
            Starta Intresseguiden
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-center text-gray-400 mt-6">
        Dina svar sparas automatiskt så du kan pausa och fortsätta när du vill.
      </p>
    </div>
  )
}
