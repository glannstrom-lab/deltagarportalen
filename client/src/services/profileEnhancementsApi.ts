/**
 * Profile Enhancements API
 * Handles: documents, skills, sharing, history, notifications, visibility, AI summary
 */

import { supabase } from '../lib/supabase'
import { generateProfileSummary } from './aiApi'

// ============================================
// TYPES
// ============================================

export interface ProfileDocument {
  id: string
  user_id: string
  name: string
  type: 'certificate' | 'degree' | 'reference' | 'other'
  description?: string
  file_url: string
  file_size?: number
  mime_type?: string
  issuer?: string
  issue_date?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

export interface ProfileSkill {
  id: string
  user_id: string
  name: string
  category: 'technical' | 'soft' | 'language' | 'tool' | 'certification' | 'other'
  level: number // 1-5
  years_experience?: number
  verified: boolean
  created_at: string
  updated_at: string
}

export interface ProfileShare {
  id: string
  user_id: string
  share_code: string
  name?: string
  show_contact: boolean
  show_skills: boolean
  show_experience: boolean
  show_education: boolean
  show_documents: boolean
  show_summary: boolean
  max_views?: number
  view_count: number
  expires_at?: string
  last_viewed_at?: string
  created_at: string
}

export interface ProfileHistoryEntry {
  id: string
  user_id: string
  field_name: string
  old_value: unknown
  new_value: unknown
  change_type: 'create' | 'update' | 'delete'
  created_at: string
}

export interface NotificationSettings {
  id: string
  user_id: string
  email_job_matches: boolean
  email_application_updates: boolean
  email_weekly_summary: boolean
  email_tips_and_resources: boolean
  email_consultant_messages: boolean
  push_enabled: boolean
  push_job_matches: boolean
  push_deadlines: boolean
  push_achievements: boolean
  inapp_enabled: boolean
  inapp_job_matches: boolean
  inapp_tips: boolean
  digest_frequency: 'realtime' | 'daily' | 'weekly' | 'never'
  quiet_hours_start?: string
  quiet_hours_end?: string
}

export interface VisibilitySettings {
  id: string
  user_id: string
  profile_visible_to: 'public' | 'consultant' | 'private'
  show_email: boolean
  show_phone: boolean
  show_location: boolean
  show_full_name: boolean
  show_photo: boolean
  show_summary: boolean
  show_skills: boolean
  show_experience: boolean
  show_education: boolean
  show_documents: boolean
  show_interests: boolean
  show_goals: boolean
  show_activity: boolean
  share_with_consultant: boolean
  consultant_can_edit: boolean
  visible_to_employers: boolean
  searchable_profile: boolean
}

// ============================================
// PROFILE IMAGE API
// ============================================

export const profileImageApi = {
  async upload(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be less than 5MB')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    // Upload file directly
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      })

    if (uploadError) throw uploadError

