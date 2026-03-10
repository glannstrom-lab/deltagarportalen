/**
 * useNextStep Hook
 * 
 * Hook för att hämta och använda nästa-steg data i komponenter
 */

import { useState, useEffect, useCallback } from 'react'
import { nextStepApi, type NextStep, type UserProgress } from '@/services/workflowApi'

interface UseNextStepReturn {
  nextStep: NextStep | null
  progress: UserProgress | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useNextStep(): UseNextStepReturn {
  const [nextStep, setNextStep] = useState<NextStep | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [stepData, progressData] = await Promise.all([
        nextStepApi.getNextStep(),
        nextStepApi.getUserProgress()
      ])
      setNextStep(stepData)
      setProgress(progressData)
    } catch (err) {
      setError('Kunde inte hämta nästa steg')
      console.error('Fel vid hämtning av nästa steg:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    nextStep,
    progress,
    loading,
    error,
    refetch: fetchData
  }
}
