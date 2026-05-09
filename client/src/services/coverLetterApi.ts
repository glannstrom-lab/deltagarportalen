/**
 * Cover Letter-API: queries mot `cover_letters`-tabellen + AI-generation.
 *
 * Extraherat från supabaseApi.ts 2026-05-09 (P2-skuld, runda 2).
 */

import { supabase } from '../lib/supabase'
import { APIError, handleError } from './apiError'
import type { CVData, CoverLetter } from './supabaseApi'

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
  },

  async generate(params: {
    cvData: CVData
    jobDescription: string
    companyName: string
    jobTitle: string
    tone?: 'formal' | 'friendly' | 'enthusiastic'
    focus?: 'experience' | 'skills' | 'motivation'
  }) {
    // Försök hämta session, om den saknas försök refresha
    let { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Försök refresha sessionen
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshData.session) {
        throw new APIError('Du har blivit utloggad. Vänligen logga in igen.', 'UNAUTHORIZED', 401)
      }
      session = refreshData.session
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(
      `${supabaseUrl}/functions/v1/ai-cover-letter`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    )

    if (!response.ok) {
      const err = await response.json()
      throw new APIError(err.error || 'Kunde inte generera brev', 'GENERATION_ERROR')
    }

    return response.json()
  }
}
