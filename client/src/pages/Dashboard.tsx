/**
 * Dashboard Page - Simplified overview
 * Shows only the onboarding journey
 */
import { useTranslation } from 'react-i18next'
import { ConsultantRequestBanner } from '@/components/consultant/ConsultantRequestBanner'
import OverviewTab from './dashboard/tabs/OverviewTab'

export default function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ConsultantRequestBanner />
        <OverviewTab />
      </div>
    </div>
  )
}
