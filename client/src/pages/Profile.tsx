/**
 * Profile Page - Slim Orchestrator
 * Reduced from 1624 lines to ~200 lines
 * Uses Zustand store and lazy-loaded components
 */

import { Suspense, lazy, useEffect, Component, type ReactNode } from 'react'
import { Loader2 } from '@/components/ui/icons'
import { useProfileStore } from '@/stores/profileStore'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
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
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 font-medium">
            Något gick fel vid laddning av denna sektion
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Försök igen
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ============== SECTION LOADER ==============

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-6 h-6 text-teal-500 dark:text-teal-400 animate-spin mx-auto mb-2" />
        <p className="text-sm text-stone-500 dark:text-stone-400">Laddar...</p>
      </div>
    </div>
  )
}

// ============== TAB CONTENT ==============

function TabContent({ activeTab }: { activeTab: TabId }) {
  return (
    <ProfileErrorBoundary>
      <Suspense fallback={<SectionLoader />}>
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
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-teal-500 dark:text-teal-400 animate-spin mx-auto mb-3" />
        <p className="text-stone-600 dark:text-stone-400">Laddar profil...</p>
      </div>
    </div>
  )
}

// ============== MAIN COMPONENT ==============

export default function Profile() {
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
    <div className="pb-8 max-w-5xl mx-auto">
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid var(--toast-border, #e7e5e4)'
          },
          success: {
            iconTheme: {
              primary: '#14b8a6',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
        }}
      />

      {/* Onboarding modal for new users (renders conditionally inside) */}
      <OnboardingModal />

      {/* Profile header with avatar, progress, actions */}
      <ProfileHeader />

      {/* Tab navigation */}
      <ProfileTabs />

      {/* Tab content (lazy loaded) */}
      <div className="mt-4">
        <TabContent activeTab={activeTab} />
      </div>

      {/* Contextual help */}
      <HelpButton content={helpContent.profile} />
    </div>
  )
}
