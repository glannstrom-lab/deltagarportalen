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

// Tab components
import SalaryCalculatorTab from './salary/SalaryCalculatorTab'
import NegotiationTab from './salary/NegotiationTab'
import MarketDataTab from './salary/MarketDataTab'

export default function SalaryPage() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

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
        <FocusSalaryWizard onExit={toggleFocusMode} />
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
      className="max-w-7xl mx-auto space-y-6"
      domain="activity"
    >
      {/* Editorial-spot (Fas 6) */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--c-bg)] border border-[var(--c-accent)]/50">
        <img
          src="/illustrations/spot-lon.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-16 h-16 flex-shrink-0 select-none"
        />
        <p className="text-sm sm:text-base text-stone-700 dark:text-stone-200">
          Räkna på din lön, förbered förhandlingen och se vad marknaden betalar.
        </p>
      </div>

      <Routes>
        <Route path="/" element={<SalaryCalculatorTab />} />
        <Route path="/negotiation" element={<NegotiationTab />} />
        <Route path="/market" element={<MarketDataTab />} />
        <Route path="*" element={<Navigate to="/salary" replace />} />
      </Routes>
    </PageLayout>
  )
}
