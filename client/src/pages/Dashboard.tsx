import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cvApi, interestApi, coverLetterApi } from '@/services/api'
import { LoadingState } from '@/components/LoadingState'
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

export default function Dashboard() {
  const { user } = useAuthStore()
  const [cvScore, setCvScore] = useState(0)
  const [hasCV, setHasCV] = useState(false)
  const [hasInterestResult, setHasInterestResult] = useState(false)
  const [coverLetterCount, setCoverLetterCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const cv = await cvApi.getCV()
        setHasCV(!!cv.summary || !!(cv.workExperience && cv.workExperience.length))
        const ats = await cvApi.getATSAnalysis()
        setCvScore(ats.score)
        try {
          await interestApi.getResult()
          setHasInterestResult(true)
        } catch {
          setHasInterestResult(false)
        }
        const letters = await coverLetterApi.getAll()
        setCoverLetterCount(letters.length)
      } catch (err) {
        console.error('Fel vid laddning:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return <LoadingState message="Laddar..." />
  }

  const progressItems = [
    { label: 'CV komplett', value: hasCV ? 100 : 0, color: 'bg-primary' },
    { label: 'Intresseguide', value: hasInterestResult ? 100 : 0, color: 'bg-accent-green' },
    { label: 'CV-kvalitet', value: cvScore, color: 'bg-accent-orange' },
  ]

  const barData = [
    { label: 'Ansökningar', value: 12, color: 'bg-primary' },
    { label: 'Sparade jobb', value: 8, color: 'bg-accent-blue' },
    { label: 'Brev skrivna', value: coverLetterCount, color: 'bg-accent-orange' },
    { label: 'Möten', value: 3, color: 'bg-accent-pink' },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Välkommen, {user?.firstName}
          </h1>
          <p className="text-slate-500 mt-1">Här är din översikt för idag.</p>
        </div>
        <SearchBar />
      </div>

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
          value="12" 
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
          label="Dagar i rad" 
          value="7" 
          color="pink" 
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <LineChart />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BarChart data={barData} />
            <CalendarWidget />
          </div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
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
