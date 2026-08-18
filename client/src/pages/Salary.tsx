/**
 * Salary Page - Löneförhandling & Marknadsdata
 * Tabs: Kalkylator, Förhandling, Marknadsdata
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Calculator, TrendingUp, BarChart3, Wallet } from '@/components/ui/icons'
import type { Tab } from '@/components/layout/PageTabs'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusSalaryWizard } from '@/components/focus/pages/FocusSalaryWizard'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'

// Tab components
import SalaryCalculatorTab from './salary/SalaryCalculatorTab'
import NegotiationTab from './salary/NegotiationTab'
import MarketDataTab from './salary/MarketDataTab'

export default function SalaryPage() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()

  const salaryTabs: Tab[] = [
    { id: 'calculator', label: t('salary.tabs.calculator.label'), path: '/salary', icon: Calculator, description: t('salary.tabs.calculator.description') },
    { id: 'negotiation', label: t('salary.tabs.negotiation.label'), path: '/salary/negotiation', icon: TrendingUp, description: t('salary.tabs.negotiation.description'), badge: t('salary.tabs.newBadge') },
    { id: 'market', label: t('salary.tabs.market.label'), path: '/salary/market', icon: BarChart3, description: t('salary.tabs.market.description') },
  ]

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('salary.title', 'Lön')}
        icon={Wallet}
        domain="activity"
      >
        <FocusSalaryWizard onExit={leaveWizard} />
      </PageFocusShell>
    )
  }

  return (
    <PageLayout
      title={t('salary.pageTitle')}
      description={t('salary.pageDescription')}
      icon={Wallet}
      customTabs={salaryTabs}
      tabVariant="glass"
      showTabs={true}
      className="space-y-6"
      domain="activity"
    >
      <Routes>
        <Route path="/" element={<><SalaryCalculatorTab /><RadgivarTips pathname="/salary" index={0} /></>} />
        <Route path="/negotiation" element={<NegotiationTab />} />
        <Route path="/market" element={<MarketDataTab />} />
        <Route path="*" element={<Navigate to="/salary" replace />} />
      </Routes>
    </PageLayout>
  )
}
