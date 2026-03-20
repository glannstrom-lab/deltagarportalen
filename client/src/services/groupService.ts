/**
 * Group Service - Accountability Groups functionality
 */

import { supabase } from '@/lib/supabase'
import type {
  CommunityGroup,
  GroupMember,
  GroupMessage,
  GroupInvite,
  CreateGroupData
} from '@/types/community.types'

// ============================================
// GROUPS
// ============================================

export async function getMyGroups(): Promise<CommunityGroup[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('community_group_members')
    .select(`
      *,
      group:group_id (
        id, name, description, max_members, is_public, is_active,
        weekly_goal_type, weekly_goal_target, weekly_goal_description,
        member_count, weekly_progress, created_by, created_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching my groups:', error)
    return []
  }

  return (data || []).map(m => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    maxMembers: m.group.max_members,
    isPublic: m.group.is_public,
    isActive: m.group.is_active,
    weeklyGoalType: m.group.weekly_goal_type,
    weeklyGoalTarget: m.group.weekly_goal_target,
    weeklyGoalDescription: m.group.weekly_goal_description,
    memberCount: m.group.member_count,
    weeklyProgress: m.group.weekly_progress,
    createdBy: m.group.created_by,
    createdAt: m.group.created_at,
    myMembership: {
      id: m.id,
      groupId: m.group_id,
      userId: m.user_id,
      role: m.role,
      weeklyContribution: m.weekly_contribution,
      isActive: m.is_active,
      joinedAt: m.joined_at,
      lastActiveAt: m.last_active_at
    }
  }))
}

export async function getPublicGroups(limit = 20): Promise<CommunityGroup[]> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('community_groups')
    .select('*')
    .eq('is_public', true)
    .eq('is_active', true)
    .lt('member_count', supabase.sql`max_members`)
    .order('member_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching public groups:', error)
    return []
  }

  // Check which groups user is already in
  let myGroupIds: string[] = []
  if (user) {
    const { data: myMemberships } = await supabase
      .from('community_group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    myGroupIds = (myMemberships || []).map(m => m.group_id)
  }

  return (data || [])
    .filter(g => !myGroupIds.includes(g.id))
    .map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      maxMembers: g.max_members,
      isPublic: g.is_public,
      isActive: g.is_active,
      weeklyGoalType: g.weekly_goal_type,
      weeklyGoalTarget: g.weekly_goal_target,
      weeklyGoalDescription: g.weekly_goal_description,
      memberCount: g.member_count,
      weeklyProgress: g.weekly_progress,
      createdBy: g.created_by,
      createdAt: g.created_at
    }))
}

export async function getGroup(groupId: string): Promise<CommunityGroup | null> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('community_groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error || !data) {
    console.error('Error fetching group:', error)
    return null
  }

  // Get members
  const { data: members } = await supabase
    .from('community_group_members')
    .select(`
      *,
      user:user_id (id, first_name, last_name, avatar_url)
    `)
    .eq('group_id', groupId)
    .eq('is_active', true)

  // Get my membership
  let myMembership: GroupMember | undefined
  if (user) {
    const member = members?.find(m => m.user_id === user.id)
    if (member) {
      myMembership = {
        id: member.id,
        groupId: member.group_id,
        userId: member.user_id,
        role: member.role,
        weeklyContribution: member.weekly_contribution,
        isActive: member.is_active,
        joinedAt: member.joined_at,
        lastActiveAt: member.last_active_at
      }
    }
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    maxMembers: data.max_members,
    isPublic: data.is_public,
    isActive: data.is_active,
    weeklyGoalType: data.weekly_goal_type,
    weeklyGoalTarget: data.weekly_goal_target,
    weeklyGoalDescription: data.weekly_goal_description,
    memberCount: data.member_count,
    weeklyProgress: data.weekly_progress,
    createdBy: data.created_by,
    createdAt: data.created_at,
    members: (members || []).map(m => ({
      id: m.id,
      groupId: m.group_id,
      userId: m.user_id,
      role: m.role,
      weeklyContribution: m.weekly_contribution,
      isActive: m.is_active,
      joinedAt: m.joined_at,
      lastActiveAt: m.last_active_at,
      user: m.user ? {
        id: m.user.id,
        firstName: m.user.first_name || 'Anonym',
        lastName: m.user.last_name || '',
        avatarUrl: m.user.avatar_url
      } : undefined
    })),
    myMembership
  }
}

export async function createGroup(data: CreateGroupData): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: group, error } = await supabase
    .from('community_groups')
    .insert({
      name: data.name,
      description: data.description,
      max_members: data.maxMembers || 6,
      is_public: data.isPublic ?? true,
      weekly_goal_type: data.weeklyGoalType,
      weekly_goal_target: data.weeklyGoalTarget || 5,
      weekly_goal_description: data.weeklyGoalDescription,
      created_by: user.id,
      member_count: 1
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating group:', error)
    return null
  }

  // Add creator as leader
  await supabase
    .from('community_group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'leader'
    })

  return group.id
}

export async function joinGroup(groupId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('join_community_group', {
    p_group_id: groupId
  })

  if (error) {
    console.error('Error joining group:', error)
    return false
  }

  return data
}

export async function leaveGroup(groupId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('leave_community_group', {
    p_group_id: groupId
  })

  if (error) {
    console.error('Error leaving group:', error)
    return false
  }

  return data
}

// ============================================
// GROUP MESSAGES
// ============================================

export async function getGroupMessages(groupId: string, limit = 50): Promise<GroupMessage[]> {
  const { data, error } = await supabase
    .from('community_group_messages')
    .select(`
      *,
      user:user_id (id, first_name, last_name, avatar_url)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching group messages:', error)
    return []
  }

  return (data || []).reverse().map(m => ({
    id: m.id,
    groupId: m.group_id,
    userId: m.user_id,
    content: m.content,
    messageType: m.message_type,
    createdAt: m.created_at,
    user: m.user ? {
      id: m.user.id,
      firstName: m.user.first_name || 'Anonym',
      lastName: m.user.last_name || '',
      avatarUrl: m.user.avatar_url
    } : undefined
  }))
}

