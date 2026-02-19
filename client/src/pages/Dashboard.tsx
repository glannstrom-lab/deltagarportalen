import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cvApi, interestApi, coverLetterApi } from '@/services/api'
import { LoadingState } from '@/components/LoadingState'
import { 
  StatsGrid, 
  ActivityChart, 
  ProgressWidget, 
  QuickLinks 
} from '@/features/dashboard'

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Välkommen tillbaka, {user?.firstName}
        </h1>
        <p className="text-slate-500 mt-1">
          Här är din översikt för idag.
        </p>
      </div>

      {/* Stats */}
      <StatsGrid cvScore={cvScore} coverLetterCount={coverLetterCount} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <div className="space-y-6">
          <ProgressWidget 
            hasCV={hasCV} 
            hasInterestResult={hasInterestResult} 
            cvScore={cvScore} 
          />
          <QuickLinks hasCV={hasCV} hasInterestResult={hasInterestResult} />
        </div>
      </div>
    </div>
  )
}
