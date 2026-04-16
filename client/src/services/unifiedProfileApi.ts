/**
 * Unified Profile API - Fas 2 Integration
 * 
 * Centraliserad hantering av all profilinformation.
 * Single source of truth för data som används i CV, brev, ansökningar, etc.
 */

import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'

// ============================================
// TYPES
// ============================================

export interface CoreProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  summary: string
  profileImageUrl?: string | null
}

export interface ProfessionalProfile {
  skills: string[]
  languages: Array<{
    language: string
    level: string
  }>
  workExperience: Array<{
    id?: string
    title: string
    company: string
    description?: string
    startDate?: string
    endDate?: string
    current?: boolean
  }>
  education: Array<{
    id?: string
    degree: string
    school: string
    startDate?: string
    endDate?: string
  }>
}

export type EmploymentStatus =
  | 'unemployed'
  | 'employed'
  | 'rehabilitation'
  | 'student'
  | 'career-change'
  | 'parental-leave'
  | 'sick-leave'
  | 'new-to-country'
  | 'self-employed'
  | 'retired'
  | 'other'

export interface CareerProfile {
  employmentStatus?: EmploymentStatus
  riasecScores?: {
    realistic: number
    investigative: number
    artistic: number
    social: number
    enterprising: number
    conventional: number
  }
  topOccupations?: string[]
  careerGoals?: {
    shortTerm: string
    longTerm: string
  }
  preferredRoles: string[]
  targetIndustries?: string[]
}

export interface UnifiedProfileData {
  core: CoreProfile
  professional: ProfessionalProfile
  career: CareerProfile
  usage: {
    cvLastUpdated?: string
    coverLettersCount: number
    applicationsCount: number
  }
}

// ============================================
// API
// ============================================

