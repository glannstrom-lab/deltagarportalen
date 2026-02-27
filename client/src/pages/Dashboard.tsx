import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { cvApi, interestApi, coverLetterApi, activityApi } from '@/services/api'
import { searchPlatsbanken, getMarketInsights, type PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { LoadingState } from '@/components/LoadingState'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { AutoSaveIndicator } from '@/components/AutoSaveIndicator'
import { MobileOptimizer, useMobileOptimization } from '@/components/MobileOptimizer'
import { 
  StatCard,
  CalendarWidget,
  ProgressBars,
  CircleChart,
  LineChart,
  BarChart,
  QuickActions,
  SearchBar,
} from '@/components/ui'
import { 
  DailyStep, 
  CareerRoadmap, 
  AchievementCelebration,
  WeeklySummary,
  type Achievement
} from '@/components/gamification'
import { MoodCheck } from '@/components/wellbeing'
import { SupportiveLanguage } from '@/components/SupportiveLanguage'
import { OnboardingReminder } from '@/components/Onboarding'
import MatchingScoreWidget from '@/components/dashboard/MatchingScoreWidget'

interface WeeklyStats {
  logins: number
  timeSpent: number
  cvProgress: number
  applications: number
  articlesRead: number
  stepsCompleted: number
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { isMobile, simplifiedView } = useMobileOptimization()
  
  const [cvScore, setCvScore] = useState(0)
  const [hasCV, setHasCV] = useState(false)
  const [hasInterestResult, setHasInterestResult] = useState(false)
  const [coverLetterCount, setCoverLetterCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [platsbankenJobs, setPlatsbankenJobs] = useState<PlatsbankenJob[]>([])
  
  // Sprint 3 & 4 states
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [showWeeklySummary, setShowWeeklySummary] = useState(false)
  const [completedDailySteps, setCompletedDailySteps] = useState<string[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    logins: 0,
    timeSpent: 0,
    cvProgress: 0,
    applications: 0,
    articlesRead: 0,
    stepsCompleted: 0
  })
  const [activityData, setActivityData] = useState<number[]>([])
  const [activeDays, setActiveDays] = useState<number[]>([])
  const [savedJobsCount, setSavedJobsCount] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        const cv = await cvApi.getCV()
        const hasCvData = cv ? (!!cv.summary || !!(cv.work_experience && cv.work_experience.length)) : false
        setHasCV(hasCvData)
        const ats = await cvApi.getATSAnalysis()
        setCvScore(ats?.score || 0)
        setWeeklyStats(prev => ({ ...prev, cvProgress: ats?.score || 0 }))
        
        try {
          await interestApi.getResult()
          setHasInterestResult(true)
        } catch {
          setHasInterestResult(false)
        }
        
        const letters = await coverLetterApi.getAll()
        setCoverLetterCount(letters.length)
        
        // Hämta riktiga aktivitetsstatistik
        const activities = await activityApi.getActivities()
        const applicationCount = await activityApi.getCount('application_sent')
        const savedJobs = await activityApi.getCount('job_saved')
        const stepCount = activities.filter(a => a.activity_type === 'step_completed').length
        
        setSavedJobsCount(savedJobs)
        setWeeklyStats(prev => ({
          ...prev,
          applications: applicationCount,
          stepsCompleted: stepCount
        }))
        
        // Hämta data för LineChart
        const activityCounts = await activityApi.getActivityCounts(10)
        setActivityData(activityCounts)
        
        // Hämta aktiva dagar för kalender
        const daysWithActivity = activities
          .filter(a => new Date(a.created_at).getMonth() === new Date().getMonth())
          .map(a => new Date(a.created_at).getDate())
        setActiveDays([...new Set(daysWithActivity)])
        
        // Ladda sparad data
        const savedSteps = localStorage.getItem('completedDailySteps')
        if (savedSteps) {
          setCompletedDailySteps(JSON.parse(savedSteps))
        }
        
        // Ladda jobb från Platsbanken
        try {
          const jobsResponse = await searchPlatsbanken({ limit: 3 })
          setPlatsbankenJobs(jobsResponse.hits || [])
        } catch (e) {
          console.log('Kunde inte ladda Platsbanken-jobb:', e)
        }
        
        // Kolla om vi ska visa veckosammanfattning (visa på söndagar eller första besöket)
        const today = new Date().getDay()
        const lastSummary = localStorage.getItem('lastWeeklySummary')
        const currentWeek = `${new Date().getFullYear()}-W${getWeekNumber(new Date())}`
        
        if ((today === 0 || !lastSummary) && lastSummary !== currentWeek) {
          setShowWeeklySummary(true)
          localStorage.setItem('lastWeeklySummary', currentWeek)
        }
      } catch (err) {
        console.error('Fel vid laddning:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])
  
  // Kolla achievements när data laddas
  useEffect(() => {
    if (!loading) {
      checkAchievements()
    }
  }, [loading, cvScore, hasInterestResult, weeklyStats.applications])

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7)
  }

  const checkAchievements = useCallback(() => {
    const achievements: Achievement[] = []

    if (cvScore >= 100) {
      achievements.push({
        id: 'cv-complete',
        title: 'CV-mästare!',
        description: 'Du har skapat ett komplett CV. Du är redo att söka jobb!',
        icon: '📄'
      })
    }

    if (weeklyStats.applications >= 1) {
      achievements.push({
        id: 'first-application',
        title: 'Första steget!',
        description: 'Du har skickat din första ansökan. Det tar mod att söka jobb!',
        icon: '🚀'
      })
    }

    if (hasInterestResult) {
      achievements.push({
        id: 'interest-complete',
        title: 'Självkännare!',
        description: 'Du har upptäckt dina intressen. Det är första steget till rätt karriär!',
        icon: '🎯'
      })
    }

    // Visa första achievement som inte visats tidigare
    const shownAchievements = JSON.parse(localStorage.getItem('shownAchievements') || '[]')
    const newAchievement = achievements.find(a => !shownAchievements.includes(a.id))
    
    if (newAchievement) {
      setCurrentAchievement(newAchievement)
      localStorage.setItem('shownAchievements', JSON.stringify([...shownAchievements, newAchievement.id]))
    }
  }, [cvScore, hasInterestResult, weeklyStats.applications])

  const handleDailyStepComplete = async (taskId: string) => {
    const updated = [...completedDailySteps, taskId]
    setCompletedDailySteps(updated)
    localStorage.setItem('completedDailySteps', JSON.stringify(updated))
    
    // Logga till Supabase
    try {
      await activityApi.logActivity('step_completed', { taskId, date: new Date().toISOString() })
    } catch (e) {
      console.error('Kunde inte logga steg:', e)
    }
    
    // Uppdatera veckostatistik
    setWeeklyStats(prev => ({
      ...prev,
      stepsCompleted: prev.stepsCompleted + 1
    }))
  }

  const handleMoodSubmit = async (mood: number) => {
    try {
      await activityApi.logActivity('mood_submitted', { mood, date: new Date().toISOString() })
    } catch (e) {
      console.error('Kunde inte spara mående:', e)
    }
  }

  if (loading) {
    return <LoadingState message="Laddar din översikt..." />
  }

  const progressItems = [
    { label: 'CV komplett', value: hasCV ? 100 : 0, color: 'bg-primary' },
    { label: 'Intresseguide', value: hasInterestResult ? 100 : 0, color: 'bg-accent-green' },
    { label: 'CV-kvalitet', value: cvScore, color: 'bg-accent-orange' },
  ]

  const barData = [
    { label: 'Ansökningar', value: weeklyStats.applications, color: 'bg-primary' },
    { label: 'Sparade jobb', value: savedJobsCount || 0, color: 'bg-accent-blue' },
    { label: 'Brev skrivna', value: coverLetterCount, color: 'bg-accent-orange' },
    { label: 'Steg klara', value: completedDailySteps.length, color: 'bg-accent-green' },
  ]

  // Hälsningsmeddelande baserat på tid på dygnet
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return `God morgon, ${user?.firstName}! ☀️`
    if (hour < 17) return `Hej, ${user?.firstName}! 👋`
    return `God kväll, ${user?.firstName}! 🌙`
  }

  return (
    <div className="space-y-6">
      {/* Mobile Optimizer - aktiverar mobilanpassningar */}
      <MobileOptimizer />
      
      {/* Achievement Celebration */}
      <AchievementCelebration 
        achievement={currentAchievement}
        onClose={() => setCurrentAchievement(null)}
      />
      
      {/* Weekly Summary Modal */}
      <WeeklySummary
        stats={weeklyStats}
        isVisible={showWeeklySummary}
        onClose={() => setShowWeeklySummary(false)}
      />

      {/* Onboarding Reminder för nya användare */}
      <OnboardingReminder />

      {/* Header with Search and Dark Mode */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {getGreeting()}
          </h1>
          <p className="text-slate-500 mt-1">
            {cvScore >= 70 
              ? 'Du är på god väg! Fortsätt så!' 
              : 'Låt oss bygga ett starkt CV tillsammans.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <SearchBar />
        </div>
      </div>

      {/* Auto-save indikator - visar att allt sparas automatiskt */}
      <div className="flex justify-end">
        <AutoSaveIndicator 
          status="saved"
          lastSaved={new Date()}
          compact
        />
      </div>

      {/* Supportive Language Message */}
      <SupportiveLanguage 
        type="encouragement" 
        emotionalState="confident"
      />

      {/* Stats Row - anpassad för mobil */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        <StatCard 
          label="CV-poäng" 
          value={`${cvScore}/100`} 
          color="purple" 
        />
        <StatCard 
          label="Ansökningar" 
          value={weeklyStats.applications.toString()} 
          color="orange" 
        />
        <StatCard 
          label="Sparade brev" 
          value={coverLetterCount.toString()} 
          color="blue" 
        />
        <StatCard 
          label="Dagens steg" 
          value={`${completedDailySteps.length}`} 
          color="purple" 
        />
      </div>

      {/* Matching Score Widget */}
      <MatchingScoreWidget />

      {/* Platsbanken Jobb - nya jobb från Arbetsförmedlingen */}
      {platsbankenJobs.length > 0 && (
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="text-xl">💼</span>
                Nya jobb från Arbetsförmedlingen
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Senaste lediga platser i din region
              </p>
            </div>
            <Link 
              to="/jobs" 
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Se alla →
            </Link>
          </div>
          
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            {platsbankenJobs.slice(0, isMobile ? 2 : 3).map((job) => (
              <div 
                key={job.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-800 line-clamp-1">{job.headline}</h4>
                </div>
                <p className="text-sm text-slate-500">{job.employer?.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {job.workplace_address?.municipality}
                  {job.employment_type && ` • ${job.employment_type.label}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid - anpassad för mobil */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Left Column - 2/3 på desktop */}
        <div className={`${isMobile ? '' : 'lg:col-span-2'} space-y-6`}>
          {/* Career Roadmap */}
          <CareerRoadmap 
            stats={{
              hasProfile: !!user,
              cvProgress: cvScore,
              interestGuideCompleted: hasInterestResult,
              coverLetterCount,
              applicationsCount: weeklyStats.applications,
              hasConsultantContact: false
            }}
          />
          
          {!simplifiedView && (
            <>
              <LineChart data={activityData} label="Din aktivitet senaste 10 dagarna" />
              
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                <BarChart data={barData} />
                <CalendarWidget activeDays={activeDays} />
              </div>
            </>
          )}
        </div>

        {/* Right Column - 1/3 på desktop */}
        <div className="space-y-6">
          {/* Daily Step */}
          <DailyStep 
            onTaskComplete={handleDailyStepComplete}
            completedTasks={completedDailySteps}
          />
          
          {/* Mood Check */}
          <MoodCheck onMoodSubmit={handleMoodSubmit} />
          
          {/* Progress Circle */}
          <CircleChart 
            percentage={cvScore} 
            label="CV-kvalitet" 
            sublabel={cvScore >= 70 ? 'Bra jobbat!' : 'Kan förbättras'} 
          />
          
          {!simplifiedView && (
            <>
              <ProgressBars items={progressItems} />
              <QuickActions hasCV={hasCV} hasInterestResult={hasInterestResult} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
