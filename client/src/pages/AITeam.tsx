/**
 * AI Team Page
 * Main page for the "Mitt AI Team" feature
 * Users can chat with 5 specialized AI agents with customizable personalities
 */

import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { AgentSelector } from '@/components/ai-team/AgentSelector'
import { PersonalityDropdown } from '@/components/ai-team/PersonalityDropdown'
import { QuickActions } from '@/components/ai-team/QuickActions'
import { AgentChat, type AgentChatHandle } from '@/components/ai-team/AgentChat'
import { OnboardingModal } from '@/components/ai-team/OnboardingModal'
import { ResponseModeSelector } from '@/components/ai-team/ResponseModeSelector'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { getAgentById } from '@/components/ai-team/AgentSelector'
import { agentColorClasses } from '@/components/ai-team/types'
import { Users, Sparkles } from '@/components/ui/icons'

export default function AITeam() {
  const { t } = useTranslation()
  const { selectedAgent } = useAITeamStore()
  const agent = getAgentById(selectedAgent)
  const colors = agentColorClasses[agent.color]
  const chatRef = useRef<AgentChatHandle>(null)

  // Handle quick action click - send message to chat via ref
  const handleQuickAction = useCallback((prompt: string) => {
    chatRef.current?.sendMessage(prompt)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50/50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 pb-20">
      {/* Onboarding for new users */}
      <OnboardingModal />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 dark:from-teal-900/20 dark:via-cyan-900/20 dark:to-sky-900/20 border-b border-teal-100 dark:border-teal-800/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-200/30 to-cyan-200/30 dark:from-teal-700/20 dark:to-cyan-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-sky-200/30 to-teal-200/30 dark:from-sky-700/20 dark:to-teal-700/20 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 dark:from-teal-500 dark:to-cyan-600 shadow-lg shadow-teal-200 dark:shadow-teal-900/50">
              <Users className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-stone-100">
              {t('aiTeam.title')}
            </h1>
            <p className="text-lg text-slate-600 dark:text-stone-400 max-w-2xl mx-auto">
              {t('aiTeam.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Agent Selector */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {t('aiTeam.selectAgent')}
            </h2>
          </div>
          <AgentSelector />
        </Card>

        {/* Chat Area with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area - shown first on mobile */}
          <Card className="order-first lg:order-last lg:col-span-3 p-0 overflow-hidden h-[450px] sm:h-[500px] lg:h-[600px]">
            <AgentChat ref={chatRef} />
          </Card>

          {/* Sidebar - Personality & Quick Actions */}
          <div className="order-last lg:order-first lg:col-span-1 space-y-4">
            <Card className="p-4">
              <PersonalityDropdown />
            </Card>
            <Card className="p-4">
              <ResponseModeSelector />
            </Card>
            <Card className="p-4">
              <QuickActions onActionClick={handleQuickAction} />
            </Card>

            {/* Tips Card */}
            <Card className={cn(
              'p-4',
              colors.bgLight,
              colors.border,
              'border'
            )}>
              <h3 className={cn('font-semibold mb-2', colors.text)}>
                {t('aiTeam.tips.title')}
              </h3>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2">
                  <span className={colors.text}>•</span>
                  {t('aiTeam.tips.tip1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className={colors.text}>•</span>
                  {t('aiTeam.tips.tip2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className={colors.text}>•</span>
                  {t('aiTeam.tips.tip3')}
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
