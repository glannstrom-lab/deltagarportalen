/**
 * CV-API: alla queries mot `cvs`, `cv_versions`, `cv_shares`-tabellerna.
 *
 * Extraherat från supabaseApi.ts 2026-05-09 (P2-skuld: 1 835-radsmodul → 1.5 MB
 * chunk). Genom att flytta cvApi till egen fil kan Vite/Rollup tree-shake:a
 * bort den från callers som inte använder CV-funktionalitet — men störst
 * vinst nås först när callers byter sina imports från '@/services/supabaseApi'
 * till '@/services/cvApi'.
 *
 * Importerar typer från supabaseApi.ts (CVData m.fl.) — typer existerar
 * inte i runtime-bundlen så det skapar inget cykliskt runtime-beroende.
 */

import { supabase } from '../lib/supabase'
import { APIError, handleError } from './apiError'
import type { CVData } from './supabaseApi'

export const cvApi = {
  async getCV(): Promise<CVData | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) handleError(error)

    if (!data) return null

    // Transform snake_case to camelCase - VIKTIGT: exkludera snake_case fält för att undvika konflikter vid sparning
    const { work_experience, color_scheme, first_name, last_name, profile_image, ...rest } = data
    return {
      ...rest,
      workExperience: work_experience || [],
      colorScheme: color_scheme,
      firstName: first_name,
      lastName: last_name,
      profileImage: profile_image,
    }
  },

  async updateCV(cvData: Partial<CVData>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    // Transform camelCase to snake_case - prioritera camelCase (UI-fält) över snake_case (DB-fält)
    const dbData: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      first_name: cvData.firstName ?? cvData.first_name,
      last_name: cvData.lastName ?? cvData.last_name,
      title: cvData.title,
      email: cvData.email,
      phone: cvData.phone,
      location: cvData.location,
      summary: cvData.summary,
      profile_image: cvData.profileImage ?? cvData.profile_image,
      work_experience: cvData.workExperience ?? cvData.work_experience,
      education: cvData.education,
      skills: cvData.skills,
      languages: cvData.languages,
      certificates: cvData.certificates,
      links: cvData.links,
      "references": cvData.references,
      template: cvData.template,
      color_scheme: cvData.colorScheme ?? cvData.color_scheme,
      font: cvData.font,
    }

    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) delete dbData[key]
    })

    try {
      // Försök uppdatera först (om raden finns)
      const { data: existing } = await supabase
        .from('cvs')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      let result
      if (existing) {
        // Uppdatera befintlig rad
        const { data, error } = await supabase
          .from('cvs')
          .update(dbData)
          .eq('user_id', user.id)
          .select()
          .single()
        if (error) throw error
        result = data
      } else {
        // Skapa ny rad
        const { data, error } = await supabase
          .from('cvs')
          .insert(dbData)
          .select()
          .single()
        if (error) throw error
        result = data
      }

      return result
    } catch (error: unknown) {
      handleError(error)
      throw error
    }
  },

  async getATSAnalysis() {
    const cv = await this.getCV()
    if (!cv) return null

    return {
      score: cv.ats_score || 0,
      feedback: cv.ats_feedback || []
    }
  },

  async getVersions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('cv_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return data || []
  },

  async saveVersion(name: string, cvData: CVData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('cv_versions')
      .insert({
        user_id: user.id,
        name,
        data: cvData
      })
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async restoreVersion(versionId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('cv_versions')
      .select('data')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single()

    if (error) handleError(error)
    return data?.data
  },

  async deleteVersion(versionId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { error } = await supabase
      .from('cv_versions')
      .delete()
      .eq('id', versionId)
      .eq('user_id', user.id)

    if (error) handleError(error)
    return true
  },

  async shareCV() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    // Generate unique share code
    const shareCode = Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error } = await supabase
      .from('cv_shares')
      .insert({
        user_id: user.id,
        share_code: shareCode,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) handleError(error)

    const shareUrl = `${window.location.origin}/cv/shared/${shareCode}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`

    return {
      shareUrl,
      qrCode: qrCodeUrl,
      expiresAt: expiresAt.toISOString(),
      shareCode
    }
  },

  async getSharedCV(shareCode: string) {
    const { data, error } = await supabase
      .from('cv_shares')
      .select(`
        *,
        cvs(*)
      `)
      .eq('share_code', shareCode)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error) handleError(error)
    return data
  }
}
