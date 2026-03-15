/**
 * Results Tab - Display RIASEC profile and personality analysis
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateUserProfile, type UserProfile } from '@/services/interestGuideData'
import { ResultsView } from '@/components/interest-guide/ResultsView'
import { LoadingState, InfoCard, Button } from '@/components/ui'
import { interestGuideApi } from '@/services/cloudStorage'
import { ClipboardList, Sparkles } from 'lucide-react'

export default function ResultsTab() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true)
        const data = await interestGuideApi.getProgress()

        if (data?.is_completed && data.answers) {
          const calculatedProfile = calculateUserProfile(data.answers)
          setProfile(calculatedProfile)
        }
      } catch (err) {
        console.error('Failed to load results:', err)
        setError('Kunde inte ladda resultaten')
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [])

  const handleRestart = async () => {
    try {
      await interestGuideApi.reset()
      navigate('/interest-guide')
    } catch (err) {
      console.error('Failed to restart:', err)
      setError('Kunde inte starta om testet')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState title="Laddar resultat..." size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ClipboardList className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Inga resultat än</h2>
        <p className="text-gray-600 mb-6">
          Du behöver genomföra intressetestet för att se dina resultat.
        </p>
        <Button
          onClick={() => navigate('/interest-guide')}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <Sparkles className="w-4 h-4" />
          Starta testet
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {error && (
        <InfoCard variant="error" className="mb-6">
          {error}
        </InfoCard>
      )}
      <ResultsView profile={profile} onRestart={handleRestart} />
    </div>
  )
}
