/**
 * useCommunity - Hook for community features
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getCommunityFeed,
  postToFeed,
  reactToFeedItem,
  removeReaction,
  sendCheer,
  getReceivedCheers,
  getCommunityStats
} from '@/services/communityService'
import type { FeedItem, Cheer, SendCheerData, ActivityType } from '@/types/community.types'

interface CommunityState {
  feed: FeedItem[]
  receivedCheers: Cheer[]
  stats: {
    totalMembers: number
    activeToday: number
    cheersToday: number
    applicationsThisWeek: number
  } | null
  isLoading: boolean
  error: string | null
}

export function useCommunity() {
  const [state, setState] = useState<CommunityState>({
    feed: [],
    receivedCheers: [],
    stats: null,
    isLoading: true,
    error: null
  })

  // Load initial data
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const [feed, cheers, stats] = await Promise.all([
        getCommunityFeed(20),
        getReceivedCheers(10),
        getCommunityStats()
      ])

      setState({
        feed,
        receivedCheers: cheers,
        stats,
        isLoading: false,
        error: null
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Kunde inte ladda community-data'
      }))
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Post to feed
  const post = useCallback(async (
    activityType: ActivityType,
    title: string,
    description?: string,
    metadata?: Record<string, unknown>
  ) => {
    const feedId = await postToFeed(activityType, title, description, metadata)
    if (feedId) {
      // Reload feed to get the new item
      const feed = await getCommunityFeed(20)
      setState(prev => ({ ...prev, feed }))
    }
    return feedId !== null
  }, [])

  // React to a feed item
  const react = useCallback(async (feedItemId: string, emoji: string) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      feed: prev.feed.map(item => {
        if (item.id !== feedItemId) return item

        const hasReacted = item.myReactions?.includes(emoji)

        if (hasReacted) {
          // Remove reaction
          return {
            ...item,
            myReactions: item.myReactions?.filter(e => e !== emoji) || [],
            reactions: item.reactions?.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, hasReacted: false }
                : r
            ).filter(r => r.count > 0) || [],
            cheerCount: item.cheerCount - 1
          }
        } else {
          // Add reaction
          const existingReaction = item.reactions?.find(r => r.emoji === emoji)
          return {
            ...item,
            myReactions: [...(item.myReactions || []), emoji],
            reactions: existingReaction
              ? item.reactions?.map(r =>
                  r.emoji === emoji
                    ? { ...r, count: r.count + 1, hasReacted: true }
                    : r
                ) || []
              : [...(item.reactions || []), { emoji, count: 1, hasReacted: true }],
            cheerCount: item.cheerCount + 1
          }
        }
      })
    }))

    // Actually perform the action
    const item = state.feed.find(i => i.id === feedItemId)
    const hasReacted = item?.myReactions?.includes(emoji)

    if (hasReacted) {
      await removeReaction(feedItemId, emoji)
    } else {
      await reactToFeedItem(feedItemId, emoji)
    }
  }, [state.feed])

  // Send a cheer
  const cheer = useCallback(async (data: SendCheerData) => {
    const success = await sendCheer(data)
    if (success) {
      // Update stats
      const stats = await getCommunityStats()
      setState(prev => ({ ...prev, stats }))
    }
    return success
  }, [])

  // Refresh data
  const refresh = useCallback(() => {
    loadData()
  }, [loadData])

  return {
    feed: state.feed,
    receivedCheers: state.receivedCheers,
    stats: state.stats,
    isLoading: state.isLoading,
    error: state.error,
    post,
    react,
    cheer,
    refresh
  }
}

export default useCommunity
