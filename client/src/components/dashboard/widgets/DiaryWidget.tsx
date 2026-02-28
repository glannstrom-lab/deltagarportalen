import { memo } from 'react'
import { BookHeart, Calendar, PenLine, Smile, Meh, Frown, Sparkles, Edit3, History, CheckCircle2 } from 'lucide-react'
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

  // Hämta mood-ikon och färg
  const getMoodInfo = (mood: number) => {
    switch (mood) {
      case 5: return { icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Mycket bra' }
      case 4: return { icon: Smile, color: 'text-green-500', bg: 'bg-green-100', label: 'Bra' }
      case 3: return { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Okej' }
      case 2: return { icon: Frown, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Jobbigt' }
      case 1: return { icon: Frown, color: 'text-rose-500', bg: 'bg-rose-100', label: 'Tungt' }
      default: return { icon: Meh, color: 'text-slate-400', bg: 'bg-slate-100', label: 'Ej angivet' }
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
      icon={<BookHeart size={22} />}
      to="/diary"
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
      <div className="mt-3 space-y-3">
        {/* Stort nummer med status */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center">
            {hasEntryToday ? (
              <Edit3 size={28} className="text-rose-600" />
            ) : (
              <BookHeart size={28} className="text-rose-600" />
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800">{entriesCount}</p>
            <p className="text-sm text-slate-500">
              {entriesCount === 0 ? 'Inga inlägg än' : entriesCount === 1 ? 'inlägg' : 'inlägg'}
            </p>
          </div>
        </div>
        
        {/* Status för idag */}
        {!hasEntryToday && entriesCount > 0 && (
          <div className="p-3 bg-rose-50 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <PenLine size={18} className="text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-rose-900">Du har inte skrivit idag</p>
              <p className="text-xs text-rose-600">Ta några minuter för att reflektera</p>
            </div>
          </div>
        )}
        
        {hasEntryToday && (
          <div className="p-3 bg-emerald-50 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-900">Du har skrivit idag!</p>
              <p className="text-xs text-emerald-600">Bra jobbat med att reflektera</p>
            </div>
          </div>
        )}
        
        {/* Visa senaste inlägg */}
        {lastEntry && (
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Senaste inlägget:</span>
              <span className="text-xs text-slate-400">{getTimeAgo(lastEntry.date)}</span>
            </div>
            <div className="flex items-start gap-3">
              {(() => {
                const { icon: Icon, color, bg } = getMoodInfo(lastEntry.mood)
                return (
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={color} />
                  </div>
                )
              })()}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700 line-clamp-2">{lastEntry.preview}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Humör: {getMoodInfo(lastEntry.mood).label}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Streak-indikator */}
        {streakDays > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-2xl">🔥</span>
            <span className="font-medium text-slate-700">
              {streakDays} dagars streak
            </span>
          </div>
        )}
        
        {/* Tom state */}
        {entriesCount === 0 && (
          <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-rose-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-900">Börja din dagbok</p>
                <p className="text-xs text-rose-700 mt-1">
                  Skriv om dina tankar, känslor och framsteg. 
                  Det kan hjälpa dig att se hur långt du har kommit.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
})
