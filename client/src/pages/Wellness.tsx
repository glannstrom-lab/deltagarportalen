/**
 * Wellness Page - Main entry with tabs
 * 4 tabs: Hälsa, Rutiner, Kognitiv träning, Akut stöd
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { wellnessTabDefs } from '../data/wellnessTabs'
import { Smile } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusWellnessWizard } from '@/components/focus/pages/FocusWellnessWizard'
import { WellnessConsentGate } from '@/components/consent/WellnessConsentGate'

// Tab components
import HealthTab from './wellness/HealthTab'
import RoutinesTab from './wellness/RoutinesTab'
import CognitiveTab from './wellness/CognitiveTab'
import CrisisTab from './wellness/CrisisTab'

export default function WellnessPage() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('wellness.title', 'Mående')}
        icon={Smile}
        domain="wellbeing"
      >
        <FocusWellnessWizard onExit={toggleFocusMode} />
      </PageFocusShell>
    )
  }

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
        domain="wellbeing"
        className="max-w-7xl mx-auto space-y-6"
      >
        <Routes>
          <Route path="/" element={<WellnessConsentGate><HealthTab /></WellnessConsentGate>} />
          <Route path="/routines" element={<RoutinesTab />} />
          <Route path="/cognitive" element={<CognitiveTab />} />
          <Route path="/crisis" element={<CrisisTab />} />
          {/* Redirect old energy URL to health tab */}
          <Route path="/energy" element={<Navigate to="/wellness" replace />} />
          <Route path="*" element={<Navigate to="/wellness" replace />} />
        </Routes>
      </PageLayout>
    </>
  )
}
