/**
 * Web Worker for article search
 * Offloads fuzzy search to prevent UI blocking
 */

import Fuse from 'fuse.js'
import type { Article } from '@/types/knowledge'

interface SearchMessage {
  type: 'SEARCH'
  payload: {
    query: string
    articles: Article[]
    filters: {
      difficulty?: ('easy' | 'medium' | 'detailed')[]
      energyLevel?: ('low' | 'medium' | 'high')[]
      maxReadingTime?: number
      category?: string
    }
    options?: Fuse.IFuseOptions<Article>
  }
}

interface SuggestionsMessage {
  type: 'GET_SUGGESTIONS'
  payload: {
    query: string
    articles: Article[]
  }
}

// Store Fuse instance for reuse
let fuse: Fuse<Article> | null = null
let articlesCache: Article[] | null = null

// Initialize Fuse with articles
function initializeFuse(articles: Article[]) {
  // Only reinitialize if articles changed
  if (articlesCache === articles && fuse) {
    return fuse
  }
  
  articlesCache = articles
  fuse = new Fuse(articles, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'summary', weight: 0.3 },
      { name: 'content', weight: 0.2 },
      { name: 'tags', weight: 0.1 },
    ],
    threshold: 0.3,
    includeScore: true,
    useExtendedSearch: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })
  
  return fuse
}

// Filter articles based on criteria
function filterArticles(
  articles: Article[],
  filters: SearchMessage['payload']['filters']
): Article[] {
  return articles.filter(article => {
    // Difficulty filter
    if (filters.difficulty?.length && !filters.difficulty.includes(article.difficulty || 'medium')) {
      return false
    }
    
    // Reading time filter based on energy level
    if (filters.energyLevel?.length) {
      const maxTime = filters.energyLevel.includes('low') ? 5 
        : filters.energyLevel.includes('medium') ? 15 
        : Infinity
      if (article.readingTime && article.readingTime > maxTime) {
        return false
      }
    }
    
    // Max reading time filter
    if (filters.maxReadingTime && article.readingTime && article.readingTime > filters.maxReadingTime) {
      return false
    }
    
    // Category filter
    if (filters.category && article.category !== filters.category) {
      return false
    }
    
    return true
  })
}

// Get search suggestions
function getSuggestions(query: string, articles: Article[]): string[] {
  if (query.length < 2) return []
  
  const fuse = initializeFuse(articles)
  const results = fuse.search(query, { limit: 5 })
  
  // Extract unique suggestions from results
  const suggestions = new Set<string>()
  
  results.forEach(result => {
    // Add title words that match
    const titleWords = result.item.title.split(' ')
    titleWords.forEach(word => {
      if (word.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(word)
      }
    })
    
    // Add category
    suggestions.add(result.item.category)
    
    // Add tags
    if (result.item.tags) {
      const tags = Array.isArray(result.item.tags) 
        ? result.item.tags 
        : result.item.tags.split(',')
      tags.forEach(tag => suggestions.add(tag.trim()))
    }
  })
  
  return Array.from(suggestions).slice(0, 8)
}

// Handle messages from main thread
self.onmessage = (event: MessageEvent<SearchMessage | SuggestionsMessage>) => {
  const { type, payload } = event.data
  
  if (type === 'SEARCH') {
    const { query, articles, filters } = payload
    
    // Filter first
    let filtered = filterArticles(articles, filters)
    
    // Then search if query exists
    let results: Array<{ item: Article; score?: number }>
    
    if (query.trim()) {
      const fuse = initializeFuse(filtered)
      results = fuse.search(query)
    } else {
      results = filtered.map(item => ({ item }))
    }
    
    // Send results back
    self.postMessage({
      type: 'SEARCH_RESULTS',
      payload: results,
    })
  }
  
  if (type === 'GET_SUGGESTIONS') {
    const { query, articles } = payload
    const suggestions = getSuggestions(query, articles)
    
    self.postMessage({
      type: 'SUGGESTIONS',
      payload: suggestions,
    })
  }
}

export {}
