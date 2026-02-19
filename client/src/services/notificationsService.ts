// Notifikationsservice för jobbövervakning
import { afApi } from './arbetsformedlingenApi'

export interface JobAlert {
  id: string
  name: string
  query: string
  municipality?: string
  employmentType?: string
  remote?: boolean
  lastChecked: string
  lastJobId?: string
}

export interface JobNotification {
  id: string
  jobId: string
  title: string
  employer: string
  municipality?: string
  publishedDate: string
  alertId: string
  read: boolean
  createdAt: string
}

class NotificationsService {
  private readonly STORAGE_KEY = 'job-alerts'
  private readonly NOTIFICATIONS_KEY = 'job-notifications'
  private readonly CHECK_INTERVAL = 5 * 60 * 1000 // 5 minuter

  // Hämta sparade bevakningar
  getAlerts(): JobAlert[] {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  // Spara bevakningar
  private saveAlerts(alerts: JobAlert[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alerts))
  }

  // Skapa ny bevakning
  createAlert(alert: Omit<JobAlert, 'id' | 'lastChecked'>): JobAlert {
    const newAlert: JobAlert = {
      ...alert,
      id: Date.now().toString(),
      lastChecked: new Date().toISOString(),
    }
    const alerts = this.getAlerts()
    alerts.push(newAlert)
    this.saveAlerts(alerts)
    return newAlert
  }

  // Ta bort bevakning
  deleteAlert(id: string): void {
    const alerts = this.getAlerts().filter(a => a.id !== id)
    this.saveAlerts(alerts)
  }

  // Uppdatera bevakning
  updateAlert(id: string, updates: Partial<JobAlert>): void {
    const alerts = this.getAlerts().map(a => 
      a.id === id ? { ...a, ...updates } : a
    )
    this.saveAlerts(alerts)
  }

  // Hämta notifikationer
  getNotifications(): JobNotification[] {
    const stored = localStorage.getItem(this.NOTIFICATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  // Spara notifikationer
  private saveNotifications(notifications: JobNotification[]): void {
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications))
  }

  // Markera notifikation som läst
  markAsRead(notificationId: string): void {
    const notifications = this.getNotifications().map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    )
    this.saveNotifications(notifications)
  }

  // Markera alla som lästa
  markAllAsRead(): void {
    const notifications = this.getNotifications().map(n => ({ ...n, read: true }))
    this.saveNotifications(notifications)
  }

  // Räkna olästa
  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.read).length
  }

  // Kontrollera nya jobb för en bevakning
  async checkAlert(alert: JobAlert): Promise<JobNotification[]> {
    try {
      const response = await afApi.searchJobs({
        q: alert.query,
        municipality: alert.municipality,
        employment_type: alert.employmentType,
        remote: alert.remote,
        limit: 5,
        published_after: alert.lastChecked,
      })

      const newNotifications: JobNotification[] = []

      for (const job of response.hits) {
        // Kolla om vi redan notifierat om detta jobb
        const existing = this.getNotifications().find(n => n.jobId === job.id)
        if (!existing) {
          const notification: JobNotification = {
            id: `notif-${Date.now()}-${job.id}`,
            jobId: job.id,
            title: job.headline,
            employer: job.employer.name,
            municipality: job.workplace_address?.municipality,
            publishedDate: job.publication_date,
            alertId: alert.id,
            read: false,
            createdAt: new Date().toISOString(),
          }
          newNotifications.push(notification)
        }
      }

      // Uppdatera senaste kontroll
      this.updateAlert(alert.id, { 
        lastChecked: new Date().toISOString(),
        lastJobId: response.hits[0]?.id 
      })

      // Spara nya notifikationer
      if (newNotifications.length > 0) {
        const allNotifications = [...newNotifications, ...this.getNotifications()]
        // Behåll bara de 50 senaste
        this.saveNotifications(allNotifications.slice(0, 50))
      }

      return newNotifications
    } catch (error) {
      console.error('Error checking alert:', error)
      return []
    }
  }

  // Kontrollera alla bevakningar
  async checkAllAlerts(): Promise<JobNotification[]> {
    const alerts = this.getAlerts()
    const allNewNotifications: JobNotification[] = []

    for (const alert of alerts) {
      const newNotifications = await this.checkAlert(alert)
      allNewNotifications.push(...newNotifications)
    }

    return allNewNotifications
  }

  // Begär notifikationsbehörighet
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  // Visa browser-notifikation
  showBrowserNotification(notification: JobNotification): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    new Notification('Nytt jobb hittat!', {
      body: `${notification.title} på ${notification.employer}`,
      icon: '/vite.svg',
      tag: notification.id,
    })
  }

  // Starta automatisk övervakning
  startMonitoring(callback?: (notifications: JobNotification[]) => void): () => void {
    // Kontrollera direkt
    this.checkAllAlerts().then(newNotifications => {
      if (newNotifications.length > 0 && callback) {
        callback(newNotifications)
      }
    })

    // Sätt upp intervall
    const intervalId = setInterval(() => {
      this.checkAllAlerts().then(newNotifications => {
        if (newNotifications.length > 0) {
          // Visa browser-notifikationer
          newNotifications.forEach(n => this.showBrowserNotification(n))
          
          if (callback) {
            callback(newNotifications)
          }
        }
      })
    }, this.CHECK_INTERVAL)

    // Returnera cleanup-funktion
    return () => clearInterval(intervalId)
  }
}

export const notificationsService = new NotificationsService()
