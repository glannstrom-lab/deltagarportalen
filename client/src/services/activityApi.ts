/**
 * Activity-API: queries mot `user_activities`-tabellen (immutable log).
 *
 * Extraherat från supabaseApi.ts 2026-05-09 (P2-skuld, runda 2).
 */

import { supabase } from '../lib/supabase'
import { APIError, handleError } from './apiError'

export const activityApi = {
  async logActivity(activityType: string, activityData?: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_data: activityData || {}
      })
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async getActivities(activityType?: string, limit: number = 30) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    let query = supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (activityType) {
      query = query.eq('activity_type', activityType)
    }

    const { data, error } = await query

    if (error) handleError(error)
    return data || []
  },

  async getActivityCounts(days: number = 10) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('user_activities')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) handleError(error)

    const counts = new Array(days).fill(0)
    data?.forEach(activity => {
      const date = new Date(activity.created_at)
      const dayDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (dayDiff < days) {
        counts[days - 1 - dayDiff]++
      }
    })

    return counts
  },

  async getCount(activityType: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { count, error } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_type', activityType)

    if (error) handleError(error)
    return count || 0
  }
}
