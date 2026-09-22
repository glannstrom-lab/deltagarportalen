/**
 * Activity-API: queries mot `user_activities`-tabellen (immutable log).
 *
 * Extraherat från supabaseApi.ts 2026-05-09 (P2-skuld, runda 2).
 */

import { supabase } from '../lib/supabase'
import { APIError, handleError } from './apiError'

export const activityApi = {

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
