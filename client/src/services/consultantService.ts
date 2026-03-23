/**
 * Consultant Service
 * API methods for consultant functionality: messages, meetings, goals, analytics
 */

import { supabase } from '@/lib/supabase'

// Types
export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  consultant_id: string
  participant_id: string
  scheduled_at: string
  duration_minutes: number
  meeting_type: 'video' | 'phone' | 'physical'
  meeting_link?: string
  location?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface ConsultantGoal {
  id: string
  participant_id: string
  consultant_id: string
  title: string
  description: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  time_bound: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  progress: number
  deadline: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  owner_id: string
  shared_with: string[]
  filename: string
  file_path: string
  file_type: string
  version: number
  created_at: string
  updated_at: string
}

export interface Placement {
  id: string
  participant_id: string
  consultant_id: string
  employer_name: string
  job_title?: string
  start_date?: string
  salary_range?: string
  placement_type: 'permanent' | 'temp' | 'trial'
  followup_3m: boolean
  followup_6m: boolean
  created_at: string
}

export interface JournalEntry {
  id: string
  consultant_id: string
  participant_id: string
  content: string
  category: 'GENERAL' | 'PROGRESS' | 'CONCERN' | 'GOAL'
  created_at: string
}

export interface AnalyticsData {
  totalParticipants: number
  activeParticipants: number
  completedParticipants: number
  cvCompletionRate: number
  averageAtsScore: number
  goalsCompletedThisMonth: number
  placementsThisMonth: number
}

class ConsultantService {
  // ==================== MESSAGES ====================

  /**
   * Get all messages for the current consultant
   */
  async getMessages(): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get messages with a specific participant
   */
  async getMessagesWithParticipant(participantId: string): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Send a message to a participant
   */
  async sendMessage(receiverId: string, content: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Send a message to multiple participants (bulk)
   */
  async sendBulkMessage(receiverIds: string[], content: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const messages = receiverIds.map(receiverId => ({
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      is_read: false,
    }))

    const { error } = await supabase
      .from('consultant_messages')
      .insert(messages)

    if (error) throw error
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('consultant_messages')
      .update({ is_read: true })
      .eq('id', messageId)

    if (error) throw error
  }

  // ==================== MEETINGS ====================

  /**
   * Get all meetings for the current consultant
   */
  async getMeetings(): Promise<Meeting[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_meetings')
      .select('*')
      .eq('consultant_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Get upcoming meetings
   */
  async getUpcomingMeetings(): Promise<Meeting[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_meetings')
      .select('*')
      .eq('consultant_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Create a new meeting
   */
  async createMeeting(meeting: Omit<Meeting, 'id' | 'consultant_id' | 'created_at' | 'updated_at'>): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_meetings')
      .insert({
        ...meeting,
        consultant_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update a meeting
   */
  async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting> {
    const { data, error } = await supabase
      .from('consultant_meetings')
      .update(updates)
      .eq('id', meetingId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Cancel a meeting
   */
  async cancelMeeting(meetingId: string): Promise<void> {
    const { error } = await supabase
      .from('consultant_meetings')
      .update({ status: 'cancelled' })
      .eq('id', meetingId)

    if (error) throw error
  }

  // ==================== GOALS ====================

  /**
   * Get all goals for a participant
   */
  async getGoalsForParticipant(participantId: string): Promise<ConsultantGoal[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_goals')
      .select('*')
      .eq('consultant_id', user.id)
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Create a new goal for a participant
   */
  async createGoal(goal: Omit<ConsultantGoal, 'id' | 'consultant_id' | 'created_at' | 'updated_at'>): Promise<ConsultantGoal> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_goals')
      .insert({
        ...goal,
        consultant_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update a goal
   */
  async updateGoal(goalId: string, updates: Partial<ConsultantGoal>): Promise<ConsultantGoal> {
    const { data, error } = await supabase
      .from('consultant_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Complete a goal
   */
  async completeGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('consultant_goals')
      .update({
        status: 'COMPLETED',
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', goalId)

    if (error) throw error
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('consultant_goals')
      .delete()
      .eq('id', goalId)

    if (error) throw error
  }

  // ==================== JOURNAL ====================

  /**
   * Get journal entries for a participant
   */
  async getJournalEntries(participantId: string): Promise<JournalEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_journal')
      .select('*')
      .eq('consultant_id', user.id)
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Add a journal entry
   */
  async addJournalEntry(
    participantId: string,
    content: string,
    category: JournalEntry['category'] = 'GENERAL'
  ): Promise<JournalEntry> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_journal')
      .insert({
        consultant_id: user.id,
        participant_id: participantId,
        content,
        category,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('consultant_journal')
      .delete()
      .eq('id', entryId)

    if (error) throw error
  }

  // ==================== PLACEMENTS ====================

  /**
   * Record a placement
   */
  async recordPlacement(placement: Omit<Placement, 'id' | 'consultant_id' | 'created_at'>): Promise<Placement> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('consultant_placements')
      .insert({
        ...placement,
        consultant_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update placement follow-up status
   */
  async updatePlacementFollowup(
    placementId: string,
    field: 'followup_3m' | 'followup_6m',
    value: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('consultant_placements')
      .update({ [field]: value })
      .eq('id', placementId)

    if (error) throw error
  }

  // ==================== ANALYTICS ====================

  /**
   * Get analytics data for the current consultant
   */
  async getAnalytics(): Promise<AnalyticsData> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Fetch participants
    const { data: participants } = await supabase
      .from('consultant_dashboard_participants')
      .select('*')
      .eq('consultant_id', user.id)

    if (!participants) {
      return {
        totalParticipants: 0,
        activeParticipants: 0,
        completedParticipants: 0,
        cvCompletionRate: 0,
        averageAtsScore: 0,
        goalsCompletedThisMonth: 0,
        placementsThisMonth: 0,
      }
    }

    const total = participants.length
    const active = participants.filter(p => p.status === 'ACTIVE').length
    const completed = participants.filter(p => p.status === 'COMPLETED').length
    const withCV = participants.filter(p => p.has_cv).length
    const avgAts = Math.round(
      participants.reduce((sum, p) => sum + (p.ats_score || 0), 0) / Math.max(total, 1)
    )

    // TODO: Fetch goals and placements this month

    return {
      totalParticipants: total,
      activeParticipants: active,
      completedParticipants: completed,
      cvCompletionRate: Math.round((withCV / Math.max(total, 1)) * 100),
      averageAtsScore: avgAts,
      goalsCompletedThisMonth: 0, // TODO: Implement
      placementsThisMonth: 0, // TODO: Implement
    }
  }

  /**
   * Log contact with participant
   */
  async logContact(participantId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Update last_contact_at in participant_consultants table
    const { error } = await supabase
      .from('participant_consultants')
      .update({ last_contact_at: new Date().toISOString() })
      .eq('consultant_id', user.id)
      .eq('participant_id', participantId)

    if (error) throw error
  }

  /**
   * Update participant priority
   */
  async updateParticipantPriority(participantId: string, priority: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('participant_consultants')
      .update({ priority })
      .eq('consultant_id', user.id)
      .eq('participant_id', participantId)

    if (error) throw error
  }

  /**
   * Update participant status
   */
  async updateParticipantStatus(
    participantId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ON_HOLD'
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('participant_consultants')
      .update({ status })
      .eq('consultant_id', user.id)
      .eq('participant_id', participantId)

    if (error) throw error
  }
}

export const consultantService = new ConsultantService()
export default consultantService
