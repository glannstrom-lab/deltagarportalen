/**
 * Dashboard Skeleton Component
 * Matches the actual Dashboard layout to minimize CLS (Cumulative Layout Shift)
 */

import { cn } from '@/lib/utils'

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton-shimmer rounded', className)} />
  )
}

// KPI Card Skeleton - matches KpiCard component
function KpiCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl p-3 sm:p-4 bg-stone-200 dark:bg-stone-700">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Shimmer className="w-16 h-3 mb-2" />
          <Shimmer className="w-12 h-6 mb-1" />
          <Shimmer className="w-20 h-2.5" />
        </div>
        <Shimmer className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0" />
      </div>
    </div>
  )
}

// Hero Section Skeleton
function HeroSkeleton() {
  return (
    <div className="bg-stone-100 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 mb-4 sm:mb-6 overflow-hidden">
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <Shimmer className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <Shimmer className="w-20 h-3 mb-2" />
            <Shimmer className="w-32 h-5" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Shimmer className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
            <div className="hidden sm:block">
              <Shimmer className="w-20 h-3 mb-1" />
              <Shimmer className="w-16 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Section Skeleton - matches DashboardSection
function SectionSkeleton({ expanded = true }: { expanded?: boolean }) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      <div className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-100 dark:bg-stone-800/50">
        <div className="flex items-center gap-2">
          <Shimmer className="w-4 h-4 sm:w-5 sm:h-5" />
          <Shimmer className="w-24 h-4" />
          <Shimmer className="w-8 h-5 rounded-full" />
        </div>
        <Shimmer className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      {expanded && (
        <div className="p-3 sm:p-4 bg-white dark:bg-stone-900/50">
          <div className="grid sm:grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <OnboardingStepSkeleton key={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Onboarding Step Skeleton
function OnboardingStepSkeleton() {
  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50">
      <Shimmer className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <Shimmer className="w-12 h-2.5 mb-1" />
        <Shimmer className="w-24 h-3.5" />
      </div>
      <Shimmer className="w-4 h-4 shrink-0" />
    </div>
  )
}

// Quick Actions Skeleton
function QuickActionsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Shimmer key={i} className="w-24 h-9 rounded-xl" />
      ))}
    </div>
  )
}

// RIASEC Chart Skeleton
function RiasecSkeleton() {
  return (
    <div className="bg-stone-100 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Shimmer className="w-4 h-4 sm:w-5 sm:h-5" />
        <Shimmer className="w-32 h-4" />
      </div>
      <div className="flex justify-center">
        <Shimmer className="w-40 h-40 rounded-full" />
      </div>
      <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1.5 sm:gap-2">
            <Shimmer className="w-4 h-4" />
            <Shimmer className="flex-1 h-3" />
            <Shimmer className="w-8 h-3" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Sidebar Card Skeleton
function SidebarCardSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Shimmer className="w-4 h-4 sm:w-5 sm:h-5" />
        <Shimmer className="w-24 h-4" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-1.5 sm:p-2 rounded-lg bg-stone-50 dark:bg-stone-900/50">
            <Shimmer className="w-full h-3.5 mb-1" />
            <Shimmer className="w-2/3 h-2.5" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Full Dashboard Skeleton
 * Matches the actual Dashboard layout structure
 */
export function DashboardSkeleton() {
  return (
    <div className="pb-8" role="status" aria-label="Laddar dashboard" aria-busy="true">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <HeroSkeleton />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main content - 2/3 width */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Onboarding Section */}
            <SectionSkeleton expanded={true} />

            {/* Quick Actions Section */}
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
              <div className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-100 dark:bg-stone-800/50">
                <div className="flex items-center gap-2">
                  <Shimmer className="w-4 h-4 sm:w-5 sm:h-5" />
                  <Shimmer className="w-28 h-4" />
                </div>
                <Shimmer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="p-3 sm:p-4 bg-white dark:bg-stone-900/50">
                <QuickActionsSkeleton />
              </div>
            </div>

            {/* Development Section - collapsed */}
            <SectionSkeleton expanded={false} />

            {/* Wellness Section - collapsed */}
            <SectionSkeleton expanded={false} />
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-3 sm:space-y-4">
            {/* RIASEC Profile */}
            <RiasecSkeleton />

            {/* Saved Jobs */}
            <SidebarCardSkeleton />

            {/* Wellness Card */}
            <SidebarCardSkeleton />
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Dashboard laddar...</span>
    </div>
  )
}

export default DashboardSkeleton
