/**
 * Quick Actions Component
 * Context-aware quick action buttons for each agent
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { getAgentById } from './AgentSelector'
import { agentColorClasses } from './types'
import { Zap } from '@/components/ui/icons'

interface QuickActionsProps {
  onActionClick: (prompt: string) => void
  className?: string
}

export function QuickActions({ onActionClick, className }: QuickActionsProps) {
  const { t } = useTranslation()
  const { selectedAgent, isLoading } = useAITeamStore()
  const agent = getAgentById(selectedAgent)
  const colors = agentColorClasses[agent.color]

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Zap className={cn('w-4 h-4', colors.text)} aria-hidden="true" />
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {t('aiTeam.quickActions.title')}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {agent.quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.prompt)}
            disabled={isLoading}
            className={cn(
              'px-3 py-1.5 rounded-full',
              'text-xs sm:text-sm font-medium',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              colors.ring.replace('ring-', 'focus-visible:ring-'),
              'disabled:opacity-50 disabled:cursor-not-allowed',
              colors.bgLight,
              colors.text,
              colors.border,
              'border',
              'hover:shadow-md',
              'active:scale-95'
            )}
          >
            {t(action.labelKey)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickActions
