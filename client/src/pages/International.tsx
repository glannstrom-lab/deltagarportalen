/**
 * International Page - Visa/Immigration Guide for International Job Seekers
 * Tabs: Visum, Integration, Språk
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Globe, FileCheck, Users, Languages } from '@/components/ui/icons'
import type { Tab } from '@/components/layout/PageTabs'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusInternationalWizard } from '@/components/focus/pages/FocusInternationalWizard'

// Tab components
import VisaGuideTab from './international/VisaGuideTab'
import IntegrationTab from './international/IntegrationTab'
import LanguageTab from './international/LanguageTab'

export default function InternationalPage() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  const internationalTabs: Tab[] = [
    { id: 'visa', label: t('international.tabs.visa.label'), path: '/international', icon: FileCheck, description: t('international.tabs.visa.description') },
    { id: 'integration', label: t('international.tabs.integration.label'), path: '/international/integration', icon: Users, description: t('international.tabs.integration.description'), badge: t('international.tabs.newBadge') },
    { id: 'language', label: t('international.tabs.language.label'), path: '/international/language', icon: Languages, description: t('international.tabs.language.description') },
  ]

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('international.title', 'Internationellt')}
        icon={Globe}
        domain="activity"
      >
        <FocusInternationalWizard onExit={toggleFocusMode} />
      </PageFocusShell>
    )
  }

  return (
    <PageLayout
      title={t('international.pageTitle')}
      description={t('international.pageDescription')}
      icon={Globe}
      customTabs={internationalTabs}
      tabVariant="glass"
      showTabs={true}
      domain="activity"
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Editorial-spot (Fas 6) */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--c-bg)] border border-[var(--c-accent)]/50">
        <img
          src="/illustrations/spot-internationellt.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-16 h-16 flex-shrink-0 select-none"
        />
        <p className="text-sm sm:text-base text-stone-700 dark:text-stone-200">
          Visum, integration och språk — det du behöver för att jobba i ett nytt land.
        </p>
      </div>

      <Routes>
        <Route path="/" element={<VisaGuideTab />} />
        <Route path="/integration" element={<IntegrationTab />} />
        <Route path="/language" element={<LanguageTab />} />
        <Route path="*" element={<Navigate to="/international" replace />} />
      </Routes>
    </PageLayout>
  )
}
