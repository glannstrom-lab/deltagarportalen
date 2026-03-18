/**
 * Career Page - Main entry with tabs
 * 8 tabs: Utforska, Nätverk, Anpassning, Företag, Credentials, Flytta, Karriärplan, Kompetens
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { careerTabDefs } from '../data/careerTabs'

// Tab components
import ExploreTab from './career/ExploreTab'
import NetworkTab from './career/NetworkTab'
import AdaptationTab from './career/AdaptationTab'
import CompaniesTab from './career/CompaniesTab'
import PlanTab from './career/PlanTab'
import SkillsTab from './career/SkillsTab'
import CredentialsTab from './career/CredentialsTab'
import RelocationTab from './career/RelocationTab'

export default function CareerPage() {
  const { t } = useTranslation()

  // Build tabs with translated labels
  const careerTabs = careerTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
    description: tab.descriptionKey ? t(tab.descriptionKey) : undefined,
    badge: tab.badgeKey ? t(tab.badgeKey) : undefined,
  }))

  return (
    <PageLayout
      title={t('career.title')}
      description={t('career.description')}
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
        <Route path="/credentials" element={<CredentialsTab />} />
        <Route path="/relocation" element={<RelocationTab />} />
        <Route path="/plan" element={<PlanTab />} />
        <Route path="/skills" element={<SkillsTab />} />
        <Route path="*" element={<Navigate to="/career" replace />} />
      </Routes>
    </PageLayout>
  )
}
