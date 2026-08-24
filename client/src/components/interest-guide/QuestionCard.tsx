/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + context/konstant/helper-export */
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Question } from '@/services/interestGuideData'
import { Pause, Save, RotateCcw } from '@/components/ui/icons'
import { interestGuideApi } from '@/services/cloudStorage'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface QuestionCardProps {
  question: Question
  /**
   * Odefinierad = frågan är inte besvarad än. Propen var tidigare `number`
   * och TestTab skickade `|| 50` — ett värde utanför skalan 1–5 som
   * webbläsaren klampade till max, så reglaget stod på "Stämmer helt" innan
   * användaren rört det. Ett obesvarat läge måste gå att uttrycka.
   */
  value: number | undefined
  onChange: (value: number) => void
  questionNumber: number
  totalQuestions: number
  onPause?: () => void
  onResume?: (questionIndex: number) => void
}

// Sparar progress (cloud storage)
export async function saveProgress(questionIndex: number, answers: Record<string, number>) {
  await interestGuideApi.saveProgress({
    current_step: questionIndex,
    answers: answers,
    is_completed: false
  })
}

// Hämtar progress (cloud storage)
export async function loadProgress(): Promise<{ questionIndex: number; answers: Record<string, number>; timestamp: number } | null> {
  const data = await interestGuideApi.getProgress()
  if (!data || !data.answers || Object.keys(data.answers).length === 0) {
    return null
  }
  return {
    questionIndex: data.current_step || 0,
    answers: data.answers,
    timestamp: data.updated_at ? new Date(data.updated_at).getTime() : Date.now()
  }
}

// Rensar progress (cloud storage)
export async function clearProgress() {
  await interestGuideApi.reset()
}

