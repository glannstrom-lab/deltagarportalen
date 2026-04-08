/**
 * Hook for managing spontaneous company applications
 * Handles CRUD operations and state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  spontaneousCompaniesApi,
  type SpontaneousCompany,
  type SpontaneousStatus,
  type CreateSpontaneousCompany,
  type UpdateSpontaneousCompany,
} from '@/services/supabaseApi'
import { getCompanyInfo, type BolagsverketCompany } from '@/services/bolagsverketApi'
import { showToast } from '@/components/Toast'

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
  removeCompany: (id: string) => Promise<boolean>
  refreshCompanies: () => Promise<void>

  // Lookup
  lookupCompany: (orgNumber: string) => Promise<BolagsverketCompany | null>
  isCompanySaved: (orgNumber: string) => boolean

  // Filters
  filterByStatus: (status: SpontaneousStatus | 'all') => SpontaneousCompany[]
}

export function useSpontaneousCompanies(): UseSpontaneousCompaniesResult {
  const [companies, setCompanies] = useState<SpontaneousCompany[]>([])
  const [stats, setStats] = useState<Record<SpontaneousStatus, number>>({
    saved: 0,
    to_contact: 0,
    contacted: 0,
    waiting: 0,
    response_positive: 0,
    response_negative: 0,
    no_response: 0,
    archived: 0,
  })
  const [upcomingFollowups, setUpcomingFollowups] = useState<SpontaneousCompany[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [companiesData, statsData, followupsData] = await Promise.all([
        spontaneousCompaniesApi.getAll(),
        spontaneousCompaniesApi.getStats(),
        spontaneousCompaniesApi.getUpcomingFollowups(),
      ])

      setCompanies(companiesData)
      setStats(statsData)
      setUpcomingFollowups(followupsData)
    } catch (err) {
      console.error('Error loading spontaneous companies:', err)
      setError('Kunde inte ladda företag')
      showToast.error('Kunde inte ladda företag')
    } finally {
      setIsLoading(false)
      setIsLoaded(true)
    }
  }, [])

  // Load on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Refresh companies
  const refreshCompanies = useCallback(async () => {
    await loadData()
  }, [loadData])

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
        showToast.error('Företaget hittades inte i Bolagsverkets register')
        return null
      }

      // Check if already saved
      if (isCompanySaved(orgNumber)) {
        showToast.warning('Företaget är redan sparat')
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

      // Update local state
      setCompanies(prev => [newCompany, ...prev])
      setStats(prev => ({ ...prev, [newCompany.status]: prev[newCompany.status] + 1 }))

      showToast.success(`${companyInfo.name} har sparats`)
      return newCompany
    } catch (err) {
      console.error('Error adding company:', err)
      showToast.error('Kunde inte spara företaget')
      return null
    }
  }, [lookupCompany, isCompanySaved])

  // Update company
  const updateCompany = useCallback(async (
    id: string,
    updates: UpdateSpontaneousCompany
  ): Promise<boolean> => {
    try {
      const updated = await spontaneousCompaniesApi.update(id, updates)

      setCompanies(prev =>
        prev.map(c => c.id === id ? updated : c)
      )

      showToast.success('Företaget har uppdaterats')
      return true
    } catch (err) {
      console.error('Error updating company:', err)
      showToast.error('Kunde inte uppdatera företaget')
      return false
    }
  }, [])

  // Update status
  const updateStatus = useCallback(async (
    id: string,
    status: SpontaneousStatus
  ): Promise<boolean> => {
    const company = companies.find(c => c.id === id)
    if (!company) return false

    const oldStatus = company.status

    try {
      await spontaneousCompaniesApi.updateStatus(id, status)

      // Update local state
      setCompanies(prev =>
        prev.map(c => c.id === id ? { ...c, status } : c)
      )
      setStats(prev => ({
        ...prev,
        [oldStatus]: Math.max(0, prev[oldStatus] - 1),
        [status]: prev[status] + 1,
      }))

      const statusLabels: Record<SpontaneousStatus, string> = {
        saved: 'Sparad',
        to_contact: 'Att kontakta',
        contacted: 'Kontaktad',
        waiting: 'Väntar svar',
        response_positive: 'Positivt svar',
        response_negative: 'Avslag',
        no_response: 'Inget svar',
        archived: 'Arkiverad',
      }

      showToast.success(`Status ändrad till "${statusLabels[status]}"`)
      return true
    } catch (err) {
      console.error('Error updating status:', err)
      showToast.error('Kunde inte uppdatera status')
      return false
    }
  }, [companies])

  // Remove company
  const removeCompany = useCallback(async (id: string): Promise<boolean> => {
    const company = companies.find(c => c.id === id)
    if (!company) return false

    try {
      await spontaneousCompaniesApi.delete(id)

      setCompanies(prev => prev.filter(c => c.id !== id))
      setStats(prev => ({
        ...prev,
        [company.status]: Math.max(0, prev[company.status] - 1),
      }))

      showToast.success('Företaget har tagits bort')
      return true
    } catch (err) {
      console.error('Error removing company:', err)
      showToast.error('Kunde inte ta bort företaget')
      return false
    }
  }, [companies])

  // Filter by status
  const filterByStatus = useCallback((status: SpontaneousStatus | 'all'): SpontaneousCompany[] => {
    if (status === 'all') return companies
    return companies.filter(c => c.status === status)
  }, [companies])

  return {
    companies,
    stats,
    upcomingFollowups,
    isLoading,
    isLoaded,
    error,
    addCompany,
    updateCompany,
    updateStatus,
    removeCompany,
    refreshCompanies,
    lookupCompany,
    isCompanySaved,
    filterByStatus,
  }
}

export default useSpontaneousCompanies
