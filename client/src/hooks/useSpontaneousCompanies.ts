/**
 * Hook for managing spontaneous company applications
 * React Query-baserad: en delad cache mellan flikarna i stället för
 * tre parallella anrop per flikbyte. Stats och kommande uppföljningar
 * härleds ur företagslistan klientside.
 */

import { useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  spontaneousCompaniesApi,
  type SpontaneousCompany,
  type SpontaneousStatus,
  type CreateSpontaneousCompany,
  type UpdateSpontaneousCompany,
} from '@/services/supabaseApi'
import { getCompanyInfo, type BolagsverketCompany } from '@/services/bolagsverketApi'
import { showToast } from '@/components/Toast'

export const SPONTANEOUS_COMPANIES_KEY = ['spontaneous-companies'] as const

const EMPTY_STATS: Record<SpontaneousStatus, number> = {
  saved: 0,
  to_contact: 0,
  contacted: 0,
  waiting: 0,
  response_positive: 0,
  response_negative: 0,
  no_response: 0,
  archived: 0,
}

// Statusar som inte längre behöver uppföljning
const FOLLOWUP_DONE_STATUSES: SpontaneousStatus[] = ['archived', 'response_positive', 'response_negative']

interface UseSpontaneousCompaniesResult {
  // Data
  companies: SpontaneousCompany[]
  stats: Record<SpontaneousStatus, number>
  upcomingFollowups: SpontaneousCompany[]

  // State
  isLoading: boolean
  isLoaded: boolean
  error: string | null

  // Actions
  addCompany: (orgNumber: string, data?: Partial<CreateSpontaneousCompany>) => Promise<SpontaneousCompany | null>
  updateCompany: (id: string, updates: UpdateSpontaneousCompany) => Promise<boolean>
  updateStatus: (id: string, status: SpontaneousStatus) => Promise<boolean>
  updateStatusBulk: (ids: string[], status: SpontaneousStatus) => Promise<number>
  removeCompany: (id: string) => Promise<boolean>
  refreshCompanies: () => Promise<void>

  // Lookup
  lookupCompany: (orgNumber: string) => Promise<BolagsverketCompany | null>
  isCompanySaved: (orgNumber: string) => boolean

  // Filters
  filterByStatus: (status: SpontaneousStatus | 'all') => SpontaneousCompany[]
}

/** Bygg de fältuppdateringar ett statusbyte medför (datumstämplar) */
function buildStatusUpdates(company: SpontaneousCompany, status: SpontaneousStatus): UpdateSpontaneousCompany {
  const today = new Date().toISOString().split('T')[0]
  const updates: UpdateSpontaneousCompany = { status }
  if (status === 'contacted' && !company.outreach_date) {
    updates.outreach_date = today
  }
  if ((status === 'response_positive' || status === 'response_negative') && !company.response_date) {
    updates.response_date = today
  }
  return updates
}