    // Get public URL with cache-busting timestamp
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName)

    // Add cache-busting parameter to force browser to reload
    const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`

    // Update profile
    await supabase
      .from('profiles')
      .update({ profile_image_url: urlWithTimestamp })
      .eq('id', user.id)

    return urlWithTimestamp
  },

  async delete(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Delete from storage (try common extensions)
    for (const ext of ['jpg', 'jpeg', 'png', 'gif', 'webp']) {
      await supabase.storage
        .from('profile-images')
        .remove([`${user.id}/avatar.${ext}`])
    }

    // Update profile
    await supabase
      .from('profiles')
      .update({ profile_image_url: null })
      .eq('id', user.id)
  },

  async getUrl(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', user.id)
      .single()

    return data?.profile_image_url || null
  }
}

// ============================================
// PROFILE DOCUMENTS API
// ============================================

export const profileDocumentsApi = {
  async getAll(): Promise<ProfileDocument[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase
        .from('profile_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error?.code === 'PGRST205') return []
      if (error) throw error
      return data || []
    } catch {
      return []
    }
  },

  async upload(file: File, metadata: {
    name: string
    type: ProfileDocument['type']
    description?: string
    issuer?: string
    issue_date?: string
    expiry_date?: string
  }): Promise<ProfileDocument> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File must be less than 10MB')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}_${file.name}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('profile-documents')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Get signed URL (private bucket)
    const { data: { signedUrl } } = await supabase.storage
      .from('profile-documents')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

    // Create record
    const { data, error } = await supabase
      .from('profile_documents')
      .insert({
        user_id: user.id,
        name: metadata.name,
        type: metadata.type,
        description: metadata.description,
        file_url: signedUrl,
        file_size: file.size,
        mime_type: file.type,
        issuer: metadata.issuer,
        issue_date: metadata.issue_date,
        expiry_date: metadata.expiry_date
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profile_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  }
}

// ============================================
// PROFILE SKILLS API
// ============================================

export const profileSkillsApi = {
  async getAll(): Promise<ProfileSkill[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase
        .from('profile_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('level', { ascending: false })

      if (error?.code === 'PGRST205') return []
      if (error) throw error
      return data || []
    } catch {
      return []
    }
  },

  async add(skill: {
    name: string
    category: ProfileSkill['category']
    level: number
    years_experience?: number
  }): Promise<ProfileSkill> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profile_skills')
      .insert({
        user_id: user.id,
        ...skill
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<ProfileSkill>): Promise<ProfileSkill> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profile_skills')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profile_skills')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  async importFromCV(): Promise<ProfileSkill[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get CV skills
    const { data: cv } = await supabase
      .from('cvs')
      .select('skills')
      .eq('user_id', user.id)
      .single()

    if (!cv?.skills?.length) return []

    // Import each skill
    const imported: ProfileSkill[] = []
    for (const skill of cv.skills) {
      const skillName = typeof skill === 'string' ? skill : skill.name
      const skillLevel = typeof skill === 'object' ? skill.level : 3
      const skillCategory = typeof skill === 'object' ? skill.category : 'other'

      try {
        const { data, error } = await supabase
          .from('profile_skills')
          .upsert({
            user_id: user.id,
            name: skillName,
            category: skillCategory,
            level: skillLevel
          }, { onConflict: 'user_id,name' })
          .select()
          .single()

        if (!error && data) imported.push(data)
      } catch {
        // Skip duplicates
      }
    }

    return imported
  }
}

// ============================================
// PROFILE SHARING API
// ============================================

export const profileShareApi = {
  async getAll(): Promise<ProfileShare[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase
        .from('profile_shares')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error?.code === 'PGRST205') return []
      if (error) throw error
      return data || []
    } catch {
      return []
    }
  },

  async create(options: {
    name?: string
    show_contact?: boolean
    show_skills?: boolean
    show_experience?: boolean
    show_education?: boolean
    show_documents?: boolean
    show_summary?: boolean
    expires_in_days?: number
    max_views?: number
  } = {}): Promise<ProfileShare> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const shareCode = Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15)

    const expiresAt = options.expires_in_days
      ? new Date(Date.now() + options.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data, error } = await supabase
      .from('profile_shares')
      .insert({
        user_id: user.id,
        share_code: shareCode,
        name: options.name,
        show_contact: options.show_contact ?? true,
        show_skills: options.show_skills ?? true,
        show_experience: options.show_experience ?? true,
        show_education: options.show_education ?? true,
        show_documents: options.show_documents ?? false,
        show_summary: options.show_summary ?? true,
        expires_at: expiresAt,
        max_views: options.max_views
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profile_shares')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  async getSharedProfile(shareCode: string): Promise<{
    profile: Record<string, unknown>
    share: ProfileShare
  } | null> {
    const { data: share, error: shareError } = await supabase
      .from('profile_shares')
      .select('*')
      .eq('share_code', shareCode)
      .single()

    if (shareError || !share) return null

    // Check expiry and max views
    if (share.expires_at && new Date(share.expires_at) < new Date()) return null
    if (share.max_views && share.view_count >= share.max_views) return null

    // Increment view count
    await supabase
      .from('profile_shares')
      .update({
        view_count: share.view_count + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', share.id)

    // Get profile based on visibility settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', share.user_id)
      .single()

    if (!profile) return null

    // Filter based on share settings
    const filteredProfile: Record<string, unknown> = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      profile_image_url: profile.profile_image_url
    }

    if (share.show_contact) {
      filteredProfile.email = profile.email
      filteredProfile.phone = profile.phone
      filteredProfile.location = profile.location
    }

    if (share.show_summary) {
      filteredProfile.ai_summary = profile.ai_summary
    }

    // Get additional data based on settings
    if (share.show_skills) {
      const { data: skills } = await supabase
        .from('profile_skills')
        .select('*')
        .eq('user_id', share.user_id)
      filteredProfile.skills = skills
    }

    if (share.show_experience || share.show_education) {
      const { data: cv } = await supabase
        .from('cvs')
        .select('work_experience, education')
        .eq('user_id', share.user_id)
        .single()

      if (share.show_experience) filteredProfile.work_experience = cv?.work_experience
      if (share.show_education) filteredProfile.education = cv?.education
    }

    if (share.show_documents) {
      const { data: docs } = await supabase
        .from('profile_documents')
        .select('*')
        .eq('user_id', share.user_id)
      filteredProfile.documents = docs
    }

    return { profile: filteredProfile, share }
  },

  getShareUrl(shareCode: string): string {
    return `${window.location.origin}/profile/shared/${shareCode}`
  }
}

// ============================================
// PROFILE HISTORY API
// ============================================

export const profileHistoryApi = {
  async getAll(limit = 50): Promise<ProfileHistoryEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase
        .from('profile_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error?.code === 'PGRST205') return []
      if (error) throw error
      return data || []
    } catch {
      return []
    }
  },

  async logChange(
    fieldName: string,
    oldValue: unknown,
    newValue: unknown,
    changeType: 'create' | 'update' | 'delete' = 'update'
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Don't log if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return

    await supabase
      .from('profile_history')
      .insert({
        user_id: user.id,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
        change_type: changeType
      })
  }
}

// ============================================
// NOTIFICATION SETTINGS API
// ============================================

export const notificationSettingsApi = {
  async get(): Promise<NotificationSettings | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      // Handle missing table gracefully
      if (error?.code === 'PGRST205') return null
      if (error) throw error
      return data
    } catch {
      // Table might not exist yet
      return null
    }
  },

  async update(settings: Partial<NotificationSettings>): Promise<NotificationSettings | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      // Handle missing table gracefully
      if (error?.code === 'PGRST205') {
        console.warn('notification_settings table not found - migration may be pending')
        return null
      }
      if (error) throw error
      return data
    } catch {
      console.warn('Could not save notification settings - table may not exist')
      return null
    }
  }
}

// ============================================
// VISIBILITY SETTINGS API
// ============================================

export const visibilitySettingsApi = {
  async get(): Promise<VisibilitySettings | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase
        .from('visibility_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      // Handle missing table gracefully
      if (error?.code === 'PGRST205') return null
      if (error) throw error
      return data
    } catch {
      // Table might not exist yet
      return null
    }
  },

  async update(settings: Partial<VisibilitySettings>): Promise<VisibilitySettings | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase
        .from('visibility_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      // Handle missing table gracefully
      if (error?.code === 'PGRST205') {
        console.warn('visibility_settings table not found - migration may be pending')
        return null
      }
      if (error) throw error
      return data
    } catch {
      console.warn('Could not save visibility settings - table may not exist')
      return null
    }
  }
}

// ============================================
// AI SUMMARY API
// ============================================

export const aiSummaryApi = {
  async generate(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get CV data
    const { data: cv } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get skills
    const { data: skills } = await supabase
      .from('profile_skills')
      .select('*')
      .eq('user_id', user.id)

    // Get preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Build context for AI
    const context = {
      name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      title: cv?.title,
      location: profile?.location,
      experience: cv?.work_experience?.map((job: { title: string; company: string; description?: string }) => ({
        title: job.title,
        company: job.company,
        description: job.description
      })),
      education: cv?.education?.map((edu: { degree: string; school: string }) => ({
        degree: edu.degree,
        school: edu.school
      })),
      skills: skills?.map(s => ({ name: s.name, level: s.level })),
      desiredJobs: prefs?.desired_jobs,
      interests: prefs?.interests
    }

    // Call AI API
    const result = await generateProfileSummary(context)
    const summary = (result as { summary?: string; content?: string }).summary ||
                    (result as { summary?: string; content?: string }).content ||
                    (typeof result === 'string' ? result : '')

    // Save to profile
    await supabase
      .from('profiles')
      .update({
        ai_summary: summary,
        ai_summary_updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    return summary
  },

  async get(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('ai_summary')
      .eq('id', user.id)
      .single()

    return data?.ai_summary || null
  },

  async save(summary: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profiles')
      .update({
        ai_summary: summary,
        ai_summary_updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error
  }
}

// ============================================
// CV INTEGRATION API
// ============================================

export const cvIntegrationApi = {
  async importToProfile(): Promise<{
    imported: string[]
    skipped: string[]
  }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const imported: string[] = []
    const skipped: string[] = []

    // Get CV
    const { data: cv } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!cv) return { imported, skipped }

    // Import basic info to profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const updates: Record<string, unknown> = {}

    if (cv.first_name && !profile?.first_name) {
      updates.first_name = cv.first_name
      imported.push('first_name')
    } else if (cv.first_name && profile?.first_name) {
      skipped.push('first_name')
    }

    if (cv.last_name && !profile?.last_name) {
      updates.last_name = cv.last_name
      imported.push('last_name')
    } else if (cv.last_name && profile?.last_name) {
      skipped.push('last_name')
    }

    if (cv.phone && !profile?.phone) {
      updates.phone = cv.phone
      imported.push('phone')
    } else if (cv.phone && profile?.phone) {
      skipped.push('phone')
    }

    if (cv.location && !profile?.location) {
      updates.location = cv.location
      imported.push('location')
    } else if (cv.location && profile?.location) {
      skipped.push('location')
    }

    if (cv.profile_image && !profile?.profile_image_url) {
      updates.profile_image_url = cv.profile_image
      imported.push('profile_image')
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
    }

    // Import skills
    const skillsResult = await profileSkillsApi.importFromCV()
    if (skillsResult.length > 0) {
      imported.push(`${skillsResult.length} skills`)
    }

    return { imported, skipped }
  }
}

// ============================================
// PROFILE EXPORT API
// ============================================

export const profileExportApi = {
  async toJSON(): Promise<Record<string, unknown>> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const [profile, cv, skills, documents, prefs] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('cvs').select('*').eq('user_id', user.id).single(),
      supabase.from('profile_skills').select('*').eq('user_id', user.id),
      supabase.from('profile_documents').select('*').eq('user_id', user.id),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()
    ])

    return {
      profile: profile.data,
      cv: cv.data,
      skills: skills.data,
      documents: documents.data,
      preferences: prefs.data,
      exportedAt: new Date().toISOString()
    }
  },

  async toPDF(): Promise<Blob> {
    // Use existing pdfExportService for CV
    const { generateCVPDF } = await import('./pdfExportService')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get CV data
    const { data: cv } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!cv) throw new Error('No CV data found')

    // Transform to expected format
    const cvData = {
      firstName: cv.first_name,
      lastName: cv.last_name,
      title: cv.title,
      email: cv.email,
      phone: cv.phone,
      location: cv.location,
      summary: cv.summary,
      profileImage: cv.profile_image,
      workExperience: cv.work_experience || [],
      education: cv.education || [],
      skills: cv.skills || [],
      languages: cv.languages || [],
      certificates: cv.certificates || [],
      template: cv.template || 'sidebar'
    }

    return generateCVPDF(cvData)
  }
}
