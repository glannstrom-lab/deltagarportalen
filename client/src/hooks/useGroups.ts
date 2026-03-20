/**
 * useGroups - Hook for accountability groups
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getMyGroups,
  getPublicGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  getGroupMessages,
  sendGroupMessage,
  getMyInvites,
  respondToInvite,
  updateMyContribution
} from '@/services/groupService'
import type {
  CommunityGroup,
  GroupMessage,
  GroupInvite,
  CreateGroupData
} from '@/types/community.types'

export function useGroups() {
  const [myGroups, setMyGroups] = useState<CommunityGroup[]>([])
  const [publicGroups, setPublicGroups] = useState<CommunityGroup[]>([])
  const [invites, setInvites] = useState<GroupInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [mine, available, myInvites] = await Promise.all([
        getMyGroups(),
        getPublicGroups(),
        getMyInvites()
      ])

      setMyGroups(mine)
      setPublicGroups(available)
      setInvites(myInvites)
    } catch {
      setError('Kunde inte ladda grupper')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const create = useCallback(async (data: CreateGroupData) => {
    const groupId = await createGroup(data)
    if (groupId) {
      await loadData()
    }
    return groupId
  }, [loadData])

  const join = useCallback(async (groupId: string) => {
    const success = await joinGroup(groupId)
    if (success) {
      await loadData()
    }
    return success
  }, [loadData])

  const leave = useCallback(async (groupId: string) => {
    const success = await leaveGroup(groupId)
    if (success) {
      await loadData()
    }
    return success
  }, [loadData])

  const respondInvite = useCallback(async (inviteId: string, accept: boolean) => {
    const success = await respondToInvite(inviteId, accept)
    if (success) {
      await loadData()
    }
    return success
  }, [loadData])

  return {
    myGroups,
    publicGroups,
    invites,
    isLoading,
    error,
    refresh: loadData,
    create,
    join,
    leave,
    respondInvite
  }
}

export function useGroupChat(groupId: string) {
  const [group, setGroup] = useState<CommunityGroup | null>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const loadData = useCallback(async () => {
    if (!groupId) return

    setIsLoading(true)
    setError(null)

    try {
      const [groupData, msgs] = await Promise.all([
        getGroup(groupId),
        getGroupMessages(groupId)
      ])

      setGroup(groupData)
      setMessages(msgs)
    } catch {
      setError('Kunde inte ladda gruppen')
    } finally {
      setIsLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    loadData()

    // Subscribe to new messages
    subscriptionRef.current = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async () => {
          // Reload messages when new one arrives
          const msgs = await getGroupMessages(groupId)
          setMessages(msgs)
        }
      )
      .subscribe()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [groupId, loadData])

  const send = useCallback(async (content: string) => {
    const success = await sendGroupMessage(groupId, content)
    if (success) {
      // Message will appear via subscription
    }
    return success
  }, [groupId])

  const updateContribution = useCallback(async (contribution: number) => {
    return updateMyContribution(groupId, contribution)
  }, [groupId])

  return {
    group,
    messages,
    isLoading,
    error,
    refresh: loadData,
    send,
    updateContribution
  }
}
