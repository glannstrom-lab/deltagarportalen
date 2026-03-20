/**
 * Buddy Service - Buddy Matching functionality
 */

import { supabase } from '@/lib/supabase'
import type {
  BuddyPreferences,
  BuddyMatch,
  BuddyPair,
  BuddyCheckin,
  UpdateBuddyPreferencesData,
  CheckinType
} from '@/types/community.types'

// ============================================
// PREFERENCES
// ============================================

export async function getMyPreferences(): Promise<BuddyPreferences | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('community_buddy_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching buddy preferences:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    userId: data.user_id,
    lookingForBuddy: data.looking_for_buddy,
    wantsInterviewPractice: data.wants_interview_practice,
    wantsCvFeedback: data.wants_cv_feedback,
    wantsMotivationSupport: data.wants_motivation_support,
    wantsAccountability: data.wants_accountability,
    canHelpInterview: data.can_help_interview,
    canHelpCv: data.can_help_cv,
    canHelpMotivation: data.can_help_motivation,
    canHelpAccountability: data.can_help_accountability,
    preferredContact: data.preferred_contact,
    timezone: data.timezone,
    bio: data.bio,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

export async function updatePreferences(data: UpdateBuddyPreferencesData): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const updateData = {
    looking_for_buddy: data.lookingForBuddy,
    wants_interview_practice: data.wantsInterviewPractice,
    wants_cv_feedback: data.wantsCvFeedback,
    wants_motivation_support: data.wantsMotivationSupport,
    wants_accountability: data.wantsAccountability,
    can_help_interview: data.canHelpInterview,
    can_help_cv: data.canHelpCv,
    can_help_motivation: data.canHelpMotivation,
    can_help_accountability: data.canHelpAccountability,
    preferred_contact: data.preferredContact,
    bio: data.bio,
    updated_at: new Date().toISOString()
  }

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if ((updateData as Record<string, unknown>)[key] === undefined) {
      delete (updateData as Record<string, unknown>)[key]
    }
  })

  const { error } = await supabase
    .from('community_buddy_preferences')
    .upsert({
      user_id: user.id,
      ...updateData
    }, {
      onConflict: 'user_id'
    })

  if (error) {
    console.error('Error updating preferences:', error)
    return false
  }

  return true
}

// ============================================
// MATCHING
// ============================================

export async function findMatches(): Promise<BuddyMatch[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase.rpc('find_buddy_matches', {
    p_user_id: user.id,
    p_limit: 10
  })

  if (error) {
    console.error('Error finding matches:', error)
    return []
  }

  // Get avatars
  const userIds = (data || []).map((m: { user_id: string }) => m.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .in('id', userIds)

  const avatarMap = new Map((profiles || []).map(p => [p.id, p.avatar_url]))

  return (data || []).map((m: { user_id: string; match_score: number; first_name: string; last_name: string; bio?: string }) => ({
    userId: m.user_id,
    matchScore: m.match_score,
    firstName: m.first_name,
    lastName: m.last_name,
    bio: m.bio,
    avatarUrl: avatarMap.get(m.user_id)
  }))
}

export async function sendBuddyRequest(toUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Create buddy pair with pending status
  const { error } = await supabase
    .from('community_buddies')
    .insert({
      user1_id: user.id,
      user2_id: toUserId,
      status: 'pending'
    })

  if (error) {
    console.error('Error sending buddy request:', error)
    return false
  }

  return true
}

// ============================================
// BUDDY PAIRS
// ============================================

export async function getMyBuddies(): Promise<BuddyPair[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('community_buddies')
    .select('*')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .in('status', ['pending', 'active'])

  if (error) {
    console.error('Error fetching buddies:', error)
    return []
  }

  // Get buddy profiles
  const buddyIds = (data || []).map(b =>
    b.user1_id === user.id ? b.user2_id : b.user1_id
  )

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .in('id', buddyIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  return (data || []).map(b => {
    const buddyId = b.user1_id === user.id ? b.user2_id : b.user1_id
    const profile = profileMap.get(buddyId)

    return {
      id: b.id,
      user1Id: b.user1_id,
      user2Id: b.user2_id,
      status: b.status,
      checkInCount: b.check_in_count,
      lastCheckIn: b.last_check_in,
      matchScore: b.match_score,
      matchedAt: b.matched_at,
      createdAt: b.created_at,
      buddy: profile ? {
        id: profile.id,
        firstName: profile.first_name || 'Anonym',
        lastName: profile.last_name || '',
        avatarUrl: profile.avatar_url
      } : undefined
    }
  })
}

export async function respondToBuddyRequest(pairId: string, accept: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('community_buddies')
    .update({
      status: accept ? 'active' : 'ended',
      matched_at: accept ? new Date().toISOString() : null
    })
    .eq('id', pairId)

  if (error) {
    console.error('Error responding to buddy request:', error)
    return false
  }

  return true
}

export async function endBuddyPair(pairId: string): Promise<boolean> {
  const { error } = await supabase
    .from('community_buddies')
    .update({ status: 'ended' })
    .eq('id', pairId)

  if (error) {
    console.error('Error ending buddy pair:', error)
    return false
  }

  return true
}

// ============================================
// CHECK-INS
// ============================================

export async function getCheckins(pairId: string): Promise<BuddyCheckin[]> {
  const { data, error } = await supabase
    .from('community_buddy_checkins')
    .select('*')
    .eq('buddy_pair_id', pairId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching checkins:', error)
    return []
  }

  return (data || []).map(c => ({
    id: c.id,
    buddyPairId: c.buddy_pair_id,
    initiatedBy: c.initiated_by,
    checkinType: c.checkin_type as CheckinType,
    notes: c.notes,
    rating: c.rating,
    createdAt: c.created_at
  }))
}

export async function createCheckin(
  pairId: string,
  checkinType: CheckinType,
  notes?: string,
  rating?: number
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('community_buddy_checkins')
    .insert({
      buddy_pair_id: pairId,
      initiated_by: user.id,
      checkin_type: checkinType,
      notes,
      rating
    })

  if (error) {
    console.error('Error creating checkin:', error)
    return false
  }

  // Update pair stats
  await supabase
    .from('community_buddies')
    .update({
      check_in_count: supabase.sql`check_in_count + 1`,
      last_check_in: new Date().toISOString()
    })
    .eq('id', pairId)

  return true
}
