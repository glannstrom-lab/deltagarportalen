/**
 * Education Search Hook
 * Real-time debounced search with caching for education search
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  educationApi,
  type Education,
  type EducationType,
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

  // Offset ligger i en ref, INTE i state.
  //
  // Tidigare var den ett state-värde som stod i `performSearch`-callbackens
  // beroendelista, och `performSearch` stod i auto-sökeffektens. Varje
  // avslutad sökning ändrade offset → ny callbackidentitet → effekten kördes
  // om → `setOffset(0)` + ny sökning. Uppmätt: "Visa fler" hämtade sida två,
  // visade 40 träffar, och 300 ms senare stod listan tillbaka på 20. Med 211
  // träffar gick det inte att nå träff 21. Varje sökning kördes dessutom
  // dubbelt.
  const offsetRef = useRef(0)

  // Status state
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Löpnummer per sökning. `educationApi.search` tar ingen AbortSignal, så
  // den gamla AbortController-dansen avbröt ingenting — ett långsamt tidigare
  // svar kunde skriva över ett nyare. Numret gör att bara det senaste svaret
  // får röra tillståndet.
  const korningRef = useRef(0)

  // Create cache key for current search params
  const searchKey = useMemo(() => {
    return `${query}|${educationType}|${region}|${distanceOnly}`
  }, [query, educationType, region, distanceOnly])

  // Perform search
  const performSearch = useCallback(async (
    isLoadMore = false
  ) => {
    // Check minimum query length
    if (query.length > 0 && query.length < minQueryLength) {
      return
    }

    const korning = ++korningRef.current
    const currentOffset = isLoadMore ? offsetRef.current : 0

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

      // Ett äldre svar som kommer in efter ett nyare får inte skriva över det.
      if (korning !== korningRef.current) return

      // `source: 'error'` betyder att anropet FÖLL — inte att det saknas
      // utbildningar. Servicen kastar inte (den fångar och returnerar), så
      // utan den här grenen hade hookens catch aldrig nåtts och sidan hade
      // visat "Inga utbildningar hittades" vid varje avbrott. Samma mönster
      // som useSkillsGap redan använder.
      if (result.source === 'error') {
        setSource('error')
        setError('Vi kunde inte nå utbildningsregistret just nu.')
        if (!isLoadMore) {
          setResults([])
          setTotal(0)
          setHasMore(false)
        }
        setHasSearched(true)
        return
      }

      if (isLoadMore) {
        // Samma kurs kan komma tillbaka på nästa sida — lägg inte till den igen.
        setResults(prev => {
          const sedda = new Set(prev.map(e => e.id))
          return [...prev, ...result.educations.filter(e => !sedda.has(e.id))]
        })
      } else {
        setResults(result.educations)
      }

      setTotal(result.total)
      setHasMore(result.hasMore)
      setSource(result.source)
      // Går mot JobEds paginering, alltså mot antalet HÄMTADE poster — inte
      // mot de hopslagna som visas.
      offsetRef.current = currentOffset + initialLimit
      setHasSearched(true)
    } catch (err) {
      if (korning !== korningRef.current) return
      console.error('[useEducationSearch] Search error:', err)
      setError('Ett fel uppstod vid sökning. Försök igen.')
      setResults([])
      setTotal(0)
      setHasMore(false)
      setHasSearched(true)
    } finally {
      if (korning === korningRef.current) {
        setIsLoading(false)
        setIsSearching(false)
      }
    }
  }, [query, educationType, region, distanceOnly, minQueryLength, initialLimit])

  // Manual search trigger
  const search = useCallback(async () => {
    offsetRef.current = 0
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
    offsetRef.current = 0
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
      offsetRef.current = 0
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
      // Höjer löpnumret så att ett svar som kommer in efter avmontering
      // inte försöker sätta state.
      korningRef.current++
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
