/**
 * Wellness Page - Main entry with tabs
 * 5 tabs: Hälsa, Energi, Rutiner, Kognitiv träning, Akut stöd
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { wellnessTabDefs } from '../data/wellnessTabs'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'

// Tab components
import HealthTab from './wellness/HealthTab'
import EnergyTab from './wellness/EnergyTab'
import RoutinesTab from './wellness/RoutinesTab'
import CognitiveTab from './wellness/CognitiveTab'
import CrisisTab from './wellness/CrisisTab'

export default function WellnessPage() {
  const { t } = useTranslation()

  // Build tabs with translated labels
  const wellnessTabs = wellnessTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
    description: tab.descriptionKey ? t(tab.descriptionKey) : undefined,
  }))

  return (
    <>
      <PageLayout
        title={t('wellness.title')}
        description={t('wellness.description')}
        customTabs={wellnessTabs}
        tabVariant="glass"
        showTabs={true}
        className="space-y-6"
      >
        <Routes>
          <Route path="/" element={<HealthTab />} />
          <Route path="/energy" element={<EnergyTab />} />
          <Route path="/routines" element={<RoutinesTab />} />
          <Route path="/cognitive" element={<CognitiveTab />} />
          <Route path="/crisis" element={<CrisisTab />} />
          <Route path="*" element={<Navigate to="/wellness" replace />} />
        </Routes>
      </PageLayout>
      <HelpButton content={helpContent.wellness} />
    </>
  )
}
