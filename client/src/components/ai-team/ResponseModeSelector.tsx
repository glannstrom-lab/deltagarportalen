/**
 * Response Mode Selector
 * Allows users to choose response length: short, medium, or detailed
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAITeamStore } from '@/stores/aiTeamStore'
import type { ResponseMode } from './types'
import { MessageSquare } from '@/components/ui/icons'

const responseModes: ResponseMode[] = ['short', 'medium', 'detailed']

interface ResponseModeSelectorProps {
  className?: string
}

export function ResponseModeSelector({ className }: ResponseModeSelectorProps) {
  const { t } = useTranslation()
  const { responseMode, setResponseMode } = useAITeamStore()

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-stone-500" aria-hidden="true" />
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {t('aiTeam.responseMode.title')}
        </span>
      </div>
      <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
        {responseModes.map((mode) => (
          <button
            key={mode}
            onClick={() => setResponseMode(mode)}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-xs font-medium',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700',
              responseMode === mode
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            )}
            aria-pressed={responseMode === mode}
            title={t(`aiTeam.responseMode.${mode}Desc`)}
          >
            {t(`aiTeam.responseMode.${mode}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ResponseModeSelector
