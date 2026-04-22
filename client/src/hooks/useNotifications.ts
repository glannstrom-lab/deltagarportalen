/**
 * useNotifications Hook
 * Real-time notification management with Supabase Realtime
 *
 * Categories:
 * - message: Direktmeddelanden
 * - job_match: Jobbmatchningar
 * - discussion: Diskussioner och svar
 * - friend_request: Vänförfrågningar
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, RealtimePayload } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { apiLogger } from '@/lib/logger'

// ============================================
// TYPES
// ============================================

export type NotificationType =
  | 'message'
  | 'job_match'
  | 'discussion'
  | 'friend_request'
  | 'system'
  | 'info'
  | 'success'
  | 'warning'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  read_at: string | null
  action_url: string | null
  data: Record<string, unknown>
  created_at: string
}

interface NotificationCounts {
  total: number
  message: number
  job_match: number
  discussion: number
  friend_request: number
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  unreadByCategory: NotificationCounts
  isLoading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAll: () => Promise<void>
  refresh: () => Promise<void>
}

// ============================================
// HOOK
// ============================================

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ============================================
  // FETCH NOTIFICATIONS
  // ============================================
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) {
        throw fetchError
      }

      setNotifications(data || [])
      apiLogger.debug('Notifications loaded', { count: data?.length || 0 })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte ladda notifikationer'
      setError(message)
      apiLogger.error('Failed to load notifications', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // ============================================
  // REALTIME SUBSCRIPTION
  // ============================================
  useEffect(() => {
    if (!user) return

    let isMounted = true

    // Initial fetch with mounted check
    const loadInitial = async () => {
      try {
        setError(null)
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (!isMounted) return

        if (fetchError) {
          throw fetchError
        }

        setNotifications(data || [])
        apiLogger.debug('Notifications loaded', { count: data?.length || 0 })
      } catch (err) {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : 'Kunde inte ladda notifikationer'
        setError(message)
        apiLogger.error('Failed to load notifications', { error: err })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInitial()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on<Notification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!isMounted) return
          apiLogger.debug('New notification received', { type: payload.new.type })
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .on<Notification>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!isMounted) return
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === (payload.new as Notification).id ? (payload.new as Notification) : n
            )
          )
        }
      )
      .on<Notification>(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!isMounted) return
          setNotifications((prev) =>
            prev.filter((n) => n.id !== (payload.old as Notification).id)
          )
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          apiLogger.debug('Subscribed to notifications channel')
        }
      })

    // Cleanup subscription
    return () => {
      isMounted = false
      apiLogger.debug('Unsubscribing from notifications channel')
      supabase.removeChannel(channel)
    }
  }, [user])

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const unreadByCategory = useMemo<NotificationCounts>(() => {
    const counts: NotificationCounts = {
      total: 0,
      message: 0,
      job_match: 0,
      discussion: 0,
      friend_request: 0,
    }

    notifications.forEach((n) => {
      if (!n.read) {
        counts.total++
        if (n.type in counts) {
          counts[n.type as keyof Omit<NotificationCounts, 'total'>]++
        }
      }
    })

    return counts
  }, [notifications])

  // ============================================
  // ACTIONS
  // ============================================
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, read: true, read_at: new Date().toISOString() }
          : n
      )
    )

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (err) {
      // Revert on error
      fetchNotifications()
      apiLogger.error('Failed to mark notification as read', { error: err })
    }
  }, [user, fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    if (!user) return

    // Optimistic update
    const now = new Date().toISOString()
    setNotifications((prev) =>
      prev.map((n) => (!n.read ? { ...n, read: true, read_at: now } : n))
    )

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: now })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
      apiLogger.debug('Marked all notifications as read')
    } catch (err) {
      // Revert on error
      fetchNotifications()
      apiLogger.error('Failed to mark all as read', { error: err })
    }
  }, [user, fetchNotifications])

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (err) {
      // Revert on error
      fetchNotifications()
      apiLogger.error('Failed to delete notification', { error: err })
    }
  }, [user, fetchNotifications])

  const clearAll = useCallback(async () => {
    if (!user) return

    // Optimistic update
    setNotifications([])

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      apiLogger.debug('Cleared all notifications')
    } catch (err) {
      // Revert on error
      fetchNotifications()
      apiLogger.error('Failed to clear all notifications', { error: err })
    }
  }, [user, fetchNotifications])

  return {
    notifications,
    unreadCount,
    unreadByCategory,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications,
  }
}

// ============================================
// NOTIFICATION ICONS & COLORS
// ============================================

export const notificationConfig: Record<NotificationType, {
  icon: string
  color: string
  bgColor: string
  label: string
}> = {
  message: {
    icon: 'MessageCircle',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Meddelande',
  },
  job_match: {
    icon: 'Briefcase',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Jobbmatchning',
  },
  discussion: {
    icon: 'MessageSquare',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Diskussion',
  },
  friend_request: {
    icon: 'UserPlus',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Vänförfrågan',
  },
  system: {
    icon: 'Settings',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    label: 'System',
  },
  info: {
    icon: 'Info',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Information',
  },
  success: {
    icon: 'CheckCircle',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Framgång',
  },
  warning: {
    icon: 'AlertTriangle',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Varning',
  },
}

// ============================================
// UTILITY: Create notification (for other services to use)
// ============================================

export async function createNotification(
  userId: string,
  notification: {
    type: NotificationType
    title: string
    message: string
    action_url?: string
    data?: Record<string, unknown>
  }
): Promise<boolean> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      action_url: notification.action_url || null,
      data: notification.data || {},
    })

    if (error) throw error
    return true
  } catch (err) {
    apiLogger.error('Failed to create notification', { error: err })
    return false
  }
}

export default useNotifications
