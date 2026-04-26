/**
 * Ny Dashboard - Widget-baserad design
 * 
 * Varje sida i portalen representeras av ett likstort widget-kort
 * med status, progress och snabb-action.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  FileText,
  Compass,
  Search,
  Briefcase,
  Mail,
  BookOpen,
  TrendingUp,
  Calendar,
  Heart,
  Dumbbell
} from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { cvApi, coverLetterApi, activityApi, savedJobsApi } from '@/services/api'
import { searchPlatsbanken } from '@/services/arbetsformedlingenApi'
import { LoadingState } from '@/components/LoadingState'
import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { MobileOptimizer, useMobileOptimization } from '@/components/MobileOptimizer'

// Typer för widget-data
interface WidgetData {
  cv: {
    exists: boolean
    progress: number
    lastUpdated?: string
  }
  interestGuide: {
    hasResult: boolean
    progress: number
    matches?: number
  }
  jobSearch: {
    savedJobsCount: number
    newJobsToday: number
  }
  jobTracker: {
    activeApplications: number
    recentStatus?: string
  }
  coverLetters: {
    count: number
    lastCreated?: string
  }
  knowledgeBase: {
    articlesRead: number
    totalArticles: number
  }
  wellness: {
    streakDays: number
    lastMood?: string
  }
  exercises: {
    completedThisWeek: number
    weeklyGoal: number
  }
}

export default function DashboardNew() {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const { isMobile } = useMobileOptimization()
  
  const [loading, setLoading] = useState(true)
  const [widgetData, setWidgetData] = useState<WidgetData>({
    cv: { exists: false, progress: 0 },
    interestGuide: { hasResult: false, progress: 0 },
    jobSearch: { savedJobsCount: 0, newJobsToday: 0 },
    jobTracker: { activeApplications: 0 },
    coverLetters: { count: 0 },
    knowledgeBase: { articlesRead: 0, totalArticles: 0 },
    wellness: { streakDays: 0 },
    exercises: { completedThisWeek: 0, weeklyGoal: 5 },
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Hämta CV-data
        const cv = await cvApi.getCV()
        const cvAnalysis = await cvApi.getATSAnalysis()
        const hasCvData = cv ? (!!cv.summary || !!(cv.work_experience && cv.work_experience.length)) : false
        
        // Hämta intresseguide-data
        const interestResult = await activityApi.getActivities()
          .then(acts => acts.find(a => a.activity_type === 'interest_guide_completed'))
        
        // Hämta sparade jobb
        const savedJobs = await savedJobsApi.getAll()
        
        // Hämta ansökningar
        const applications = await activityApi.getCount('application_sent')
        
        // Hämta personliga brev
        const letters = await coverLetterApi.getAll()
        
        // Hämta nya jobb från Platsbanken
        let newJobsCount = 0
        try {
          const jobsResponse = await searchPlatsbanken({ limit: 1 })
          newJobsCount = jobsResponse.total?.value || 0
        } catch (e) {
          // Ignorera fel
        }
        
        // Hämta aktiviteter för wellness/exercises
        const activities = await activityApi.getActivities()
        const exerciseActivities = activities.filter(a => a.activity_type === 'exercise_completed')
        const wellnessActivities = activities.filter(a => a.activity_type === 'mood_logged')
        
        // Beräkna veckans övningar
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const exercisesThisWeek = exerciseActivities.filter(
          a => new Date(a.created_at) > oneWeekAgo
        ).length
        
        // Beräkna wellness streak
        const uniqueDays = new Set(wellnessActivities.map(a => 
          new Date(a.created_at).toDateString()
        ))
        
        setWidgetData({
          cv: {
            exists: hasCvData,
            progress: cvAnalysis?.score || 0,
            lastUpdated: cv?.updated_at,
          },
          interestGuide: {
            hasResult: !!interestResult,
            progress: interestResult ? 100 : 0,
            matches: 3, // Placeholder - ska hämtas från API
          },
          jobSearch: {
            savedJobsCount: savedJobs.length,
            newJobsToday: Math.min(newJobsCount, 12), // Max 12 för display
          },
          jobTracker: {
            activeApplications: applications,
            recentStatus: applications > 0 ? t('dashboard.widgets.applications.waitingForResponse') : undefined,
          },
          coverLetters: {
            count: letters.length,
            lastCreated: letters[0]?.created_at,
          },
          knowledgeBase: {
            articlesRead: activities.filter(a => a.activity_type === 'article_read').length,
            totalArticles: 24, // Placeholder
          },
          wellness: {
            streakDays: uniqueDays.size,
            lastMood: wellnessActivities[0]?.metadata?.mood,
          },
          exercises: {
            completedThisWeek: exercisesThisWeek,
            weeklyGoal: 5,
          },
        })
      } catch (err) {
        console.error('Fel vid laddning av dashboard-data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  if (loading) {
    return <LoadingState message={t('dashboard.loading')} />
  }

  // Välkomstmeddelande baserat på progress
  const getWelcomeMessage = () => {
    const { cv, interestGuide, jobTracker } = widgetData
    const completedCount = [
      cv.exists,
      interestGuide.hasResult,
      jobTracker.activeApplications > 0,
    ].filter(Boolean).length

    if (completedCount === 0) {
      return t('dashboard.welcomeMessages.start')
    } else if (completedCount === 1) {
      return t('dashboard.welcomeMessages.goodStart')
    } else if (completedCount === 2) {
      return t('dashboard.welcomeMessages.onTrack')
    }
    return t('dashboard.welcomeMessages.ready')
  }

  return (
    <div className="space-y-6">
      <MobileOptimizer />

      {/* Välkomstsektion */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
          {t('dashboard.greeting', { name: user?.firstName || t('dashboard.greetingDefault') })}
        </h1>
        <p className="text-slate-700 text-sm sm:text-base mt-1">
          {getWelcomeMessage()}
        </p>
      </header>

      {/* Widget Grid */}
      <section
        className="grid gap-4 sm:gap-5"
        style={{
          gridTemplateColumns: isMobile
            ? 'repeat(2, 1fr)'
            : 'repeat(auto-fill, minmax(240px, 1fr))'
        }}
        aria-label={t('dashboard.ariaLabel')}
      >
        {/* 1. CV Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.cv.title')}
          icon={FileText}
          color="violet"
          to="/cv"
          statusText={widgetData.cv.exists
            ? t('dashboard.widgets.cv.score', { score: widgetData.cv.progress })
            : t('dashboard.widgets.cv.noCV')}
          statusDescription={widgetData.cv.exists
            ? widgetData.cv.progress >= 70 ? t('dashboard.widgets.cv.looksGood') : t('dashboard.widgets.cv.roomForImprovement')
            : t('dashboard.widgets.cv.createToStart')}
          showProgress={widgetData.cv.exists}
          progressValue={widgetData.cv.progress}
          progressLabel={t('dashboard.widgets.cv.optimized', { percent: widgetData.cv.progress })}
          ctaText={widgetData.cv.exists ? t('dashboard.widgets.cv.update') : t('dashboard.widgets.cv.create')}
          badge={widgetData.cv.progress >= 80 ? t('dashboard.widgets.cv.ready') : undefined}
        />

        {/* 2. Intresseguide Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.interestGuide.title')}
          icon={Compass}
          color="brand"
          to="/interest-guide"
          statusText={widgetData.interestGuide.hasResult
            ? t('dashboard.widgets.interestGuide.matches', { count: widgetData.interestGuide.matches })
            : t('dashboard.widgets.interestGuide.findJobs')}
          statusDescription={widgetData.interestGuide.hasResult
            ? t('dashboard.widgets.interestGuide.analyzed')
            : t('dashboard.widgets.interestGuide.takeQuiz')}
          showProgress={!widgetData.interestGuide.hasResult}
          progressValue={widgetData.interestGuide.progress}
          progressLabel={t('dashboard.widgets.interestGuide.quiz')}
          ctaText={widgetData.interestGuide.hasResult ? t('dashboard.widgets.interestGuide.seeResults') : t('dashboard.widgets.interestGuide.startGuide')}
          badge={!widgetData.interestGuide.hasResult ? t('dashboard.widgets.interestGuide.recommended') : undefined}
        />

        {/* 3. Jobbsök Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.jobSearch.title')}
          icon={Search}
          color="blue"
          to="/job-search"
          statusText={widgetData.jobSearch.savedJobsCount > 0
            ? t('dashboard.widgets.jobSearch.savedJobs', { count: widgetData.jobSearch.savedJobsCount })
            : t('dashboard.widgets.jobSearch.searchThousands')}
          statusDescription={widgetData.jobSearch.newJobsToday > 0
            ? t('dashboard.widgets.jobSearch.newToday', { count: widgetData.jobSearch.newJobsToday })
            : t('dashboard.widgets.jobSearch.fromAF')}
          ctaText={t('dashboard.widgets.jobSearch.search')}
          badge={widgetData.jobSearch.newJobsToday > 0 ? t('dashboard.widgets.jobSearch.new', { count: widgetData.jobSearch.newJobsToday }) : undefined}
        />

        {/* 4. Ansökningar Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.applications.title')}
          icon={Briefcase}
          color="orange"
          to="/job-search"
          statusText={widgetData.jobTracker.activeApplications > 0
            ? t('dashboard.widgets.applications.activeCount', { count: widgetData.jobTracker.activeApplications })
            : t('dashboard.widgets.applications.noActive')}
          statusDescription={widgetData.jobTracker.recentStatus}
          ctaText={widgetData.jobTracker.activeApplications > 0 ? t('dashboard.widgets.applications.manage') : t('dashboard.widgets.applications.track')}
          badge={widgetData.jobTracker.activeApplications > 0 ? `${widgetData.jobTracker.activeApplications}` : undefined}
        />

        {/* 5. Brev Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.coverLetters.title')}
          icon={Mail}
          color="emerald"
          to="/cover-letter"
          statusText={widgetData.coverLetters.count > 0
            ? t('dashboard.widgets.coverLetters.savedCount', { count: widgetData.coverLetters.count })
            : t('dashboard.widgets.coverLetters.createLetters')}
          statusDescription={widgetData.coverLetters.count > 0
            ? t('dashboard.widgets.coverLetters.lastUpdated', {
                date: widgetData.coverLetters.lastCreated
                  ? new Date(widgetData.coverLetters.lastCreated).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')
                  : t('dashboard.widgets.coverLetters.recently')
              })
            : t('dashboard.widgets.coverLetters.customized')}
          ctaText={widgetData.coverLetters.count > 0 ? t('dashboard.widgets.coverLetters.createNew') : t('dashboard.widgets.coverLetters.create')}
        />

        {/* 6. Kunskapsbank Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.knowledgeBase.title')}
          icon={BookOpen}
          color="amber"
          to="/knowledge-base"
          statusText={widgetData.knowledgeBase.articlesRead > 0
            ? t('dashboard.widgets.knowledgeBase.articlesRead', { count: widgetData.knowledgeBase.articlesRead })
            : t('dashboard.widgets.knowledgeBase.articlesAndGuides')}
          statusDescription={t('dashboard.widgets.knowledgeBase.available', { count: widgetData.knowledgeBase.totalArticles })}
          showProgress={widgetData.knowledgeBase.articlesRead > 0}
          progressValue={(widgetData.knowledgeBase.articlesRead / widgetData.knowledgeBase.totalArticles) * 100}
          progressLabel={t('dashboard.widgets.knowledgeBase.percentRead', { percent: Math.round((widgetData.knowledgeBase.articlesRead / widgetData.knowledgeBase.totalArticles) * 100) })}
          ctaText={t('dashboard.widgets.knowledgeBase.explore')}
        />

        {/* 7. Karriär Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.career.title')}
          icon={TrendingUp}
          color="pink"
          to="/career"
          statusText={t('dashboard.widgets.career.explore')}
          statusDescription={t('dashboard.widgets.career.pathways')}
          ctaText={t('dashboard.widgets.career.cta')}
        />

        {/* 8. Kalender Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.calendar.title')}
          icon={Calendar}
          color="purple"
          to="/diary"
          statusText={t('dashboard.widgets.calendar.scheduleReminders')}
          statusDescription={t('dashboard.widgets.calendar.trackMeetings')}
          ctaText={t('dashboard.widgets.calendar.open')}
        />

        {/* 9. Välmående Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.wellness.title')}
          icon={Heart}
          color="rose"
          to="/wellness"
          statusText={widgetData.wellness.streakDays > 0
            ? t('dashboard.widgets.wellness.streak', { count: widgetData.wellness.streakDays })
            : t('dashboard.widgets.wellness.howAreYou')}
          statusDescription={widgetData.wellness.lastMood
            ? t('dashboard.widgets.wellness.lastMood', { mood: widgetData.wellness.lastMood })
            : t('dashboard.widgets.wellness.logForSupport')}
          ctaText={widgetData.wellness.streakDays > 0 ? t('dashboard.widgets.wellness.logToday') : t('dashboard.widgets.wellness.logMood')}
          badge={widgetData.wellness.streakDays >= 7 ? `${widgetData.wellness.streakDays} 🔥` : undefined}
        />

        {/* 10. Övningar Widget */}
        <DashboardWidget
          title={t('dashboard.widgets.exercises.title')}
          icon={Dumbbell}
          color="mint"
          to="/exercises"
          statusText={t('dashboard.widgets.exercises.weeklyProgress', {
            completed: widgetData.exercises.completedThisWeek,
            goal: widgetData.exercises.weeklyGoal
          })}
          statusDescription={widgetData.exercises.completedThisWeek >= widgetData.exercises.weeklyGoal
            ? t('dashboard.widgets.exercises.goalAchieved')
            : t('dashboard.widgets.exercises.forJobSeekers')}
          showProgress={true}
          progressValue={(widgetData.exercises.completedThisWeek / widgetData.exercises.weeklyGoal) * 100}
          progressLabel={`${widgetData.exercises.completedThisWeek}/${widgetData.exercises.weeklyGoal}`}
          ctaText={t('dashboard.widgets.exercises.continue')}
          badge={widgetData.exercises.completedThisWeek >= widgetData.exercises.weeklyGoal ? t('dashboard.widgets.exercises.done') : undefined}
        />
      </section>

      {/* Snabblänkar (footer) */}
      <footer className="mt-8 pt-6 border-t border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">{t('dashboard.quickLinks.title')}</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: t('dashboard.quickLinks.profile'), to: '/profile' },
            { label: t('dashboard.quickLinks.settings'), to: '/settings' },
            { label: t('dashboard.quickLinks.help'), to: '/knowledge-base' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
