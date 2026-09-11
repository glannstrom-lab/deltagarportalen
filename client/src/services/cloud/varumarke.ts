/** Personligt varumärke: varumärkeskollen, portfolio, pitchar, synlighetsstrategier och innehållskalender. Skrivvägar kastar LagringsFel. */

import { supabase } from '@/lib/supabase'
import { getCurrentUser, handleStorageError, kastaLagringsFel } from './_shared'

// ============================================
// PERSONAL BRAND
// ============================================

export interface PortfolioItem {
  id?: string
  title: string
  description?: string
  item_type: 'project' | 'work' | 'certificate' | 'other'
  url?: string
  image_url?: string
  tags: string[]
  start_date?: string
  end_date?: string
  is_featured?: boolean
  sort_order?: number
}

export interface ElevatorPitch {
  id?: string
  title: string
  content: string
  duration_seconds: number
  pitch_type: 'general' | 'job-specific' | 'networking' | 'interview'
  target_audience?: string
  key_points: string[]
  is_favorite?: boolean
  practice_count?: number
  last_practiced_at?: string
}

export interface VisibilityProgressItem {
  strategy_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  started_at?: string
  completed_at?: string
  notes?: string
}

export interface ContentCalendarItem {
  id?: string
  title: string
  content?: string
  platform: 'linkedin' | 'twitter' | 'blog' | 'other'
  scheduled_date: string
  scheduled_time?: string
  status: 'draft' | 'scheduled' | 'published' | 'skipped'
  tags: string[]
}

