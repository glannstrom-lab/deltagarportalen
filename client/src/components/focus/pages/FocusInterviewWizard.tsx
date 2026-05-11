/**
 * FocusInterviewWizard — NPF-anpassad intervjuövning.
 *
 * Steg: vilken roll → andas 10s (lugna ner) → läs en fråga → skriv ditt svar
 * → klart. Minimalt — ingen AI-loop, ingen mic, ingen feedback. Bara
 * EN fråga åt gången, andetag emellan. Stora knappar.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Briefcase, HeartPulse, MessageSquare, PencilLine, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const QUESTIONS: Record<string, string[]> = {
  default: [
    'Berätta kort om dig själv.',
    'Varför söker du den här tjänsten?',
    'Vad är din största styrka?',
  ],
}

export function FocusInterviewWizard({ onExit }: Props) {
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [role, setRole] = useState('')
  const [breathSeconds, setBreathSeconds] = useState(10)
  const [answer, setAnswer] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)

  useEffect(() => {
    if (step !== 1 || breathSeconds <= 0) return
    const timer = setTimeout(() => setBreathSeconds((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [step, breathSeconds])

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'role',
      icon: Briefcase,
      title: t('focus.interview.roleTitle', 'Vilken roll vill du öva för?'),
      hint: t('focus.interview.roleHint', 'En enkel beskrivning räcker.'),
    },
    {
      id: 'breathe',
      icon: HeartPulse,
      title: t('focus.interview.breatheTitle', 'Andas lugnt i 10 sekunder'),
      hint: t('focus.interview.breatheHint', 'Du klarar det här. In genom näsan, ut genom munnen.'),
    },
    {
      id: 'question',
      icon: MessageSquare,
      title: t('focus.interview.questionTitle', 'Här är din fråga'),
    },
    {
      id: 'answer',
      icon: PencilLine,
      title: t('focus.interview.answerTitle', 'Skriv ditt svar i lugn takt'),
      hint: t('focus.interview.answerHint', 'Det finns inget rätt eller fel — bara träning.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.interview.doneTitle', 'Bra jobbat!'),
    },
  ] as const

  const current = STEPS[step]
  const questions = QUESTIONS.default
  const currentQuestion = questions[questionIndex % questions.length]

  const handleNext = async () => {
    if (current.id === 'done') {
      onExit()
      return
    }
    if (current.id === 'answer') {
      setQuestionIndex((i) => i + 1)
    }
    setStep((s) => s + 1)
  }

  const canNext = current.id === 'role' ? role.trim().length > 0 : current.id === 'breathe' ? breathSeconds <= 0 : true

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={handleNext}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={canNext}
      nextLabel={current.id === 'breathe' && breathSeconds > 0 ? t('focus.interview.breatheWait', 'Vänta lite...') : undefined}
    >
      {current.id === 'role' && (
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder={t('focus.interview.rolePlaceholder', 't.ex. butikssäljare, undersköterska')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'breathe' && (
        <div className="text-center py-6">
          <div className="text-5xl font-bold text-[var(--c-solid)] mb-3">
            {breathSeconds > 0 ? breathSeconds : '✓'}
          </div>
          <p className="text-stone-600 dark:text-stone-300">
            {breathSeconds > 0
              ? t('focus.interview.breatheCountdown', 'sekunder kvar')
              : t('focus.interview.breatheDone', 'Klart! Du är redo.')}
          </p>
        </div>
      )}

      {current.id === 'question' && (
        <p className="text-lg text-stone-800 dark:text-stone-100 leading-relaxed">
          {currentQuestion}
        </p>
      )}

      {current.id === 'answer' && (
        <>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">{currentQuestion}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            placeholder={t('focus.interview.answerPlaceholder', 'Skriv så som du skulle säga det...')}
            className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
            autoFocus
          />
        </>
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t(
            'focus.interview.doneText',
            'Du har övat på en fråga. Vill du öva fler? Gå till intervjusimulatorn i normalt läge för mer.'
          )}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusInterviewWizard
