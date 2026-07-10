/**
 * useNotifications Hook
 * Real-time notification management with Supabase Realtime
 *
 * React Query-baserad: TopBar/Layout renderar NotificationBell på varje
 * sidvisning — en delad cache ersätter en ny fetch per mount.
 * Realtime-eventen skriver direkt in i React Query-cachen.
 *
 * Categories:
 * - message: Direktmeddelanden
 * - job_match: Jobbmatchningar
 * - discussion: Diskussioner och svar
 * - friend_request: Vänförfrågningar
 */

import { useEffect, useCallback, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { apiLogger } from '@/lib/logger'

// Supabase-fetch som avbryts vid unmount/navigation rejectar inte alltid som
// AbortError — vid sid-navigation ger Chrome "TypeError: Failed to fetch" och
// WebKit "Load failed". Dessa är transienta och ska inte loggas som fel eller
// visas för användaren (notifikationer är icke-kritiska).
function isTransientFetchError(err: unknown): boolean {
  if (!err) return false
  const e = err as { name?: string; message?: unknown; code?: unknown }
  if (e.name === 'AbortError') return true
  if (e.code === '20') return true
  const msg = (typeof e.message === 'string' ? e.message : '').toLowerCase()
  return (
    msg.includes('abort') ||
    msg.includes('cancel') ||
    msg.includes('failed to fetch') ||
    msg.includes('load failed') ||
    msg.includes('networkerror')
  )
}

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
// QUERY KEY & COLUMNS
// ============================================

export const NOTIFICATIONS_KEY = ['notifications'] as const

function notificationsKey(userId: string) {
  return [...NOTIFICATIONS_KEY, userId] as const
}

// Explicit kolumnlista i stället för select('*'). Tabellen har idag exakt
// dessa 10 kolumner — samma uppsättning som det exporterade Notification-
// interfacet kräver, så inget kan trimmas bort utan att ändra API-ytan.
// Listan skyddar mot att framtida kolumntillägg blåser upp payloaden.
const NOTIFICATION_COLUMNS =
  'id, user_id, type, title, message, read, read_at, action_url, data, created_at'

// ============================================
// HOOK
// ============================================

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const userId = user?.id

  // ============================================
  // FETCH NOTIFICATIONS (React Query)
  // ============================================
  const query = useQuery({
    queryKey: notificationsKey(userId ?? 'anonymous'),
    enabled: !!userId,
    // Realtime-kanalen håller cachen färsk — staleTime skyddar mot
    // onödiga refetches vid varje mount av NotificationBell.
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select(NOTIFICATION_COLUMNS)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) {
        throw fetchError
      }

      apiLogger.debug('Notifications loaded', { count: data?.length || 0 })
      return (data || []) as unknown as Notification[]
    },
  })

  const notifications = useMemo(() => query.data ?? [], [query.data])

  // Transienta avbrott (navigation/unmount) ska varken loggas eller visas
  const error = useMemo(() => {
    if (!query.error || isTransientFetchError(query.error)) return null
    return query.error instanceof Error
      ? query.error.message
      : 'Kunde inte ladda notifikationer'
  }, [query.error])

  // Logga laddningsfel — en gång per felobjekt
  const loggedError = useRef<unknown>(null)
  useEffect(() => {
    if (query.error && !isTransientFetchError(query.error) && loggedError.current !== query.error) {
      loggedError.current = query.error
      apiLogger.error('Failed to load notifications', { error: query.error })
    }
  }, [query.error])

  // ============================================
  // CACHE HELPERS
  // ============================================
  const setNotifications = useCallback(
    (updater: (prev: Notification[]) => Notification[]) => {
      if (!userId) return
      queryClient.setQueryData<Notification[]>(notificationsKey(userId), (prev) =>
        updater(prev ?? [])
      )
    },
    [queryClient, userId]
  )

  const refresh = useCallback(async () => {
    if (!userId) return
    await queryClient.invalidateQueries({ queryKey: notificationsKey(userId) })
  }, [queryClient, userId])

  // ============================================
  // REALTIME SUBSCRIPTION (en per hook-instans, som tidigare)
  // ============================================
  useEffect(() => {
    if (!userId) return

    const key = notificationsKey(userId)
    const setCache = (updater: (prev: Notification[]) => Notification[]) => {
      queryClient.setQueryData<Notification[]>(key, (prev) => updater(prev ?? []))
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on<Notification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          apiLogger.debug('New notification received', { type: payload.new.type })
          setCache((prev) => [payload.new as Notification, ...prev])
        }
      )
      .on<Notification>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setCache((prev) =>
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
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setCache((prev) => prev.filter((n) => n.id !== (payload.old as Notification).id))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          apiLogger.debug('Subscribed to notifications channel')
        }
      })

    // Cleanup subscription
    return () => {
      apiLogger.debug('Unsubscribing from notifications channel')
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

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
  // ACTIONS (optimistisk cache-uppdatering, revert via invalidate)
  // ============================================
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return

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
        .eq('user_id', userId)

      if (error) throw error
    } catch (err) {
      // Revert on error
      refresh()
      apiLogger.error('Failed to mark notification as read', { error: err })
    }
  }, [userId, setNotifications, refresh])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    // Optimistic update
    const now = new Date().toISOString()
    setNotifications((prev) =>
      prev.map((n) => (!n.read ? { ...n, read: true, read_at: now } : n))
    )

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: now })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      apiLogger.debug('Marked all notifications as read')
    } catch (err) {
      // Revert on error
      refresh()
      apiLogger.error('Failed to mark all as read', { error: err })
    }
  }, [userId, setNotifications, refresh])

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!userId) return

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (err) {
      // Revert on error
      refresh()
      apiLogger.error('Failed to delete notification', { error: err })
    }
  }, [userId, setNotifications, refresh])

  const clearAll = useCallback(async () => {
    if (!userId) return

    // Optimistic update
    setNotifications(() => [])

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      apiLogger.debug('Cleared all notifications')
    } catch (err) {
      // Revert on error
      refresh()
      apiLogger.error('Failed to clear all notifications', { error: err })
    }
  }, [userId, setNotifications, refresh])

  return {
    notifications,
    unreadCount,
    unreadByCategory,
    isLoading: query.isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
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