export const unifiedProfileApi = {
  /**
   * Hämta komplett unified profil
   * Aggreggerar data från flera källor (profile, cv, interest_result, etc.)
   */
  async getProfile(): Promise<Partial<UnifiedProfileData>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      // Parallella hämtningar för bättre prestanda
      const [
        { data: profile },
        { data: cv },
        { data: interestResult },
        { data: unifiedProfile },
        { count: coverLettersCount },
        { count: applicationsCount }
      ] = await Promise.all([
        // 1. Grundprofil från profiles
        supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, location, avatar_url, employment_status, career_goals')
          .eq('id', user.id)
          .single(),
        
        // 2. CV-data
        supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        // 3. Intresseguideresultat
        supabase
          .from('interest_results')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        
        // 4. Unified profile (om finns)
        supabase
          .from('unified_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        // 5. Räkna cover letters
        supabase
          .from('cover_letters')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // 6. Räkna applications
        supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ])

      // Sammansätt profilen
      const result: Partial<UnifiedProfileData> = {
        core: {
          firstName: unifiedProfile?.first_name || profile?.first_name || '',
          lastName: unifiedProfile?.last_name || profile?.last_name || '',
          email: profile?.email || user.email || '',
          phone: unifiedProfile?.phone || profile?.phone || '',
          location: unifiedProfile?.location || '',
          summary: unifiedProfile?.summary || cv?.summary || '',
          profileImageUrl: unifiedProfile?.profile_image_url || profile?.avatar_url || null
        },
        professional: {
          skills: cv?.skills || [],
          languages: cv?.languages || [],
          workExperience: cv?.work_experience || [],
          education: cv?.education || []
        },
        career: {
          employmentStatus: profile?.employment_status || undefined,
          riasecScores: interestResult?.riasec_scores || undefined,
          topOccupations: interestResult?.top_occupations || [],
          careerGoals: profile?.career_goals || unifiedProfile?.career_goals || { shortTerm: '', longTerm: '' },
          preferredRoles: profile?.career_goals?.preferredRoles || unifiedProfile?.preferred_roles || [],
          targetIndustries: profile?.career_goals?.targetIndustries || []
        },
        usage: {
          cvLastUpdated: cv?.updated_at,
          coverLettersCount: coverLettersCount || 0,
          applicationsCount: applicationsCount || 0
        }
      }

      return result
    } catch (error) {
      console.error('Fel vid hämtning av unified profile:', error)
      // Returnera tom profil vid fel
      return {
        core: { firstName: '', lastName: '', email: '', phone: '', location: '', summary: '' },
        professional: { skills: [], languages: [], workExperience: [], education: [] },
        career: { preferredRoles: [] },
        usage: { coverLettersCount: 0, applicationsCount: 0 }
      }
    }
  },

  /**
   * Uppdatera core profile
   */
  async updateCore(data: Partial<CoreProfile>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      // Uppdatera unified_profiles
      const { error } = await supabase
        .from('unified_profiles')
        .upsert({
          user_id: user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          location: data.location,
          summary: data.summary,
          profile_image_url: data.profileImageUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      // Uppdatera även profiles-tabellen för bakåtkompatibilitet
      await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      showToast.success('Profilen sparad')
    } catch (error) {
      console.error('Fel vid uppdatering av core profile:', error)
      showToast.error('Kunde inte spara profilen')
      throw error
    }
  },

  /**
   * Uppdatera career profile
   * Sparar till profiles-tabellen (primary source of truth)
   */
  async updateCareer(data: Partial<CareerProfile>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      // Build the update object
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      // Update employment status if provided
      if (data.employmentStatus !== undefined) {
        updateData.employment_status = data.employmentStatus
      }

      // Update career goals if any career goal fields provided
      if (data.careerGoals || data.preferredRoles || data.targetIndustries) {
        // First get existing career_goals to merge
        const { data: existing } = await supabase
          .from('profiles')
          .select('career_goals')
          .eq('id', user.id)
          .single()

        updateData.career_goals = {
          ...(existing?.career_goals || {}),
          ...(data.careerGoals || {}),
          preferredRoles: data.preferredRoles || existing?.career_goals?.preferredRoles || [],
          targetIndustries: data.targetIndustries || existing?.career_goals?.targetIndustries || [],
          updatedAt: new Date().toISOString()
        }
      }

      // Update profiles table (primary)
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      // Also update unified_profiles for backwards compatibility
      if (data.careerGoals || data.preferredRoles) {
        await supabase
          .from('unified_profiles')
          .upsert({
            user_id: user.id,
            career_goals: data.careerGoals,
            preferred_roles: data.preferredRoles,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
      }

      showToast.success('Karriärprofilen sparad')
    } catch (error) {
      console.error('Fel vid uppdatering av career profile:', error)
      showToast.error('Kunde inte spara karriärprofilen')
      throw error
    }
  },

  /**
   * Synkronisera från CV till unified profile
   * Används när CV uppdateras
   */
  async syncFromCV(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      // Hämta CV-data
      const { data: cv } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cv) return

      // Uppdatera unified profile med CV-data
      await supabase
        .from('unified_profiles')
        .upsert({
          user_id: user.id,
          summary: cv.summary,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    } catch (error) {
      console.error('Fel vid synk från CV:', error)
    }
  },

  /**
   * Synkronisera till CV från unified profile
   * Används när profilen uppdateras och CV ska uppdateras
   */
  async syncToCV(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      // Hämta unified profile
      const { data: unifiedProfile } = await supabase
        .from('unified_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!unifiedProfile) return

      // Uppdatera CV med profildata
      await supabase
        .from('cvs')
        .update({
          summary: unifiedProfile.summary,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Fel vid synk till CV:', error)
    }
  },

  /**
   * Ladda upp profilbild
   */
  async uploadProfileImage(file: File): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      const fileExt = file.name.split('.').pop()
      const fileName = `profile-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      // Ladda upp till storage
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Hämta public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath)

      // Uppdatera profilen med ny bild-URL
      await this.updateCore({ profileImageUrl: publicUrl })

      // Uppdatera även profiles-tabellen
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      showToast.success('Profilbild uppdaterad')
      return publicUrl
    } catch (error) {
      console.error('Fel vid uppladdning av profilbild:', error)
      showToast.error('Kunde inte ladda upp bild')
      throw error
    }
  },

  /**
   * Beräkna profilkompletthet (0-100%)
   */
  calculateCompleteness(profile: Partial<UnifiedProfileData>): number {
    let score = 0
    const weights = {
      core: 40,
      professional: 35,
      career: 25
    }

    // Core profile (max 40%)
    if (profile.core) {
      if (profile.core.firstName) score += 8
      if (profile.core.lastName) score += 8
      if (profile.core.email) score += 8
      if (profile.core.phone) score += 8
      if (profile.core.summary) score += 8
    }

    // Professional (max 35%)
    if (profile.professional) {
      if (profile.professional.skills?.length > 0) score += 10
      if (profile.professional.workExperience?.length > 0) score += 15
      if (profile.professional.education?.length > 0) score += 10
    }

    // Career (max 25%)
    if (profile.career) {
      if (profile.career.riasecScores) score += 10
      if (profile.career.careerGoals?.shortTerm || profile.career.careerGoals?.longTerm) score += 10
      if (profile.career.preferredRoles?.length > 0) score += 5
    }

    return Math.min(100, score)
  }
}
