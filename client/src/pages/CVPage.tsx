/**
 * CV Page - Main entry with 5 tabs
 * Tabs: Skapa CV, Mina CV, Mallar, ATS-analys, CV-tips
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { cvTabs } from '@/data/cvTabs'
import CVBuilder from './CVBuilder'
import { MyCVs } from '@/components/cv/MyCVs'
import { CVTemplates } from '@/components/cv/templates/CVTemplates'
import { ATSAnalysis } from '@/components/cv/ATSAnalysis'
import { CVTips } from '@/components/cv/CVTips'

export default function CVPage() {
  const location = useLocation()
  
  // Get current tab label for title
  const currentTab = cvTabs.find(tab => location.pathname === tab.path || location.pathname.startsWith(tab.path + '/'))
  const pageTitle = currentTab?.label || 'CV'

  return (
    <PageLayout
      title={pageTitle}
      description="Skapa, hantera och optimera ditt CV för att öka chanserna till drömjobbet"
      customTabs={cvTabs}
      showTabs={true}
      className="space-y-6"
    >
      <Routes>
        <Route path="/" element={<CVBuilder />} />
        <Route path="/my-cvs" element={<MyCVs />} />
        <Route path="/templates" element={<CVTemplates />} />
        <Route path="/ats" element={<ATSAnalysis />} />
        <Route path="/tips" element={<CVTips />} />
        <Route path="*" element={<Navigate to="/cv" replace />} />
      </Routes>
    </PageLayout>
  )
}