export const personalBrandApi = {
  // ===== BRAND AUDIT =====
  async getAuditAnswers(): Promise<Record<string, boolean>> {
    const user = await getCurrentUser()
    if (!user) {
      const saved = localStorage.getItem('brand-audit-answers')
      return saved ? JSON.parse(saved) : {}
    }

    const { data, error } = await supabase
      .from('personal_brand_audit')
      .select('answers')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      handleStorageError(error, 'hämta varumärkesaudit')
      const saved = localStorage.getItem('brand-audit-answers')
      return saved ? JSON.parse(saved) : {}
    }
    return data?.[0]?.answers || {}
  },

  /**
   * Varumärkeskollens svar.
   *
   * Låg tidigare på `.upsert(…, { onConflict: 'user_id' })`. Prod har inget
   * unikt index på `personal_brand_audit(user_id)` — bara primärnyckeln på
   * `id` — så Postgres svarade **42P10 varje gång**: "there is no unique or
   * exclusion constraint matching the ON CONFLICT specification". Felet
   * sväljdes av `handleStorageError` och svaren lades i localStorage, som
   * ingen läsväg någonsin hämtade dem ur och som `clearUserScopedStorage()`
   * tömmer vid utloggning. Sidan sa "Dina svar sparas automatiskt i molnet".
   *
   * Ingen migration behövs för att laga det: läs först, skriv sedan. Ett
   * unikt index vore den snyggare modellen men är en prod-ändring och
   * därmed ett eget beslut — se `supabase/migrations/` och ROADMAP PB-A.
   *
   * Verifierat i prod 2026-08-21: `personal_brand_audit` har indexen
   * `personal_brand_audit_pkey` (unikt, id), `idx_..._user_id` (icke-unikt)
   * och `idx_..._updated` (icke-unikt).
   */
  async saveAuditAnswers(answers: Record<string, boolean>, totalScore: number, categoryScores: Record<string, number>): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      localStorage.setItem('brand-audit-answers', JSON.stringify(answers))
      return
    }

    const rad = {
      answers,
      total_score: totalScore,
      category_scores: categoryScores,
      updated_at: new Date().toISOString(),
    }

    const { data: befintlig, error: lasFel } = await supabase
      .from('personal_brand_audit')
      .select('id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lasFel) kastaLagringsFel(lasFel, 'spara varumärkeskollen')

    const { error } = befintlig?.id
      ? await supabase.from('personal_brand_audit').update(rad).eq('id', befintlig.id).eq('user_id', user.id)
      : await supabase.from('personal_brand_audit').insert({ ...rad, user_id: user.id })

    if (error) kastaLagringsFel(error, 'spara varumärkeskollen')
  },

  async getAuditHistory(): Promise<{ total_score: number; category_scores: Record<string, number>; created_at: string }[]> {
    const user = await getCurrentUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('personal_brand_audit')
      .select('total_score, category_scores, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      handleStorageError(error, 'hämta audit-historik')
      return []
    }
    return data || []
  },

  // ===== PORTFOLIO =====
  async getPortfolioItems(): Promise<PortfolioItem[]> {
    const user = await getCurrentUser()
    if (!user) {
      const saved = localStorage.getItem('portfolio-items')
      return saved ? JSON.parse(saved) : []
    }

    // E11 (2026-07-23): explicit kolumnlista — matchar exakt PortfolioItem-interfacet.
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('id, title, description, item_type, url, image_url, tags, start_date, end_date, is_featured, sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    // Ett läsfel får inte se ut som "du har inget än" — det var precis den
    // förväxlingen som fick sidan att visa "Ingen portfolio ännu" för någon
    // med sparade poster.
    if (error) kastaLagringsFel(error, 'hämta portfolion')
    return data || []
  },

  async addPortfolioItem(item: PortfolioItem): Promise<PortfolioItem | null> {
    const user = await getCurrentUser()
    if (!user) {
      const items = JSON.parse(localStorage.getItem('portfolio-items') || '[]')
      const newItem = { ...item, id: Date.now().toString() }
      items.unshift(newItem)
      localStorage.setItem('portfolio-items', JSON.stringify(items))
      return newItem
    }

    const { data, error } = await supabase
      .from('portfolio_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()

    // Skrev tidigare en kopia i localStorage och returnerade den som om
    // sparningen lyckats. Läsvägen ovan hämtar bara localStorage när SELECT
    // failar — för en inloggad användare med fungerande läsning möttes de
    // två aldrig. Objektet fanns alltså i webbläsaren, syntes aldrig, och
    // raderades vid nästa utloggning. Ett synligt fel är bättre än en tyst
    // halvsparning.
    if (error) kastaLagringsFel(error, 'spara portfolioposten')
    return data
  },

  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      const items = JSON.parse(localStorage.getItem('portfolio-items') || '[]')
      const index = items.findIndex((i: PortfolioItem) => i.id === id)
      if (index >= 0) {
        items[index] = { ...items[index], ...updates }
        localStorage.setItem('portfolio-items', JSON.stringify(items))
      }
      return
    }

    const { error } = await supabase
      .from('portfolio_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) kastaLagringsFel(error, 'uppdatera portfolioposten')
  },

  async deletePortfolioItem(id: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      const items = JSON.parse(localStorage.getItem('portfolio-items') || '[]')
      const filtered = items.filter((i: PortfolioItem) => i.id !== id)
      localStorage.setItem('portfolio-items', JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    // En raderingsbegäran som inte gick igenom och inte heller sa något är
    // art. 17-relevant — användaren tror att posten är borta.
    if (error) kastaLagringsFel(error, 'ta bort portfolioposten')
  },

  // ===== ELEVATOR PITCHES =====
  async getPitches(): Promise<ElevatorPitch[]> {
    const user = await getCurrentUser()
    if (!user) {
      const saved = localStorage.getItem('elevator-pitches')
      return saved ? JSON.parse(saved) : []
    }

    // E11 (2026-07-23): explicit kolumnlista — matchar exakt ElevatorPitch-interfacet.
    const { data, error } = await supabase
      .from('elevator_pitches')
      .select('id, title, content, duration_seconds, pitch_type, target_audience, key_points, is_favorite, practice_count, last_practiced_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) kastaLagringsFel(error, 'hämta dina pitchar')
    return data || []
  },

  async addPitch(pitch: ElevatorPitch): Promise<ElevatorPitch | null> {
    const user = await getCurrentUser()
    if (!user) {
      const pitches = JSON.parse(localStorage.getItem('elevator-pitches') || '[]')
      const newPitch = { ...pitch, id: Date.now().toString() }
      pitches.unshift(newPitch)
      localStorage.setItem('elevator-pitches', JSON.stringify(pitches))
      return newPitch
    }

    const { data, error } = await supabase
      .from('elevator_pitches')
      .insert({ ...pitch, user_id: user.id })
      .select()
      .single()

    // Returnerade tidigare en localStorage-kopia som om sparningen lyckats.
    // Anroparen kör sedan `loadPitches()`, som hämtar serverns lista UTAN
    // kopian och skriver över den — användaren såg formuläret stängas och
    // pitchen försvinna, utan ett ord.
    if (error) kastaLagringsFel(error, 'spara pitchen')
    return data
  },

  async updatePitch(id: string, updates: Partial<ElevatorPitch>): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      const pitches = JSON.parse(localStorage.getItem('elevator-pitches') || '[]')
      const index = pitches.findIndex((p: ElevatorPitch) => p.id === id)
      if (index >= 0) {
        pitches[index] = { ...pitches[index], ...updates }
        localStorage.setItem('elevator-pitches', JSON.stringify(pitches))
      }
      return
    }

    const { error } = await supabase
      .from('elevator_pitches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) kastaLagringsFel(error, 'uppdatera pitchen')
  },

  async deletePitch(id: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      const pitches = JSON.parse(localStorage.getItem('elevator-pitches') || '[]')
      const filtered = pitches.filter((p: ElevatorPitch) => p.id !== id)
      localStorage.setItem('elevator-pitches', JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('elevator_pitches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) kastaLagringsFel(error, 'ta bort pitchen')
  },

  async recordPractice(id: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      const pitches = JSON.parse(localStorage.getItem('elevator-pitches') || '[]')
      const index = pitches.findIndex((p: ElevatorPitch) => p.id === id)
      if (index >= 0) {
        pitches[index].practice_count = (pitches[index].practice_count || 0) + 1
        pitches[index].last_practiced_at = new Date().toISOString()
        localStorage.setItem('elevator-pitches', JSON.stringify(pitches))
      }
      return
    }

    // Get current count first
    const { data: current, error: readError } = await supabase
      .from('elevator_pitches')
      .select('practice_count')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    // D7 (2026-07-23): kasta vid läsfel — annars skrivs practice_count=1 och
    // NOLLSTÄLLER räknaren vid ett transient läsfel. (Kvarvarande race vid
    // samtidiga ökningar kräver en atomisk RPC — noterat i ROADMAP D7.)
    if (readError) {
      handleStorageError(readError, 'läsa övningsräknare')
      return
    }

    const { error } = await supabase
      .from('elevator_pitches')
      .update({
        practice_count: (current?.practice_count || 0) + 1,
        last_practiced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      handleStorageError(error, 'registrera övning')
    }
  },

  // ===== VISIBILITY PROGRESS =====
  async getVisibilityProgress(): Promise<VisibilityProgressItem[]> {
    const user = await getCurrentUser()
    if (!user) {
      const saved = localStorage.getItem('visibility-progress')
      return saved ? JSON.parse(saved) : []
    }

    // E11 (2026-07-23): explicit kolumnlista — matchar exakt VisibilityProgressItem-interfacet.
    const { data, error } = await supabase
      .from('visibility_progress')
      .select('strategy_id, status, started_at, completed_at, notes')
      .eq('user_id', user.id)

    if (error) {
      kastaLagringsFel(error, 'hämta dina strategier')
      const saved = localStorage.getItem('visibility-progress')
      return saved ? JSON.parse(saved) : []
    }
    return data || []
  },

  async updateVisibilityProgress(item: VisibilityProgressItem): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      const progress = JSON.parse(localStorage.getItem('visibility-progress') || '[]')
      const index = progress.findIndex((p: VisibilityProgressItem) => p.strategy_id === item.strategy_id)
      if (index >= 0) {
        progress[index] = item
      } else {
        progress.push(item)
      }
      localStorage.setItem('visibility-progress', JSON.stringify(progress))
      return
    }

    const { error } = await supabase
      .from('visibility_progress')
      .upsert({
        user_id: user.id,
        ...item,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,strategy_id'
      })

    if (error) {
      kastaLagringsFel(error, 'spara ändringen')
    }
  },

  // ===== CONTENT CALENDAR =====
  async getContentCalendar(startDate?: string, endDate?: string): Promise<ContentCalendarItem[]> {
    const user = await getCurrentUser()
    if (!user) {
      const saved = localStorage.getItem('content-calendar')
      return saved ? JSON.parse(saved) : []
    }

    // E11 (2026-07-23): explicit kolumnlista — matchar exakt ContentCalendarItem-interfacet.
    let query = supabase
      .from('content_calendar')
      .select('id, title, content, platform, scheduled_date, scheduled_time, status, tags')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true })

    if (startDate) {
      query = query.gte('scheduled_date', startDate)
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      kastaLagringsFel(error, 'hämta din innehållskalender')
      const saved = localStorage.getItem('content-calendar')
      return saved ? JSON.parse(saved) : []
    }
    return data || []
  },

  async addContentItem(item: ContentCalendarItem): Promise<ContentCalendarItem | null> {
    const user = await getCurrentUser()
    if (!user) {
      const items = JSON.parse(localStorage.getItem('content-calendar') || '[]')
      const newItem = { ...item, id: Date.now().toString() }
      items.push(newItem)
      localStorage.setItem('content-calendar', JSON.stringify(items))
      return newItem
    }

    const { data, error } = await supabase
      .from('content_calendar')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()

    if (error) {
      kastaLagringsFel(error, 'spara det planerade inlägget')
      return null
    }
    return data
  },

  async updateContentItem(id: string, updates: Partial<ContentCalendarItem>): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      const items = JSON.parse(localStorage.getItem('content-calendar') || '[]')
      const index = items.findIndex((i: ContentCalendarItem) => i.id === id)
      if (index >= 0) {
        items[index] = { ...items[index], ...updates }
        localStorage.setItem('content-calendar', JSON.stringify(items))
      }
      return
    }

    const { error } = await supabase
      .from('content_calendar')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      kastaLagringsFel(error, 'uppdatera det planerade inlägget')
    }
  },

  async deleteContentItem(id: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      const items = JSON.parse(localStorage.getItem('content-calendar') || '[]')
      const filtered = items.filter((i: ContentCalendarItem) => i.id !== id)
      localStorage.setItem('content-calendar', JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('content_calendar')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      kastaLagringsFel(error, 'ta bort det planerade inlägget')
    }
  }
}
