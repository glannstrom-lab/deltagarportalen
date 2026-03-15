/**
 * Cover Letter Page - Main entry with 5 tabs
 * Tabs: Skriv brev, Mina brev, Dina ansökningar, Färdiga mallar, Din statistik
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { coverLetterTabs } from '@/data/coverLetterTabs'
import { CoverLetterWrite } from '@/components/cover-letter/CoverLetterWrite'
import { CoverLetterMyLetters } from '@/components/cover-letter/CoverLetterMyLetters'
import { CoverLetterApplications } from '@/components/cover-letter/CoverLetterApplications'
import { CoverLetterTemplates } from '@/components/cover-letter/CoverLetterTemplates'
import { CoverLetterStatistics } from '@/components/cover-letter/CoverLetterStatistics'

export default function CoverLetterPage() {
  const location = useLocation()
  
  // Get current tab label for title
  const currentTab = coverLetterTabs.find(tab => location.pathname === tab.path || location.pathname.startsWith(tab.path + '/'))
  const pageTitle = currentTab?.label || 'Personligt brev'

  return (
    <PageLayout
      title={pageTitle}
      description="Skapa professionella personliga brev som öppnar dörrar till nya möjligheter"
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
  )
}
