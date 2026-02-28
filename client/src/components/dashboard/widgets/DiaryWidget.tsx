import { memo } from 'react'
import { BookHeart, PenLine, Smile, Meh, Frown, Sparkles, Edit3, History, Calendar, Clock } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface DiaryWidgetProps {
  entriesCount?: number
  lastEntry?: { date: string; mood: 1 | 2 | 3 | 4 | 5; preview: string } | null
  streakDays?: number
  hasEntryToday?: boolean
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// Mood emoji helper
const getMoodEmoji = (mood: number) => {
  switch (mood) {
    case 5: return '😄'
    case 4: return '🙂'
    case 3: return '😐'
    case 2: return '😔'
    case 1: return '😢'
    default: return '😐'
  }
}

// SMALL - Enkelt status + antal
function DiaryWidgetSmall({ entriesCount = 0, hasEntryToday = false, loading, error, onRetry }: Omit<DiaryWidgetProps, 'size' | 'lastEntry' | 'streakDays'>) {
  const getStatus = (): WidgetStatus => {
    if (entriesCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Dagbok"
      icon={<BookHeart size={20} />}
      to="/diary"
      color="rose"
      status={status}
      progress={Math.min(100, (entriesCount / 7) * 100)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasEntryToday ? 'Läs' : 'Skriv',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        {hasEntryToday ? (
          <>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
              <Edit3 size={20} className="text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700">Skrivet idag!</p>
          </>
        ) : (
          <>
            <BookHeart size={28} className="text-rose-500 mb-2" />
            <p className="text-3xl font-bold text-slate-800">{entriesCount}</p>
            <p className="text-sm text-slate-500">{entriesCount === 1 ? 'inlägg' : 'inlägg'}</p>
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Senaste inlägg + humör
function DiaryWidgetMedium({ entriesCount = 0, lastEntry, hasEntryToday = false, loading, error, onRetry }: DiaryWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (entriesCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  return (
    <DashboardWidget
      title="Dagbok"
      icon={<BookHeart size={22} />}
      to="/diary"
      color="rose"
      status={status}
      progress={Math.min(100, (entriesCount / 7) * 100)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasEntryToday ? 'Läs dagbok' : 'Skriv en rad',
      }}
    >
      <div className="space-y-3">
        {/* Antal */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            {hasEntryToday ? (
              <Edit3 size={24} className="text-emerald-600" />
            ) : (
              <BookHeart size={24} className="text-rose-600" />
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{entriesCount}</p>
            <p className="text-xs text-slate-500">{entriesCount === 1 ? 'inlägg' : 'inlägg'}</p>
          </div>
        </div>

        {/* Status för idag */}
        {!hasEntryToday && entriesCount > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-600">Vill du skriva en rad?</p>
            <p className="text-xs text-slate-400 mt-1">Det är okej att ta det lugnt idag</p>
          </div>
        )}

        {hasEntryToday && (
          <div className="p-3 bg-emerald-50 rounded-xl">
            <p className="text-sm text-emerald-700">Du har skrivit idag!</p>
            <p className="text-xs text-emerald-600 mt-1">Bra jobbat med att reflektera</p>
          </div>
        )}

        {/* Senaste inlägg */}
        {lastEntry && (
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Senaste: {getTimeAgo(lastEntry.date)}</span>
              <span className="text-lg">{getMoodEmoji(lastEntry.mood)}</span>
            </div>
            <p className="text-sm text-slate-700 line-clamp-2">{lastEntry.preview}</p>
          </div>
        )}

        {/* Empty state */}
        {entriesCount === 0 && (
          <div className="p-3 bg-rose-50 rounded-lg">
            <p className="text-sm text-rose-700">Börja din dagbok</p>
            <p className="text-xs text-rose-600 mt-1">Skriv om dina tankar och framsteg</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full dagboksöversikt
function DiaryWidgetLarge({ entriesCount = 0, lastEntry, hasEntryToday = false, loading, error, onRetry }: DiaryWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (entriesCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  return (
    <DashboardWidget
      title="Dagbok"
      icon={<BookHeart size={24} />}
      to="/diary"
      color="rose"
      status={status}
      progress={Math.min(100, (entriesCount / 7) * 100)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasEntryToday ? 'Läs dagbok' : 'Skriv nytt inlägg',
      }}
      secondaryAction={entriesCount > 0 ? {
        label: 'Se historik',
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-4">
        {/* Header med status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-xl">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <BookHeart size={28} className="text-rose-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-rose-700">{entriesCount}</p>
              <p className="text-sm text-rose-600">{entriesCount === 1 ? 'inlägg' : 'inlägg'}</p>
            </div>
          </div>
          <div className={`flex items-center gap-4 p-4 rounded-xl ${hasEntryToday ? 'bg-emerald-50' : 'bg-slate-50'}`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${hasEntryToday ? 'bg-white' : 'bg-white'}`}>
              {hasEntryToday ? (
                <Edit3 size={28} className="text-emerald-600" />
              ) : (
                <Calendar size={28} className="text-slate-500" />
              )}
            </div>
            <div>
              {hasEntryToday ? (
                <>
                  <p className="text-lg font-bold text-emerald-700">Skrivet!</p>
                  <p className="text-sm text-emerald-600">Du har skrivit idag</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-700">Inte skrivet</p>
                  <p className="text-sm text-slate-500">Det är okej att ta det lugnt</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Senaste inlägget - prominently */}
        {lastEntry ? (
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Senaste inlägget</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getMoodEmoji(lastEntry.mood)}</span>
                <span className="text-sm text-slate-400">{getTimeAgo(lastEntry.date)}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl">
              <p className="text-slate-700 leading-relaxed">{lastEntry.preview}</p>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Humör: {lastEntry.mood}/5
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Sparkles size={32} className="text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-rose-900 mb-2">Börja din dagbok</p>
                <p className="text-sm text-rose-700 mb-4">
                  Skriv om dina tankar, känslor och framsteg. Det kan hjälpa dig att 
                  se hur långt du har kommit i ditt jobbsökande.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-xl text-center">
                    <Smile size={20} className="text-rose-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Logga humör</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl text-center">
                    <PenLine size={20} className="text-rose-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Fria tankar</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl text-center">
                    <History size={20} className="text-rose-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Se tillbaka</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent
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
