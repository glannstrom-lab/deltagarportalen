/**
 * Cover Letter-API: queries mot `cover_letters`-tabellen + AI-generation.
 *
 * Extraherat från supabaseApi.ts 2026-05-09 (P2-skuld, runda 2).
 */

import { supabase } from '../lib/supabase'
import { APIError, handleError } from './apiError'
import type { CoverLetter } from './supabaseApi'

export const coverLetterApi = {
  async getAll(): Promise<CoverLetter[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return data || []
  },

  async getById(id: string): Promise<CoverLetter | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      handleError(error)
    }
    return data
  },

  async create(letterData: Partial<CoverLetter>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('cover_letters')
      .insert({
        ...letterData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async update(id: string, letterData: Partial<CoverLetter>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('cover_letters')
      .update({
        ...letterData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async delete(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { error } = await supabase
      .from('cover_letters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) handleError(error)
    return true
  }

  // C11 (2026-07-23): generate() raderad — callerlös dubblett mot
  // ai-cover-letter-edgen. Det levande flödet är callAI('personligt-brev')
  // i CoverLetterWrite (edgens no-platshållare-regler portade till ai.js).
}
