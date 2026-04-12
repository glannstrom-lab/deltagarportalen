/**
 * Calendar Integration Service
 * Connects career module with calendar - syncs milestones, network follow-ups, and reminders
 */

import { careerPlanApi, networkApi, type Milestone, type NetworkContact } from './careerApi'
import { calendarApi } from './cloudStorage'
import type { CalendarEvent, SmartReminder } from './calendarData'
import { v4 as uuidv4 } from 'uuid'

// Types
export interface CalendarIntegrationOptions {
  createReminders?: boolean
  reminderMinutesBefore?: number
}

export interface AggregatedReminder {
  id: string
  source: 'milestone' | 'network' | 'calendar' | 'recommendation'
  title: string
  description: string
  dueDate: Date
  priority: 'high' | 'medium' | 'low'
  actionPath: string
  actionLabel: string
  type: string
}

// Generate unique ID if uuid not available
const generateId = (): string => {
  try {
    return uuidv4()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }
}

/**
 * Create calendar event from career milestone
 */
export async function createEventFromMilestone(
  milestone: Milestone,
  options: CalendarIntegrationOptions = {}
): Promise<CalendarEvent | null> {
  if (!milestone.target_date) return null

  const { createReminders = true, reminderMinutesBefore = 1440 } = options // Default 24 hours

  const eventDate = new Date(milestone.target_date)
  const dateStr = eventDate.toISOString().split('T')[0]

  const reminders: SmartReminder[] = []
  if (createReminders) {
    const reminderDate = new Date(eventDate.getTime() - reminderMinutesBefore * 60 * 1000)
    reminders.push({
      id: generateId(),
      eventId: `milestone-${milestone.id}`,
      triggerTime: reminderDate.toISOString(),
      type: 'in_app',
      message: `Påminnelse: "${milestone.title}" ska vara klar ${milestone.target_date}`,
      sent: false
    })
  }

  const event: Partial<CalendarEvent> = {
    id: `milestone-${milestone.id}`,
    title: milestone.title,
    date: dateStr,
    time: '09:00',
    endTime: '10:00',
    type: 'deadline',
    description: milestone.description || `Milstolpe från din karriärplan`,
    reminders,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  try {
    const created = await calendarApi.createEvent(event)
    return created as unknown as CalendarEvent
  } catch (error) {
    console.error('Failed to create calendar event from milestone:', error)
    return null
  }
}

/**
 * Create calendar event from network contact follow-up
 */
export async function createEventFromNetworkFollowup(
  contact: NetworkContact,
  options: CalendarIntegrationOptions = {}
): Promise<CalendarEvent | null> {
  if (!contact.next_contact_date) return null

  const { createReminders = true, reminderMinutesBefore = 1440 } = options

  const eventDate = new Date(contact.next_contact_date)
  const dateStr = eventDate.toISOString().split('T')[0]

  const reminders: SmartReminder[] = []
  if (createReminders) {
    const reminderDate = new Date(eventDate.getTime() - reminderMinutesBefore * 60 * 1000)
    reminders.push({
      id: generateId(),
      eventId: `network-${contact.id}`,
      triggerTime: reminderDate.toISOString(),
      type: 'in_app',
      message: `Följ upp med ${contact.name} (${contact.company || 'Kontakt'})`,
      sent: false
    })
  }

  const event: Partial<CalendarEvent> = {
    id: `network-${contact.id}`,
    title: `Följ upp: ${contact.name}`,
    date: dateStr,
    time: '10:00',
    endTime: '10:30',
    type: 'followup',
    description: `Uppföljning med ${contact.name}${contact.company ? ` på ${contact.company}` : ''}${contact.role ? `, ${contact.role}` : ''}`,
    with: contact.name,
    reminders,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  try {
    const created = await calendarApi.createEvent(event)
    return created as unknown as CalendarEvent
  } catch (error) {
    console.error('Failed to create calendar event from network contact:', error)
    return null
  }
}

/**
 * Sync all career milestones to calendar
 */
export async function syncMilestonesToCalendar(): Promise<{ synced: number; errors: number }> {
  let synced = 0
  let errors = 0

  try {
    const plan = await careerPlanApi.getActive()
    if (!plan?.milestones) return { synced: 0, errors: 0 }

    // Get existing calendar events
    const existingEvents = await calendarApi.getEvents()
    const existingMilestoneIds = new Set(
      (existingEvents as unknown as CalendarEvent[])
        .filter(e => e.id.startsWith('milestone-'))
        .map(e => e.id)
    )

    // Only sync incomplete milestones with target dates
    const milestonesToSync = plan.milestones.filter(
      m => !m.is_completed && m.target_date && !existingMilestoneIds.has(`milestone-${m.id}`)
    )

    for (const milestone of milestonesToSync) {
      const result = await createEventFromMilestone(milestone)
      if (result) {
        synced++
      } else {
        errors++
      }
    }
  } catch (error) {
    console.error('Failed to sync milestones to calendar:', error)
    errors++
  }

  return { synced, errors }
}

/**
 * Sync all network follow-ups to calendar
 */
export async function syncNetworkFollowupsToCalendar(): Promise<{ synced: number; errors: number }> {
  let synced = 0
  let errors = 0

  try {
    const contacts = await networkApi.getAll()

    // Get existing calendar events
    const existingEvents = await calendarApi.getEvents()
    const existingNetworkIds = new Set(
      (existingEvents as unknown as CalendarEvent[])
        .filter(e => e.id.startsWith('network-'))
        .map(e => e.id)
    )

    // Only sync contacts with upcoming follow-up dates
    const now = new Date()
    const contactsToSync = contacts.filter(c => {
      if (!c.next_contact_date) return false
      const followupDate = new Date(c.next_contact_date)
      return followupDate >= now && !existingNetworkIds.has(`network-${c.id}`)
    })

    for (const contact of contactsToSync) {
      const result = await createEventFromNetworkFollowup(contact)
      if (result) {
        synced++
      } else {
        errors++
      }
    }
  } catch (error) {
    console.error('Failed to sync network follow-ups to calendar:', error)
    errors++
  }

  return { synced, errors }
}

/**
 * Get aggregated upcoming reminders from all sources
 */
export async function getAggregatedReminders(daysAhead: number = 7): Promise<AggregatedReminder[]> {
  const reminders: AggregatedReminder[] = []
  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  try {
    // Get career milestones
    const plan = await careerPlanApi.getActive()
    if (plan?.milestones) {
      for (const milestone of plan.milestones) {
        if (milestone.is_completed || !milestone.target_date) continue

        const targetDate = new Date(milestone.target_date)
        if (targetDate >= now && targetDate <= futureDate) {
          const daysUntil = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          reminders.push({
            id: `milestone-${milestone.id}`,
            source: 'milestone',
            title: milestone.title,
            description: milestone.description || 'Milstolpe från din karriärplan',
            dueDate: targetDate,
            priority: daysUntil <= 2 ? 'high' : daysUntil <= 5 ? 'medium' : 'low',
            actionPath: '/career?tab=plan',
            actionLabel: 'Se karriärplan',
            type: 'deadline'
          })
        }
      }
    }

    // Get network follow-ups
    const contacts = await networkApi.getAll()
    for (const contact of contacts) {
      if (!contact.next_contact_date) continue

      const followupDate = new Date(contact.next_contact_date)
      if (followupDate >= now && followupDate <= futureDate) {
        const daysUntil = Math.floor((followupDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        reminders.push({
          id: `network-${contact.id}`,
          source: 'network',
          title: `Följ upp: ${contact.name}`,
          description: `Uppföljning med ${contact.name}${contact.company ? ` på ${contact.company}` : ''}`,
          dueDate: followupDate,
          priority: daysUntil <= 1 ? 'high' : daysUntil <= 3 ? 'medium' : 'low',
          actionPath: '/career?tab=network',
          actionLabel: 'Se kontakt',
          type: 'followup'
        })
      }
    }

    // Get calendar events
    const events = await calendarApi.getEvents()
    for (const event of events as unknown as CalendarEvent[]) {
      // Skip events that we created from milestones/network
      if (event.id.startsWith('milestone-') || event.id.startsWith('network-')) continue

      const eventDate = new Date(event.date)
      if (eventDate >= now && eventDate <= futureDate) {
        const daysUntil = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        reminders.push({
          id: `calendar-${event.id}`,
          source: 'calendar',
          title: event.title,
          description: event.description || `${event.type} kl ${event.time}`,
          dueDate: eventDate,
          priority: event.type === 'interview' ? 'high' : daysUntil <= 1 ? 'medium' : 'low',
          actionPath: '/calendar',
          actionLabel: 'Se kalender',
          type: event.type
        })
      }
    }
  } catch (error) {
    console.error('Failed to aggregate reminders:', error)
  }

  // Sort by priority and date
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return reminders.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return a.dueDate.getTime() - b.dueDate.getTime()
  })
}

/**
 * Schedule browser notification for upcoming event
 */
export function scheduleBrowserNotification(
  reminder: AggregatedReminder,
  minutesBefore: number = 30
): (() => void) | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null
  }

  const notifyTime = new Date(reminder.dueDate.getTime() - minutesBefore * 60 * 1000)
  const delay = notifyTime.getTime() - Date.now()

  if (delay <= 0) return null

  const timeoutId = setTimeout(() => {
    new Notification(reminder.title, {
      body: reminder.description,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: reminder.id,
      data: { actionPath: reminder.actionPath }
    })
  }, delay)

  return () => clearTimeout(timeoutId)
}

/**
 * Request notification permission and schedule upcoming reminders
 */
export async function initializeNotifications(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
  }

  if (Notification.permission !== 'granted') {
    return false
  }

  // Schedule notifications for upcoming reminders
  try {
    const reminders = await getAggregatedReminders(3) // Next 3 days
    reminders.forEach(reminder => {
      scheduleBrowserNotification(reminder, 30) // 30 min before
    })
  } catch (error) {
    console.error('Failed to schedule notifications:', error)
  }

  return true
}

// Export service
export const calendarIntegration = {
  createEventFromMilestone,
  createEventFromNetworkFollowup,
  syncMilestonesToCalendar,
  syncNetworkFollowupsToCalendar,
  getAggregatedReminders,
  scheduleBrowserNotification,
  initializeNotifications
}

export default calendarIntegration
