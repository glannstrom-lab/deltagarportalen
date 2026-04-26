/**
 * Quick Actions Component
 * Context-aware quick action buttons for each agent
 * Includes links to relevant pages when available
 * Now with personalized prompts based on user data
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { getAgentById } from './AgentSelector'
import { agentColorClasses, type QuickAction } from './types'
import { Zap, ExternalLink } from '@/components/ui/icons'
import { useAITeamContext, type AITeamUserContext } from '@/hooks/useAITeamContext'

interface QuickActionsProps {
  onActionClick: (prompt: string) => void
  className?: string
}

/**
 * Enrich a quick action prompt with relevant user context
 */
function enrichPromptWithContext(action: QuickAction, context: AITeamUserContext): string {
  let prompt = action.prompt
  const additions: string[] = []

  // Add name for personalization
  if (context.firstName) {
    // Replace generic prompts with personalized ones
    prompt = prompt.replace(/^(Ge mig|Hjälp mig)/i, `$1, ${context.firstName},`)
  }

  // Add CV context for CV-related prompts
  if (action.id.includes('cv') && context.hasCV) {
    if (context.cvTitle) additions.push(`Min nuvarande CV-titel är "${context.cvTitle}".`)
    if (context.skills && context.skills.length > 0) {
      additions.push(`Mina kompetenser inkluderar: ${context.skills.slice(0, 5).join(', ')}.`)
    }
  }

  // Add job search context
  if ((action.id.includes('job') || action.id.includes('strategy')) && context.targetRole) {
    additions.push(`Jag söker jobb som ${context.targetRole}${context.targetIndustry ? ` inom ${context.targetIndustry}` : ''}.`)
    if (context.appliedJobsCount > 0) {
      additions.push(`Jag har skickat ${context.appliedJobsCount} ansökningar hittills.`)
    }
  }

  // Add experience context for career-related prompts
  if (action.id.includes('career') || action.id.includes('skill')) {
    if (context.experienceYears !== undefined && context.experienceYears > 0) {
      additions.push(`Jag har ${context.experienceYears} års arbetslivserfarenhet.`)
    }
    if (context.workExperience && context.workExperience.length > 0) {
      const recentJob = context.workExperience[0]
      additions.push(`Min senaste roll var ${recentJob.title} på ${recentJob.company}.`)
    }
  }

  // Add interest profile for career guidance
  if ((action.id.includes('career') || action.id.includes('education')) && context.riasecTypes) {
    additions.push(`Mina intressetyper är: ${context.riasecTypes.join(', ')}.`)
  }

  // Add energy level for therapy-related prompts
  if (action.id.includes('energy') || action.id.includes('stress')) {
    const energyText = context.energyLevel === 'low' ? 'låg' : context.energyLevel === 'high' ? 'hög' : 'normal'
    additions.push(`Min energinivå just nu är ${energyText}.`)
  }

  // Add LinkedIn context
  if (action.id.includes('linkedin') && context.targetRole) {
    additions.push(`Jag vill synas för rekryterare som söker ${context.targetRole}.`)
  }

  // Combine prompt with additions
  if (additions.length > 0) {
    return `${prompt}\n\nKontext om mig: ${additions.join(' ')}`
  }

  return prompt
}

export function QuickActions({ onActionClick, className }: QuickActionsProps) {
  const { t } = useTranslation()
  const { selectedAgent, isLoading } = useAITeamStore()
  const agent = getAgentById(selectedAgent)
  const colors = agentColorClasses[agent.color]
  const { context } = useAITeamContext()

  // Handle action click with enriched prompt
  const handleActionClick = useCallback((action: QuickAction) => {
    const enrichedPrompt = enrichPromptWithContext(action, context)
    onActionClick(enrichedPrompt)
  }, [context, onActionClick])

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
              onClick={() => handleActionClick(action)}
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
