import { memo } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Briefcase, 
  Video, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Flame
} from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface DiaryWidgetProps {
  // Kalender-data istället för dagboks-data
  upcomingEvents?: {
    id: string
    title: string
    date: string
    time?: string
    type: string
  }[]
  eventsThisWeek?: number
  hasConsultantMeeting?: boolean
  streakDays?: number
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// Event type config
const eventTypeConfig: Record<string, { icon: typeof Calendar; color: string; bg: string; label: string }> = {
  interview: { icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Intervju' },
  meeting: { icon: Video, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Möte' },
  deadline: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Deadline' },
  preparation: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Förberedelse' },
  default: { icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Händelse' },
}

// Format date relative
const getRelativeDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) return 'Idag'
  if (date.toDateString() === tomorrow.toDateString()) return 'Imorgon'
  
  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) {
    const weekdays = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
    return weekdays[date.getDay()]
  }
  
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

// SMALL - Ultra kompakt kalender-widget
function DiaryWidgetSmall({ 
  upcomingEvents = [], 
  eventsThisWeek = 0,
  streakDays = 0,
  loading, 
  error, 
  onRetry 
}: Omit<DiaryWidgetProps, 'size' | 'hasConsultantMeeting'>) {
  const getStatus = (): WidgetStatus => {
    if (upcomingEvents.length === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const nextEvent = upcomingEvents[0]

  return (
    <DashboardWidget
      title="Kalender"
      icon={<Calendar size={14} />}
      to="/diary"
      color="rose"
      status={status}
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-rose-500" />
        <div className="flex-1 min-w-0">
          {upcomingEvents.length === 0 ? (
            <span className="text-xs text-slate-500">Inga händelser</span>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-slate-800">{upcomingEvents.length}</span>
              <span className="text-xs text-slate-500">
                {upcomingEvents.length === 1 ? 'kommande' : 'kommande'}
              </span>
              {streakDays > 0 && (
                <span className="text-xs bg-amber-100 text-amber-600 px-1 py-0.5 rounded ml-1">
                  🔥 {streakDays}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Kalender med nästa händelser
function DiaryWidgetMedium({ 
  upcomingEvents = [], 
  eventsThisWeek = 0,
  hasConsultantMeeting = false,
  streakDays = 0,
  loading, 
  error, 
  onRetry 
}: DiaryWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (upcomingEvents.length === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const nextEvent = upcomingEvents[0]

  return (
    <DashboardWidget
      title="Kalender"
      icon={<Calendar size={20} className="text-rose-500" />}
      to="/diary"
      color="rose"
      status={status}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: upcomingEvents.length > 0 ? 'Se schema' : 'Lägg till',
      }}
    >
      <div className="space-y-3">
        {/* Stats header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            <Calendar size={24} className="text-rose-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{upcomingEvents.length}</p>
            <p className="text-xs text-slate-500">kommande händelser</p>
          </div>
          {eventsThisWeek > 0 && (
            <div className="ml-auto text-right">
              <p className="text-sm font-bold text-rose-600">{eventsThisWeek}</p>
              <p className="text-xs text-slate-500">denna vecka</p>
            </div>
          )}
        </div>

        {/* Nästa händelser */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nästkommande</p>
            {upcomingEvents.slice(0, 2).map((event) => {
              const config = eventTypeConfig[event.type] || eventTypeConfig.default
              const Icon = config.icon
              return (
                <div 
                  key={event.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer group"
                >
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon size={16} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-rose-700 transition-colors">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-600 font-medium">{getRelativeDate(event.date)}</span>
                      {event.time && (
                        <>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{event.time}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tomt state */}
        {upcomingEvents.length === 0 && (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-rose-400" />
              <div>
                <p className="font-semibold text-rose-900 text-sm">Inga planerade händelser</p>
                <p className="text-xs text-rose-600">Lägg till intervjuer och möten</p>
              </div>
            </div>
          </div>
        )}

        {/* Konsulentmöte badge */}
        {hasConsultantMeeting && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
            <Video size={14} className="text-blue-500" />
            <span className="text-xs text-blue-700">Konsulentmöte inbokat</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full kalender-överblick
function DiaryWidgetLarge({ 
  upcomingEvents = [], 
  eventsThisWeek = 0,
  hasConsultantMeeting = false,
  streakDays = 0,
  loading, 
  error, 
  onRetry 
}: DiaryWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (upcomingEvents.length === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Gruppera events per dag
  const eventsByDay = upcomingEvents.slice(0, 5).reduce((acc, event) => {
    const date = getRelativeDate(event.date)
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {} as Record<string, typeof upcomingEvents>)

  return (
    <DashboardWidget
      title="Kalender"
      icon={<Calendar size={22} className="text-rose-500" />}
      to="/diary"
      color="rose"
      status={status}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Öppna kalender',
      }}
    >
      <div className="space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100 text-center">
            <p className="text-2xl font-bold text-rose-600">{upcomingEvents.length}</p>
            <p className="text-xs text-rose-700">Kommande</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-slate-700">{eventsThisWeek}</p>
            <p className="text-xs text-slate-500">Denna vecka</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame size={16} className="text-amber-500" />
              <p className="text-2xl font-bold text-amber-600">{streakDays || 0}</p>
            </div>
            <p className="text-xs text-amber-700">Dagar i rad</p>
          </div>
        </div>

        {/* Timeline */}
        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock size={16} className="text-rose-500" />
              Kommande händelser
            </p>
            <div className="space-y-2">
              {upcomingEvents.slice(0, 4).map((event, index) => {
                const config = eventTypeConfig[event.type] || eventTypeConfig.default
                const Icon = config.icon
                return (
                  <div 
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition-all cursor-pointer group"
                  >
                    {/* Date column */}
                    <div className="w-14 text-center shrink-0">
                      <p className="text-xs font-bold text-rose-600">{getRelativeDate(event.date)}</p>
                      {event.time && (
                        <p className="text-xs text-slate-500">{event.time}</p>
                      )}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                      <Icon size={18} className={config.color} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-rose-700 transition-colors">
                        {event.title}
                      </p>
                      <span className={`text-xs ${config.color}`}>{config.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Calendar size={28} className="text-rose-400" />
            </div>
            <h3 className="font-semibold text-rose-900 mb-1">Din kalender är tom</h3>
            <p className="text-sm text-rose-600 mb-4">Lägg till intervjuer, möten och deadlines för att hålla koll på ditt jobbsökande</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1.5 bg-white rounded-lg text-xs text-slate-600 border border-rose-100">
                📅 Intervjuer
              </span>
              <span className="px-3 py-1.5 bg-white rounded-lg text-xs text-slate-600 border border-rose-100">
                💼 Möten
              </span>
              <span className="px-3 py-1.5 bg-white rounded-lg text-xs text-slate-600 border border-rose-100">
                ⏰ Deadlines
              </span>
            </div>
          </div>
        )}

        {/* Consultant meeting alert */}
        {hasConsultantMeeting && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Video size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">Konsulentmöte inbokat</p>
              <p className="text-xs text-blue-600">Du har ett möte med din arbetskonsulent</p>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// HUVUDKOMPONENT
export const DiaryWidget = memo(function DiaryWidget(props: DiaryWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <DiaryWidgetLarge {...rest} />
    case 'medium':
      return <DiaryWidgetMedium {...rest} />
    case 'small':
    default:
      return <DiaryWidgetSmall {...rest} />
  }
})
