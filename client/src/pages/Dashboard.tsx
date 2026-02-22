import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cvApi, interestApi, coverLetterApi } from '@/services/api'
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
  EnergyFilter,
  EnergyBadge,
  useDailyEnergy,
  type EnergyLevel,
  type Achievement
} from '@/components/gamification'
import { MoodCheck } from '@/components/wellbeing'
import { SupportiveLanguage } from '@/components/SupportiveLanguage'
import { OnboardingReminder } from '@/components/Onboarding'

interface WeeklyStats {
  logins: number
  timeSpent: number
  cvProgress: number
  applications: number
  articlesRead: number
  stepsCompleted: number
}

// Dashboard-uppgifter med energiklassificering
const dashboardTasks = [
  { id: 'view-stats', title: 'Se statistik', duration: 2, energy: 'low' as const, classification: 'low' as const },
  { id: 'check-mood', title: 'Registrera mående', duration: 1, energy: 'low' as const, classification: 'low' as const },
  { id: 'daily-step', title: 'Dagens lilla steg', duration: 5, energy: 'medium' as const, classification: 'medium' as const },
  { id: 'update-cv', title: 'Uppdatera CV', duration: 15, energy: 'high' as const, classification: 'high' as const },
  { id: 'search-jobs', title: 'Söka jobb', duration: 10, energy: 'medium' as const, classification: 'medium' as const },
  { id: 'write-letter', title: 'Skriva personligt brev', duration: 20, energy: 'high' as const, classification: 'high' as const },
]

export default function Dashboard() {
  const { user } = useAuthStore()
  const { isMobile, simplifiedView } = useMobileOptimization()
  const { energyLevel, saveEnergyLevel, clearEnergyLevel, hasSelectedToday } = useDailyEnergy()
  
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
    logins: 5,
    timeSpent: 120,
    cvProgress: 0,
    applications: 3,
    articlesRead: 2,
    stepsCompleted: 4
  })
  
  // Filtrera uppgifter baserat på energinivå
  const getFilteredTasks = useCallback(() => {
    if (!energyLevel) return dashboardTasks.filter(t => t.classification === 'low' || t.classification === 'medium')
    
    if (energyLevel <= 2) {
      // Låg energi - visa endast låga och max 20% medium
      const lowTasks = dashboardTasks.filter(t => t.classification === 'low')
      const mediumTasks = dashboardTasks.filter(t => t.classification === 'medium').slice(0, 1)
      return [...lowTasks, ...mediumTasks]
    } else if (energyLevel <= 3) {
      // Medel energi - visa låga, medium och max 20% höga
      const lowTasks = dashboardTasks.filter(t => t.classification === 'low')
      const mediumTasks = dashboardTasks.filter(t => t.classification === 'medium')
      const highTasks = dashboardTasks.filter(t => t.classification === 'high').slice(0, 1)
      return [...lowTasks, ...mediumTasks, ...highTasks]
    } else {
      // Hög energi - visa alla
      return dashboardTasks
    }
  }, [energyLevel])

  const filteredTasks = getFilteredTasks()

  useEffect(() => {
    const loadData = async () => {
      try {
        const cv = await cvApi.getCV()
        const hasCvData = !!cv.summary || !!(cv.workExperience && cv.workExperience.length)
        setHasCV(hasCvData)
        const ats = await cvApi.getATSAnalysis()
        setCvScore(ats.score)
        setWeeklyStats(prev => ({ ...prev, cvProgress: ats.score }))
        
        try {
          await interestApi.getResult()
          setHasInterestResult(true)
        } catch {
          setHasInterestResult(false)
        }
        
        const letters = await coverLetterApi.getAll()
        setCoverLetterCount(letters.length)
        
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

  const handleDailyStepComplete = (taskId: string) => {
    const updated = [...completedDailySteps, taskId]
    setCompletedDailySteps(updated)
    localStorage.setItem('completedDailySteps', JSON.stringify(updated))
    
    // Uppdatera veckostatistik
    setWeeklyStats(prev => ({
      ...prev,
      stepsCompleted: prev.stepsCompleted + 1
    }))
  }

  const handleMoodSubmit = (mood: number) => {
    console.log('Mood submitted:', mood)
    // Här skulle vi kunna spara till backend
  }

  const handleEnergySelect = (level: EnergyLevel) => {
    saveEnergyLevel(level)
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
    { label: 'Sparade jobb', value: 8, color: 'bg-accent-blue' },
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
          energyLevel={energyLevel || undefined}
          compact
        />
      </div>

      {/* Energy Filter - visas om inte vald idag */}
      {!hasSelectedToday && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <EnergyFilter 
            onEnergySelect={handleEnergySelect}
            selectedLevel={energyLevel}
          />
        </div>
      )}

      {/* Energinivå-indikator om redan vald */}
      {hasSelectedToday && energyLevel && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Dagens energinivå:</span>
            <EnergyBadge classification={energyLevel <= 2 ? 'low' : energyLevel <= 3 ? 'medium' : 'high'} showLabel />
          </div>
          <button
            onClick={() => clearEnergyLevel()}
            className="text-sm text-teal-600 hover:text-teal-700 underline"
          >
            Ändra
          </button>
        </div>
      )}

      {/* Supportive Language Message */}
      <SupportiveLanguage 
        type="encouragement" 
        emotionalState={energyLevel && energyLevel <= 2 ? 'tired' : 'confident'}
      />

      {/* Stats Row - anpassad för mobil */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        <StatCard 
          label="CV-poäng" 
          value={`${cvScore}/100`} 
          trend={!isMobile ? "up" : undefined} 
          trendValue={!isMobile ? "+12%" : undefined} 
          color="purple" 
        />
        <StatCard 
          label="Ansökningar" 
          value={weeklyStats.applications.toString()} 
          trend={!isMobile ? "up" : undefined} 
          trendValue={!isMobile ? "+2" : undefined} 
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
            <a 
              href="/jobs" 
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Se alla →
            </a>
          </div>
          
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            {platsbankenJobs.slice(0, isMobile ? 2 : 3).map((job) => (
              <div 
                key={job.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-800 line-clamp-1">{job.headline}</h4>
                  <EnergyBadge 
                    classification={job.employment_type?.label === 'Heltid' ? 'medium' : 'low'} 
                    size="sm"
                  />
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
              <LineChart />
              
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                <BarChart data={barData} />
                <CalendarWidget />
              </div>
            </>
          )}
        </div>

        {/* Right Column - 1/3 på desktop */}
        <div className="space-y-6">
          {/* Daily Step med energifiltrering */}
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

      {/* Uppgifter anpassade efter energinivå */}
      {energyLevel && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>🎯</span>
            Uppgifter för din energinivå idag
          </h3>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {filteredTasks.map((task) => (
              <div 
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer"
              >
                <EnergyBadge classification={task.classification} size="sm" />
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{task.title}</p>
                  <p className="text-xs text-slate-500">~{task.duration} min</p>
                </div>
              </div>
            ))}
          </div>
          {energyLevel <= 2 && (
            <p className="text-sm text-slate-500 mt-4 text-center">
              💡 Du ser endast energisnåla uppgifter just nu. 
              <button 
                onClick={() => clearEnergyLevel()}
                className="text-teal-600 hover:underline ml-1"
              >
                Visa alla uppgifter
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
