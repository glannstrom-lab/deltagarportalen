/**
 * Quick Actions Component
 * Context-aware quick action buttons for each agent
 * Includes links to relevant pages when available
 */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { getAgentById } from './AgentSelector'
import { agentColorClasses } from './types'
import { Zap, ExternalLink } from '@/components/ui/icons'

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
      <div className="space-y-2">
        {agent.quickActions.map((action) => (
          <div key={action.id} className="flex items-center gap-2">
            <button
              onClick={() => onActionClick(action.prompt)}
              disabled={isLoading}
              aria-label={t(action.labelKey)}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-left',
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
                'active:scale-[0.98]'
              )}
            >
              {t(action.labelKey)}
            </button>
            {action.linkTo && (
              <Link
                to={action.linkTo}
                className={cn(
                  'p-2 rounded-lg',
                  'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200',
                  'bg-stone-100 dark:bg-stone-800',
                  'hover:bg-stone-200 dark:hover:bg-stone-700',
                  'transition-colors'
                )}
                title={action.linkLabelKey ? t(action.linkLabelKey) : t('common.view')}
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuickActions
