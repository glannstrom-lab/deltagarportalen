import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEnergyStore } from '@/stores/energyStoreWithSync'
import { userPreferencesApi } from '@/services/cloudStorage'

/**
 * Hook to initialize authentication state on app startup
 * Use this in your root App component or layout
 *
 * This hook handles:
 * 1. Auth state initialization
 * 2. Syncing settings and energy from cloud (decoupled from authStore)
 */
export function useAuthInit() {
  const { initialize, isLoading, isAuthenticated, user } = useAuthStore()
  const syncSettings = useSettingsStore((state) => state.syncWithServer)
  const syncEnergy = useEnergyStore((state) => state.syncWithServer)

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Sync other stores when user becomes authenticated
  // This decouples the stores - authStore doesn't call other stores directly
  useEffect(() => {
    if (isAuthenticated && user) {
      // Sync settings and energy from cloud
      syncSettings()
      syncEnergy()
      // Update last login for streak tracking
      userPreferencesApi.updateLastLogin()
    }
  }, [isAuthenticated, user, syncSettings, syncEnergy])

  return { isLoading }
}
