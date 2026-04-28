/**
 * AI Team Page - Clean Modern Design
 * Simplified layout matching profile page style
 */

import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { AgentSelector, getAgentById } from '@/components/ai-team/AgentSelector'
import { PersonalityDropdown } from '@/components/ai-team/PersonalityDropdown'
import { QuickActions } from '@/components/ai-team/QuickActions'
import { AgentChat, type AgentChatHandle } from '@/components/ai-team/AgentChat'
import { OnboardingModal } from '@/components/ai-team/OnboardingModal'
import { ResponseModeSelector } from '@/components/ai-team/ResponseModeSelector'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { agentColorClasses } from '@/components/ai-team/types'
import { Users, Lightbulb } from '@/components/ui/icons'
import { useSuggestedAgent } from '@/hooks/useSuggestedAgent'

export default function AITeam() {
  const { t } = useTranslation()
  const { selectedAgent, setAgent } = useAITeamStore()
  const agent = getAgentById(selectedAgent)
  const colors = agentColorClasses[agent.color]
  const chatRef = useRef<AgentChatHandle>(null)
  const suggestedAgent = useSuggestedAgent()

  // Handle quick action click
  const handleQuickAction = useCallback((prompt: string) => {
    chatRef.current?.sendMessage(prompt)
  }, [])

  // Handle clicking the suggested agent
  const handleSuggestedAgentClick = useCallback(() => {
    if (suggestedAgent) {
      setAgent(suggestedAgent.agentId)
    }
  }, [suggestedAgent, setAgent])

  return (
    <div className="pb-8 max-w-6xl mx-auto">
      {/* Skip link for accessibility */}
      <a
        href="#ai-chat"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--c-solid)] focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        {t('aiTeam.skipToChat', 'Hoppa till chatten')}
      </a>

      {/* Onboarding for new users */}
      <OnboardingModal />

      {/* Page Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 flex items-center justify-center">
            <Users className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">
              {t('aiTeam.title')}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t('aiTeam.description')}
            </p>
          </div>
        </div>
      </header>

      {/* Suggested Agent Banner */}
      {suggestedAgent && suggestedAgent.agentId !== selectedAgent && (
        <button
          onClick={handleSuggestedAgentClick}
          className="w-full flex items-center gap-3 p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {t('aiTeam.suggestion.title', 'Rekommenderad för dig')}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 truncate">
              {t(suggestedAgent.reasonKey, suggestedAgent.reason)} — {t(`aiTeam.agents.${suggestedAgent.agentId}.name`)}
            </p>
          </div>
          <span className="text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
            →
          </span>
        </button>
      )}

      {/* Agent Selector */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
          </div>
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            {t('aiTeam.selectAgent')}
          </h2>
        </div>
        <AgentSelector />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 order-last lg:order-first">
          {/* Personality */}
          <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4">
            <PersonalityDropdown />
          </section>

          {/* Response Mode */}
          <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4">
            <ResponseModeSelector />
          </section>

          {/* Quick Actions */}
          <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4">
            <QuickActions onActionClick={handleQuickAction} />
          </section>

          {/* Tips Card */}
          <section className={cn(
            'rounded-xl border p-4',
            colors.bgLight,
            'border-stone-200 dark:border-stone-700/50'
          )}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center',
                'bg-white/50 dark:bg-stone-900/30'
              )}>
                <Lightbulb className={cn('w-3.5 h-3.5', colors.text)} />
              </div>
              <h3 className={cn('text-sm font-semibold', colors.text)}>
                {t('aiTeam.tips.title')}
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <li className="flex items-start gap-2">
                <span className={cn('w-1 h-1 rounded-full mt-1.5 flex-shrink-0', colors.bg)} />
                {t('aiTeam.tips.tip1')}
              </li>
              <li className="flex items-start gap-2">
                <span className={cn('w-1 h-1 rounded-full mt-1.5 flex-shrink-0', colors.bg)} />
                {t('aiTeam.tips.tip2')}
              </li>
              <li className="flex items-start gap-2">
                <span className={cn('w-1 h-1 rounded-full mt-1.5 flex-shrink-0', colors.bg)} />
                {t('aiTeam.tips.tip3')}
              </li>
            </ul>
          </section>
        </div>

        {/* Chat Area */}
        <div
          id="ai-chat"
          className="lg:col-span-3 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 overflow-hidden h-[450px] sm:h-[500px] lg:h-[600px] order-first lg:order-last"
          tabIndex={-1}
        >
          <AgentChat ref={chatRef} />
        </div>
      </div>
    </div>
  )
}
