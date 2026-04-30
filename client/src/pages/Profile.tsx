/**
 * Profile Page - Clean Modern Design
 * Simplified layout matching new dashboard style
 */

import { Suspense, lazy, useEffect, Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n/config'
import { Loader2 } from '@/components/ui/icons'
import { useProfileStore } from '@/stores/profileStore'
import { Toaster } from 'react-hot-toast'
import type { TabId } from '@/components/profile/constants'

// Eager load critical components
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { OnboardingModal } from '@/components/profile/OnboardingModal'

// Lazy load tab sections for better initial load performance
const OverviewSection = lazy(() =>
  import('@/components/profile/sections/OverviewSection').then(m => ({ default: m.OverviewSection }))
)
const JobSearchSection = lazy(() =>
  import('@/components/profile/sections/JobSearchSection').then(m => ({ default: m.JobSearchSection }))
)
const CompetenceSection = lazy(() =>
  import('@/components/profile/sections/CompetenceSection').then(m => ({ default: m.CompetenceSection }))
)
const SupportSection = lazy(() =>
  import('@/components/profile/sections/SupportSection').then(m => ({ default: m.SupportSection }))
)
const SettingsSection = lazy(() =>
  import('@/components/profile/sections/SettingsSection').then(m => ({ default: m.SettingsSection }))
)

// ============== ERROR BOUNDARY ==============

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ProfileErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Profile section error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 font-medium">
            {i18n.t('profile.errorLoadingSection')}
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            {i18n.t('common.tryAgain')}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ============== SECTION LOADER ==============

function SectionLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-6 h-6 text-[var(--c-solid)] dark:text-[var(--c-solid)] animate-spin mx-auto mb-2" />
        <p className="text-sm text-stone-500 dark:text-stone-400">{t('common.loading')}</p>
      </div>
    </div>
  )
}

// ============== TAB CONTENT ==============

function TabContent({ activeTab }: { activeTab: TabId }) {
  const { i18n } = useTranslation()

  return (
    <ProfileErrorBoundary>
      <Suspense key={i18n.language} fallback={<SectionLoader />}>
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'jobbsok' && <JobSearchSection />}
        {activeTab === 'kompetens' && <CompetenceSection />}
        {activeTab === 'stod' && <SupportSection />}
        {activeTab === 'installningar' && <SettingsSection />}
      </Suspense>
    </ProfileErrorBoundary>
  )
}

// ============== INITIAL LOADER ==============

function InitialLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[var(--c-solid)] dark:text-[var(--c-solid)] animate-spin mx-auto mb-3" />
        <p className="text-stone-600 dark:text-stone-400">{t('profile.loading')}</p>
      </div>
    </div>
  )
}

// ============== MAIN COMPONENT ==============

export default function Profile() {
  const { i18n } = useTranslation()
  const { activeTab, initialLoading, loadAll } = useProfileStore()

  // Load all profile data on mount
  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Show loading state
  if (initialLoading) {
    return <InitialLoader />
  }

  return (
    <div key={i18n.language} className="pb-8 max-w-7xl mx-auto" data-domain="wellbeing">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #1c1917)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid var(--toast-border, #e7e5e4)'
          },
          success: {
            iconTheme: { primary: '#14b8a6', secondary: '#fff' }
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' }
          }
        }}
      />

      {/* Onboarding modal for new users */}
      <OnboardingModal />

      {/* Profile header with avatar and progress */}
      <ProfileHeader />

      {/* Tab navigation */}
      <ProfileTabs />

      {/* Tab content */}
      <div className="mt-5">
        <TabContent activeTab={activeTab} />
      </div>
    </div>
  )
}
