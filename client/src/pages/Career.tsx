/**
 * Career Page - Main entry with tabs
 * 5 tabs: Arbetsmarknad, Anpassning, Credentials, Flytta, Karriärplan
 * Note: Nätverk moved to /nätverk, Företag removed (use Spontanansökan instead)
 * Note: Kompetens merged into standalone /skills-gap page
 */
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { careerTabDefs } from '../data/careerTabs'
import { userApi } from '@/services/supabaseApi'
import { Target } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusCareerWizard } from '@/components/focus/pages/FocusCareerWizard'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'

// Tab components
import LaborMarketTab from './career/LaborMarketTab'
import AdaptationTab from './career/AdaptationTab'
import PlanTab from './career/PlanTab'
import CredentialsTab from './career/CredentialsTab'
import RelocationTab from './career/RelocationTab'

export default function CareerPage() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()

  // Mark career page as visited for onboarding tracking (cloud + localStorage fallback)
  useEffect(() => {
    localStorage.setItem('career-visited', 'true')
    // Also sync to cloud
    userApi.updateOnboardingStep('career', true).catch(err => {
      console.error('Error updating onboarding progress:', err)
    })
  }, [])

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('career.title', 'Karriär')}
        icon={Target}
        domain="coaching"
      >
        <FocusCareerWizard onExit={leaveWizard} />
      </PageFocusShell>
    )
  }

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
        domain="coaching"
      >
        <RadgivarTips pathname="/career" index={0} />

        <Routes>
          <Route path="/" element={<LaborMarketTab />} />
          <Route path="/adaptation" element={<AdaptationTab />} />
          <Route path="/credentials" element={<CredentialsTab />} />
          <Route path="/relocation" element={<RelocationTab />} />
          <Route path="/plan" element={<PlanTab />} />
          <Route path="*" element={<Navigate to="/career" replace />} />
        </Routes>
      </PageLayout>
    </>
  )
}
