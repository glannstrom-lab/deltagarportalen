/**
 * Calendar Integration Service
 * Connects career module with calendar - syncs milestones, network follow-ups, and reminders
 */

// careerApi exporterar `CareerMilestone`, aldrig `Milestone`. Importen stod
// som `type Milestone` och gav ett TS2305 som legat i det frysta taket.
import { careerPlanApi, networkApi, type CareerMilestone as Milestone, type NetworkContact } from './careerApi'
import { calendarApi } from './cloudStorage'
import type { CalendarEvent, SmartReminder } from './calendarData'
import { formatLocalDate, parseLocalDate } from './aktivitetSchema'

/**
 * 2026-09-22: `calendarApi.createEvent` (services/cloud/kalender.ts) tar
 * `CalendarEventData` — SNAKE_CASE (`end_time`, `with_person`, ...) — men
 * de här funktionerna byggde ett `Partial<CalendarEvent>` (calendarData.ts),
 * som är CAMELCASE (`endTime`, `with`, ...), och skickade det rakt in.
 * `endTime`/`with` hade alltså aldrig nått databasen (fel nyckelnamn — inte
 * ens en kolumn som blev NULL, bara osparade), och `createdAt`/`updatedAt`
 * finns inte som kolumner alls (DB:n sätter `created_at`/`updated_at`
 * själv). Reachable via career-planens "synka till kalender" (PlanTab.tsx →
 * CalendarSync.tsx). Den här mappern är den enda ändring som krävs — själva
 * `CalendarEvent`/`CalendarEventData`-typerna ägs inte här.
 */
function tillCalendarEventData(event: Partial<CalendarEvent>): {
  id?: string
  title: string
  date: string
  time: string
  end_time?: string
  type: string
  description?: string
  with_person?: string
  reminders?: unknown[]
} {
  return {
    id: event.id,
    title: event.title ?? '',
    date: event.date ?? '',
    time: event.time ?? '',
    end_time: event.endTime,
    type: event.type ?? 'other',
    description: event.description,
    with_person: event.with,
    reminders: event.reminders,
  }
}

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

/**
 * Synkens dubblettskydd.
 *
 * Händelserna skapades med `id: 'milestone-<id>'` / `'network-<id>'`, och
 * synken letade efter befintliga händelser med just de id:na. Men
 * `calendar_events.id` är en uuid som databasen sätter — `createEvent`
 * skickar aldrig med id:t. Inget id började därför någonsin med
 * 'milestone-', och VARJE klick på "Synka till kalender" skapade alla
 * milstolpar och uppföljningar en gång till. Samma miss gjorde att
 * getAggregatedReminders visade varje synkad milstolpe två gånger (en gång
 * från karriärplanen, en gång från kalendern).
 *
 * Nyckeln bygger i stället på det som faktiskt sparas: typ, datum och rubrik.
 */
export function synkNyckel(e: { type?: string | null; date?: string | null; title?: string | null }): string {
  return `${e.type ?? ''}|${(e.date ?? '').slice(0, 10)}|${e.title ?? ''}`
}

/** `YYYY-MM-DD` ur ett datum från karriärplanen (date-kolumn eller ISO-sträng). */
function handelseDatum(v: string): string {
  return new Date(v).toISOString().split('T')[0]
}

/**
 * Antal kalenderdagar från `idag` (lokalt `YYYY-MM-DD`) till ett datum ur en
 * date-kolumn. `null` om datumet saknas eller inte går att läsa.
 *
 * 2026-09-24: jämförelserna nedan gjordes tidigare som `new Date(datum) >= now`.
 * `new Date('2026-09-24')` är UTC-midnatt — kl. 02:00 svensk sommartid — så
 * efter 02:00 var dagens milstolpar, uppföljningar och kalenderhändelser
 * "passerade": de föll ur påminnelselistan och synkades aldrig till kalendern,
 * just den dag de gällde. Och `floor` på millisekunder gjorde morgondagen till
 * "0 dagar kvar". Alla tre kolumnerna (career_milestones.target_date,
 * network_contacts.next_contact_date, calendar_events.date) är `date` i prod.
 */
