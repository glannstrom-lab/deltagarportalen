import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

/**
 * Hook to initialize authentication state on app startup
 * Use this in your root App component or layout
 */
export function useAuthInit() {
  const { initialize, isLoading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return { isLoading }
}
