/**
 * CV Page - Main entry with 4 tabs
 * Tabs: Skapa CV, Mina CV, ATS-analys, CV-tips
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { cvTabDefs } from '@/data/cvTabs'
import CVBuilder from './CVBuilder'
import { MyCVs } from '@/components/cv/MyCVs'
import { ATSAnalysis } from '@/components/cv/ATSAnalysis'
import { CVTips } from '@/components/cv/CVTips'

export default function CVPage() {
  const location = useLocation()
  const { t } = useTranslation()

  // Build tabs with translated labels
  const cvTabs = cvTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))

  // Get current tab label for title
  const currentTab = cvTabs.find(
    (tab) => location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
  )
  const pageTitle = currentTab?.label || t('cv.title')

  return (
    <PageLayout
      title={pageTitle}
      description={t('cv.description')}
      customTabs={cvTabs}
      tabVariant="glass"
      showTabs={true}
      className="space-y-6"
    >
      <Routes>
        <Route path="/" element={<CVBuilder />} />
        <Route path="/my-cvs" element={<MyCVs />} />
        <Route path="/ats" element={<ATSAnalysis />} />
        <Route path="/tips" element={<CVTips />} />
        <Route path="*" element={<Navigate to="/cv" replace />} />
      </Routes>
    </PageLayout>
  )
}