export async function sendGroupMessage(groupId: string, content: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('community_group_messages')
    .insert({
      group_id: groupId,
      user_id: user.id,
      content,
      message_type: 'text'
    })

  if (error) {
    console.error('Error sending message:', error)
    return false
  }

  // Update last active
  await supabase
    .from('community_group_members')
    .update({ last_active_at: new Date().toISOString() })
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  return true
}

// ============================================
// GROUP INVITES
// ============================================

export async function getMyInvites(): Promise<GroupInvite[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('community_group_invites')
    .select(`
      *,
      group:group_id (id, name, description, member_count, max_members),
      inviter:invited_by (id, first_name, last_name, avatar_url)
    `)
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invites:', error)
    return []
  }

  return (data || []).map(i => ({
    id: i.id,
    groupId: i.group_id,
    invitedBy: i.invited_by,
    invitedUserId: i.invited_user_id,
    status: i.status,
    createdAt: i.created_at,
    respondedAt: i.responded_at,
    group: i.group ? {
      id: i.group.id,
      name: i.group.name,
      description: i.group.description,
      memberCount: i.group.member_count,
      maxMembers: i.group.max_members
    } as CommunityGroup : undefined,
    inviter: i.inviter ? {
      id: i.inviter.id,
      firstName: i.inviter.first_name || 'Anonym',
      lastName: i.inviter.last_name || '',
      avatarUrl: i.inviter.avatar_url
    } : undefined
  }))
}

export async function respondToInvite(inviteId: string, accept: boolean): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Get invite
  const { data: invite } = await supabase
    .from('community_group_invites')
    .select('group_id')
    .eq('id', inviteId)
    .eq('invited_user_id', user.id)
    .single()

  if (!invite) return false

  // Update invite status
  await supabase
    .from('community_group_invites')
    .update({
      status: accept ? 'accepted' : 'declined',
      responded_at: new Date().toISOString()
    })
    .eq('id', inviteId)

  // If accepted, join the group
  if (accept) {
    await joinGroup(invite.group_id)
  }

  return true
}

// ============================================
// WEEKLY PROGRESS
// ============================================

export async function updateMyContribution(groupId: string, contribution: number): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('community_group_members')
    .update({
      weekly_contribution: contribution,
      last_active_at: new Date().toISOString()
    })
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating contribution:', error)
    return false
  }

  // Update group total
  const { data: members } = await supabase
    .from('community_group_members')
    .select('weekly_contribution')
    .eq('group_id', groupId)
    .eq('is_active', true)

  const total = (members || []).reduce((sum, m) => sum + (m.weekly_contribution || 0), 0)

  await supabase
    .from('community_groups')
    .update({ weekly_progress: total })
    .eq('id', groupId)

  return true
}
