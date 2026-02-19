import { useState, useEffect } from 'react'
import { 
  Bell, 
  X, 
  Trash2, 
  Briefcase,
  Clock,
  MapPin,
  Settings,
  Plus
} from 'lucide-react'
import { notificationsService, type JobNotification, type JobAlert } from '../services/notificationsService'
import { afApi, type JobAd } from '../services/arbetsformedlingenApi'

export default function NotificationsCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<JobNotification[]>([])
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [newAlertQuery, setNewAlertQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobAd | null>(null)

  // Ladda data
  useEffect(() => {
    setNotifications(notificationsService.getNotifications())
    setAlerts(notificationsService.getAlerts())
    setUnreadCount(notificationsService.getUnreadCount())
  }, [isOpen])

  // Starta övervakning
  useEffect(() => {
    const cleanup = notificationsService.startMonitoring((newNotifications) => {
      setNotifications(prev => [...newNotifications, ...prev])
      setUnreadCount(prev => prev + newNotifications.length)
    })

    // Begär notifikationsbehörighet
    notificationsService.requestNotificationPermission()

    return cleanup
  }, [])

  const handleMarkAsRead = (id: string) => {
    notificationsService.markAsRead(id)
    setNotifications(notificationsService.getNotifications())
    setUnreadCount(notificationsService.getUnreadCount())
  }

  const handleMarkAllAsRead = () => {
    notificationsService.markAllAsRead()
    setNotifications(notificationsService.getNotifications())
    setUnreadCount(0)
  }

  const handleDeleteAlert = (id: string) => {
    notificationsService.deleteAlert(id)
    setAlerts(notificationsService.getAlerts())
  }

  const handleCreateAlert = () => {
    if (!newAlertQuery.trim()) return
    
    notificationsService.createAlert({
      name: newAlertQuery,
      query: newAlertQuery,
    })
    
    setAlerts(notificationsService.getAlerts())
    setNewAlertQuery('')
  }

  const handleCheckNow = async (alert: JobAlert) => {
    const newNotifications = await notificationsService.checkAlert(alert)
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev])
      setUnreadCount(prev => prev + newNotifications.length)
    }
  }

  const fetchJobDetails = async (jobId: string) => {
    try {
      const job = await afApi.getJobById(jobId)
      setSelectedJob(job)
    } catch (error) {
      console.error('Error fetching job:', error)
    }
  }

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 bg-white text-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all border border-slate-200"
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="font-medium text-sm hidden sm:inline">
          {unreadCount > 0 ? `${unreadCount} nya` : 'Bevakningar'}
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-xl">
                  <Bell className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {showSettings ? 'Jobbbevakningar' : 'Notifikationer'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {showSettings 
                      ? `${alerts.length} bevakningar` 
                      : `${unreadCount} olästa`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-teal-100 text-teal-600' : 'hover:bg-slate-100'}`}
                  title={showSettings ? 'Visa notifikationer' : 'Hantera bevakningar'}
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh]">
              {showSettings ? (
                // Settings / Alerts view
                <div className="p-6 space-y-6">
                  {/* Create new alert */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-semibold text-slate-900 mb-3">Skapa ny bevakning</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAlertQuery}
                        onChange={(e) => setNewAlertQuery(e.target.value)}
                        placeholder="T.ex. 'utvecklare', 'sjuksköterska', 'lärare'..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateAlert()}
                      />
                      <button
                        onClick={handleCreateAlert}
                        disabled={!newAlertQuery.trim()}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Lägg till
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Du får notifikationer när nya jobb matchar din sökning. Vi kontrollerar var 5:e minut.
                    </p>
                  </div>

                  {/* Alerts list */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900">Dina bevakningar</h3>
                    {alerts.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">
                        Inga bevakningar än. Skapa en ovan för att börja få notifikationer!
                      </p>
                    ) : (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-slate-300"
                        >
                          <div>
                            <h4 className="font-medium text-slate-900">{alert.name}</h4>
                            <p className="text-sm text-slate-500">
                              Senast kontrollerad: {new Date(alert.lastChecked).toLocaleString('sv-SE')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCheckNow(alert)}
                              className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg"
                            >
                              Kontrollera nu
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                // Notifications view
                <div className="divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">Inga notifikationer än</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Skapa en jobbbevakning för att få notifikationer
                      </p>
                    </div>
                  ) : (
                    <>
                      {unreadCount > 0 && (
                        <div className="p-3 bg-slate-50 flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            {unreadCount} olästa notifikationer
                          </span>
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                          >
                            Markera alla som lästa
                          </button>
                        </div>
                      )}
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-teal-50/30' : ''
                          }`}
                          onClick={() => {
                            handleMarkAsRead(notification.id)
                            fetchJobDetails(notification.jobId)
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${!notification.read ? 'bg-teal-100' : 'bg-slate-100'}`}>
                              <Briefcase className={`w-4 h-4 ${!notification.read ? 'text-teal-600' : 'text-slate-500'}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-medium ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-slate-600">{notification.employer}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                {notification.municipality && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    {notification.municipality}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {new Date(notification.createdAt).toLocaleString('sv-SE')}
                                </span>
                              </div>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-teal-500 rounded-full mt-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedJob.headline}</h2>
                <p className="text-slate-600">{selectedJob.employer.name}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: selectedJob.description?.text_formatted || selectedJob.description?.text || '' 
              }}
            />

            {selectedJob.application_details?.url && (
              <a
                href={selectedJob.application_details.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
              >
                <Briefcase className="w-4 h-4" />
                Ansök nu
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
