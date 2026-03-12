/**
 * React Query hooks for Knowledge Base
 * Caching, prefetching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { articleApi } from '@/services/api'
import type { Article } from '@/types/knowledge'

const ARTICLES_KEY = 'articles'
const BOOKMARKS_KEY = 'article-bookmarks'
const READING_PROGRESS_KEY = 'article-progress'

// Get all articles
export function useArticles() {
  return useQuery({
    queryKey: [ARTICLES_KEY],
    queryFn: () => articleApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  })
}

// Get single article
export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: [ARTICLES_KEY, id],
    queryFn: () => articleApi.getById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

// Get bookmarks
export function useBookmarks() {
  return useQuery({
    queryKey: [BOOKMARKS_KEY],
    queryFn: async () => {
      try {
        // Try cloud first
        const response = await fetch('/api/bookmarks')
        if (response.ok) return await response.json()
      } catch {
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem('article-bookmarks') || '[]')
      }
    },
    staleTime: 1 * 60 * 1000,
  })
}

// Toggle bookmark with optimistic update
export function useToggleBookmark() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ articleId, shouldBookmark }: { articleId: string; shouldBookmark: boolean }) => {
      // Try cloud first
      try {
        if (shouldBookmark) {
          await fetch(`/api/bookmarks/${articleId}`, { method: 'POST' })
        } else {
          await fetch(`/api/bookmarks/${articleId}`, { method: 'DELETE' })
        }
      } catch {
        // Fallback to localStorage
        const bookmarks = JSON.parse(localStorage.getItem('article-bookmarks') || '[]')
        const newBookmarks = shouldBookmark
          ? [...bookmarks, articleId]
          : bookmarks.filter((id: string) => id !== articleId)
        localStorage.setItem('article-bookmarks', JSON.stringify(newBookmarks))
      }
      return { articleId, shouldBookmark }
    },
    
    onMutate: async ({ articleId, shouldBookmark }) => {
      await queryClient.cancelQueries({ queryKey: [BOOKMARKS_KEY] })
      const previousBookmarks = queryClient.getQueryData<string[]>([BOOKMARKS_KEY])
      
      queryClient.setQueryData([BOOKMARKS_KEY], (old: string[] = []) => {
        return shouldBookmark
          ? [...old, articleId]
          : old.filter(id => id !== articleId)
      })
      
      return { previousBookmarks }
    },
    
    onError: (err, variables, context) => {
      queryClient.setQueryData([BOOKMARKS_KEY], context?.previousBookmarks)
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKMARKS_KEY] })
    },
  })
}

// Save reading progress
export function useSaveProgress() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ articleId, progress }: { articleId: string; progress: number }) => {
      localStorage.setItem(`${READING_PROGRESS_KEY}-${articleId}`, String(progress))
      return { articleId, progress }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [READING_PROGRESS_KEY] })
    },
  })
}

// Get reading progress
export function useReadingProgress(articleId: string) {
  return useQuery({
    queryKey: [READING_PROGRESS_KEY, articleId],
    queryFn: () => {
      const progress = localStorage.getItem(`${READING_PROGRESS_KEY}-${articleId}`)
      return progress ? parseInt(progress, 10) : 0
    },
  })
}

// Prefetch article for faster navigation
export function usePrefetchArticle() {
  const queryClient = useQueryClient()
  
  return (articleId: string) => {
    queryClient.prefetchQuery({
      queryKey: [ARTICLES_KEY, articleId],
      queryFn: () => articleApi.getById(articleId),
      staleTime: 10 * 60 * 1000,
    })
  }
}

// Search articles with filtering
export function useSearchArticles() {
  const { data: articles } = useArticles()
  
  const search = (
    query: string,
    filters: {
      category?: string
      difficulty?: ('easy' | 'medium' | 'detailed')[]
      energyLevel?: ('low' | 'medium' | 'high')[]
      maxReadingTime?: number
    } = {}
  ) => {
    if (!articles) return []
    
    return articles.filter((article: Article) => {
      // Text search
      if (query) {
        const searchLower = query.toLowerCase()
        const matchesSearch =
          article.title.toLowerCase().includes(searchLower) ||
          article.summary.toLowerCase().includes(searchLower) ||
          (article.tags && (
            Array.isArray(article.tags)
              ? article.tags.some(t => t.toLowerCase().includes(searchLower))
              : article.tags.toLowerCase().includes(searchLower)
          ))
        if (!matchesSearch) return false
      }
      
      // Category filter
      if (filters.category && article.category !== filters.category) {
        return false
      }
      
      // Difficulty filter
      if (filters.difficulty?.length && !filters.difficulty.includes(article.difficulty || 'medium')) {
        return false
      }
      
      // Reading time filter
      if (filters.maxReadingTime && article.readingTime && article.readingTime > filters.maxReadingTime) {
        return false
      }
      
      return true
    })
  }
  
  return { search, articles }
}

// Get personalized recommendations
export function usePersonalizedArticles() {
  const { data: articles } = useArticles()
  const { data: bookmarks = [] } = useBookmarks()
  
  const getRecommendations = (userProfile: {
    readArticles: string[]
    interests: string[]
    energyLevel: 'low' | 'medium' | 'high'
  }) => {
    if (!articles) return []
    
    return articles
      .map((article: Article) => {
        let score = 0
        
        // Not already read
        if (!userProfile.readArticles.includes(article.id)) {
          score += 10
        }
        
        // Matches interests
        if (userProfile.interests.some(i => 
          article.category.toLowerCase().includes(i.toLowerCase()) ||
          article.tags?.includes(i)
        )) {
          score += 20
        }
        
        // Energy level match
        if (userProfile.energyLevel === 'low' && article.readingTime && article.readingTime <= 5) {
          score += 15
        } else if (userProfile.energyLevel === 'medium' && article.readingTime && article.readingTime <= 10) {
          score += 10
        } else if (userProfile.energyLevel === 'high') {
          score += 5
        }
        
        // Popular articles
        if (article.helpfulnessRating && article.helpfulnessRating >= 4.5) {
          score += 5
        }
        
        return { article, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.article)
  }
  
  return { getRecommendations }
}
