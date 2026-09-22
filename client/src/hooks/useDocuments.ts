/**
 * useDocuments Hook
 * Fetches CV versions and cover letters for use in application tracking
 */

import { useQuery } from '@tanstack/react-query'
import { cvApi } from '@/services/cvApi'
import { coverLetterApi } from '@/services/coverLetterApi'
import { useAnvandarnyckel } from '@/hooks/useAnvandarnyckel'

export interface CVVersion {
  id: string
  name: string
  created_at: string
  data?: unknown
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
  // KA2: cachen bär vems data det är.
  const nyckel = useAnvandarnyckel()
  // Fetch CV versions
  const {
    data: cvVersions = [],
    isLoading: isLoadingCVs,
    error: cvError
  } = useQuery({
    queryKey: nyckel(['cv-versions']),
    queryFn: async () => {
      const versions = await cvApi.getVersions()
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
    queryKey: nyckel(['cover-letters']),
    queryFn: async () => {
      const letters = await coverLetterApi.getAll()
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

// useCVVersion och useCoverLetter RADERADE 2026-09-22 — noll anropare.