function dagarTill(datum: string | null | undefined, idag: string): number | null {
  const d = (datum ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null
  // round, inte floor: ett dygn över sommartidens gränser är 23 eller 25 h.
  return Math.round((parseLocalDate(d).getTime() - parseLocalDate(idag).getTime()) / 86_400_000)
}

/**
 * Antal lokala kalenderdagar från `nu` till `datum` — 0 = idag, 1 = imorgon,
 * negativt = passerat. Samma räkning som `dagarTill`, för ett Date-värde.
 * CalendarSync räknade tidigare `floor` över millisekunder mot klockslaget
 * nu, så dagens saker (lokal midnatt) visades som "Försenad" och
 * morgondagens som "Idag".
 */
export function dagarTillDatum(datum: Date, nu: Date = new Date()): number | null {
  if (Number.isNaN(datum.getTime())) return null
  return dagarTill(formatLocalDate(datum), formatLocalDate(nu))
}

const milstolpeNyckel = (m: Milestone) =>
  synkNyckel({ type: 'deadline', date: handelseDatum(m.target_date as string), title: m.title })
const uppfoljningsNyckel = (c: NetworkContact) =>
  synkNyckel({ type: 'followup', date: handelseDatum(c.next_contact_date as string), title: `Följ upp: ${c.name}` })

// Generate unique ID using crypto.randomUUID or fallback
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
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
  const dateStr = handelseDatum(milestone.target_date)

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
    const created = await calendarApi.createEvent(tillCalendarEventData(event))
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
  const dateStr = handelseDatum(contact.next_contact_date)

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
    const created = await calendarApi.createEvent(tillCalendarEventData(event))
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
    const befintliga = new Set((existingEvents as unknown as CalendarEvent[]).map(synkNyckel))

    // Only sync incomplete milestones with target dates
    const milestonesToSync = plan.milestones.filter(
      m => !m.is_completed && m.target_date && !befintliga.has(milstolpeNyckel(m))
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
    const befintliga = new Set((existingEvents as unknown as CalendarEvent[]).map(synkNyckel))

    // Only sync contacts with upcoming follow-up dates
    const idag = formatLocalDate(new Date())
    const contactsToSync = contacts.filter(c => {
      const dagar = dagarTill(c.next_contact_date, idag)
      return dagar !== null && dagar >= 0 && !befintliga.has(uppfoljningsNyckel(c))
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
  // Nycklar för det som redan kommit med från karriärplanen/nätverket — en
  // synkad kopia i kalendern ska inte visas en gång till.
  const redanMed = new Set<string>()
  const idag = formatLocalDate(new Date())
  const inomFonstret = (dagar: number | null): dagar is number =>
    dagar !== null && dagar >= 0 && dagar <= daysAhead

  try {
    // Get career milestones
    const plan = await careerPlanApi.getActive()
    if (plan?.milestones) {
      for (const milestone of plan.milestones) {
        if (milestone.is_completed || !milestone.target_date) continue

        const daysUntil = dagarTill(milestone.target_date, idag)
        if (inomFonstret(daysUntil)) {
          const targetDate = parseLocalDate(milestone.target_date.slice(0, 10))

          redanMed.add(milstolpeNyckel(milestone))
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

      const daysUntil = dagarTill(contact.next_contact_date, idag)
      if (inomFonstret(daysUntil)) {
        const followupDate = parseLocalDate(contact.next_contact_date.slice(0, 10))

        redanMed.add(uppfoljningsNyckel(contact))
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
      // Hoppa över kalenderns kopia av en milstolpe/uppföljning som redan är med
      if (redanMed.has(synkNyckel(event))) continue

      const daysUntil = dagarTill(event.date, idag)
      if (inomFonstret(daysUntil)) {
        const eventDate = parseLocalDate(event.date.slice(0, 10))

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
