/**
 * FocusAITeamWizard — NPF-anpassad ingång till AI-team.
 *
 * Steg: välj agent → ställ EN fråga → klart (svar visas i normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, MessageSquare, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const AGENTS = [
  { id: 'jobcoach', labelKey: 'focus.ai.jobcoach', labelDefault: 'Jobbcoach — hjälper dig söka jobb' },
  { id: 'cv', labelKey: 'focus.ai.cv', labelDefault: 'CV-experten — hjälper med CV och brev' },
  { id: 'interview', labelKey: 'focus.ai.interview', labelDefault: 'Intervju-coach — öva inför intervjuer' },
  { id: 'wellbeing', labelKey: 'focus.ai.wellbeing', labelDefault: 'Stöd — hjälper med mående och rutiner' },
] as const

export function FocusAITeamWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [agent, setAgent] = useState<string | null>(null)
  const [question, setQuestion] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'agent', icon: Bot, title: t('focus.ai.agentTitle', 'Vem vill du prata med?') },
    { id: 'question', icon: MessageSquare, title: t('focus.ai.questionTitle', 'Vad vill du fråga om?'), hint: t('focus.ai.questionHint', 'En fråga räcker.') },
    { id: 'done', icon: Smile, title: t('focus.ai.doneTitle', 'Klart!') },
  ] as const

  const current = STEPS[step]
  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') { onExit(); return }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={current.id === 'agent' ? agent != null : current.id === 'question' ? question.trim().length > 0 : true}
    >
      {current.id === 'agent' && (
        <div className="space-y-2">
          {AGENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAgent(a.id)}
              className={`w-full px-4 py-4 rounded-xl text-left border-2 ${
                agent === a.id ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20' : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <span className="text-base text-stone-800 dark:text-stone-100">{t(a.labelKey, a.labelDefault)}</span>
            </button>
          ))}
        </div>
      )}
      {current.id === 'question' && (
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={5}
          placeholder={t('focus.ai.questionPlaceholder', 'Skriv din fråga...')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.ai.doneText', 'Bra! Öppna AI-team i normalläge för att fortsätta samtalet.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusAITeamWizard
