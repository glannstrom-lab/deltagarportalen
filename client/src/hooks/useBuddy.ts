/**
 * useBuddy - Hook for buddy matching
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getMyPreferences,
  updatePreferences,
  findMatches,
  sendBuddyRequest,
  getMyBuddies,
  respondToBuddyRequest,
  endBuddyPair,
  getCheckins,
  createCheckin
} from '@/services/buddyService'
import type {
  BuddyPreferences,
  BuddyMatch,
  BuddyPair,
  BuddyCheckin,
  UpdateBuddyPreferencesData,
  CheckinType
} from '@/types/community.types'

export function useBuddy() {
  const [preferences, setPreferences] = useState<BuddyPreferences | null>(null)
  const [matches, setMatches] = useState<BuddyMatch[]>([])
  const [buddies, setBuddies] = useState<BuddyPair[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [prefs, buddyList] = await Promise.all([
        getMyPreferences(),
        getMyBuddies()
      ])

      setPreferences(prefs)
      setBuddies(buddyList)

      // Only fetch matches if looking for buddy
      if (prefs?.lookingForBuddy) {
        const matchList = await findMatches()
        setMatches(matchList)
      } else {
        setMatches([])
      }
    } catch {
      setError('Kunde inte ladda buddy-data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const savePreferences = useCallback(async (data: UpdateBuddyPreferencesData) => {
    const success = await updatePreferences(data)
    if (success) {
      await loadData()
    }
    return success
  }, [loadData])

  const requestBuddy = useCallback(async (userId: string) => {
    const success = await sendBuddyRequest(userId)
    if (success) {
      await loadData()
    }
    return success
  }, [loadData])

  const respondToRequest = useCallback(async (pairId: string, accept: boolean) => {
    const success = await respondToBuddyRequest(pairId, accept)
    if (success) {
      await loadData()
    }
    return success
  }, [loadData])

  const endPair = useCallback(async (pairId: string) => {
    const success = await endBuddyPair(pairId)
    if (success) {
      await loadData()
    }
    return success
  }, [loadData])

  // Get pending requests (where I am user2 and status is pending)
  const pendingRequests = buddies.filter(b => b.status === 'pending')

  // Get active buddies
  const activeBuddies = buddies.filter(b => b.status === 'active')

  return {
    preferences,
    matches,
    buddies,
    pendingRequests,
    activeBuddies,
    isLoading,
    error,
    refresh: loadData,
    savePreferences,
    requestBuddy,
    respondToRequest,
    endPair
  }
}

export function useBuddyCheckins(pairId: string) {
  const [checkins, setCheckins] = useState<BuddyCheckin[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!pairId) return

    setIsLoading(true)
    const data = await getCheckins(pairId)
    setCheckins(data)
    setIsLoading(false)
  }, [pairId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addCheckin = useCallback(async (
    type: CheckinType,
    notes?: string,
    rating?: number
  ) => {
    const success = await createCheckin(pairId, type, notes, rating)
    if (success) {
      await loadData()
    }
    return success
  }, [pairId, loadData])

  return {
    checkins,
    isLoading,
    refresh: loadData,
    addCheckin
  }
}
