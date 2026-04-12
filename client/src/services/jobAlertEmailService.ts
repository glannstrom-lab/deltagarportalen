/**
 * Job Alert Email Service
 * Client-side service for triggering job alert email notifications
 */

import { supabase } from '@/lib/supabase'

const API_URL = '/api/job-alerts'

export interface JobNotification {
  id: string
  alert_id: string
  user_id: string
  job_id: string
  job_title: string
  employer: string
  location?: string
  publication_date?: string
  read: boolean
  created_at: string
}

export interface CheckAlertsResult {
  success: boolean
  checked: number
  newJobs: number
}

/**
 * Check all user's alerts for new jobs and send notifications
 */
export async function checkUserAlerts(): Promise<CheckAlertsResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({
      action: 'check-user',
      userId: user.id
    })
  })

  if (!response.ok) {
    throw new Error('Failed to check alerts')
  }

  return response.json()
}

/**
 * Get unread job notifications for the current user
 */
export async function getUnreadNotifications(): Promise<JobNotification[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('job_notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data || []
}

/**
 * Get all job notifications for the current user
 */
export async function getAllNotifications(limit: number = 100): Promise<JobNotification[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('job_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data || []
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('job_notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('job_notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }

  return true
}

/**
 * Get notification count for badge display
 */
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('job_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    console.error('Error counting notifications:', error)
    return 0
  }

  return count || 0
}

/**
 * Request daily digest email
 */
export async function requestDailyDigest(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        action: 'send-digest',
        userId: user.id
      })
    })

    return response.ok
  } catch (error) {
    console.error('Error requesting digest:', error)
    return false
  }
}

/**
 * Update email notification preferences
 */
export async function updateNotificationPreferences(preferences: {
  emailEnabled: boolean
  frequency: 'instant' | 'daily' | 'weekly' | 'none'
}): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      job_alert_email_enabled: preferences.emailEnabled,
      job_alert_frequency: preferences.frequency,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error updating preferences:', error)
    return false
  }

  return true
}

/**
 * Get current notification preferences
 */
export async function getNotificationPreferences(): Promise<{
  emailEnabled: boolean
  frequency: 'instant' | 'daily' | 'weekly' | 'none'
}> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { emailEnabled: true, frequency: 'daily' }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('job_alert_email_enabled, job_alert_frequency')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return { emailEnabled: true, frequency: 'daily' }
  }

  return {
    emailEnabled: data.job_alert_email_enabled ?? true,
    frequency: data.job_alert_frequency ?? 'daily'
  }
}

// Export service
export const jobAlertEmailService = {
  checkUserAlerts,
  getUnreadNotifications,
  getAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  requestDailyDigest,
  updateNotificationPreferences,
  getNotificationPreferences
}

export default jobAlertEmailService
