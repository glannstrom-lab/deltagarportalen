/**
 * FocusAITeamWizard — NPF-anpassad ingång till AI-team.
 *
 * Steg: välj agent → ställ EN fråga → klart (svar visas i normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, MessageSquare, Smile } from '@/components/ui/icons'
import { useAITeamStore } from '@/stores/aiTeamStore'
import type { AgentId } from '@/components/ai-team/types'
import { FOCUS_WIZARD_TITLE_ID, FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

/**
 * Id:na måste vara riktiga `AgentId`-värden.
 *
 * De var `jobcoach`/`cv`/`interview`/`wellbeing` — fyra strängar som inte
 * motsvarade någon agent i `types.ts`. Även om valet hade skickats vidare
 * hade det pekat på ingenting.
 */
const AGENTS: ReadonlyArray<{ id: AgentId; labelKey: string; labelDefault: string }> = [
  { id: 'arbetskonsulent', labelKey: 'focus.ai.jobcoach', labelDefault: 'Jobbcoach — hjälper dig söka jobb' },
  { id: 'digitalcoach', labelKey: 'focus.ai.cv', labelDefault: 'Digital coach — hjälper med CV och nätprofil' },
  { id: 'studievagledare', labelKey: 'focus.ai.interview', labelDefault: 'Studievägledare — utbildning och nästa steg' },
  { id: 'arbetsterapeut', labelKey: 'focus.ai.wellbeing', labelDefault: 'Arbetsterapeut — mående, energi och rutiner' },
] as const

export function FocusAITeamWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [agent, setAgent] = useState<AgentId | null>(null)
  const [question, setQuestion] = useState('')
  const väljAgent = useAITeamStore((s) => s.setAgent)
  const lämnaFråga = useAITeamStore((s) => s.setPendingQuestion)

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
        // Här skickas frågan på riktigt. `AgentChat` är monterad hela tiden
        // (FokusVaxel döljer normalvyn, avmonterar den inte) och plockar upp
        // `pendingQuestion` så snart den sätts.
        if (current.id === 'question' && agent) {
          väljAgent(agent)
          lämnaFråga(question.trim())
        }
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
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
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
          {t('focus.ai.doneText', 'Din fråga är skickad. Öppna AI-team i normalläge för att läsa svaret.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusAITeamWizard
