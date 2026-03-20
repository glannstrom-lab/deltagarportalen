/**
 * Service Worker Registration Hook
 * 
 * Handles:
 * - SW registration
 * - Update detection
 * - Offline/online state
 * - Push notification permissions
 */

import { useEffect, useState, useCallback } from 'react'
import { swLogger } from '@/lib/logger'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isOffline: boolean
  updateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  update: () => Promise<void>
  unregister: () => Promise<void>
  checkForUpdates: () => Promise<void>
}

/**
 * Hook to manage Service Worker lifecycle
 */
export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOffline: !navigator.onLine,
    updateAvailable: false,
    registration: null,
  })

  // Register service worker
  useEffect(() => {
    if (!state.isSupported) {
      swLogger.debug('[SW] Service Worker not supported')
      return
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        swLogger.debug('[SW] Registered:', registration)

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }))

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                swLogger.debug('[SW] Update available')
                setState((prev) => ({ ...prev, updateAvailable: true }))
              }
            })
          }
        })

        // Check for existing waiting worker
        if (registration.waiting && navigator.serviceWorker.controller) {
          setState((prev) => ({ ...prev, updateAvailable: true }))
        }
      } catch (error) {
        swLogger.error('[SW] Registration failed:', error)
      }
    }

    registerSW()
  }, [state.isSupported])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      swLogger.debug('[SW] App is online')
      setState((prev) => ({ ...prev, isOffline: false }))
    }

    const handleOffline = () => {
      swLogger.debug('[SW] App is offline')
      setState((prev) => ({ ...prev, isOffline: true }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Listen for messages from SW
  useEffect(() => {
    if (!state.isSupported) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_AVAILABLE') {
        setState((prev) => ({ ...prev, updateAvailable: true }))
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [state.isSupported])

  // Update service worker
  const update = useCallback(async () => {
    if (!state.registration?.waiting) return

    // Send skip waiting message
    state.registration.waiting.postMessage('skipWaiting')

    // Reload page when new SW takes over
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [state.registration])

  // Unregister service worker
  const unregister = useCallback(async () => {
    if (!state.registration) return

    const success = await state.registration.unregister()
    swLogger.debug('[SW] Unregistered:', success)
    
    setState((prev) => ({
      ...prev,
      isRegistered: false,
      registration: null,
    }))
  }, [state.registration])

  // Manually check for updates
  const checkForUpdates = useCallback(async () => {
    if (!state.registration) return

    try {
      await state.registration.update()
      swLogger.debug('[SW] Update check complete')
    } catch (error) {
      swLogger.error('[SW] Update check failed:', error)
    }
  }, [state.registration])

  return {
    ...state,
    update,
    unregister,
    checkForUpdates,
  }
}

/**
 * Hook to track network status
 */
export function useNetworkStatus(): {
  isOnline: boolean
  isOffline: boolean
  effectiveType: string | null
} {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    effectiveType: (navigator as any).connection?.effectiveType || null,
  })

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true, isOffline: false }))
    }

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false, isOffline: true }))
    }

    const handleConnectionChange = () => {
      const connection = (navigator as any).connection
      setStatus((prev) => ({
        ...prev,
        effectiveType: connection?.effectiveType || null,
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  return status
}

/**
 * Hook for background sync
 */
export function useBackgroundSync() {
  const sync = useCallback(async (tag: string): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('sync' in (navigator as any).serviceWorker)) {
      swLogger.debug('[SW] Background sync not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync.register(tag)
      swLogger.debug('[SW] Background sync registered:', tag)
      return true
    } catch (error) {
      swLogger.error('[SW] Background sync registration failed:', error)
      return false
    }
  }, [])

  return { sync }
}

/**
 * Hook for push notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      swLogger.debug('[SW] Push notifications not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Request permission
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result !== 'granted') {
        swLogger.debug('[SW] Notification permission denied')
        return false
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      })

      swLogger.debug('[SW] Push subscription:', subscription)
      
      // Send subscription to server
      // await fetch('/api/subscriptions', {
      //   method: 'POST',
      //   body: JSON.stringify(subscription),
      // })

      return true
    } catch (error) {
      swLogger.error('[SW] Push subscription failed:', error)
      return false
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        swLogger.debug('[SW] Push subscription cancelled')
        return true
      }
      
      return false
    } catch (error) {
      swLogger.error('[SW] Push unsubscribe failed:', error)
      return false
    }
  }, [])

  return {
    permission,
    subscribe,
    unsubscribe,
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
  }
}

/**
 * Utility to convert base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export default useServiceWorker
