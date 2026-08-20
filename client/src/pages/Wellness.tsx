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
  const { isFocusMode, leaveWizard } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('wellness.title', 'Mående')}
        icon={Smile}
        domain="wellbeing"
      >
        {/* MV3 (2026-08-21): grinden låg tidigare BARA på `<Route path="/">`
            nedan, så fokusläget renderades utanför den. Wizarden skriver till
            `mood_logs`, som är RLS-grindad på `check_wellness_consent` — utan
            samtycke nekade databasen skrivningen medan wizarden ändå stängdes
            med en klarmarkering. Ett fokusläge byggt för den som lätt tappar
            tråden gav alltså en falsk kvittens på att måendet loggats.
            Grinden hör hemma runt BÅDA vägarna, inte den ena. */}
        <WellnessConsentGate>
          <FocusWellnessWizard onExit={leaveWizard} />
        </WellnessConsentGate>
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
        className="space-y-6"
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
