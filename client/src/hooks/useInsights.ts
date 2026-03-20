/**
 * useInsights - Hook for personalized insights and analytics
 */

import { useState, useEffect, useCallback } from 'react'
import { getInsights, type InsightData } from '@/services/insightsService'

interface UseInsightsReturn {
  data: InsightData | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useInsights(): UseInsightsReturn {
  const [data, setData] = useState<InsightData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const insights = await getInsights()
      setData(insights)
    } catch (err) {
      console.error('Error loading insights:', err)
      setError('Kunde inte ladda insikter')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    data,
    isLoading,
    error,
    refresh: loadData
  }
}

export default useInsights
