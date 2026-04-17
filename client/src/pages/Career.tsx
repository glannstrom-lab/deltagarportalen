/**
 * Career Page - Main entry with tabs
 * 6 tabs: Arbetsmarknad, Anpassning, Credentials, Flytta, Karriärplan, Kompetens
 * Note: Nätverk moved to /nätverk, Företag removed (use Spontanansökan instead)
 */
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { careerTabDefs } from '../data/careerTabs'
import { userApi } from '@/services/api'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'

// Tab components
import LaborMarketTab from './career/LaborMarketTab'
import AdaptationTab from './career/AdaptationTab'
import PlanTab from './career/PlanTab'
import SkillsTab from './career/SkillsTab'
import CredentialsTab from './career/CredentialsTab'
import RelocationTab from './career/RelocationTab'

export default function CareerPage() {
  const { t } = useTranslation()

  // Mark career page as visited for onboarding tracking (cloud + localStorage fallback)
  useEffect(() => {
    localStorage.setItem('career-visited', 'true')
    // Also sync to cloud
    userApi.updateOnboardingStep('career', true).catch(err => {
      console.error('Error updating onboarding progress:', err)
    })
  }, [])

  // Build tabs with translated labels
  const careerTabs = careerTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
    description: tab.descriptionKey ? t(tab.descriptionKey) : undefined,
    badge: tab.badgeKey ? t(tab.badgeKey) : undefined,
  }))

  return (
    <>
      <PageLayout
        title={t('career.title')}
        description={t('career.description')}
        customTabs={careerTabs}
        tabVariant="glass"
        showTabs={true}
        className="space-y-6"
      >
        <Routes>
          <Route path="/" element={<LaborMarketTab />} />
          <Route path="/adaptation" element={<AdaptationTab />} />
          <Route path="/credentials" element={<CredentialsTab />} />
          <Route path="/relocation" element={<RelocationTab />} />
          <Route path="/plan" element={<PlanTab />} />
          <Route path="/skills" element={<SkillsTab />} />
          <Route path="*" element={<Navigate to="/career" replace />} />
        </Routes>
      </PageLayout>
      <HelpButton content={helpContent.career} />
    </>
  )
}