export function useSpontaneousCompanies(): UseSpontaneousCompaniesResult {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SPONTANEOUS_COMPANIES_KEY,
    queryFn: () => spontaneousCompaniesApi.getAll(),
    staleTime: 60_000,
  })

  const companies = useMemo(() => query.data ?? [], [query.data])

  // Toast vid laddningsfel — en gång per felobjekt
  const toastedError = useRef<unknown>(null)
  useEffect(() => {
    if (query.error && toastedError.current !== query.error) {
      toastedError.current = query.error
      console.error('Error loading spontaneous companies:', query.error)
      showToast.error(t('spontaneous.toasts.loadError'))
    }
  }, [query.error, t])

  const stats = useMemo(() => {
    const s = { ...EMPTY_STATS }
    for (const c of companies) {
      s[c.status] = (s[c.status] ?? 0) + 1
    }
    return s
  }, [companies])

  const upcomingFollowups = useMemo(() => {
    const limit = new Date()
    limit.setDate(limit.getDate() + 30)
    const limitStr = limit.toISOString().split('T')[0]
    return companies
      .filter(c =>
        c.followup_date
        && c.followup_date <= limitStr
        && !FOLLOWUP_DONE_STATUSES.includes(c.status)
      )
      .sort((a, b) => (a.followup_date! < b.followup_date! ? -1 : 1))
  }, [companies])

  const setCompanies = useCallback((updater: (prev: SpontaneousCompany[]) => SpontaneousCompany[]) => {
    queryClient.setQueryData<SpontaneousCompany[]>(SPONTANEOUS_COMPANIES_KEY, (prev) => updater(prev ?? []))
  }, [queryClient])

  const refreshCompanies = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SPONTANEOUS_COMPANIES_KEY })
  }, [queryClient])

  // Lookup company from Bolagsverket
  const lookupCompany = useCallback(async (orgNumber: string): Promise<BolagsverketCompany | null> => {
    try {
      const company = await getCompanyInfo(orgNumber)
      return company
    } catch (err) {
      console.error('Error looking up company:', err)
      throw err
    }
  }, [])

  // Check if company is already saved
  const isCompanySaved = useCallback((orgNumber: string): boolean => {
    const normalized = orgNumber.replace(/[-\s]/g, '')
    return companies.some(c => c.org_number === normalized)
  }, [companies])

  // Add company
  const addCompany = useCallback(async (
    orgNumber: string,
    data?: Partial<CreateSpontaneousCompany>
  ): Promise<SpontaneousCompany | null> => {
    try {
      // First, lookup company info from Bolagsverket
      const companyInfo = await lookupCompany(orgNumber)

      if (!companyInfo) {
        showToast.error(t('spontaneous.search.notFound'))
        return null
      }

      // Check if already saved
      if (isCompanySaved(orgNumber)) {
        showToast.warning(t('spontaneous.toasts.alreadySaved'))
        return null
      }

      // Create the company
      const newCompany = await spontaneousCompaniesApi.create({
        org_number: companyInfo.orgNumber,
        company_name: companyInfo.name,
        company_data: {
          legalForm: companyInfo.legalForm,
          address: companyInfo.address,
          sniCodes: companyInfo.sniCodes,
          businessDescription: companyInfo.businessDescription,
          registrationDate: companyInfo.registrationDate,
        },
        ...data,
      })

      setCompanies(prev => [newCompany, ...prev])

      showToast.success(t('spontaneous.toasts.saved', { name: companyInfo.name }))
      return newCompany
    } catch (err) {
      console.error('Error adding company:', err)
      showToast.error(t('spontaneous.toasts.saveError'))
      return null
    }
  }, [lookupCompany, isCompanySaved, setCompanies, t])

  // Update company
  const updateCompany = useCallback(async (
    id: string,
    updates: UpdateSpontaneousCompany
  ): Promise<boolean> => {
    try {
      const updated = await spontaneousCompaniesApi.update(id, updates)

      setCompanies(prev => prev.map(c => c.id === id ? updated : c))

      showToast.success(t('spontaneous.toasts.updated'))
      return true
    } catch (err) {
      console.error('Error updating company:', err)
      showToast.error(t('spontaneous.toasts.updateError'))
      return false
    }
  }, [setCompanies, t])

  // Update status
  const updateStatus = useCallback(async (
    id: string,
    status: SpontaneousStatus
  ): Promise<boolean> => {
    const company = companies.find(c => c.id === id)
    if (!company) return false

    try {
      const updated = await spontaneousCompaniesApi.update(id, buildStatusUpdates(company, status))

      setCompanies(prev => prev.map(c => c.id === id ? updated : c))

      showToast.success(t('spontaneous.toasts.statusChanged', { status: t(`spontaneous.status.${status}`) }))
      return true
    } catch (err) {
      console.error('Error updating status:', err)
      showToast.error(t('spontaneous.toasts.statusError'))
      return false
    }
  }, [companies, setCompanies, t])

  // Update status for several companies at once — en toast, inte en per företag
  const updateStatusBulk = useCallback(async (
    ids: string[],
    status: SpontaneousStatus
  ): Promise<number> => {
    const targets = companies.filter(c => ids.includes(c.id))
    if (targets.length === 0) return 0

    const results = await Promise.allSettled(
      targets.map(c => spontaneousCompaniesApi.update(c.id, buildStatusUpdates(c, status)))
    )

    const updated = results
      .filter((r): r is PromiseFulfilledResult<SpontaneousCompany> => r.status === 'fulfilled')
      .map(r => r.value)

    if (updated.length > 0) {
      const byId = new Map(updated.map(c => [c.id, c]))
      setCompanies(prev => prev.map(c => byId.get(c.id) ?? c))
      showToast.success(t('spontaneous.toasts.statusChangedBulk', {
        count: updated.length,
        status: t(`spontaneous.status.${status}`),
      }))
    }

    if (updated.length < targets.length) {
      showToast.error(t('spontaneous.toasts.statusError'))
    }

    return updated.length
  }, [companies, setCompanies, t])

  // Remove company
  const removeCompany = useCallback(async (id: string): Promise<boolean> => {
    try {
      await spontaneousCompaniesApi.delete(id)

      setCompanies(prev => prev.filter(c => c.id !== id))

      showToast.success(t('spontaneous.toasts.removed'))
      return true
    } catch (err) {
      console.error('Error removing company:', err)
      showToast.error(t('spontaneous.toasts.removeError'))
      return false
    }
  }, [setCompanies, t])

  // Filter by status
  const filterByStatus = useCallback((status: SpontaneousStatus | 'all'): SpontaneousCompany[] => {
    if (status === 'all') return companies
    return companies.filter(c => c.status === status)
  }, [companies])

  return {
    companies,
    stats,
    upcomingFollowups,
    isLoading: query.isLoading,
    isLoaded: query.isFetched,
    error: query.error ? t('spontaneous.toasts.loadError') : null,
    addCompany,
    updateCompany,
    updateStatus,
    updateStatusBulk,
    removeCompany,
    refreshCompanies,
    lookupCompany,
    isCompanySaved,
    filterByStatus,
  }
}

export default useSpontaneousCompanies
