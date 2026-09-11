/** Kalendern: calendar_events, calendar_goals och calendar_mood_entries, med localStorage som cache och fallback. */

import { supabase } from '@/lib/supabase'
import { getCurrentUser, handleStorageError } from './_shared'

// ============================================
// CALENDAR API
// ============================================

interface CalendarEventData {
  id?: string
  title: string
  date: string
  time: string
  end_time?: string
  type: string
  location?: string
  is_video?: boolean
  is_phone?: boolean
  description?: string
  with_person?: string
  job_id?: string
  job_application_id?: string
  tasks?: unknown[]
  travel?: unknown
  interview_prep?: unknown
  is_recurring?: boolean
  recurring_config?: unknown
  parent_event_id?: string
  reminders?: unknown[]
  shared_with?: string[]
  is_shared?: boolean
}

interface CalendarGoalData {
  id?: string
  type: string
  target: number
  period: string
  start_date?: string
}

interface MoodEntryData {
  date: string
  level: number
  note?: string
  energy_level?: number
  stress_level?: number
}

export const calendarApi = {
  // Events
  async getEvents(): Promise<CalendarEventData[]> {
    const user = await getCurrentUser()
    if (!user) {
      const cached = localStorage.getItem('calendar_events')
      return cached ? JSON.parse(cached) : []
    }

    // E3 (2026-07-10): explicita kolumner i stället för select('*') —
    // exakt de fält transformen nedan använder
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, title, date, time, end_time, type, location, is_video, is_phone, description, with_person, job_id, job_application_id, tasks, travel, interview_prep, is_recurring, recurring_config, parent_event_id, reminders, shared_with, is_shared, created_at, updated_at')
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) {
      handleStorageError(error, 'hämta kalenderhändelser')
      const cached = localStorage.getItem('calendar_events')
      return cached ? JSON.parse(cached) : []
    }

    // Transform from snake_case to camelCase for frontend
    const events = (data || []).map(e => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      endTime: e.end_time,
      type: e.type,
      location: e.location,
      isVideo: e.is_video,
      isPhone: e.is_phone,
      description: e.description,
      with: e.with_person,
      jobId: e.job_id,
      jobApplicationId: e.job_application_id,
      tasks: e.tasks || [],
      travel: e.travel,
      interviewPrep: e.interview_prep,
      isRecurring: e.is_recurring,
      recurringConfig: e.recurring_config,
      parentEventId: e.parent_event_id,
      reminders: e.reminders || [],
      sharedWith: e.shared_with || [],
      isShared: e.is_shared,
      createdAt: e.created_at,
      updatedAt: e.updated_at
    }))

    localStorage.setItem('calendar_events', JSON.stringify(events))
    return events
  },

  async createEvent(event: CalendarEventData): Promise<CalendarEventData | null> {
    const user = await getCurrentUser()
    if (!user) {
      const events = JSON.parse(localStorage.getItem('calendar_events') || '[]')
      const newEvent = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      events.push(newEvent)
      localStorage.setItem('calendar_events', JSON.stringify(events))
      return newEvent
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        title: event.title,
        date: event.date,
        time: event.time,
        end_time: event.end_time,
        type: event.type,
        location: event.location,
        is_video: event.is_video,
        is_phone: event.is_phone,
        description: event.description,
        with_person: event.with_person,
        job_id: event.job_id,
        job_application_id: event.job_application_id,
        tasks: event.tasks || [],
        travel: event.travel,
        interview_prep: event.interview_prep,
        is_recurring: event.is_recurring,
        recurring_config: event.recurring_config,
        parent_event_id: event.parent_event_id,
        reminders: event.reminders || [],
        shared_with: event.shared_with || [],
        is_shared: event.is_shared || false
      })
      .select()
      .single()

    if (error) {
      handleStorageError(error, 'skapa kalenderhändelse')
      return null
    }

    return data
  },

  async updateEvent(id: string, event: Partial<CalendarEventData>): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) {
      const events = JSON.parse(localStorage.getItem('calendar_events') || '[]')
      const index = events.findIndex((e: CalendarEventData) => e.id === id)
      if (index !== -1) {
        events[index] = { ...events[index], ...event, updatedAt: new Date().toISOString() }
        localStorage.setItem('calendar_events', JSON.stringify(events))
        return true
      }
      return false
    }

    const updateData: Record<string, unknown> = {}
    if (event.title !== undefined) updateData.title = event.title
    if (event.date !== undefined) updateData.date = event.date
    if (event.time !== undefined) updateData.time = event.time
    if (event.end_time !== undefined) updateData.end_time = event.end_time
    if (event.type !== undefined) updateData.type = event.type
    if (event.location !== undefined) updateData.location = event.location
    if (event.is_video !== undefined) updateData.is_video = event.is_video
    if (event.is_phone !== undefined) updateData.is_phone = event.is_phone
    if (event.description !== undefined) updateData.description = event.description
    if (event.with_person !== undefined) updateData.with_person = event.with_person
    if (event.tasks !== undefined) updateData.tasks = event.tasks
    if (event.travel !== undefined) updateData.travel = event.travel
    if (event.interview_prep !== undefined) updateData.interview_prep = event.interview_prep

    const { error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)

    if (error) {
      handleStorageError(error, 'uppdatera kalenderhändelse')
      return false
    }

    return true
  },

  async deleteEvent(id: string): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) {
      const events = JSON.parse(localStorage.getItem('calendar_events') || '[]')
      const filtered = events.filter((e: CalendarEventData) => e.id !== id)
      localStorage.setItem('calendar_events', JSON.stringify(filtered))
      return true
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)

    if (error) {
      handleStorageError(error, 'ta bort kalenderhändelse')
      return false
    }

    return true
  },

  // Goals
  async getGoals(): Promise<CalendarGoalData[]> {
    const user = await getCurrentUser()
    if (!user) {
      const cached = localStorage.getItem('calendar_goals')
      return cached ? JSON.parse(cached) : []
    }

    // E11 (2026-07-23): explicit kolumnlista — matchar exakt transformen nedan.
    const { data, error } = await supabase
      .from('calendar_goals')
      .select('id, type, target, period, start_date')
      .order('created_at', { ascending: false })

    if (error) {
      handleStorageError(error, 'hämta kalendermål')
      const cached = localStorage.getItem('calendar_goals')
      return cached ? JSON.parse(cached) : []
    }

    const goals = (data || []).map(g => ({
      id: g.id,
      type: g.type,
      target: g.target,
      period: g.period,
      startDate: g.start_date
    }))

    localStorage.setItem('calendar_goals', JSON.stringify(goals))
    return goals
  },

  async saveGoal(goal: CalendarGoalData): Promise<CalendarGoalData | null> {
    const user = await getCurrentUser()
    if (!user) {
      const goals = JSON.parse(localStorage.getItem('calendar_goals') || '[]')
      const newGoal = { ...goal, id: goal.id || crypto.randomUUID() }
      const index = goals.findIndex((g: CalendarGoalData) => g.id === newGoal.id)
      if (index !== -1) {
        goals[index] = newGoal
      } else {
        goals.push(newGoal)
      }
      localStorage.setItem('calendar_goals', JSON.stringify(goals))
      return newGoal
    }

    const { data, error } = await supabase
      .from('calendar_goals')
      .upsert({
        id: goal.id || undefined,
        user_id: user.id,
        type: goal.type,
        target: goal.target,
        period: goal.period,
        start_date: goal.start_date || new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      handleStorageError(error, 'spara kalendermål')
      return null
    }

    return data
  },

  // Mood Entries
  async getMoodEntries(): Promise<MoodEntryData[]> {
    const user = await getCurrentUser()
    if (!user) {
      const cached = localStorage.getItem('calendar_mood_entries')
      return cached ? JSON.parse(cached) : []
    }

    // E11 (2026-07-23): explicit kolumnlista — matchar exakt transformen nedan.
    const { data, error } = await supabase
      .from('calendar_mood_entries')
      .select('date, level, note, energy_level, stress_level')
      .order('date', { ascending: false })
      .limit(30)

    if (error) {
      handleStorageError(error, 'hämta humörloggar')
      const cached = localStorage.getItem('calendar_mood_entries')
      return cached ? JSON.parse(cached) : []
    }

    const entries = (data || []).map(e => ({
      date: e.date,
      level: e.level,
      note: e.note,
      energyLevel: e.energy_level,
      stressLevel: e.stress_level
    }))

    localStorage.setItem('calendar_mood_entries', JSON.stringify(entries))
    return entries
  },

  async saveMoodEntry(entry: MoodEntryData): Promise<MoodEntryData | null> {
    const user = await getCurrentUser()
    if (!user) {
      const entries = JSON.parse(localStorage.getItem('calendar_mood_entries') || '[]')
      const filtered = entries.filter((e: MoodEntryData) => e.date !== entry.date)
      filtered.push(entry)
      localStorage.setItem('calendar_mood_entries', JSON.stringify(filtered))
      return entry
    }

    const { data, error } = await supabase
      .from('calendar_mood_entries')
      .upsert({
        user_id: user.id,
        date: entry.date,
        level: entry.level,
        note: entry.note,
        energy_level: entry.energy_level,
        stress_level: entry.stress_level
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single()

    if (error) {
      handleStorageError(error, 'spara humörlogg')
      return null
    }

    return data
  }
}
