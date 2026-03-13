/**
 * Career Page - Main entry with tabs
 * 6 tabs: Utforska, Nätverk, Anpassning, Företag, Karriärplan, Kompetens
 */
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { careerTabs } from '../data/careerTabs'

// Tab components
import ExploreTab from './career/ExploreTab'
import NetworkTab from './career/NetworkTab'
import AdaptationTab from './career/AdaptationTab'
import CompaniesTab from './career/CompaniesTab'
import PlanTab from './career/PlanTab'
import SkillsTab from './career/SkillsTab'

export default function CareerPage() {
  const location = useLocation()
  
  // Get current tab label for title
  const currentTab = careerTabs.find(tab => 
    location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
  )
  
  const pageTitle = currentTab?.label || 'Karriär'
  const pageDescription = currentTab?.description || 'Utforska yrken och planera din framtid'

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
      customTabs={careerTabs}
      showTabs={true}
      className="space-y-6"
    >
      <Routes>
        <Route path="/" element={<ExploreTab />} />
        <Route path="/network" element={<NetworkTab />} />
        <Route path="/adaptation" element={<AdaptationTab />} />
        <Route path="/companies" element={<CompaniesTab />} />
        <Route path="/plan" element={<PlanTab />} />
        <Route path="/skills" element={<SkillsTab />} />
        <Route path="*" element={<Navigate to="/career" replace />} />
      </Routes>
    </PageLayout>
  )
}
