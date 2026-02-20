import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cvApi, interestApi, coverLetterApi } from '@/services/api'
import { LoadingState } from '@/components/LoadingState'
import { DarkModeToggle } from '@/components/DarkModeToggle'
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
  type EnergyLevel,
  type Achievement
} from '@/components/gamification'
import { MoodCheck } from '@/components/wellbeing'


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
  const [cvScore, setCvScore] = useState(0)
  const [hasCV, setHasCV] = useState(false)
  const [hasInterestResult, setHasInterestResult] = useState(false)
  const [coverLetterCount, setCoverLetterCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Sprint 3 & 4 states
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [showWeeklySummary, setShowWeeklySummary] = useState(false)
  const [completedDailySteps, setCompletedDailySteps] = useState<string[]>([])
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    logins: 5,
    timeSpent: 120,
    cvProgress: 0,
    applications: 3,
    articlesRead: 2,
    stepsCompleted: 4
  })

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
        
        const savedEnergy = localStorage.getItem('lastEnergyLevel')
        if (savedEnergy) {
          setEnergyLevel(parseInt(savedEnergy) as EnergyLevel)
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

      {/* Sprint 4: Energy Filter - visas om inte vald idag */}
      {!energyLevel && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <EnergyFilter 
            onEnergySelect={setEnergyLevel}
            selectedLevel={energyLevel}
          />
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="CV-poäng" 
          value={`${cvScore}/100`} 
          trend="up" 
          trendValue="+12%" 
          color="purple" 
        />
        <StatCard 
          label="Ansökningar" 
          value={weeklyStats.applications.toString()} 
          trend="up" 
          trendValue="+2" 
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sprint 3: Career Roadmap */}
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
          
          <LineChart />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BarChart data={barData} />
            <CalendarWidget />
          </div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Sprint 3: Daily Step */}
          <DailyStep 
            onTaskComplete={handleDailyStepComplete}
            completedTasks={completedDailySteps}
          />
          
          {/* Sprint 3 & 4: Mood Check */}
          <MoodCheck onMoodSubmit={handleMoodSubmit} />
          
          <CircleChart 
            percentage={cvScore} 
            label="CV-kvalitet" 
            sublabel={cvScore >= 70 ? 'Bra jobbat!' : 'Kan förbättras'} 
          />
          <ProgressBars items={progressItems} />
          <QuickActions hasCV={hasCV} hasInterestResult={hasInterestResult} />
        </div>
      </div>
    </div>
  )
}
