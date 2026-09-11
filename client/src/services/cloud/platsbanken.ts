/** Platsbanken: sparade jobb och sparade sökningar, med engångsmigrering från localStorage. */

import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'
import { getCurrentUser, handleStorageError } from './_shared'

interface SavedSearch {
  id?: string
  name: string
  query?: string
  municipality?: string
  employment_type?: string
  remote?: boolean
  [key: string]: unknown
}

interface PlatsbankenJob {
  id: string
  title?: string
  employer?: { name?: string }
  [key: string]: unknown
}

interface PlatsbankenSavedJobData {
  job_data: PlatsbankenJob
}

// ============================================
// PLATSBANKEN (sparade jobb och sökningar)
// ============================================

const PLATSBANKEN_JOBS_KEY = 'platsbanken_saved_jobs'
const PLATSBANKEN_SEARCHES_KEY = 'platsbanken_saved_searches'
const PLATSBANKEN_MIGRATED_KEY = 'platsbanken_migrated_to_cloud'

/**
 * Migrera localStorage-jobb till Supabase vid första molnanrop.
 * Körs en gång per device — markeras som klar i localStorage.
 */
async function migratePlatsbankenLocalToCloud(userId: string): Promise<void> {
  if (localStorage.getItem(PLATSBANKEN_MIGRATED_KEY) === 'true') return

  const localJobs: PlatsbankenJob[] = JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
  if (localJobs.length === 0) {
    localStorage.setItem(PLATSBANKEN_MIGRATED_KEY, 'true')
    return
  }

  storageLogger.info(`Migrerar ${localJobs.length} platsbanken-jobb från localStorage till molnet`)

  const rows = localJobs
    .filter((j) => j && j.id)
    .map((j) => ({ user_id: userId, job_id: j.id, job_data: j }))

  if (rows.length > 0) {
    const { error } = await supabase
      .from('platsbanken_saved_jobs')
      .upsert(rows, { onConflict: 'user_id,job_id', ignoreDuplicates: true })

    if (error) {
      storageLogger.warn('Migration av platsbanken-jobb misslyckades, behåller localStorage:', error)
      return
    }
  }

  localStorage.setItem(PLATSBANKEN_MIGRATED_KEY, 'true')
  // Behåll localStorage som fallback under en tid — rensas vid nästa större version
}

