/**
 * Education Search Hook
 * Real-time debounced search with caching for education search
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  educationApi,
  type Education,
  type EducationType,
  type SearchResult,
} from '@/services/educationApi'

interface UseEducationSearchOptions {
  /** Debounce delay in ms (default: 300) */
  debounceDelay?: number
  /** Auto-search when filters change (default: true) */
  autoSearch?: boolean
  /** Minimum query length to trigger search (default: 0) */
  minQueryLength?: number
  /** Initial limit per page (default: 20) */
  initialLimit?: number
}

interface UseEducationSearchReturn {
  // Search state
  query: string
  setQuery: (query: string) => void
  educationType: EducationType
  setEducationType: (type: EducationType) => void
  region: string
  setRegion: (region: string) => void
  distanceOnly: boolean
  setDistanceOnly: (distance: boolean) => void

  // Results
  results: Education[]
  total: number
  hasMore: boolean
  source: string

  // Status
  isLoading: boolean
  isSearching: boolean
  hasSearched: boolean
  error: string | null

  // Actions
  search: () => Promise<void>
  loadMore: () => Promise<void>
  clearSearch: () => void
  clearFilters: () => void
}

export function useEducationSearch(
  options: UseEducationSearchOptions = {}
): UseEducationSearchReturn {
  const {
    debounceDelay = 300,
    autoSearch = true,
    minQueryLength = 0,
    initialLimit = 20,
  } = options

  // Search parameters
  const [query, setQuery] = useState('')
  const [educationType, setEducationType] = useState<EducationType>('all')
  const [region, setRegion] = useState('')
  const [distanceOnly, setDistanceOnly] = useState(false)

  // Results state
  const [results, setResults] = useState<Education[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [source, setSource] = useState('')
  const [offset, setOffset] = useState(0)

  // Status state
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Create cache key for current search params
  const searchKey = useMemo(() => {
    return `${query}|${educationType}|${region}|${distanceOnly}`
  }, [query, educationType, region, distanceOnly])

  // Perform search
  const performSearch = useCallback(async (
    isLoadMore = false
  ) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // Check minimum query length
    if (query.length > 0 && query.length < minQueryLength) {
      return
    }

    const currentOffset = isLoadMore ? offset : 0

    setIsLoading(true)
    if (!isLoadMore) {
      setIsSearching(true)
    }
    setError(null)

    try {
      const result = await educationApi.search({
        query: query || undefined,
        type: educationType,
        region: region || undefined,
        distance: distanceOnly || undefined,
        limit: initialLimit,
        offset: currentOffset,
      })

      if (isLoadMore) {
        // Append to existing results
        setResults(prev => [...prev, ...result.educations])
      } else {
        setResults(result.educations)
      }

      setTotal(result.total)
      setHasMore(result.hasMore)
      setSource(result.source)
      setOffset(currentOffset + result.educations.length)
      setHasSearched(true)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Ignore aborted requests
        return
      }
      console.error('[useEducationSearch] Search error:', err)
      setError('Ett fel uppstod vid sökning. Försök igen.')
      setResults([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }, [query, educationType, region, distanceOnly, offset, minQueryLength, initialLimit])

  // Manual search trigger
  const search = useCallback(async () => {
    setOffset(0)
    await performSearch(false)
  }, [performSearch])

  // Load more results
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await performSearch(true)
  }, [hasMore, isLoading, performSearch])

  // Clear search results
  const clearSearch = useCallback(() => {
    setResults([])
    setTotal(0)
    setHasMore(false)
    setSource('')
    setOffset(0)
    setHasSearched(false)
    setError(null)
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setQuery('')
    setEducationType('all')
    setRegion('')
    setDistanceOnly(false)
    clearSearch()
  }, [clearSearch])

  // Debounced auto-search effect
  useEffect(() => {
    if (!autoSearch) return

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Don't auto-search if no filters are set
    const hasFilters = query || educationType !== 'all' || region || distanceOnly
    if (!hasFilters) {
      clearSearch()
      return
    }

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      setOffset(0)
      performSearch(false)
    }, debounceDelay)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchKey, autoSearch, debounceDelay, performSearch, clearSearch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // Search state
    query,
    setQuery,
    educationType,
    setEducationType,
    region,
    setRegion,
    distanceOnly,
    setDistanceOnly,

    // Results
    results,
    total,
    hasMore,
    source,

    // Status
    isLoading,
    isSearching,
    hasSearched,
    error,

    // Actions
    search,
    loadMore,
    clearSearch,
    clearFilters,
  }
}

export default useEducationSearch
