/**
 * CV Page - Main entry with 5 tabs
 * Använder PageLayout för neutral hub-header (persika 4px-accent)
 * per DESIGN.md "undersidor ärver moderhubbens färg".
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cvTabDefs } from '@/data/cvTabs'
import CVBuilder from './CVBuilder'
import JobAdaptPage from './JobAdaptPage'
import { MyCVs } from '@/components/cv/MyCVs'
import { ATSAnalysis } from '@/components/cv/ATSAnalysis'
import { CVTips } from '@/components/cv/CVTips'
import { SaveIndicator } from '@/components/cv/SaveIndicator'
import { FocusCVBuilder } from '@/components/cv/FocusCVBuilder'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageLayout } from '@/components/layout/PageLayout'

export default function CVPage() {
  const location = useLocation()
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  const cvTabs = cvTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))

  const isBuilderPage = location.pathname === '/cv' || location.pathname === '/cv/'

  // Focus mode: simplified layout utan tabs/full PageHeader
  if (isFocusMode && isBuilderPage) {
    return (
      <PageLayout
        title={t('cv.title')}
        subtitle={t('focusCV.subtitle', 'Steg-för-steg')}
        domain="activity"
        showTabs={false}
        className="max-w-7xl mx-auto"
      >
        <FocusCVBuilder onExitFocusMode={toggleFocusMode} />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={t('cv.title')}
      subtitle={t('cv.subtitle', 'Skapa och optimera ditt CV')}
      customTabs={cvTabs}
      tabVariant="glass"
      domain="activity"
      actions={isBuilderPage ? <SaveIndicator /> : undefined}
      className="max-w-7xl mx-auto"
    >
      <Routes>
        <Route path="/" element={<CVBuilder />} />
        <Route path="/my-cvs" element={<MyCVs />} />
        <Route path="/adapt" element={<JobAdaptPage />} />
        <Route path="/ats" element={<ATSAnalysis />} />
        <Route path="/tips" element={<CVTips />} />
        <Route path="*" element={<Navigate to="/cv" replace />} />
      </Routes>
    </PageLayout>
  )
}
