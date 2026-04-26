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
      { id: 'cv-tips', labelKey: 'aiTeam.quickActions.cvTips', prompt: 'Ge mig tips för att förbättra mitt CV baserat på min profil. Vad bör jag lyfta fram och vad kan förbättras?', linkTo: '/cv', linkLabelKey: 'aiTeam.quickActions.goToCV' },
      { id: 'job-strategy', labelKey: 'aiTeam.quickActions.jobStrategy', prompt: 'Baserat på min bakgrund, vilken jobbsökningsstrategi passar mig bäst? Var bör jag fokusera mina ansträngningar?', linkTo: '/job-search', linkLabelKey: 'aiTeam.quickActions.goToJobSearch' },
      { id: 'action-plan', labelKey: 'aiTeam.quickActions.actionPlan', prompt: 'Skapa en konkret handlingsplan för min jobbsökning de närmaste 2 veckorna. Inkludera specifika aktiviteter och delmål.' },
      { id: 'reference-letter', labelKey: 'aiTeam.quickActions.referenceLetter', prompt: 'Hjälp mig skriva ett utkast till referensbrev som jag kan ge till en tidigare chef eller kollega.' },
      { id: 'interview-tips', labelKey: 'aiTeam.quickActions.interviewTips', prompt: 'Ge mig tips för att förbereda mig inför jobbintervjuer. Vilka frågor bör jag vara beredd på?', linkTo: '/interview-simulator', linkLabelKey: 'aiTeam.quickActions.goToInterview' },
    ],
  },
  {
    id: 'arbetsterapeut',
    nameKey: 'aiTeam.agents.arbetsterapeut.name',
    descriptionKey: 'aiTeam.agents.arbetsterapeut.description',
    icon: Heart,
    color: 'rose',
    quickActions: [
      { id: 'work-ability', labelKey: 'aiTeam.quickActions.workAbility', prompt: 'Hjälp mig reflektera över min arbetsförmåga och vad jag behöver tänka på.' },
      { id: 'energy-planning', labelKey: 'aiTeam.quickActions.energyPlanning', prompt: 'Hur kan jag planera min dag för att hushålla med energin? Ge konkreta tips.', linkTo: '/wellness', linkLabelKey: 'aiTeam.quickActions.goToWellness' },
      { id: 'adaptations', labelKey: 'aiTeam.quickActions.suggestAdaptations', prompt: 'Vilka arbetsanpassningar kan vara relevanta för mig att diskutera med en arbetsgivare?' },
      { id: 'stress-coping', labelKey: 'aiTeam.quickActions.handleStress', prompt: 'Ge mig strategier för att hantera stress i jobbsökandet.', linkTo: '/diary', linkLabelKey: 'aiTeam.quickActions.goToDiary' },
    ],
  },
  {
    id: 'studievagledare',
    nameKey: 'aiTeam.agents.studievagledare.name',
    descriptionKey: 'aiTeam.agents.studievagledare.description',
    icon: GraduationCap,
    color: 'violet',
    quickActions: [
      { id: 'career-paths', labelKey: 'aiTeam.quickActions.careerPaths', prompt: 'Baserat på min bakgrund, vilka karriärvägar och utvecklingsmöjligheter finns för mig?', linkTo: '/career', linkLabelKey: 'aiTeam.quickActions.goToCareer' },
      { id: 'skill-gaps', labelKey: 'aiTeam.quickActions.skillGaps', prompt: 'Vilka kompetenser bör jag utveckla för att nå mina karriärmål?', linkTo: '/skills-gap-analysis', linkLabelKey: 'aiTeam.quickActions.goToSkillsGap' },
      { id: 'education-advice', labelKey: 'aiTeam.quickActions.findEducation', prompt: 'Vilka utbildningar eller kurser kan vara relevanta för mig att överväga?' },
      { id: 'validate-skills', labelKey: 'aiTeam.quickActions.validateSkills', prompt: 'Hur kan jag validera och dokumentera mina befintliga kunskaper och erfarenheter?' },
    ],
  },
  {
    id: 'motivationscoach',
    nameKey: 'aiTeam.agents.motivationscoach.name',
    descriptionKey: 'aiTeam.agents.motivationscoach.description',
    icon: Sparkles,
    color: 'amber',
    quickActions: [
      { id: 'set-goals', labelKey: 'aiTeam.quickActions.setGoals', prompt: 'Hjälp mig sätta upp realistiska och motiverande mål för min jobbsökning.' },
      { id: 'overcome-setbacks', labelKey: 'aiTeam.quickActions.overcomeSetbacks', prompt: 'Hur kan jag hantera motgångar och behålla motivationen i jobbsökandet?' },
      { id: 'build-confidence', labelKey: 'aiTeam.quickActions.buildConfidence', prompt: 'Ge mig konkreta övningar för att stärka mitt självförtroende.' },
      { id: 'celebrate-progress', labelKey: 'aiTeam.quickActions.celebrateProgress', prompt: 'Hjälp mig se och fira mina framsteg, även de små.', linkTo: '/diary', linkLabelKey: 'aiTeam.quickActions.goToDiary' },
    ],
  },
  {
    id: 'digitalcoach',
    nameKey: 'aiTeam.agents.digitalcoach.name',
    descriptionKey: 'aiTeam.agents.digitalcoach.description',
    icon: Monitor,
    color: 'sky',
    quickActions: [
      { id: 'linkedin-tips', labelKey: 'aiTeam.quickActions.linkedinTips', prompt: 'Ge mig tips för att förbättra min LinkedIn-profil och synas bättre för rekryterare.', linkTo: '/linkedin-optimizer', linkLabelKey: 'aiTeam.quickActions.goToLinkedIn' },
      { id: 'online-presence', labelKey: 'aiTeam.quickActions.onlinePresence', prompt: 'Hur kan jag bygga en professionell online-närvaro utöver LinkedIn?' },
      { id: 'network-online', labelKey: 'aiTeam.quickActions.networkOnline', prompt: 'Ge mig praktiska tips för att nätverka online och hitta dolda jobb.' },
      { id: 'digital-tools', labelKey: 'aiTeam.quickActions.digitalTools', prompt: 'Vilka digitala verktyg och appar kan hjälpa mig effektivisera min jobbsökning?' },
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

  // Handle keyboard navigation within the group
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      newIndex = (currentIndex + 1) % agents.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      newIndex = (currentIndex - 1 + agents.length) % agents.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      newIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      newIndex = agents.length - 1
    } else {
      return
    }

    setAgent(agents[newIndex].id)
    // Focus the new button
    const buttons = document.querySelectorAll('[role="radio"]')
    ;(buttons[newIndex] as HTMLElement)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('aiTeam.selectAgent', 'Välj AI-agent')}
      className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3', className)}
    >
      {agents.map((agent, index) => {
        const isSelected = selectedAgent === agent.id
        const colors = agentColorClasses[agent.color]

        return (
          <button
            key={agent.id}
            onClick={() => setAgent(agent.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative flex flex-col items-center p-3 sm:p-4 rounded-xl',
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
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            aria-label={`${t(agent.nameKey)}: ${t(agent.descriptionKey)}`}
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
            <span
              className={cn(
                'mt-1 text-[10px] sm:text-xs text-center line-clamp-2 leading-tight',
                isSelected
                  ? 'text-stone-600 dark:text-stone-400'
                  : 'text-stone-400 dark:text-stone-500'
              )}
            >
              {t(agent.descriptionKey)}
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
