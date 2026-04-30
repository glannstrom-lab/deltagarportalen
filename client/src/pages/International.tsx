/**
 * International Page - Visa/Immigration Guide for International Job Seekers
 * Tabs: Visum, Integration, Språk
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Globe, FileCheck, Users, Languages } from '@/components/ui/icons'
import type { Tab } from '@/components/layout/PageTabs'

// Tab components
import VisaGuideTab from './international/VisaGuideTab'
import IntegrationTab from './international/IntegrationTab'
import LanguageTab from './international/LanguageTab'

const internationalTabs: Tab[] = [
  { id: 'visa', label: 'Visum & Arbetstillstånd', path: '/international', icon: FileCheck, description: 'Guide för arbetstillstånd' },
  { id: 'integration', label: 'Integration', path: '/international/integration', icon: Users, description: 'Checklista för etablering', badge: 'Ny!' },
  { id: 'language', label: 'Språk', path: '/international/language', icon: Languages, description: 'Svenska för arbetslivet' },
]

export default function InternationalPage() {
  const { t } = useTranslation()

  return (
    <PageLayout
      title="Internationell Guide"
      description="Allt du behöver veta om att arbeta i Sverige"
      icon={Globe}
      customTabs={internationalTabs}
      tabVariant="glass"
      showTabs={true}
      domain="activity"
      className="max-w-7xl mx-auto space-y-6"
    >
      <Routes>
        <Route path="/" element={<VisaGuideTab />} />
        <Route path="/integration" element={<IntegrationTab />} />
        <Route path="/language" element={<LanguageTab />} />
        <Route path="*" element={<Navigate to="/international" replace />} />
      </Routes>
    </PageLayout>
  )
}
