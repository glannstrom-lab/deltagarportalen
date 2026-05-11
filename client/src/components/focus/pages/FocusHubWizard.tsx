/**
 * FocusHubWizard — generisk NPF-anpassad hub-landningswizard.
 *
 * Steg: vad vill du göra → välj verktyg → klart (länkar till verktyget).
 *
 * Återanvänds av alla 5 hubbar med olika tool-listor.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Smile, ArrowRight } from '@/components/ui/icons'
import type { LucideIcon } from 'lucide-react'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

export interface HubTool {
  id: string
  path: string
  label: string
  description?: string
  icon: LucideIcon
}

interface Props {
  onExit: () => void
  /** Översätt-stable nyckel — t.ex. "focus.hubOverview". */
  pageKey: string
  /** Defaulttitel som visas på första steget. */
  question: string
  tools: ReadonlyArray<HubTool>
}

export function FocusHubWizard({ onExit, pageKey: _pageKey, question, tools }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<HubTool | null>(null)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'pick', icon: tools[0]?.icon ?? Smile, title: question },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.hub.doneTitle', 'Bra val!'),
    },
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
      canNext={current.id === 'pick' ? picked != null : true}
    >
      {current.id === 'pick' && (
        <div className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon
            const selected = picked?.id === tool.id
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setPicked(tool)}
                className={`w-full px-4 py-4 rounded-xl text-left border-2 flex items-center gap-3 ${
                  selected ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20' : 'border-stone-200 dark:border-stone-700'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--c-accent)]/40 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[var(--c-solid)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-medium text-stone-800 dark:text-stone-100">{tool.label}</p>
                  {tool.description && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{tool.description}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {current.id === 'done' && picked && (
        <div className="space-y-4">
          <p className="text-stone-600 dark:text-stone-300">
            {t('focus.hub.doneText', 'Öppna verktyget när du är redo:')}
          </p>
          <Link
            to={picked.path}
            onClick={onExit}
            className="flex items-center justify-between gap-2 w-full px-4 py-4 rounded-xl border-2 border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20"
          >
            <span className="text-base font-medium text-stone-800 dark:text-stone-100">{picked.label}</span>
            <ArrowRight className="w-5 h-5 text-[var(--c-solid)]" />
          </Link>
        </div>
      )}
    </FocusWizardFrame>
  )
}

export default FocusHubWizard