export const platsbankenApi = {
  // Sparade jobb
  async getSavedJobs() {
    const user = await getCurrentUser()
    if (!user) {
      return JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
    }

    // Auto-migrate localStorage → cloud första gången per device
    await migratePlatsbankenLocalToCloud(user.id).catch((e) =>
      storageLogger.warn('Platsbanken-migration triggade fel:', e)
    )

    // E11 (2026-07-23): explicit kolumn — raden mappas direkt till job_data
    // (rad nedan), inget annat fält används.
    const { data, error } = await supabase
      .from('platsbanken_saved_jobs')
      .select('job_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      handleStorageError(error, 'hämta platsbanken-sparade jobb')
      storageLogger.warn('Faller tillbaka på localStorage för platsbanken-jobb — molnsync misslyckades')
      return JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
    }
    return data?.map((d: PlatsbankenSavedJobData) => d.job_data) || []
  },

  async saveJob(job: PlatsbankenJob) {
    const user = await getCurrentUser()
    if (!user) {
      const saved = JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
      if (!saved.find((j: PlatsbankenJob) => j.id === job.id)) {
        saved.push(job)
        localStorage.setItem(PLATSBANKEN_JOBS_KEY, JSON.stringify(saved))
      }
      return job
    }

    // Använd upsert för att undvika UNIQUE-constraint-fel vid dubbel-spara
    const { error } = await supabase
      .from('platsbanken_saved_jobs')
      .upsert(
        { user_id: user.id, job_id: job.id, job_data: job },
        { onConflict: 'user_id,job_id', ignoreDuplicates: true }
      )

    if (error) {
      handleStorageError(error, 'spara platsbanken-jobb')
      storageLogger.warn(`Sparar platsbanken-jobb ${job.id} lokalt — molnsparning misslyckades`)
      const saved = JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
      if (!saved.find((j: PlatsbankenJob) => j.id === job.id)) {
        saved.push(job)
        localStorage.setItem(PLATSBANKEN_JOBS_KEY, JSON.stringify(saved))
      }
    }
    return job
  },

  async removeSavedJob(jobId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const saved = JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
      const filtered = saved.filter((j: PlatsbankenJob) => j.id !== jobId)
      localStorage.setItem(PLATSBANKEN_JOBS_KEY, JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('platsbanken_saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', user.id)

    if (error) {
      handleStorageError(error, 'ta bort platsbanken-sparat jobb')
      storageLogger.warn(`Tar bort platsbanken-jobb ${jobId} lokalt — molnradering misslyckades`)
      const saved = JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
      const filtered = saved.filter((j: PlatsbankenJob) => j.id !== jobId)
      localStorage.setItem(PLATSBANKEN_JOBS_KEY, JSON.stringify(filtered))
    } else {
      // Synka även lokalt vid lyckad molnradering så fallback-listan stämmer
      const saved = JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
      const filtered = saved.filter((j: PlatsbankenJob) => j.id !== jobId)
      localStorage.setItem(PLATSBANKEN_JOBS_KEY, JSON.stringify(filtered))
    }
  },

  async isSaved(jobId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const saved = JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
      return saved.some((j: PlatsbankenJob) => j.id === jobId)
    }

    const { data, error } = await supabase
      .from('platsbanken_saved_jobs')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .limit(1)

    if (error) {
      handleStorageError(error, 'kolla platsbanken-jobb sparat')
      const saved = JSON.parse(localStorage.getItem(PLATSBANKEN_JOBS_KEY) || '[]')
      return saved.some((j: PlatsbankenJob) => j.id === jobId)
    }
    return !!(data && data.length > 0)
  },

  // Sparade sökningar
  async getSavedSearches() {
    const user = await getCurrentUser()
    if (!user) {
      return JSON.parse(localStorage.getItem(PLATSBANKEN_SEARCHES_KEY) || '[]')
    }

    const { data, error } = await supabase
      .from('platsbanken_saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      handleStorageError(error, 'hämta sparade sökningar')
      storageLogger.warn('Faller tillbaka på localStorage för platsbanken-sökningar')
      return JSON.parse(localStorage.getItem(PLATSBANKEN_SEARCHES_KEY) || '[]')
    }
    return data || []
  },

  async saveSearch(search: SavedSearch) {
    const user = await getCurrentUser()
    if (!user) {
      const searches = JSON.parse(localStorage.getItem(PLATSBANKEN_SEARCHES_KEY) || '[]')
      searches.push(search)
      localStorage.setItem(PLATSBANKEN_SEARCHES_KEY, JSON.stringify(searches))
      return search
    }

    const { data, error } = await supabase
      .from('platsbanken_saved_searches')
      .insert({
        user_id: user.id,
        name: search.name,
        query: search.query,
        municipality: search.municipality,
        employment_type: search.employment_type,
        remote: search.remote
      })
      .select()
      .single()

    if (error) {
      handleStorageError(error, 'spara sökning')
      storageLogger.warn(`Sparar platsbanken-sökning lokalt — molnsparning misslyckades`)
      const searches = JSON.parse(localStorage.getItem(PLATSBANKEN_SEARCHES_KEY) || '[]')
      searches.push(search)
      localStorage.setItem(PLATSBANKEN_SEARCHES_KEY, JSON.stringify(searches))
      return search
    }
    return data
  },

  async removeSavedSearch(searchId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const searches = JSON.parse(localStorage.getItem(PLATSBANKEN_SEARCHES_KEY) || '[]')
      const filtered = searches.filter((s: SavedSearch) => s.id !== searchId)
      localStorage.setItem(PLATSBANKEN_SEARCHES_KEY, JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('platsbanken_saved_searches')
      .delete()
      .eq('id', searchId)
      .eq('user_id', user.id)

    if (error) {
      handleStorageError(error, 'ta bort sparad sökning')
      storageLogger.warn(`Tar bort platsbanken-sökning ${searchId} lokalt — molnradering misslyckades`)
      const searches = JSON.parse(localStorage.getItem(PLATSBANKEN_SEARCHES_KEY) || '[]')
      const filtered = searches.filter((s: SavedSearch) => s.id !== searchId)
      localStorage.setItem(PLATSBANKEN_SEARCHES_KEY, JSON.stringify(filtered))
    } else {
      const searches = JSON.parse(localStorage.getItem(PLATSBANKEN_SEARCHES_KEY) || '[]')
      const filtered = searches.filter((s: SavedSearch) => s.id !== searchId)
      localStorage.setItem(PLATSBANKEN_SEARCHES_KEY, JSON.stringify(filtered))
    }
  }
}
