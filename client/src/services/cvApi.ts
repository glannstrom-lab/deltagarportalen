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

/**
 * Uppladdade CV-FILER — personens eget färdiga CV, sparat som det är.
 *
 * Skiljer sig från `cv_versions`, som är CV byggda i portalen och lagras som
 * strukturerad JSON. Det här är filen: en PDF eller ett Word-dokument som
 * ligger orört i lagringen och kan laddas ner igen precis som den kom in.
 * Många har redan ett CV de är nöjda med, och att tvinga dem genom byggaren
 * för att få det in i portalen vore att be dem göra om jobbet.
 *
 * Återanvänder `profile_documents` + bucketen `profile-documents` (privat,
 * 10 MB, tillåter PDF/Word) — båda fanns redan och är verifierade mot prod
 * 2026-08-19. `type = 'cv'` avgränsar dem från profilens intyg och betyg.
 * Ingen ny tabell, ingen migration.
 */
const CV_BUCKET = 'profile-documents'

export interface UppladdatCv {
  id: string
  name: string
  file_url: string
  file_size?: number | null
  mime_type?: string | null
  created_at: string
  /** Sökvägen i bucketen. Behövs för att kunna radera filen, inte bara raden. */
  description?: string | null
}

export const cvFilerApi = {
  async getAll(): Promise<UppladdatCv[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('profile_documents')
      .select('id, name, file_url, file_size, mime_type, created_at, description')
      .eq('user_id', user.id)
      .eq('type', 'cv')
      .order('created_at', { ascending: false })

    // Fel kastas vidare i stället för att bli en tom lista. Ett hämtningsfel
    // som ser ut som "du har inga CV" är portalens vanligaste lögn.
    if (error) handleError(error)
    return (data || []) as UppladdatCv[]
  },

  async upload(file: File, namn: string): Promise<UppladdatCv> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    // Bucketens eget tak är 10 MB; kontrollen här ger ett begripligt fel i
    // stället för ett rått lagringsfel.
    if (file.size > 10 * 1024 * 1024) {
      throw new APIError('Filen är större än 10 MB', 'FILE_TOO_LARGE', 413)
    }

    // Filnamnet saneras: bucketens nycklar tål inte alla tecken, och ett
    // svenskt filnamn med mellanslag och å/ä/ö är regel snarare än undantag.
    const rentNamn = file.name
      .replace(/[^\w.\- ]+/g, '_')
      .replace(/\s+/g, '_')
      .slice(-80)
    const sokvag = `${user.id}/cv/${Date.now()}_${rentNamn}`

    const { error: uploadError } = await supabase.storage
      .from(CV_BUCKET)
      .upload(sokvag, file, { contentType: file.type || undefined, upsert: false })
    if (uploadError) throw new APIError(uploadError.message, 'UPLOAD_FAILED', 500)

    const { data: signerad } = await supabase.storage
      .from(CV_BUCKET)
      .createSignedUrl(sokvag, 60 * 60 * 24 * 365)

    const { data, error } = await supabase
      .from('profile_documents')
      .insert({
        user_id: user.id,
        name: namn.trim() || file.name,
        type: 'cv',
        // `description` bär lagringssökvägen. Fult men ärligt: tabellen har
        // ingen egen kolumn för den, och utan sökvägen kan en radering ta
        // bort raden men lämna filen kvar i lagringen för alltid.
        description: sokvag,
        file_url: signerad?.signedUrl || '',
        file_size: file.size,
        mime_type: file.type || null,
      })
      .select('id, name, file_url, file_size, mime_type, created_at, description')
      .single()

    if (error) {
      // Raden gick inte in — städa bort filen, annars ligger den kvar utan
      // att någonsin kunna nås eller raderas via UI:t.
      await supabase.storage.from(CV_BUCKET).remove([sokvag])
      handleError(error)
    }
    return data as UppladdatCv
  },

  /** Färska länkar: den sparade signerade URL:en går ut efter ett år. */
  async signeradLank(sokvag: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(CV_BUCKET)
      .createSignedUrl(sokvag, 60 * 10)
    if (error) return null
    return data?.signedUrl || null
  },

  async delete(id: string, sokvag?: string | null): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { error } = await supabase
      .from('profile_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'cv')

    if (error) handleError(error)

    // Filen tas bort efter raden. Misslyckas den blir det en föräldralös fil,
    // inte en rad som pekar på ingenting — den ordningen är mindre skadlig.
    if (sokvag) {
      const { error: filFel } = await supabase.storage.from(CV_BUCKET).remove([sokvag])
      if (filFel) console.warn('Raden är borta men filen ligger kvar i lagringen:', filFel)
    }
  },
}