export function QuestionCard({
  question,
  value,
  onChange,
  questionNumber,
  totalQuestions,
  onPause,
}: QuestionCardProps) {
  const { t } = useTranslation()
  const [isAnimating, setIsAnimating] = useState(false)
  const [showPauseConfirm, setShowPauseConfirm] = useState(false)

  // Focus-trap medan paus-confirmation visas
  const pauseDialogRef = useFocusTrap<HTMLDivElement>(showPauseConfirm, {
    onEscape: () => setShowPauseConfirm(false),
    restoreFocus: true,
    autoFocus: true,
  })

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    onChange(newValue)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)
  }

  const handlePause = useCallback(() => {
    setShowPauseConfirm(true)
  }, [])

  const confirmPause = useCallback(() => {
    setShowPauseConfirm(false)
    onPause?.()
  }, [onPause])

  const besvarad = typeof value === 'number'

  const getThumbPosition = () => {
    if (!besvarad) return 0
    return ((value - 1) / 4) * 100
  }

  /*
    Skalan gick rött → orange → gult → grönt, alltså ett omdöme om svaret:
    "Stämmer inte alls" färgades rött. Frågorna handlar bland annat om
    användarens ork och koncentration — det finns inget dåligt svar, och en
    röd stapel säger motsatsen. En intensitet av hubbfärgen räcker för att
    visa var reglaget står.
  */
  const getGradientColor = () => {
    if (!besvarad) return 'bg-transparent'
    return 'bg-[var(--c-solid)]'
  }

  // Beräkna progress
  const progress = Math.round((questionNumber / totalQuestions) * 100)
  const remaining = totalQuestions - questionNumber

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 relative">
      {/* Paus-confirmation modal */}
      {showPauseConfirm && (
        <div
          ref={pauseDialogRef}
          className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-dialog-title"
          aria-describedby="pause-dialog-description"
        >
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pause className="w-8 h-8 text-amber-600" aria-hidden="true" />
            </div>
            <h3 id="pause-dialog-title" className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">{t('interestGuide.question.pauseTitle')}</h3>
            <p id="pause-dialog-description" className="text-stone-700 dark:text-stone-300 mb-6 max-w-xs">
              {t('interestGuide.question.pauseBody')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowPauseConfirm(false)}
                className="px-4 py-2 text-stone-700 dark:text-stone-300 hover:text-stone-900"
              >
                {t('interestGuide.question.pauseContinue')}
              </button>
              <button
                type="button"
                onClick={confirmPause}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                {t('interestGuide.question.pauseConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {t('interestGuide.question.questionOf', { number: questionNumber, total: totalQuestions })}
            </span>
            <span className="text-xs text-stone-600 dark:text-stone-400">
              ({t('interestGuide.question.remaining', { count: remaining })})
            </span>
          </div>
          
          {/* Paus-knapp */}
          <button
            onClick={handlePause}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-[var(--c-bg)] rounded-lg transition-colors"
          >
            <Pause className="w-4 h-4" aria-hidden="true" />
            {t('interestGuide.question.pauseButton')}
          </button>
        </div>

        {/* Progress bar med uppmuntran */}
        <div className="relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--c-solid)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Progress meddelande */}
          {/*
            Milstolparna var hårdkodade för 20 frågor: "Halvvägs!" på fråga 10
            av 34 (29 %) och "Nästan klart nu!" på fråga 15 (44 %). Att säga
            "nästan klart" till någon med 19 frågor kvar är precis det slags
            påhittade påstående som ska bort. Nu härleds de ur antalet, och
            emojidrivet pepp är struket (DESIGN.md §1 — aldrig en
            gamification-app).
          */}
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 text-center">
            {questionNumber === totalQuestions
              ? t('interestGuide.question.lastQuestion')
              : progress >= 50 && progress < 55
                ? t('interestGuide.question.halfway')
                : t('interestGuide.question.takeYourTime', { progress })}
          </p>
        </div>
      </div>

      {/* Question text */}
      <div className="text-center mb-8">
        <h3
          id={`question-${questionNumber}`}
          className="text-lg sm:text-xl font-medium text-gray-900 leading-relaxed"
        >
          {question.text}
        </h3>
        {question.subtext && (
          <p className="text-sm text-gray-500 mt-2">{question.subtext}</p>
        )}
      </div>

      {/* Slider */}
      <div className="relative px-2" role="group" aria-labelledby={`question-${questionNumber}`}>
        {/* Scale labels */}
        <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 mb-3 px-1" aria-hidden="true">
          <span className="text-center flex-1">{t('interestGuide.question.low')}</span>
          <span className="text-center flex-1">{t('interestGuide.question.mid')}</span>
          <span className="text-center flex-1">{t('interestGuide.question.high')}</span>
        </div>

        {/* Slider track */}
        <div className="relative h-12 flex items-center">
          {/* Background track */}
          <div className="absolute inset-x-0 h-3 bg-gray-200 rounded-full" aria-hidden="true"></div>

          {/* Active gradient track */}
          <div
            className={`absolute left-0 h-3 ${getGradientColor()} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${getThumbPosition()}%` }}
            aria-hidden="true"
          />

          {/* Dots for each value (visual only, not keyboard accessible) */}
          <div className="absolute inset-x-0 flex justify-between px-1 z-10" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((dotValue) => {
              const isActive = besvarad && value >= dotValue
              const isCurrent = value === dotValue

              return (
                <button
                  key={dotValue}
                  type="button"
                  onClick={() => onChange(dotValue)}
                  tabIndex={-1}
                  className={`
                    w-8 h-8 rounded-full border-4 transition-all duration-200 ease-out cursor-pointer
                    ${isCurrent
                      ? 'bg-white border-indigo-600 scale-110 shadow-lg'
                      : isActive
                        ? 'bg-white border-emerald-400 hover:scale-105'
                        : 'bg-white border-gray-300 hover:scale-105 hover:border-gray-400'
                    }
                  `}
                />
              )
            })}
          </div>

          {/* Accessible range input for keyboard navigation */}
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={besvarad ? value : 3}
            onChange={handleSliderChange}
            aria-label={t('interestGuide.question.sliderLabel', { number: questionNumber, text: question.text })}
            aria-valuemin={1}
            aria-valuemax={5}
            {...(besvarad ? { 'aria-valuenow': value } : {})}
            aria-valuetext={
              besvarad
                ? t(`interestGuide.question.scale.${value}`)
                : t('interestGuide.question.noAnswerYet')
            }
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
        </div>

        {/* Labels below (visual, clickable) */}
        <div className="flex justify-between mt-4 px-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              tabIndex={-1}
              className={`text-xs font-medium transition-colors ${
                value === num
                  ? num <= 2 ? 'text-red-500' : num === 3 ? 'text-yellow-500' : 'text-emerald-500'
                  : 'text-stone-600 dark:text-stone-400 hover:text-gray-600'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Selected value indicator */}
      <div className="mt-6 text-center">
        <div 
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-300
            ${isAnimating ? 'scale-105' : 'scale-100'}
            ${(value || 3) <= 2 
              ? 'bg-red-50 text-red-700' 
              : (value || 3) === 3 
                ? 'bg-yellow-50 text-yellow-700' 
                : 'bg-emerald-50 text-emerald-700'
            }
          `}
        >
          <span className="font-medium">
            {besvarad
              ? t(`interestGuide.question.scale.${value}`)
              : t('interestGuide.question.noAnswerYet')}
          </span>
        </div>
      </div>

      {/* Föregående-knapp info */}
      {questionNumber > 1 && (
        <p className="text-xs text-center text-stone-600 dark:text-stone-400 mt-4">
          💡 Du kan alltid gå tillbaka för att ändra tidigare svar
        </p>
      )}
    </div>
  )
}

// ResumeModal - visas när användaren återvänder efter paus
export function ResumeModal({
  onResume,
  onRestart,
  questionIndex,
  savedDate
}: {
  onResume: () => void
  onRestart: () => void
  questionIndex: number
  savedDate: Date
}) {
  const { t } = useTranslation()
  const hoursSince = Math.round((Date.now() - savedDate.getTime()) / (1000 * 60 * 60))

  // Focus-trap. ResumeModal renders alltid när komponenten är mountad.
  const modalRef = useFocusTrap<HTMLDivElement>(true, {
    onEscape: onResume,
    restoreFocus: true,
    autoFocus: true,
  })

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-dialog-title"
      aria-describedby="resume-dialog-description"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-8 h-8 text-indigo-600" aria-hidden="true" />
        </div>

        <h2 id="resume-dialog-title" className="text-xl font-bold text-gray-900 text-center mb-2">
          Välkommen tillbaka!
        </h2>

        <p id="resume-dialog-description" className="text-gray-600 text-center mb-6">
          {hoursSince < 1
            ? 'Du var på fråga ' + (questionIndex + 1) + ' för en stund sedan.'
            : `Du var på fråga ${questionIndex + 1} för ${hoursSince} timme${hoursSince > 1 ? 'r' : ''} sedan.`
          }
          <br />
          <span className="text-sm">{t('interestGuide.question.resumeModal.takeYourTime')}</span>
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            Fortsätt där jag slutade
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Börja om från början
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionCard
