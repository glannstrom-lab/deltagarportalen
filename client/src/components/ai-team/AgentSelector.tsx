/**
 * Agent Selector Component
 * Displays the 5 AI agents as selectable cards
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { AgentAvatar } from './AgentAvatar'
import type { Agent, AgentId, AgentColor, QuickAction } from './types'
import { agentColorClasses } from './types'
import { Briefcase, Heart, GraduationCap, Sparkles, Monitor } from '@/components/ui/icons'

// Agent definitions
export const agents: Agent[] = [
  {
    id: 'arbetskonsulent',
    nameKey: 'aiTeam.agents.arbetskonsulent.name',
    descriptionKey: 'aiTeam.agents.arbetskonsulent.description',
    icon: Briefcase,
    color: 'teal',
    quickActions: [
      { id: 'review-cv', labelKey: 'aiTeam.quickActions.reviewCV', prompt: 'Granska mitt CV som finns i min profil. Ge konkret feedback baserat på min faktiska erfarenhet, utbildning och kompetenser som du kan se. Fokusera på förbättringar som är relevanta för min bakgrund.' },
      { id: 'find-jobs', labelKey: 'aiTeam.quickActions.findJobs', prompt: 'Baserat på mitt CV och min profil - vilka typer av jobb passar mig? Ge konkreta förslag utifrån mina faktiska kompetenser och erfarenheter.' },
      { id: 'cover-letter', labelKey: 'aiTeam.quickActions.coverLetter', prompt: 'Hjälp mig skriva ett personligt brev som matchar min faktiska bakgrund och kompetenser från mitt CV.' },
      { id: 'analyze-job', labelKey: 'aiTeam.quickActions.analyzeJob', prompt: 'Jag vill analysera en jobbannons. Fråga mig om jobbannonsen först, sedan kan vi diskutera hur den matchar min bakgrund.' },
    ],
  },
  {
    id: 'arbetsterapeut',
    nameKey: 'aiTeam.agents.arbetsterapeut.name',
    descriptionKey: 'aiTeam.agents.arbetsterapeut.description',
    icon: Heart,
    color: 'rose',
    quickActions: [
      { id: 'work-ability', labelKey: 'aiTeam.quickActions.workAbility', prompt: 'Hjälp mig utvärdera min arbetsförmåga' },
      { id: 'suggest-adaptations', labelKey: 'aiTeam.quickActions.suggestAdaptations', prompt: 'Föreslå anpassningar för min arbetssituation' },
      { id: 'plan-workday', labelKey: 'aiTeam.quickActions.planWorkday', prompt: 'Hjälp mig planera min arbetsdag med hänsyn till min energi' },
      { id: 'handle-stress', labelKey: 'aiTeam.quickActions.handleStress', prompt: 'Ge mig tips för att hantera stress på jobbet' },
    ],
  },
  {
    id: 'studievagledare',
    nameKey: 'aiTeam.agents.studievagledare.name',
    descriptionKey: 'aiTeam.agents.studievagledare.description',
    icon: GraduationCap,
    color: 'violet',
    quickActions: [
      { id: 'find-education', labelKey: 'aiTeam.quickActions.findEducation', prompt: 'Hjälp mig hitta utbildningar som passar mina mål' },
      { id: 'validate-skills', labelKey: 'aiTeam.quickActions.validateSkills', prompt: 'Hur kan jag validera mina kunskaper och erfarenheter?' },
      { id: 'career-paths', labelKey: 'aiTeam.quickActions.careerPaths', prompt: 'Vilka karriärvägar finns för mig?' },
      { id: 'compare-education', labelKey: 'aiTeam.quickActions.compareEducation', prompt: 'Hjälp mig jämföra olika utbildningsalternativ' },
    ],
  },
  {
    id: 'motivationscoach',
    nameKey: 'aiTeam.agents.motivationscoach.name',
    descriptionKey: 'aiTeam.agents.motivationscoach.description',
    icon: Sparkles,
    color: 'amber',
    quickActions: [
      { id: 'set-goals', labelKey: 'aiTeam.quickActions.setGoals', prompt: 'Hjälp mig sätta upp realistiska mål för min jobbsökning' },
      { id: 'overcome-setbacks', labelKey: 'aiTeam.quickActions.overcomeSetbacks', prompt: 'Hur kan jag övervinna motgångar i jobbsökandet?' },
      { id: 'build-confidence', labelKey: 'aiTeam.quickActions.buildConfidence', prompt: 'Ge mig tips för att bygga mitt självförtroende' },
      { id: 'celebrate-progress', labelKey: 'aiTeam.quickActions.celebrateProgress', prompt: 'Hjälp mig fira mina framsteg' },
    ],
  },
  {
    id: 'digitalcoach',
    nameKey: 'aiTeam.agents.digitalcoach.name',
    descriptionKey: 'aiTeam.agents.digitalcoach.description',
    icon: Monitor,
    color: 'sky',
    quickActions: [
      { id: 'optimize-linkedin', labelKey: 'aiTeam.quickActions.optimizeLinkedIn', prompt: 'Hjälp mig optimera min LinkedIn-profil' },
      { id: 'create-portfolio', labelKey: 'aiTeam.quickActions.createPortfolio', prompt: 'Ge mig tips för att skapa en digital portfolio' },
      { id: 'network-online', labelKey: 'aiTeam.quickActions.networkOnline', prompt: 'Hur kan jag nätverka online effektivt?' },
      { id: 'digital-tools', labelKey: 'aiTeam.quickActions.digitalTools', prompt: 'Vilka digitala verktyg kan hjälpa mig i jobbsökandet?' },
    ],
  },
]

export function getAgentById(id: AgentId): Agent {
  return agents.find((agent) => agent.id === id) || agents[0]
}

interface AgentSelectorProps {
  className?: string
}

export function AgentSelector({ className }: AgentSelectorProps) {
  const { t } = useTranslation()
  const { selectedAgent, setAgent } = useAITeamStore()

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3', className)}>
      {agents.map((agent) => {
        const isSelected = selectedAgent === agent.id
        const colors = agentColorClasses[agent.color]

        return (
          <button
            key={agent.id}
            onClick={() => setAgent(agent.id)}
            className={cn(
              'relative flex flex-col items-center p-4 rounded-xl',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              colors.ring.replace('ring-', 'focus-visible:ring-'),
              isSelected
                ? cn(
                    'bg-white dark:bg-stone-800',
                    'border-2',
                    colors.border,
                    'shadow-lg',
                    'ring-2 ring-offset-2',
                    colors.ring
                  )
                : cn(
                    'bg-stone-50 dark:bg-stone-800/50',
                    'border border-stone-200 dark:border-stone-700',
                    'hover:bg-white dark:hover:bg-stone-800',
                    'hover:border-stone-300 dark:hover:border-stone-600',
                    'hover:shadow-md'
                  )
            )}
            aria-pressed={isSelected}
            aria-label={t(agent.nameKey)}
          >
            <AgentAvatar agentId={agent.id} color={agent.color} size="lg" />
            <span
              className={cn(
                'mt-2 text-xs sm:text-sm font-medium text-center',
                isSelected
                  ? 'text-stone-900 dark:text-stone-100'
                  : 'text-stone-600 dark:text-stone-400'
              )}
            >
              {t(agent.nameKey)}
            </span>
            {isSelected && (
              <div
                className={cn(
                  'absolute -bottom-1 left-1/2 -translate-x-1/2',
                  'w-2 h-2 rounded-full',
                  colors.bg
                )}
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default AgentSelector
