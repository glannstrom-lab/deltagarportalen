/**
 * useDocuments Hook
 * Fetches CV versions and cover letters for use in application tracking
 */

import { useQuery } from '@tanstack/react-query'
import { supabaseApi } from '@/services/supabaseApi'

export interface CVVersion {
  id: string
  name: string
  created_at: string
  data?: any
}

export interface CoverLetter {
  id: string
  title?: string
  company_name?: string
  job_title?: string
  created_at: string
  content?: string
}

export function useDocuments() {
  // Fetch CV versions
  const {
    data: cvVersions = [],
    isLoading: isLoadingCVs,
    error: cvError
  } = useQuery({
    queryKey: ['cv-versions'],
    queryFn: async () => {
      const versions = await supabaseApi.cv.getVersions()
      return versions as CVVersion[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch cover letters
  const {
    data: coverLetters = [],
    isLoading: isLoadingLetters,
    error: letterError
  } = useQuery({
    queryKey: ['cover-letters'],
    queryFn: async () => {
      const letters = await supabaseApi.coverLetters.getAll()
      return letters as CoverLetter[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    cvVersions,
    coverLetters,
    isLoading: isLoadingCVs || isLoadingLetters,
    error: cvError || letterError
  }
}

export function useCVVersion(id: string | null | undefined) {
  return useQuery({
    queryKey: ['cv-version', id],
    queryFn: async () => {
      if (!id) return null
      const data = await supabaseApi.cv.restoreVersion(id)
      return data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCoverLetter(id: string | null | undefined) {
  return useQuery({
    queryKey: ['cover-letter', id],
    queryFn: async () => {
      if (!id) return null
      const data = await supabaseApi.coverLetters.getById(id)
      return data as CoverLetter | null
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}
