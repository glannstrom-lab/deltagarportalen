/** Kunskapsbanken: bokmärken, lässtatus och checklistor per artikel. */

import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'
import { getCurrentUser, handleStorageError } from './_shared'

interface ArticleProgressUpdate {
  user_id: string
  article_id: string
  progress_percent: number
  updated_at: string
  is_completed?: boolean
  completed_at?: string
}

// ============================================
// ARTIKLAR
// ============================================
export const articleBookmarksApi = {
  async getAll() {
    // E11 (2026-07-23): explicit kolumn — enda konsumenten (this.getBookmarks
    // nedan) läser bara article_id.
    const { data, error } = await supabase
      .from('article_bookmarks')
      .select('article_id')
      .order('created_at', { ascending: false })

    if (error) {
      handleStorageError(error, 'hämta bokmärken')
      return JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
    }
    return data?.map(d => d.article_id) || []
  },

  /**
   * Get bookmarked articles with full article data
   * Returns article objects with title, category, readingTime etc.
   */
  /**
   * `category` är artikelns **kategorinyckel** (`articles.category_key`), inte
   * ett färdigt visningsnamn.
   *
   * Fram till 2026-08-22 översatte den här funktionen nyckeln själv, mot en
   * hårdkodad lista med åtta namn. Prod har tretton kategorier — de fem som
   * saknades (`getting-started`, `self-awareness`, `digital-presence`,
   * `accessibility`, `job-market`, `tools`, `easy-swedish`) föll igenom till
   * `article.category_key`, så bokmärkeskortet visade den råa engelska slugen
   * `digital-presence` som etikett. Registret ligger numera i
   * `data/artikelkategorier.ts`; anroparen översätter med `kategoriNamn(t, …)`,
   * som aldrig returnerar en slug.
   */
  async getBookmarks(): Promise<Array<{
    id: string
    title: string
    category: string
    readingTime?: number
    summary?: string
  }>> {
    const user = await getCurrentUser()

    // First get bookmark IDs
    const bookmarkIds = user
      ? await this.getAll()
      : JSON.parse(localStorage.getItem('article_bookmarks') || '[]')

    if (!bookmarkIds || bookmarkIds.length === 0) {
      return []
    }

    // Fetch article data from the articles table
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, slug, title, category_key, reading_time, summary')
      .in('slug', bookmarkIds)

    if (error) {
      handleStorageError(error, 'hämta bokmärkta artiklar')
      // Return minimal data from local storage
      return bookmarkIds.map((id: string) => ({
        id,
        title: id,
        // Tom nyckel, inte ordet "Okänd" — anroparen översätter till "Övrigt".
        category: '',
      }))
    }

    return (articles || []).map(article => ({
      id: article.slug || article.id,
      title: article.title,
      // Nyckeln, inte namnet. Se docstringen ovan.
      category: article.category_key || '',
      readingTime: article.reading_time,
      summary: article.summary
    }))
  },

  async add(articleId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      if (!bookmarks.includes(articleId)) {
        bookmarks.push(articleId)
        localStorage.setItem('article_bookmarks', JSON.stringify(bookmarks))
      }
      return
    }

    // `upsert`, inte `insert`: tabellen har UNIQUE (user_id, article_id), så
    // ett andra bokmärke på samma artikel gav 23505 som tyst dumpades i
    // localStorage-fallbacken.
    const { error } = await supabase
      .from('article_bookmarks')
      .upsert(
        { user_id: user.id, article_id: articleId },
        { onConflict: 'user_id,article_id' }
      )
    
    if (error) {
      handleStorageError(error, 'lägga till bokmärke')
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      if (!bookmarks.includes(articleId)) {
        bookmarks.push(articleId)
        localStorage.setItem('article_bookmarks', JSON.stringify(bookmarks))
      }
    }
  },

  async remove(articleId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      const filtered = bookmarks.filter((id: string) => id !== articleId)
      localStorage.setItem('article_bookmarks', JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('article_bookmarks')
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', user.id)
    
    if (error) {
      handleStorageError(error, 'ta bort bokmärke')
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      const filtered = bookmarks.filter((id: string) => id !== articleId)
      localStorage.setItem('article_bookmarks', JSON.stringify(filtered))
    }
  },

  async isBookmarked(articleId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      return bookmarks.includes(articleId)
    }

    const { data, error } = await supabase
      .from('article_bookmarks')
      .select('id')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .limit(1)
    
    if (error) {
      handleStorageError(error, 'kolla bokmärke')
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      return bookmarks.includes(articleId)
    }
    return data && data.length > 0
  }
}

export const articleProgressApi = {
  async get(articleId: string) {
    const user = await getCurrentUser()
    if (!user) return null

    // E11 (2026-07-23): explicit kolumn — enda konsumenten (ReadingProgress.tsx)
    // läser bara progress_percent.
    const { data, error } = await supabase
      .from('article_reading_progress')
      .select('progress_percent')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      storageLogger.error('Error getting progress:', error)
    }
    return data?.[0] || null
  },

  async update(articleId: string, progress: number, isCompleted = false) {
    const user = await getCurrentUser()
    if (!user) return

    const updateData: ArticleProgressUpdate = {
      user_id: user.id,
      article_id: articleId,
      progress_percent: progress,
      updated_at: new Date().toISOString()
    }

    if (isCompleted) {
      updateData.is_completed = true
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('article_reading_progress')
      .upsert(updateData, {
        onConflict: 'user_id,article_id'
      })

    if (error && error.code !== '42501') {
      storageLogger.error('Error updating progress:', error)
    }
  },

  async pause(articleId: string) {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await supabase
      .from('article_reading_progress')
      .upsert({
        user_id: user.id,
        article_id: articleId,
        paused_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,article_id'
      })
    
    if (error && error.code !== '42501') {
      storageLogger.error('Error pausing progress:', error)
    }
  }
}

export const articleChecklistApi = {
  async get(articleId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      return checklists[articleId] || []
    }

    const { data, error } = await supabase
      .from('article_checklists')
      .select('checked_items')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .limit(1)
    
    if (error) {
      handleStorageError(error, 'hämta checklista')
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      return checklists[articleId] || []
    }
    return data?.[0]?.checked_items || []
  },

  async update(articleId: string, checkedItems: string[]) {
    const user = await getCurrentUser()
    if (!user) {
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      checklists[articleId] = checkedItems
      localStorage.setItem('article_checklists', JSON.stringify(checklists))
      return
    }

    const { error } = await supabase
      .from('article_checklists')
      .upsert({
        user_id: user.id,
        article_id: articleId,
        checked_items: checkedItems,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,article_id'
      })
    
    if (error) {
      handleStorageError(error, 'uppdatera checklista')
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      checklists[articleId] = checkedItems
      localStorage.setItem('article_checklists', JSON.stringify(checklists))
    }
  }
}
