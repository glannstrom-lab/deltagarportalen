/**
 * Career Page - Main entry with tabs
 * 6 tabs: Utforska, Nätverk, Anpassning, Företag, Karriärplan, Kompetens
 */
import { Routes, Route, Navigate } from 'react-router-dom'
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
  return (
    <PageLayout
      title="Karriär"
      description="Utforska yrken och planera din framtid"
      customTabs={careerTabs}
      tabVariant="glass"
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
