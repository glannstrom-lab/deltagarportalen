/**
 * Community Service - Stötta & Fira
 * Handles community feed and encouragement features
 */

import { supabase } from '@/lib/supabase'
import type {
  FeedItem,
  Cheer,
  SendCheerData,
  ActivityType,
  ReactionSummary
} from '@/types/community.types'

// Database types
interface FeedItemDB {
  id: string
  user_id: string
  activity_type: ActivityType
  title: string
  description: string | null
  metadata: Record<string, unknown>
  is_public: boolean
  cheer_count: number
  created_at: string
}

interface CheerDB {
  id: string
  from_user_id: string
  to_user_id: string | null
  feed_item_id: string | null
  cheer_type: string
  message: string | null
  emoji: string | null
  is_anonymous: boolean
  created_at: string
}

interface ProfileDB {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

/**
 * Get the community feed with recent activities
 */
export async function getCommunityFeed(limit = 20, offset = 0): Promise<FeedItem[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch public feed items with user profiles
  const { data: feedItems, error } = await supabase
    .from('community_feed')
    .select(`
      *,
      profiles:user_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching community feed:', error)
    return []
  }

  if (!feedItems) return []

  // Get my reactions for these items
  const feedIds = feedItems.map(item => item.id)
  const { data: myReactions } = await supabase
    .from('community_cheers')
    .select('feed_item_id, emoji')
    .eq('from_user_id', user.id)
    .in('feed_item_id', feedIds)

  // Get reaction counts per item
  const { data: allReactions } = await supabase
    .from('community_cheers')
    .select('feed_item_id, emoji, from_user_id')
    .in('feed_item_id', feedIds)
    .eq('cheer_type', 'reaction')

  // Build reaction summaries
  const reactionsByItem = new Map<string, Map<string, { count: number; users: string[] }>>()

  allReactions?.forEach(reaction => {
    if (!reaction.feed_item_id || !reaction.emoji) return

    if (!reactionsByItem.has(reaction.feed_item_id)) {
      reactionsByItem.set(reaction.feed_item_id, new Map())
    }

    const itemReactions = reactionsByItem.get(reaction.feed_item_id)!
    if (!itemReactions.has(reaction.emoji)) {
      itemReactions.set(reaction.emoji, { count: 0, users: [] })
    }

    const emojiData = itemReactions.get(reaction.emoji)!
    emojiData.count++
    emojiData.users.push(reaction.from_user_id)
  })

  // Transform to FeedItem[]
  return feedItems.map(item => {
    const profile = item.profiles as ProfileDB | null
    const itemReactions = reactionsByItem.get(item.id)

    const reactions: ReactionSummary[] = []
    if (itemReactions) {
      itemReactions.forEach((data, emoji) => {
        reactions.push({
          emoji,
          count: data.count,
          hasReacted: data.users.includes(user.id)
        })
      })
    }

    // Sort reactions by count
    reactions.sort((a, b) => b.count - a.count)

    return {
      id: item.id,
      userId: item.user_id,
      activityType: item.activity_type,
      title: item.title,
      description: item.description || undefined,
      metadata: item.metadata,
      isPublic: item.is_public,
      cheerCount: item.cheer_count,
      createdAt: item.created_at,
      user: profile ? {
        firstName: profile.first_name || 'Anonym',
        lastName: profile.last_name || '',
        avatarUrl: profile.avatar_url || undefined
      } : undefined,
      myReactions: myReactions
        ?.filter(r => r.feed_item_id === item.id)
        .map(r => r.emoji)
        .filter((e): e is string => e !== null) || [],
      reactions
    }
  })
}

/**
 * Post an activity to the community feed
 */
export async function postToFeed(
  activityType: ActivityType,
  title: string,
  description?: string,
  metadata: Record<string, unknown> = {},
  isPublic = true
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.rpc('post_to_community_feed', {
    p_user_id: user.id,
    p_activity_type: activityType,
    p_title: title,
    p_description: description || null,
    p_metadata: metadata,
    p_is_public: isPublic
  })

  if (error) {
    console.error('Error posting to feed:', error)
    return null
  }

  return data
}

/**
 * React to a feed item with an emoji
 */
export async function reactToFeedItem(feedItemId: string, emoji: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase.rpc('react_to_feed_item', {
    p_user_id: user.id,
    p_feed_item_id: feedItemId,
    p_emoji: emoji
  })

  if (error) {
    console.error('Error reacting to feed item:', error)
    return false
  }

  return true
}

/**
 * Remove a reaction from a feed item
 */
export async function removeReaction(feedItemId: string, emoji: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase.rpc('remove_reaction', {
    p_user_id: user.id,
    p_feed_item_id: feedItemId,
    p_emoji: emoji
  })

  if (error) {
    console.error('Error removing reaction:', error)
    return false
  }

  return true
}

/**
 * Send encouragement to another user
 */
export async function sendCheer(data: SendCheerData): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('community_cheers')
    .insert({
      from_user_id: user.id,
      to_user_id: data.toUserId || null,
      feed_item_id: data.feedItemId || null,
      cheer_type: data.cheerType,
      message: data.message || null,
      emoji: data.emoji || null,
      is_anonymous: data.isAnonymous || false
    })

  if (error) {
    console.error('Error sending cheer:', error)
    return false
  }

  return true
}

/**
 * Get cheers received by current user
 */
export async function getReceivedCheers(limit = 10): Promise<Cheer[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('community_cheers')
    .select(`
      *,
      from_user:from_user_id (
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('to_user_id', user.id)
    .neq('cheer_type', 'reaction')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching received cheers:', error)
    return []
  }

  return (data || []).map(cheer => ({
    id: cheer.id,
    fromUserId: cheer.from_user_id,
    toUserId: cheer.to_user_id,
    feedItemId: cheer.feed_item_id,
    cheerType: cheer.cheer_type as Cheer['cheerType'],
    message: cheer.message || undefined,
    emoji: cheer.emoji || undefined,
    isAnonymous: cheer.is_anonymous,
    createdAt: cheer.created_at,
    fromUser: cheer.is_anonymous ? undefined : (cheer.from_user ? {
      firstName: (cheer.from_user as ProfileDB).first_name || 'Anonym',
      lastName: (cheer.from_user as ProfileDB).last_name || '',
      avatarUrl: (cheer.from_user as ProfileDB).avatar_url || undefined
    } : undefined)
  }))
}

/**
 * Get users who can receive cheers (for the send cheer form)
 */
export async function getCheerableUsers(): Promise<Array<{ id: string; name: string; avatarUrl?: string }>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get users who have been active recently (have feed items)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .neq('id', user.id)
    .limit(50)

  if (error) {
    console.error('Error fetching cheerable users:', error)
    return []
  }

  return (data || []).map(profile => ({
    id: profile.id,
    name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Anonym',
    avatarUrl: profile.avatar_url || undefined
  }))
}

/**
 * Get community stats
 */
export async function getCommunityStats(): Promise<{
  totalMembers: number
  activeToday: number
  cheersToday: number
  applicationsThisWeek: number
}> {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get total members
  const { count: totalMembers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get active today (users with feed items today)
  const { count: activeToday } = await supabase
    .from('community_feed')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', today)

  // Get cheers today
  const { count: cheersToday } = await supabase
    .from('community_cheers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)

  // Get applications this week
  const { count: applicationsThisWeek } = await supabase
    .from('community_feed')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'application_sent')
    .gte('created_at', weekAgo)

  return {
    totalMembers: totalMembers || 0,
    activeToday: activeToday || 0,
    cheersToday: cheersToday || 0,
    applicationsThisWeek: applicationsThisWeek || 0
  }
}
