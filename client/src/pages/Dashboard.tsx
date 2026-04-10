/**
 * Dashboard Page - Overview with profile status
 * Shows onboarding journey and profile status widget
 */
import { useTranslation } from 'react-i18next'
import { ConsultantRequestBanner } from '@/components/consultant/ConsultantRequestBanner'
import OverviewTab from './dashboard/tabs/OverviewTab'
import { ProfileStatusWidget } from '@/components/dashboard/ProfileStatusWidget'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'

export default function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[var(--bg-page)] page-transition">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ConsultantRequestBanner />

        {/* Profile Status Widget */}
        <div className="mb-6">
          <ProfileStatusWidget />
        </div>

        <OverviewTab />
      </div>
      <HelpButton content={helpContent.dashboard} />
    </div>
  )
}
