import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { cvApi, coverLetterApi, activityApi } from '@/services/api'
import { searchPlatsbanken, type PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { LoadingState } from '@/components/LoadingState'
import { 
  CalendarWidget,
  LineChart,
} from '@/components/ui'
import { MobileOptimizer, useMobileOptimization } from '@/components/MobileOptimizer'
import MatchingScoreWidget from '@/components/dashboard/MatchingScoreWidget'

interface WeeklyStats {
  applications: number
  coverLetterCount: number
  cvProgress: number
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { isMobile, simplifiedView } = useMobileOptimization()
  
  const [cvScore, setCvScore] = useState(0)
  const [hasCV, setHasCV] = useState(false)
  const [loading, setLoading] = useState(true)
  const [platsbankenJobs, setPlatsbankenJobs] = useState<PlatsbankenJob[]>([])
  
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    applications: 0,
    coverLetterCount: 0,
    cvProgress: 0
  })
  const [activityData, setActivityData] = useState<number[]>([])
  const [activeDays, setActiveDays] = useState<number[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const cv = await cvApi.getCV()
        const hasCvData = cv ? (!!cv.summary || !!(cv.work_experience && cv.work_experience.length)) : false
        setHasCV(hasCvData)
        const ats = await cvApi.getATSAnalysis()
        setCvScore(ats?.score || 0)
        
        const letters = await coverLetterApi.getAll()
        
        // Hämta aktivitetsstatistik
        const activities = await activityApi.getActivities()
        const applicationCount = await activityApi.getCount('application_sent')
        
        setWeeklyStats({
          applications: applicationCount,
          coverLetterCount: letters.length,
          cvProgress: ats?.score || 0
        })
        
        // Data för aktivitetsgraf
        const activityCounts = await activityApi.getActivityCounts(10)
        setActivityData(activityCounts)
        
        // Aktiva dagar för kalender
        const daysWithActivity = activities
          .filter(a => new Date(a.created_at).getMonth() === new Date().getMonth())
          .map(a => new Date(a.created_at).getDate())
        setActiveDays([...new Set(daysWithActivity)])
        
        // Ladda jobb från Platsbanken
        try {
          const jobsResponse = await searchPlatsbanken({ limit: 3 })
          setPlatsbankenJobs(jobsResponse.hits || [])
        } catch (e) {
          console.log('Kunde inte ladda Platsbanken-jobb:', e)
        }
      } catch (err) {
        console.error('Fel vid laddning:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return <LoadingState message="Laddar din översikt..." />
  }

  return (
    <div className="space-y-6">
      {/* Mobile Optimizer */}
      <MobileOptimizer />

      {/* Välkomstmeddelande - enkelt och kompakt */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Hej, {user?.firstName}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {cvScore >= 70 
            ? 'Du är på god väg! Fortsätt så!' 
            : 'Låt oss bygga ett starkt CV tillsammans.'}
        </p>
      </div>

      {/* Matching Score Widget */}
      <MatchingScoreWidget />

      {/* Platsbanken Jobb */}
      {platsbankenJobs.length > 0 && (
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="text-xl">💼</span>
                Nya jobb från Arbetsförmedlingen
              </h3>
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
                <h4 className="font-medium text-slate-800 line-clamp-1">{job.headline}</h4>
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

      {/* Huvudinnehåll - Två kolumner på desktop */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Vänster kolumn - större */}
        <div className={`${isMobile ? '' : 'lg:col-span-2'} space-y-6`}>
          {/* Aktivitetsgraf */}
          {!simplifiedView && activityData.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4">Din aktivitet</h3>
              <LineChart data={activityData} label="Senaste 10 dagarna" />
            </div>
          )}

          {/* Fortsätt där du slutade */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">Fortsätt där du slutade</h3>
            <div className="space-y-3">
              {!hasCV && (
                <Link 
                  to="/cv" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-violet-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <span className="text-violet-600">📝</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Skapa ditt CV</p>
                    <p className="text-sm text-slate-500">Det första steget mot nytt jobb</p>
                  </div>
                </Link>
              )}
              <Link 
                to="/job-search" 
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-teal-50 transition-colors"
              >
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-teal-600">🔍</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">Sök jobb</p>
                  <p className="text-sm text-slate-500">Hitta lediga platser</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Höger kolumn - mindre */}
        <div className="space-y-6">
          {/* Kalender */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">Din aktivitet</h3>
            <CalendarWidget activeDays={activeDays} />
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
            <h3 className="font-semibold text-slate-800 mb-2">💡 Tips</h3>
            <p className="text-sm text-slate-600">
              Kom ihåg att anpassa ditt CV för varje jobbansökan. Det ökar dina chanser avsevärt!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
