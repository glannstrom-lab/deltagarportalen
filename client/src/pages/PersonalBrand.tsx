/**
 * Personal Brand Page - Personal branding tools
 * Tabs: Audit, Portfolio, Visibility
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Star, ClipboardCheck, FolderOpen, Eye } from 'lucide-react'
import type { Tab } from '@/components/layout/PageTabs'

// Tab components
import BrandAuditTab from './personal-brand/BrandAuditTab'
import PortfolioTab from './personal-brand/PortfolioTab'
import VisibilityTab from './personal-brand/VisibilityTab'

const brandTabs: Tab[] = [
  { id: 'audit', label: 'Varumärkesaudit', path: '/personal-brand', icon: ClipboardCheck, description: 'Analysera ditt personliga varumärke' },
  { id: 'portfolio', label: 'Portfolio', path: '/personal-brand/portfolio', icon: FolderOpen, description: 'Visa upp dina projekt', badge: 'Ny!' },
  { id: 'visibility', label: 'Synlighet', path: '/personal-brand/visibility', icon: Eye, description: 'Öka din digitala närvaro' },
]

export default function PersonalBrandPage() {
  const { t } = useTranslation()

  return (
    <PageLayout
      title="Personligt Varumärke"
      description="Bygg och stärk ditt professionella varumärke"
      icon={Star}
      customTabs={brandTabs}
      tabVariant="glass"
      showTabs={true}
      className="space-y-6"
    >
      <Routes>
        <Route path="/" element={<BrandAuditTab />} />
        <Route path="/portfolio" element={<PortfolioTab />} />
        <Route path="/visibility" element={<VisibilityTab />} />
        <Route path="*" element={<Navigate to="/personal-brand" replace />} />
      </Routes>
    </PageLayout>
  )
}
