import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { MobileOptimizer } from '@/components/MobileOptimizer'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import {
  CVWidget,
  JobSearchWidget,
  ApplicationsWidget,
  InterestWidget,
  CoverLetterWidget,
  ActivityWidget,
} from '@/components/dashboard'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data, loading, error, refetch } = useDashboardData()

  return (
    <div className="space-y-6">
      {/* Mobile Optimizer */}
      <MobileOptimizer />

      {/* Välkomstmeddelande */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Hej{user?.firstName ? `, ${user.firstName}` : ''}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Här är din översikt för idag.
        </p>
      </div>

      {/* Widget Grid */}
      <DashboardGrid>
        <CVWidget
          hasCV={data?.cv.hasCV ?? false}
          progress={data?.cv.progress ?? 0}
          atsScore={data?.cv.atsScore ?? 0}
          missingSections={data?.cv.missingSections}
          loading={loading}
          error={error}
          onRetry={refetch}
        />

        <JobSearchWidget
          savedCount={data?.jobs.savedCount ?? 0}
          newMatches={data?.jobs.newMatches}
          recentJobs={data?.jobs.recentSavedJobs}
          loading={loading}
        />

        <ApplicationsWidget
          total={data?.applications.total ?? 0}
          statusBreakdown={data?.applications.statusBreakdown}
          nextFollowUp={data?.applications.nextFollowUp}
          loading={loading}
        />

        <InterestWidget
          hasResult={data?.interest.hasResult ?? false}
          topRecommendations={data?.interest.topRecommendations}
          completedAt={data?.interest.completedAt}
          loading={loading}
        />

        <CoverLetterWidget
          count={data?.coverLetters.count ?? 0}
          recentLetters={data?.coverLetters.recentLetters}
          loading={loading}
        />

        <ActivityWidget
          weeklyApplications={data?.activity.weeklyApplications ?? 0}
          streakDays={data?.activity.streakDays ?? 0}
          loading={loading}
        />
      </DashboardGrid>
    </div>
  )
}
