/**
 * Personal Brand Page - Personal branding tools
 * Tabs: Audit, Pitch, Portfolio, Visibility
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Star, ClipboardCheck, FolderOpen, Eye, Mic } from '@/components/ui/icons'
import type { Tab } from '@/components/layout/PageTabs'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusPersonalBrandWizard } from '@/components/focus/pages/FocusPersonalBrandWizard'

// Tab components
import BrandAuditTab from './personal-brand/BrandAuditTab'
import PitchTab from './personal-brand/PitchTab'
import PortfolioTab from './personal-brand/PortfolioTab'
import VisibilityTab from './personal-brand/VisibilityTab'

export default function PersonalBrandPage() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  const brandTabs: Tab[] = [
    { id: 'audit', label: t('personalBrand.tabs.audit.label'), path: '/personal-brand', icon: ClipboardCheck, description: t('personalBrand.tabs.audit.description') },
    { id: 'pitch', label: t('personalBrand.tabs.pitch.label'), path: '/personal-brand/pitch', icon: Mic, description: t('personalBrand.tabs.pitch.description'), badge: t('personalBrand.tabs.newBadge') },
    { id: 'portfolio', label: t('personalBrand.tabs.portfolio.label'), path: '/personal-brand/portfolio', icon: FolderOpen, description: t('personalBrand.tabs.portfolio.description') },
    { id: 'visibility', label: t('personalBrand.tabs.visibility.label'), path: '/personal-brand/visibility', icon: Eye, description: t('personalBrand.tabs.visibility.description') },
  ]

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('personalBrand.title', 'Personligt varumärke')}
        icon={Star}
        domain="coaching"
      >
        <FocusPersonalBrandWizard onExit={toggleFocusMode} />
      </PageFocusShell>
    )
  }

  return (
    <PageLayout
      title={t('personalBrand.pageTitle')}
      description={t('personalBrand.pageDescription')}
      icon={Star}
      customTabs={brandTabs}
      tabVariant="glass"
      showTabs={true}
      className="max-w-7xl mx-auto space-y-6"
      domain="coaching"
    >
      {/* Editorial-spot (Fas 6) */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--c-bg)] border border-[var(--c-accent)]/50">
        <img
          src="/illustrations/spot-varumarke.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-16 h-16 flex-shrink-0 select-none"
        />
        <p className="text-sm sm:text-base text-stone-700 dark:text-stone-200">
          {t('personalBrand.editorialSpot')}
        </p>
      </div>

      <Routes>
        <Route path="/" element={<BrandAuditTab />} />
        <Route path="/pitch" element={<PitchTab />} />
        <Route path="/portfolio" element={<PortfolioTab />} />
        <Route path="/visibility" element={<VisibilityTab />} />
        <Route path="*" element={<Navigate to="/personal-brand" replace />} />
      </Routes>
    </PageLayout>
  )
}
