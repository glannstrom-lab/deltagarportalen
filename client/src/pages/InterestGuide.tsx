/**
 * Interest Guide Page - Main entry point with tab navigation
 */
import { lazy, Suspense, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { LoadingState } from '@/components/ui'
import { interestGuideTabDefs } from '@/data/interestGuideTabs'
import { Compass } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusInterestGuideWizard } from '@/components/focus/pages/FocusInterestGuideWizard'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'

// Lazy load tab components
const TestTab = lazy(() => import('./interest-guide/TestTab'))
const ResultsTab = lazy(() => import('./interest-guide/ResultsTab'))
const OccupationsTab = lazy(() => import('./interest-guide/OccupationsTab'))
const ExploreTab = lazy(() => import('./interest-guide/ExploreTab'))
const HistoryTab = lazy(() => import('./interest-guide/HistoryTab'))

function TabLoading() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-12 bg-stone-50 dark:bg-stone-900">
      <LoadingState title={t('common.loading')} size="lg" />
    </div>
  )
}

export default function InterestGuide() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()
  const { pathname } = useLocation()

  const interestGuideTabs = useMemo(
    () => interestGuideTabDefs.map((tab) => ({ ...tab, label: t(tab.labelKey) })),
    [t]
  )

  /**
   * Rådgivartipset var hårdkodat till `index={0}` och låg utanför `<Routes>`,
   * så samma mening — "Svara intuitivt, första instinkten är oftast rätt" —
   * stod överst även på Resultat, Yrken, Utforska och Historik, där man inte
   * svarar på något. Nu väljs ett tips per flik.
   */
  const flikIndex = Math.max(0, interestGuideTabDefs.findIndex((tab) => tab.path === pathname))

  return (
    <>
      {isFocusMode && (
        <PageFocusShell
          title={t('interestGuide.title', 'Intresseguide')}
          icon={Compass}
          domain="coaching"
        >
          <FocusInterestGuideWizard onExit={leaveWizard} />
        </PageFocusShell>
      )}

      {/*
        Flikarna DÖLJS i fokusläge, de avmonteras inte.

        `if (isFocusMode) return <PageFocusShell>` låg ovanför den här returen
        och rev `<Routes>`. Testsvaren överlever tack vare serversparningen,
        men filterval, expanderade kort och skrollposition försvann — och
        nästa osparade fält någon lägger in i en flik hade fått den riktiga
        buggen gratis. Samma mönster som Intervjusimulatorn (2026-08-19) och
        Karriär (2026-08-21). `display: none` behåller komponenterna monterade
        och tar samtidigt bort trädet ur tillgänglighetsträdet.
      */}
      <div style={isFocusMode ? { display: 'none' } : undefined}>
        <PageLayout
          title={t('interestGuide.title')}
          subtitle={t('interestGuide.discover')}
          tabs={interestGuideTabs}
          domain="coaching"
          className="sidbredd"
        >
          <RadgivarTips pathname={pathname} index={flikIndex} />

          <Suspense fallback={<TabLoading />}>
            <Routes>
              <Route index element={<TestTab />} />
              <Route path="results" element={<ResultsTab />} />
              <Route path="occupations" element={<OccupationsTab />} />
              <Route path="explore" element={<ExploreTab />} />
              <Route path="history" element={<HistoryTab />} />
              <Route path="*" element={<Navigate to="/interest-guide" replace />} />
            </Routes>
          </Suspense>
        </PageLayout>
      </div>
    </>
  )
}
