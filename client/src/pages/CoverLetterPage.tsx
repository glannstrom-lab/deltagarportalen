/**
 * Cover Letter Page - Main entry with 5 tabs
 * Tabs: Skriv brev, Mina brev, Dina ansökningar, Färdiga mallar, Din statistik
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { coverLetterTabDefs } from '@/data/coverLetterTabs'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { CoverLetterWrite } from '@/components/cover-letter/CoverLetterWrite'
import { CoverLetterMyLetters } from '@/components/cover-letter/CoverLetterMyLetters'
import { CoverLetterApplications } from '@/components/cover-letter/CoverLetterApplications'
import { CoverLetterTemplates } from '@/components/cover-letter/CoverLetterTemplates'
import { CoverLetterStatistics } from '@/components/cover-letter/CoverLetterStatistics'

export default function CoverLetterPage() {
  const location = useLocation()
  const { t } = useTranslation()

  // Build tabs with translated labels
  const coverLetterTabs = coverLetterTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))

  // Get current tab label for title
  const currentTab = coverLetterTabs.find(
    (tab) => location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
  )
  const pageTitle = currentTab?.label || t('coverLetter.title')

  return (
    <>
      <PageLayout
        title={pageTitle}
        description={t('coverLetter.description')}
        customTabs={coverLetterTabs}
        tabVariant="glass"
        showTabs={true}
        className="space-y-6"
      >
        <Routes>
          <Route path="/" element={<CoverLetterWrite />} />
          <Route path="/my-letters" element={<CoverLetterMyLetters />} />
          <Route path="/applications" element={<CoverLetterApplications />} />
          <Route path="/templates" element={<CoverLetterTemplates />} />
          <Route path="/statistics" element={<CoverLetterStatistics />} />
          <Route path="*" element={<Navigate to="/cover-letter" replace />} />
        </Routes>
      </PageLayout>
      <HelpButton content={helpContent.coverLetter} />
    </>
  )
}
