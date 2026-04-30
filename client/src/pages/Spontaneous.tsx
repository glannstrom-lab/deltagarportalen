/**
 * Spontaneous Application Page (Spontanansökan)
 * Helps job seekers find and track companies for spontaneous applications
 */
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { spontaneousTabDefs } from '@/data/spontaneousTabs'
import { userApi } from '@/services/api'
import { HelpButton } from '@/components/HelpButton'

// Tab components
import SearchTab from './spontaneous/SearchTab'
import MyCompaniesTab from './spontaneous/MyCompaniesTab'
import StatsTab from './spontaneous/StatsTab'

export default function SpontaneousPage() {
  const { t } = useTranslation()

  // Mark page as visited for onboarding tracking
  useEffect(() => {
    localStorage.setItem('spontaneous-visited', 'true')
    userApi.updateOnboardingStep('spontaneous', true).catch(err => {
      console.error('Error updating onboarding progress:', err)
    })
  }, [])

  // Build tabs with translated labels (fallback to Swedish)
  const tabs = spontaneousTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey, tab.labelKey.split('.').pop()),
    description: tab.descriptionKey ? t(tab.descriptionKey, '') : undefined,
  }))

  // Help content for this page
  const helpContent = {
    title: 'Om Spontanansökan',
    description: 'Här kan du hitta och hålla koll på företag du vill skicka spontanansökningar till.',
    sections: [
      {
        title: 'Sök företag',
        content: 'Ange ett organisationsnummer för att hämta information om ett företag från Bolagsverket.',
      },
      {
        title: 'Spara intressanta företag',
        content: 'Spara företag du vill kontakta och håll koll på din jobbsökning.',
      },
      {
        title: 'Spåra din kontakt',
        content: 'Uppdatera status när du kontaktar företag och får svar.',
      },
    ],
  }

  return (
    <>
      <PageLayout
        title={t('spontaneous.title', 'Spontanansökan')}
        description={t('spontaneous.description', 'Hitta och kontakta företag som passar dig')}
        customTabs={tabs}
        tabVariant="glass"
        showTabs={true}
        className="max-w-7xl mx-auto space-y-6"
      >
        <Routes>
          <Route path="/" element={<SearchTab />} />
          <Route path="/mina-foretag" element={<MyCompaniesTab />} />
          <Route path="/statistik" element={<StatsTab />} />
          <Route path="*" element={<Navigate to="/spontanansökan" replace />} />
        </Routes>
      </PageLayout>
      <HelpButton content={helpContent} />
    </>
  )
}
