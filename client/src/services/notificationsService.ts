// Notifikationsservice för jobbövervakning - NU I MOLNET!
import { afApi } from './arbetsformedlingenApi'
import { notificationsApi } from './cloudStorage'
import { supabase } from '@/lib/supabase'

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

// Konverteringsfunktioner
const toApiAlert = (alert: JobAlert) => ({
  id: alert.id,
  name: alert.name,
  query: alert.query,
  municipality: alert.municipality,
  employment_type: alert.employmentType,
  remote: alert.remote,
  last_checked: alert.lastChecked,
  last_job_id: alert.lastJobId,
})

const fromApiAlert = (data: any): JobAlert => ({
  id: data.id,
  name: data.name,
  query: data.query,
  municipality: data.municipality,
  employmentType: data.employment_type,
  remote: data.remote,
  lastChecked: data.last_checked,
  lastJobId: data.last_job_id,
})

const toApiNotification = (notif: JobNotification) => ({
  id: notif.id,
  job_id: notif.jobId,
  title: notif.title,
  employer: notif.employer,
  municipality: notif.municipality,
  published_date: notif.publishedDate,
  alert_id: notif.alertId,
  read: notif.read,
  created_at: notif.createdAt,
})

const fromApiNotification = (data: any): JobNotification => ({
  id: data.id,
  jobId: data.job_id,
  title: data.title,
  employer: data.employer,
  municipality: data.municipality,
  publishedDate: data.published_date,
  alertId: data.alert_id,
  read: data.read,
  createdAt: data.created_at,
})

class NotificationsService {
  private readonly STORAGE_KEY = 'job-alerts'
  private readonly NOTIFICATIONS_KEY = 'job-notifications'
  private readonly CHECK_INTERVAL = 5 * 60 * 1000 // 5 minuter

  // Hämta sparade bevakningar (från molnet!)
  async getAlerts(): Promise<JobAlert[]> {
    try {
      const { data, error } = await supabase
        .from('job_alerts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data?.map(fromApiAlert) || []
    } catch (error) {
      console.error('Fel vid hämtning av bevakningar:', error)
      // Fallback till localStorage
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    }
  }

  // Spara bevakningar (lokalt för fallback)
  private saveAlertsToLocalStorage(alerts: JobAlert[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alerts))
    } catch {
      // Ignorera fel
    }
  }

  // Skapa ny bevakning (i molnet!)
  async createAlert(alert: Omit<JobAlert, 'id' | 'lastChecked'>): Promise<JobAlert> {
    const newAlert: JobAlert = {
      ...alert,
      id: Date.now().toString(),
      lastChecked: new Date().toISOString(),
    }

    try {
      const { data, error } = await supabase
        .from('job_alerts')
        .insert(toApiAlert(newAlert))
        .select()
        .single()
      
      if (error) throw error
      return fromApiAlert(data)
    } catch (error) {
      console.error('Fel vid skapande av bevakning:', error)
      // Fallback: spara lokalt
      const alerts = await this.getAlerts()
      alerts.push(newAlert)
      this.saveAlertsToLocalStorage(alerts)
      return newAlert
    }
  }

  // Ta bort bevakning (från molnet!)
  async deleteAlert(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Fel vid borttagning av bevakning:', error)
      // Fallback: ta bort lokalt
      const alerts = await this.getAlerts()
      const filtered = alerts.filter(a => a.id !== id)
      this.saveAlertsToLocalStorage(filtered)
    }
  }

  // Uppdatera bevakning (i molnet!)
  async updateAlert(id: string, updates: Partial<JobAlert>): Promise<void> {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .update({
          ...updates,
          last_checked: updates.lastChecked,
          last_job_id: updates.lastJobId,
          employment_type: updates.employmentType,
        })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Fel vid uppdatering av bevakning:', error)
      // Fallback: uppdatera lokalt
      const alerts = await this.getAlerts()
      const updated = alerts.map(a => 
        a.id === id ? { ...a, ...updates } : a
      )
      this.saveAlertsToLocalStorage(updated)
    }
  }

  // Hämta notifikationer (från molnet!)
  async getNotifications(): Promise<JobNotification[]> {
    try {
      const data = await notificationsApi.getAll()
      return data.map(fromApiNotification)
    } catch (error) {
      console.error('Fel vid hämtning av notifikationer:', error)
      // Fallback till localStorage
      const stored = localStorage.getItem(this.NOTIFICATIONS_KEY)
      return stored ? JSON.parse(stored) : []
    }
  }

  // Spara notifikationer (lokalt för fallback)
  private saveNotificationsToLocalStorage(notifications: JobNotification[]): void {
    try {
      localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications))
    } catch {
      // Ignorera fel
    }
  }

  // Markera notifikation som läst (i molnet!)
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await notificationsApi.markAsRead(notificationId)
    } catch (error) {
      console.error('Fel vid markering som läst:', error)
      // Fallback: uppdatera lokalt
      const notifications = await this.getNotifications()
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
      this.saveNotificationsToLocalStorage(updated)
    }
  }

  // Markera alla som lästa (i molnet!)
  async markAllAsRead(): Promise<void> {
    try {
      await notificationsApi.markAllAsRead()
    } catch (error) {
      console.error('Fel vid markering av alla som lästa:', error)
      // Fallback: uppdatera lokalt
      const notifications = await this.getNotifications()
      const updated = notifications.map(n => ({ ...n, read: true }))
      this.saveNotificationsToLocalStorage(updated)
    }
  }

  // Räkna olästa
  async getUnreadCount(): Promise<number> {
    try {
      const unread = await notificationsApi.getUnread()
      return unread.length
    } catch (error) {
      console.error('Fel vid räkning av olästa:', error)
      // Fallback: räkna lokalt
      const notifications = await this.getNotifications()
      return notifications.filter(n => !n.read).length
    }
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
      const existingNotifications = await this.getNotifications()

      for (const job of response.hits) {
        // Kolla om vi redan notifierat om detta jobb
        const existing = existingNotifications.find(n => n.jobId === job.id)
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
      await this.updateAlert(alert.id, { 
        lastChecked: new Date().toISOString(),
        lastJobId: response.hits[0]?.id 
      })

      // Spara nya notifikationer
      if (newNotifications.length > 0) {
        // Spara till molnet
        for (const notif of newNotifications) {
          try {
            await supabase.from('user_notifications').insert(toApiNotification(notif))
          } catch (e) {
            console.error('Fel vid sparande av notifikation:', e)
          }
        }
        
        // Fallback: spara lokalt också
        const allNotifications = [...newNotifications, ...existingNotifications]
        this.saveNotificationsToLocalStorage(allNotifications.slice(0, 50))
      }

      return newNotifications
    } catch (error) {
      console.error('Error checking alert:', error)
      return []
    }
  }

  // Kontrollera alla bevakningar
  async checkAllAlerts(): Promise<JobNotification[]> {
    const alerts = await this.getAlerts()
    const allNotifications: JobNotification[] = []

    for (const alert of alerts) {
      const notifications = await this.checkAlert(alert)
      allNotifications.push(...notifications)
    }

    return allNotifications
  }

  // Rensa gamla notifikationer
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
      
      if (error) throw error
    } catch (error) {
      console.error('Fel vid rensning av gamla notifikationer:', error)
      // Fallback: rensa lokalt
      const notifications = await this.getNotifications()
      const filtered = notifications.filter(n => 
        new Date(n.createdAt) > cutoffDate
      )
      this.saveNotificationsToLocalStorage(filtered)
    }
  }
}

export const notificationsService = new NotificationsService()
