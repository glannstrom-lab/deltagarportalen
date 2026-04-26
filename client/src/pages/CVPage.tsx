/**
 * CV Page - Main entry with 4 tabs
 * Tabs: Skapa CV, Mina CV, ATS-analys, CV-tips
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { cvTabDefs } from '@/data/cvTabs'
import CVBuilder from './CVBuilder'
import JobAdaptPage from './JobAdaptPage'
import { MyCVs } from '@/components/cv/MyCVs'
import { ATSAnalysis } from '@/components/cv/ATSAnalysis'
import { CVTips } from '@/components/cv/CVTips'
import { SaveIndicator } from '@/components/cv/SaveIndicator'

export default function CVPage() {
  const location = useLocation()
  const { t } = useTranslation()

  // Build tabs with translated labels
  const cvTabs = cvTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))

  // Check if we're on the CV builder page (show save indicator)
  const isBuilderPage = location.pathname === '/cv' || location.pathname === '/cv/'

  return (
    <>
      <PageLayout
        title={t('cv.title')}
        customTabs={cvTabs}
        tabVariant="glass"
        showTabs={true}
        actions={isBuilderPage ? <SaveIndicator /> : undefined}
        className="space-y-6"
        domain="coaching"
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
    </>
  )
}
