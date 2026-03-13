/**
 * Wellness Page - Main entry with tabs
 * 5 tabs: Hälsa, Energi, Rutiner, Kognitiv träning, Akut stöd
 */
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { wellnessTabs } from '../data/wellnessTabs'

// Tab components
import HealthTab from './wellness/HealthTab'
import EnergyTab from './wellness/EnergyTab'
import RoutinesTab from './wellness/RoutinesTab'
import CognitiveTab from './wellness/CognitiveTab'
import CrisisTab from './wellness/CrisisTab'

export default function WellnessPage() {
  const location = useLocation()
  
  // Get current tab label for title
  const currentTab = wellnessTabs.find(tab => 
    location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
  )
  
  const pageTitle = currentTab?.label || 'Hälsa'
  const pageDescription = currentTab?.description || 'Verktyg för ditt välmående'

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
      customTabs={wellnessTabs}
      showTabs={true}
      className="space-y-6"
    >
      <Routes>
        <Route path="/" element={<HealthTab />} />
        <Route path="/energy" element={<EnergyTab />} />
        <Route path="/routines" element={<RoutinesTab />} />
        <Route path="/cognitive" element={<CognitiveTab />} />
        <Route path="/crisis" element={<CrisisTab />} />
        <Route path="*" element={<Navigate to="/wellness" replace />} />
      </Routes>
    </PageLayout>
  )
}
