/**
 * Quick Actions Component - Clean Modern Design
 * Context-aware quick action buttons for each agent
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { getAgentById } from './AgentSelector'
import { agentColorClasses, type QuickAction } from './types'
import { Zap, ExternalLink, ChevronRight } from '@/components/ui/icons'
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
        <div className={cn(
          'w-6 h-6 rounded-lg flex items-center justify-center',
          colors.bgLight
        )}>
          <Zap className={cn('w-3.5 h-3.5', colors.text)} aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          {t('aiTeam.quickActions.title')}
        </span>
      </div>

      <div className="space-y-1.5">
        {agent.quickActions.map((action) => (
          <div key={action.id} className="flex items-center gap-1.5">
            <button
              onClick={() => handleActionClick(action)}
              disabled={isLoading}
              aria-label={t(action.labelKey)}
              className={cn(
                'flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-left',
                'text-xs font-medium',
                'transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-teal-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-stone-50 dark:bg-stone-800',
                'hover:bg-stone-100 dark:hover:bg-stone-700',
                'text-stone-700 dark:text-stone-300',
                'group'
              )}
            >
              <span>{t(action.labelKey)}</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 group-hover:translate-x-0.5 transition-all" />
            </button>
            {action.linkTo && (
              <Link
                to={action.linkTo}
                className={cn(
                  'p-2 rounded-lg flex-shrink-0',
                  'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300',
                  'hover:bg-stone-100 dark:hover:bg-stone-700',
                  'transition-colors'
                )}
                title={action.linkLabelKey ? t(action.linkLabelKey) : t('common.view')}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuickActions
