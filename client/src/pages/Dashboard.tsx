import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { MobileOptimizer } from '@/components/MobileOptimizer'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import {
  CVWidget,
  CoverLetterWidget,
  JobSearchWidget,
  CareerWidget,
  InterestWidget,
  ExercisesWidget,
  DiaryWidget,
  KnowledgeWidget,
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

      {/* Widget Grid - 8 widgets */}
      <DashboardGrid>
        {/* Rad 1 */}
        <CVWidget
          hasCV={data?.cv.hasCV ?? false}
          progress={data?.cv.progress ?? 0}
          atsScore={data?.cv.atsScore ?? 0}
          missingSections={data?.cv.missingSections}
          loading={loading}
          error={error}
          onRetry={refetch}
        />

        <CoverLetterWidget
          count={data?.coverLetters.count ?? 0}
          recentLetters={data?.coverLetters.recentLetters}
          loading={loading}
        />

        <JobSearchWidget
          savedCount={data?.jobs.savedCount ?? 0}
          newMatches={data?.jobs.newMatches}
          recentJobs={data?.jobs.recentSavedJobs}
          loading={loading}
        />

        <CareerWidget
          exploredCount={data?.interest.hasResult ? 1 : 0}
          recommendedOccupations={data?.interest.topRecommendations}
          loading={loading}
        />

        {/* Rad 2 */}
        <InterestWidget
          hasResult={data?.interest.hasResult ?? false}
          topRecommendations={data?.interest.topRecommendations}
          completedAt={data?.interest.completedAt}
          loading={loading}
        />

        <ExercisesWidget
          completedCount={data?.activity.streakDays}
          streakDays={data?.activity.streakDays}
          loading={loading}
        />

        <DiaryWidget
          entriesCount={data?.activity.streakDays}
          streakDays={data?.activity.streakDays}
          hasEntryToday={false}
          loading={loading}
        />

        <KnowledgeWidget
          readCount={0}
          totalArticles={0}
          loading={loading}
        />
      </DashboardGrid>
    </div>
  )
}
