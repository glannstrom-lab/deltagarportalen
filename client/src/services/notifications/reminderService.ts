/**
 * Smart Reminder Service
 * Intelligent påminnelsesystem baserat på användarbeteende och AI-insikter
 */

export interface Reminder {
  id: string
  type: 'application' | 'followUp' | 'deadline' | 'milestone' | 'insight'
  title: string
  description: string
  dueDate: Date
  priority: 'high' | 'medium' | 'low'
  action?: {
    label: string
    url: string
  }
  completed: boolean
  dismissed: boolean
}

export interface ReminderPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  reminderTime: string // '09:00', 'morning', 'evening'
  frequency: 'daily' | 'weekly' | 'smart' // smart = AI-driven
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

// Standardpreferenser
export const defaultReminderPreferences: ReminderPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  reminderTime: '09:00',
  frequency: 'smart',
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  }
}

/**
 * Generera smarta påminnelser baserat på användardata
 */
export function generateSmartReminders(
  userData: {
    savedJobs: Array<{ id: string; title: string; company: string; savedAt: Date }>
    applications: Array<{ id: string; company: string; appliedAt: Date; status: string }>
    goals: Array<{ id: string; title: string; deadline: Date; status: string }>
    lastLogin: Date
    streakDays: number
    activityPattern: number[] // Aktivitet per timme (0-23)
  }
): Reminder[] {
  const reminders: Reminder[] = []
  const now = new Date()

  // 1. Påminnelse om jobb som sparats för länge sedan
  userData.savedJobs.forEach(job => {
    const daysSinceSaved = Math.floor((now.getTime() - job.savedAt.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceSaved >= 5 && daysSinceSaved < 14) {
      reminders.push({
        id: `job-${job.id}`,
        type: 'application',
        title: `Sök ${job.title}`,
        description: `Du sparade detta jobb för ${daysSinceSaved} dagar sedan. Annonsen kanske stänger snart!`,
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Imorgon
        priority: daysSinceSaved > 10 ? 'high' : 'medium',
        action: {
          label: 'Se jobb',
          url: `/dashboard/job-search`
        },
        completed: false,
        dismissed: false
      })
    }
  })

  // 2. Uppföljning av ansökningar
  userData.applications.forEach(app => {
    if (app.status === 'applied') {
      const daysSinceApplied = Math.floor((now.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceApplied >= 7 && daysSinceApplied < 14) {
        reminders.push({
          id: `followup-${app.id}`,
          type: 'followUp',
          title: `Följ upp ansökan till ${app.company}`,
          description: `Det har gått en vecka sedan du sökte. Ett uppföljningsmejl kan visa ditt engagemang.`,
          dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          priority: 'medium',
          action: {
            label: 'Skriv uppföljning',
            url: `/dashboard/applications`
          },
          completed: false,
          dismissed: false
        })
      }
    }
  })

  // 3. Deadline-påminnelser för mål
  userData.goals.forEach(goal => {
    if (goal.status !== 'completed') {
      const daysUntilDeadline = Math.floor((goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
        reminders.push({
          id: `goal-${goal.id}`,
          type: 'deadline',
          title: `Deadline: ${goal.title}`,
          description: `Ditt mål ska vara klart om ${daysUntilDeadline} dagar.`,
          dueDate: goal.deadline,
          priority: daysUntilDeadline === 1 ? 'high' : 'medium',
          action: {
            label: 'Se mål',
            url: `/dashboard/goals`
          },
          completed: false,
          dismissed: false
        })
      }
    }
  })

  // 4. Streak-påminnelse
  if (userData.streakDays > 0) {
    const lastLoginDays = Math.floor((now.getTime() - userData.lastLogin.getTime()) / (1000 * 60 * 60 * 24))
    
    if (lastLoginDays >= 1) {
      reminders.push({
        id: 'streak',
        type: 'milestone',
        title: `${userData.streakDays} dagar i rad! 🎉`,
        description: `Du är på en streak! Logga in idag för att behålla den.`,
        dueDate: new Date(now.getTime() + 12 * 60 * 60 * 1000), // Innan midnatt
        priority: 'low',
        action: {
          label: 'Logga in',
          url: '/dashboard'
        },
        completed: false,
        dismissed: false
      })
    }
  }

  // 5. AI-insikt: Bästa tid för aktivitet
  const bestHour = findBestActivityHour(userData.activityPattern)
  const currentHour = now.getHours()
  
  if (Math.abs(currentHour - bestHour) <= 1) {
    reminders.push({
      id: 'optimal-time',
      type: 'insight',
      title: 'Perfekt tid för jobbsökning!',
      description: `Baserat på ditt mönster är detta din mest produktiva tid. Passa på att göra något litet.`,
      dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      priority: 'low',
      action: {
        label: 'Gör något litet',
        url: '/dashboard'
      },
      completed: false,
      dismissed: false
    })
  }

  return reminders.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

/**
 * Hitta bästa timmen för aktivitet baserat på mönster
 */
function findBestActivityHour(pattern: number[]): number {
  let maxHour = 9
  let maxValue = 0
  
  pattern.forEach((value, hour) => {
    if (value > maxValue) {
      maxValue = value
      maxHour = hour
    }
  })
  
  return maxHour
}

/**
 * Beräkna optimal påminnelsetid för en användare
 */
export function calculateOptimalReminderTime(
  activityPattern: number[]
): string {
  // Hitta timme med högsta aktivitet
  const bestHour = findBestActivityHour(activityPattern)
  
  // Formatera som "HH:00"
  return `${bestHour.toString().padStart(2, '0')}:00`
}

/**
 * Skapa återkommande påminnelser
 */
export function createRecurringReminders(
  type: 'daily' | 'weekly',
  preferences: ReminderPreferences
): Partial<Reminder>[] {
  const reminders: Partial<Reminder>[] = []

  if (type === 'daily') {
    reminders.push({
      type: 'milestone',
      title: 'Dagens jobbsökning',
      description: 'Ta ett litet steg idag - även 10 minuter räknas!',
      priority: 'low'
    })
  }

  if (type === 'weekly') {
    reminders.push({
      type: 'insight',
      title: 'Veckosammanfattning',
      description: 'Granska veckans framsteg och planera nästa vecka.',
      priority: 'medium'
    })
  }

  return reminders
}

/**
 * Kolla om det är tyst timme
 */
export function isQuietHour(
  now: Date = new Date(),
  preferences: ReminderPreferences
): boolean {
  if (!preferences.quietHours.enabled) return false

  const hour = now.getHours()
  const minute = now.getMinutes()
  const currentTime = hour * 60 + minute

  const [startHour, startMinute] = preferences.quietHours.start.split(':').map(Number)
  const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number)
  
  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime
  } else {
    // Över midnatt
    return currentTime >= startTime || currentTime < endTime
  }
}

/**
 * Spara påminnelsepreferenser
 */
export function saveReminderPreferences(preferences: ReminderPreferences): void {
  localStorage.setItem('reminder-preferences', JSON.stringify(preferences))
}

/**
 * Hämta påminnelsepreferenser
 */
export function loadReminderPreferences(): ReminderPreferences {
  try {
    const saved = localStorage.getItem('reminder-preferences')
    if (saved) {
      return { ...defaultReminderPreferences, ...JSON.parse(saved) }
    }
  } catch {
    console.warn('Kunde inte läsa påminnelsepreferenser')
  }
  return defaultReminderPreferences
}

/**
 * Begär tillstånd för push-notiser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Visa push-notis
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  new Notification(title, {
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    ...options
  })
}

/**
 * Schemalägg påminnelse
 */
export function scheduleReminder(
  reminder: Reminder,
  callback: () => void
): () => void {
  const now = new Date()
  const delay = reminder.dueDate.getTime() - now.getTime()

  if (delay <= 0) {
    callback()
    return () => {}
  }

  const timeoutId = setTimeout(callback, delay)
  return () => clearTimeout(timeoutId)
}

export default {
  generateSmartReminders,
  calculateOptimalReminderTime,
  createRecurringReminders,
  isQuietHour,
  saveReminderPreferences,
  loadReminderPreferences,
  requestNotificationPermission,
  showNotification,
  scheduleReminder
}
