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
import { ResponseModeSelector } from '@/components/ai-team/ResponseModeSelector'
import { InlineTip } from '@/components/ui/InlineTip'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { agentColorClasses } from '@/components/ai-team/types'
import { Users, Lightbulb, Bot } from '@/components/ui/icons'
import { useSuggestedAgent } from '@/hooks/useSuggestedAgent'
import { PageLayout } from '@/components/layout/PageLayout'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FocusAITeamWizard } from '@/components/focus/pages/FocusAITeamWizard'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'

export default function AITeam() {
  const { t } = useTranslation()
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('aiTeam.title', 'AI-team')}
      icon={Bot}
      /* "action" är Översiktens mint. Sidan hör till hubben Resurser, och
         normalvyn nedan säger redan "info" — så fokusläget färgade om hela
         sidan till fel hubb. Samma bugg som Article.tsx hade 2026-08-22. */
      domain="info"
      guide={<FocusAITeamWizard onExit={leaveWizard} />}
    >
      <AITeamInner />
    </FokusVaxel>
  )
}

function AITeamInner() {
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
    <PageLayout
      title={t('aiTeam.title')}
      subtitle={t('aiTeam.description')}
      domain="info"
      showTabs={false}
      className="sidbredd"
    >
      {/* Skip link for accessibility */}
      <a
        href="#ai-chat"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--c-solid)] focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        {t('aiTeam.skipToChat', 'Hoppa till chatten')}
      </a>

      {/* Onboarding via InlineTip — DESIGN.md §12 ersätter den tidigare
          OnboardingModal. AI Team-sidan självförklarar (titel + agentkort)
          så en kort inline-tip räcker. */}
      <InlineTip storageKey="ai-team-intro" icon={Lightbulb} className="mb-4">
        {t(
          'aiTeam.intro',
          'Här är ditt team. Välj vem du vill prata med — du kan ändra personlighet och svarslängd i sidopanelen när som helst.'
        )}
      </InlineTip>

      {/* Suggested Agent Banner */}
      {suggestedAgent && suggestedAgent.agentId !== selectedAgent && (
        <button
          onClick={handleSuggestedAgentClick}
          /* Amber är enligt DESIGN.md §4 semantisk varningsfärg. Ett positivt
             förslag är ingen varning — och en amber-yta mitt på en sky-blå
             sida bryter en-färg-per-sida-regeln. */
          className="w-full flex items-center gap-3 p-3 mb-4 rounded-xl bg-[var(--c-bg)] border border-[var(--c-accent)] hover:bg-[var(--c-accent)]/30 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-stone-900/40 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-[var(--c-text)]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--c-text)]">
              {t('aiTeam.suggestion.title', 'Rekommenderad för dig')}
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
              {t(suggestedAgent.reasonKey, suggestedAgent.reason)} — {t(`aiTeam.agents.${suggestedAgent.agentId}.name`)}
            </p>
          </div>
          <span aria-hidden="true" className="text-[var(--c-text)] group-hover:translate-x-1 transition-transform">
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
        {/* Chat Area */}
        {/*
          Höjden är relativ till fönstret, inte tre fasta pixeltal. Med
          `h-[450px]` krympte inte chatten när mobiltangentbordet fälldes upp,
          så fältet man skrev i kunde hamna bakom det — och sidan fick både en
          yttre och en inre scroll på en liten skärm.

          `role="region"` + namn: skiplänken ovan flyttar fokus hit, men målet
          hade varken roll eller namn, så en skärmläsare sa ingenting om var
          man landat.
        */}
        <div
          id="ai-chat"
          role="region"
          aria-label={t('aiTeam.chatHistory', 'Chatthistorik')}
          className="lg:col-span-3 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 overflow-hidden h-[min(70dvh,600px)] min-h-[420px] lg:order-last"
          tabIndex={-1}
        >
          <AgentChat ref={chatRef} />
        </div>
        {/*
          Sidopanelen ligger EFTER chatten i DOM.

          Den låg före, och `order-last`/`lg:order-first` flyttade den visuellt
          — vilket betyder att tangentbord och skärmläsare på mobil gick genom
          personlighet, svarslängd, fem snabbfunktioner och tipsrutan INNAN
          chatten, trots att chatten syns överst. WCAG 1.3.2 och 2.4.3.
        */}
        <div className="lg:col-span-1 space-y-4 lg:order-first">
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
      </div>
    </PageLayout>
  )
}
