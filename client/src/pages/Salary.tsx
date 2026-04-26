/**
 * Salary Page - Löneförhandling & Marknadsdata
 * Tabs: Kalkylator, Förhandling, Marknadsdata
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Calculator, TrendingUp, BarChart3, Wallet } from '@/components/ui/icons'
import type { Tab } from '@/components/layout/PageTabs'

// Tab components
import SalaryCalculatorTab from './salary/SalaryCalculatorTab'
import NegotiationTab from './salary/NegotiationTab'
import MarketDataTab from './salary/MarketDataTab'

const salaryTabs: Tab[] = [
  { id: 'calculator', label: 'Lönekalkylator', path: '/salary', icon: Calculator, description: 'Beräkna marknadslön för ditt yrke' },
  { id: 'negotiation', label: 'Förhandling', path: '/salary/negotiation', icon: TrendingUp, description: 'Tips för löneförhandling', badge: 'Ny!' },
  { id: 'market', label: 'Marknadsdata', path: '/salary/market', icon: BarChart3, description: 'Lönestatistik per bransch' },
]

export default function SalaryPage() {
  const { t } = useTranslation()

  return (
    <PageLayout
      title="Lön & Förhandling"
      description="Få koll på löneläget och förhandla smartare"
      icon={Wallet}
      customTabs={salaryTabs}
      tabVariant="glass"
      showTabs={true}
      className="space-y-6"
      domain="coaching"
    >
      <Routes>
        <Route path="/" element={<SalaryCalculatorTab />} />
        <Route path="/negotiation" element={<NegotiationTab />} />
        <Route path="/market" element={<MarketDataTab />} />
        <Route path="*" element={<Navigate to="/salary" replace />} />
      </Routes>
    </PageLayout>
  )
}
