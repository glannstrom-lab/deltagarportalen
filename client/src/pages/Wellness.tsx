/**
 * Wellness Page - Main entry with tabs
 * 5 tabs: Hälsa, Energi, Rutiner, Kognitiv träning, Akut stöd
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { wellnessTabs } from '../data/wellnessTabs'

// Tab components
import HealthTab from './wellness/HealthTab'
import EnergyTab from './wellness/EnergyTab'
import RoutinesTab from './wellness/RoutinesTab'
import CognitiveTab from './wellness/CognitiveTab'
import CrisisTab from './wellness/CrisisTab'

export default function WellnessPage() {
  return (
    <PageLayout
      title="Hälsa"
      description="Verktyg för ditt välmående"
      customTabs={wellnessTabs}
      tabVariant="glass"
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
