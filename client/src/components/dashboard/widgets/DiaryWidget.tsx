import { memo } from 'react'
import { BookHeart, Calendar, PenLine, Smile, Meh, Frown } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface DiaryWidgetProps {
  entriesCount?: number
  lastEntry?: { date: string; mood: 1 | 2 | 3 | 4 | 5; preview: string } | null
  streakDays?: number
  hasEntryToday?: boolean
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const DiaryWidget = memo(function DiaryWidget({
  entriesCount = 0,
  lastEntry,
  streakDays = 0,
  hasEntryToday = false,
  loading,
  error,
  onRetry,
}: DiaryWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (entriesCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Hämta mood-ikon baserat på humör
  const getMoodIcon = (mood: number) => {
    switch (mood) {
      case 5: return <Smile size={16} className="text-emerald-500" />
      case 4: return <Smile size={16} className="text-green-500" />
      case 3: return <Meh size={16} className="text-yellow-500" />
      case 2: return <Frown size={16} className="text-orange-500" />
      case 1: return <Frown size={16} className="text-rose-500" />
      default: return <Meh size={16} className="text-slate-400" />
    }
  }

  // Formatera datum
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  return (
    <DashboardWidget
      title="Dagbok"
      icon={<BookHeart size={20} />}
      to="/calendar"
      color="rose"
      status={status}
      progress={Math.min(100, (entriesCount / 7) * 100)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { label: 'Antal inlägg', value: entriesCount },
        ...(streakDays > 0 ? [{ 
          label: 'Dagar i rad', 
          value: streakDays,
          trend: 'up' as const
        }] : []),
      ]}
      primaryAction={{
        label: hasEntryToday ? 'Läs dagbok' : 'Skriv idag',
      }}
    >
      {/* Status för idag */}
      {!hasEntryToday && entriesCount > 0 && (
        <div className="mt-2 p-2 bg-rose-50 rounded-lg flex items-center gap-2">
          <PenLine size={14} className="text-rose-500" />
          <span className="text-sm text-rose-700">
            Du har inte skrivit idag än
          </span>
        </div>
      )}
      
      {/* Visa senaste inlägg */}
      {lastEntry && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-1">Senaste inlägget:</p>
          <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
            {getMoodIcon(lastEntry.mood)}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700 line-clamp-2">
                {lastEntry.preview}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {getTimeAgo(lastEntry.date)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Streak-indikator */}
      {streakDays > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-rose-500">🔥</span>
          <span className="font-medium text-slate-700">
            {streakDays} dagars streak!
          </span>
        </div>
      )}
      
      {/* Tom state */}
      {entriesCount === 0 && (
        <div className="mt-2 p-3 bg-rose-50 rounded-lg">
          <p className="text-sm text-rose-700">
            I din dagbok kan du skriva om dina tankar, känslor 
            och framsteg i jobbsökandet.
          </p>
        </div>
      )}
    </DashboardWidget>
  )
})
