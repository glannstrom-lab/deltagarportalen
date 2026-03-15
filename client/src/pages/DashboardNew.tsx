/**
 * Ny Dashboard - Widget-baserad design
 * 
 * Varje sida i portalen representeras av ett likstort widget-kort
 * med status, progress och snabb-action.
 */

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
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
            recentStatus: applications > 0 ? 'Väntar på svar' : undefined,
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
    return <LoadingState message="Laddar din översikt..." />
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
      return 'Välkommen! Låt oss komma igång med ditt jobbsökande.'
    } else if (completedCount === 1) {
      return 'Bra start! Fortsätt bygga din profil.'
    } else if (completedCount === 2) {
      return 'Du är på god väg! Fortsätt så!'
    }
    return 'Fantastiskt arbete! Du är redo att söka drömjobbet.'
  }

  return (
    <div className="space-y-6">
      <MobileOptimizer />

      {/* Välkomstsektion */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
          Hej, {user?.firstName || 'där'}! 👋
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">
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
        aria-label="Dashboard-widgets"
      >
        {/* 1. CV Widget */}
        <DashboardWidget
          title="Mitt CV"
          icon={FileText}
          color="violet"
          to="/cv"
          statusText={widgetData.cv.exists 
            ? `CV-score: ${widgetData.cv.progress}/100` 
            : 'Inget CV skapat än'}
          statusDescription={widgetData.cv.exists 
            ? widgetData.cv.progress >= 70 ? 'Ditt CV ser bra ut!' : 'Det finns utrymme för förbättring'
            : 'Skapa ditt CV för att komma igång'}
          showProgress={widgetData.cv.exists}
          progressValue={widgetData.cv.progress}
          progressLabel={`${widgetData.cv.progress}% optimerat`}
          ctaText={widgetData.cv.exists ? 'Uppdatera CV' : 'Skapa CV'}
          badge={widgetData.cv.progress >= 80 ? 'Redo!' : undefined}
        />

        {/* 2. Intresseguide Widget */}
        <DashboardWidget
          title="Intresseguide"
          icon={Compass}
          color="teal"
          to="/interest-guide"
          statusText={widgetData.interestGuide.hasResult
            ? `${widgetData.interestGuide.matches} yrken matchar`
            : 'Hitta yrken som passar dig'}
          statusDescription={widgetData.interestGuide.hasResult
            ? 'Dina intressen är analyserade'
            : 'Gör testet för att se matchningar'}
          showProgress={!widgetData.interestGuide.hasResult}
          progressValue={widgetData.interestGuide.progress}
          progressLabel="Quiz"
          ctaText={widgetData.interestGuide.hasResult ? 'Se resultat' : 'Starta guiden'}
          badge={!widgetData.interestGuide.hasResult ? 'Rekommenderas' : undefined}
        />

        {/* 3. Jobbsök Widget */}
        <DashboardWidget
          title="Jobbsök"
          icon={Search}
          color="blue"
          to="/job-search"
          statusText={widgetData.jobSearch.savedJobsCount > 0
            ? `${widgetData.jobSearch.savedJobsCount} sparade jobb`
            : 'Sök bland tusentals jobb'}
          statusDescription={widgetData.jobSearch.newJobsToday > 0
            ? `${widgetData.jobSearch.newJobsToday} nya jobb idag`
            : 'Från Arbetsförmedlingen'}
          ctaText="Sök jobb"
          badge={widgetData.jobSearch.newJobsToday > 0 ? `${widgetData.jobSearch.newJobsToday} nya` : undefined}
        />

        {/* 4. Ansökningar Widget */}
        <DashboardWidget
          title="Ansökningar"
          icon={Briefcase}
          color="orange"
          to="/job-search"
          statusText={widgetData.jobTracker.activeApplications > 0
            ? `${widgetData.jobTracker.activeApplications} aktiva ansökningar`
            : 'Inga aktiva ansökningar'}
          statusDescription={widgetData.jobTracker.recentStatus}
          ctaText={widgetData.jobTracker.activeApplications > 0 ? 'Hantera' : 'Spåra ansökningar'}
          badge={widgetData.jobTracker.activeApplications > 0 ? `${widgetData.jobTracker.activeApplications}` : undefined}
        />

        {/* 5. Brev Widget */}
        <DashboardWidget
          title="Personliga brev"
          icon={Mail}
          color="emerald"
          to="/cover-letter"
          statusText={widgetData.coverLetters.count > 0
            ? `${widgetData.coverLetters.count} sparade brev`
            : 'Skapa personliga brev'}
          statusDescription={widgetData.coverLetters.count > 0
            ? 'Senast uppdaterat ' + (widgetData.coverLetters.lastCreated 
              ? new Date(widgetData.coverLetters.lastCreated).toLocaleDateString('sv-SE')
              : 'nyligen')
            : 'Anpassade för varje jobb'}
          ctaText={widgetData.coverLetters.count > 0 ? 'Skapa nytt' : 'Skapa brev'}
        />

        {/* 6. Kunskapsbank Widget */}
        <DashboardWidget
          title="Kunskapsbank"
          icon={BookOpen}
          color="amber"
          to="/knowledge-base"
          statusText={widgetData.knowledgeBase.articlesRead > 0
            ? `${widgetData.knowledgeBase.articlesRead} artiklar lästa`
            : 'Artiklar och guider'}
          statusDescription={`${widgetData.knowledgeBase.totalArticles} artiklar tillgängliga`}
          showProgress={widgetData.knowledgeBase.articlesRead > 0}
          progressValue={(widgetData.knowledgeBase.articlesRead / widgetData.knowledgeBase.totalArticles) * 100}
          progressLabel={`${Math.round((widgetData.knowledgeBase.articlesRead / widgetData.knowledgeBase.totalArticles) * 100)}% läst`}
          ctaText="Utforska"
        />

        {/* 7. Karriär Widget */}
        <DashboardWidget
          title="Karriärvägar"
          icon={TrendingUp}
          color="pink"
          to="/career"
          statusText="Utforska yrken och löner"
          statusDescription="Se utbildningsvägar och karriärmöjligheter"
          ctaText="Utforska"
        />

        {/* 8. Kalender Widget */}
        <DashboardWidget
          title="Kalender"
          icon={Calendar}
          color="purple"
          to="/diary"
          statusText="Schema och påminnelser"
          statusDescription="Håll koll på möten och deadlines"
          ctaText="Öppna kalender"
        />

        {/* 9. Välmående Widget */}
        <DashboardWidget
          title="Välmående"
          icon={Heart}
          color="rose"
          to="/wellness"
          statusText={widgetData.wellness.streakDays > 0
            ? `${widgetData.wellness.streakDays} dagar i rad!`
            : 'Hur mår du idag?'}
          statusDescription={widgetData.wellness.lastMood
            ? `Senaste humör: ${widgetData.wellness.lastMood}`
            : 'Logga ditt humör för att få stöd'}
          ctaText={widgetData.wellness.streakDays > 0 ? 'Logga idag' : 'Logga humör'}
          badge={widgetData.wellness.streakDays >= 7 ? `${widgetData.wellness.streakDays} 🔥` : undefined}
        />

        {/* 10. Övningar Widget */}
        <DashboardWidget
          title="Övningar"
          icon={Dumbbell}
          color="mint"
          to="/exercises"
          statusText={`${widgetData.exercises.completedThisWeek}/${widgetData.exercises.weeklyGoal} övningar denna vecka`}
          statusDescription={widgetData.exercises.completedThisWeek >= widgetData.exercises.weeklyGoal
            ? 'Bra jobbat! Veckans mål uppnått'
            : 'Övningar för jobbsökande'}
          showProgress={true}
          progressValue={(widgetData.exercises.completedThisWeek / widgetData.exercises.weeklyGoal) * 100}
          progressLabel={`${widgetData.exercises.completedThisWeek}/${widgetData.exercises.weeklyGoal}`}
          ctaText="Fortsätt öva"
          badge={widgetData.exercises.completedThisWeek >= widgetData.exercises.weeklyGoal ? 'Klart!' : undefined}
        />
      </section>

      {/* Snabblänkar (footer) */}
      <footer className="mt-8 pt-6 border-t border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Snabblänkar</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Min profil', to: '/profile' },
            { label: 'Inställningar', to: '/settings' },
            { label: 'Hjälp', to: '/knowledge-base' },
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
