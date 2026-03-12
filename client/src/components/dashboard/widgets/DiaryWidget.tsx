import { memo, useMemo } from 'react'
import { BookHeart, PenLine, Sparkles, Calendar, Heart, TrendingUp, Feather } from 'lucide-react'
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

// Humör-konfiguration med färger och copy
const MOOD_CONFIG = {
  5: { emoji: '😄', color: 'emerald', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', label: 'Jättebra', vibe: 'Så härligt att du har en bra dag!' },
  4: { emoji: '🙂', color: 'amber', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200', label: 'Bra', vibe: 'Skönt att det känns okej idag.' },
  3: { emoji: '😐', color: 'slate', bgColor: 'bg-slate-50', textColor: 'text-slate-700', borderColor: 'border-slate-200', label: 'Neutral', vibe: 'Det är helt okej att ha en sådan dag.' },
  2: { emoji: '😔', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', label: 'Nere', vibe: 'Skickar en varm tanke till dig idag.' },
  1: { emoji: '😢', color: 'indigo', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200', label: 'Ledsen', vibe: 'Ta hand om dig själv idag, du är värdefull.' },
}

// Inspirerande prompts för att skriva
const WRITING_PROMPTS = [
  'Vad är du tacksam över just nu?',
  'Vad har du lärt dig om dig själv på sistone?',
  'Vad ser du fram emot imorgon?',
  'Vad är en sak du kan vara snäll mot dig själv med idag?',
  'Vad har du gjort idag som du kan vara stolt över?',
  'Vilken liten sak gjorde dig glad idag?',
  'Hur känns det i kroppen just nu?',
  'Vad skulle du vilja säga till dig själv för ett år sedan?',
  'Vad är viktigast för dig just nu?',
  'Vilken stjärna är du stolt över att ha satt igår?',
]

// Hjälpfunktioner
const getMoodConfig = (mood: number) => MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG] || MOOD_CONFIG[3]
const getRandomPrompt = () => WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)]

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Idag'
  if (diffDays === 1) return 'Igår'
  if (diffDays < 7) return `${diffDays} dagar sedan`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} veckor sedan`
  return `${Math.floor(diffDays / 30)} månader sedan`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  if (isToday) {
    return 'Idag'
  }
  
  const weekdays = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  
  const weekday = weekdays[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  
  return `${weekday} ${day} ${month}`
}

// ============================================
// SMALL - Kompakt men mysig
// ============================================
function DiaryWidgetSmall({ entriesCount = 0, lastEntry, hasEntryToday = false, loading, error, onRetry }: Omit<DiaryWidgetProps, 'size' | 'streakDays'>) {
  const moodConfig = lastEntry ? getMoodConfig(lastEntry.mood) : null
  
  const getStatus = (): WidgetStatus => {
    if (entriesCount === 0) return 'empty'
    return 'complete'
  }

  return (
    <DashboardWidget
      title="Dagbok"
      icon={<BookHeart size={18} className="text-rose-500" />}
      to="/dashboard/diary"
      color="rose"
      status={getStatus()}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasEntryToday ? 'Läs' : 'Skriv',
      }}
    >
      <div className="flex flex-col items-center justify-center py-1 text-center">
        {entriesCount === 0 ? (
          // Empty state - varm och inbjudande
          <div className="relative">
            <div className="absolute inset-0 bg-rose-200 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
              <Sparkles size={22} className="text-rose-500" />
            </div>
          </div>
        ) : hasEntryToday ? (
          // Skrivet idag - visa dagens humör
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer">
              <div className={`w-14 h-14 ${moodConfig?.bgColor || 'bg-emerald-50'} rounded-2xl flex items-center justify-center mb-2 shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                <span className="text-3xl animate-bounce-subtle">{moodConfig?.emoji || '😊'}</span>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                <Heart size={10} className="text-white fill-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-emerald-600">Skrivet idag!</p>
          </div>
        ) : (
          // Inte skrivet idag - visa senaste humör eller default
          <div className="flex flex-col items-center">
            <div className="relative">
              {lastEntry ? (
                <div className={`w-12 h-12 ${moodConfig?.bgColor} rounded-2xl flex items-center justify-center mb-2 shadow-sm`}>
                  <span className="text-2xl">{moodConfig?.emoji}</span>
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-50 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                  <BookHeart size={22} className="text-rose-400" />
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-700">{entriesCount}</p>
            <p className="text-xs text-slate-400">{entriesCount === 1 ? 'inlägg' : 'inlägg'}</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// ============================================
// MEDIUM - Balanserad överblick
// ============================================
function DiaryWidgetMedium({ entriesCount = 0, lastEntry, hasEntryToday = false, loading, error, onRetry }: DiaryWidgetProps) {
  const moodConfig = lastEntry ? getMoodConfig(lastEntry.mood) : null
  const prompt = useMemo(() => getRandomPrompt(), [hasEntryToday])
  
  const getStatus = (): WidgetStatus => {
    if (entriesCount === 0) return 'empty'
    return 'complete'
  }

  return (
    <DashboardWidget
      title="Dagbok"
      icon={<BookHeart size={20} className="text-rose-500" />}
      to="/dashboard/diary"
      color="rose"
      status={getStatus()}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasEntryToday ? 'Läs dagbok' : 'Skriv en rad',
      }}
    >
      <div className="space-y-3">
        {entriesCount === 0 ? (
          // Empty state - locka till att börja skriva
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 rounded-2xl border border-rose-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200 rounded-full blur-2xl opacity-20 -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Sparkles size={22} className="text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-rose-900 mb-1">Din personliga plats</p>
                <p className="text-sm text-rose-700 leading-relaxed">
                  Börja skriva om dina tankar, känslor och framsteg. Inget måste vara perfekt här.
                </p>
              </div>
            </div>
          </div>
        ) : hasEntryToday ? (
          // Skrivet idag - visa senaste inlägget snyggt
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="text-2xl animate-bounce-subtle">{moodConfig?.emoji}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center border-2 border-white">
                  <Heart size={9} className="text-white fill-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{formatDate(lastEntry?.date || new Date().toISOString())}</p>
                <p className="text-xs text-slate-500">{moodConfig?.vibe}</p>
              </div>
            </div>
            
            {lastEntry && (
              <div className={`p-3 ${moodConfig?.bgColor} ${moodConfig?.borderColor} border rounded-xl`}>
                <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">"{lastEntry.preview}"</p>
              </div>
            )}
          </div>
        ) : (
          // Inte skrivet idag - uppmuntran att skriva
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-50 rounded-2xl flex items-center justify-center shadow-sm">
                <PenLine size={22} className="text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Vill du skriva idag?</p>
                <p className="text-xs text-slate-500">Ingen press, bara om du känner för det</p>
              </div>
            </div>
            
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs font-medium text-rose-600 mb-1">💭 Dagens tanke:</p>
              <p className="text-sm text-slate-700 italic">"{prompt}"</p>
            </div>
            
            {lastEntry && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <span className="text-lg">{moodConfig?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Senaste: {getTimeAgo(lastEntry.date)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// ============================================
// LARGE - Full dagboks-upplevelse
// ============================================
function DiaryWidgetLarge({ entriesCount = 0, lastEntry, streakDays = 0, hasEntryToday = false, loading, error, onRetry }: DiaryWidgetProps) {
  const moodConfig = lastEntry ? getMoodConfig(lastEntry.mood) : null
  const prompt = useMemo(() => getRandomPrompt(), [hasEntryToday])
  
  // Simulerad vecka (i verkligheten hämtas detta från API)
  const weekMoods = useMemo(() => {
    if (!lastEntry) return []
    return [
      { day: 'M', mood: 4, hasEntry: true },
      { day: 'T', mood: 3, hasEntry: true },
      { day: 'O', mood: 5, hasEntry: true },
      { day: 'T', mood: 2, hasEntry: true },
      { day: 'F', mood: 4, hasEntry: true },
      { day: 'L', mood: 0, hasEntry: false },
      { day: 'S', mood: hasEntryToday ? lastEntry.mood : 0, hasEntry: hasEntryToday },
    ]
  }, [lastEntry, hasEntryToday])
  
  const getStatus = (): WidgetStatus => {
    if (entriesCount === 0) return 'empty'
    return 'complete'
  }

  const today = new Date()
  const weekdayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
  const todayName = weekdayNames[today.getDay()]
  
  const months = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
  const todayDate = `${today.getDate()} ${months[today.getMonth()]}`

  return (
    <DashboardWidget
      title="Dagbok"
      icon={<BookHeart size={22} className="text-rose-500" />}
      to="/dashboard/diary"
      color="rose"
      status={getStatus()}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasEntryToday ? 'Läs dagbok' : 'Skriv nytt inlägg',
      }}
    >
      <div className="space-y-4">
        {entriesCount === 0 ? (
          // ============================================
          // EMPTY STATE - Snyggaste möjliga
          // ============================================
          <div className="relative overflow-hidden">
            {/* Dekorativ bakgrund */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 rounded-2xl" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-200 rounded-full blur-3xl opacity-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-200 rounded-full blur-3xl opacity-20" />
            
            <div className="relative p-5">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-4 relative">
                  <div className="absolute inset-0 bg-rose-100 rounded-2xl animate-pulse opacity-50" />
                  <Feather size={28} className="text-rose-500 relative" />
                </div>
                <h3 className="text-lg font-bold text-rose-900 mb-2">Välkommen till din dagbok</h3>
                <p className="text-sm text-rose-700 max-w-xs mx-auto leading-relaxed">
                  En trygg plats för dina tankar. Inga krav, ingen prestation - bara du och dina ord.
                </p>
              </div>
              
              {/* Fördelar */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl text-center shadow-sm">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">😌</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700">Reflektera</p>
                </div>
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl text-center shadow-sm">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">📈</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700">Följ din resa</p>
                </div>
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl text-center shadow-sm">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">💝</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700">Var snäll</p>
                </div>
              </div>
              
              {/* CTA */}
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-rose-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-rose-400 flex-shrink-0" />
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Dagens tanke:</span> "{WRITING_PROMPTS[0]}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ============================================
          // HAR INLÄGG - Full upplevelse
          // ============================================
          <>
            {/* Header med dag och datum */}
            <div className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4 border border-rose-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200 rounded-full blur-2xl opacity-20" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-rose-500 uppercase tracking-wide">{todayDate}</p>
                  <h3 className="text-xl font-bold text-rose-900">{todayName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {hasEntryToday ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-full">
                      <Heart size={14} className="text-emerald-600 fill-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Skrivet idag</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/70 rounded-full">
                      <Calendar size={14} className="text-rose-400" />
                      <span className="text-sm text-slate-600">Väntar på dig</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Veckans översikt / Humör-historik */}
            {weekMoods.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Din vecka</span>
                  </div>
                  {streakDays > 0 && (
                    <span className="text-xs text-rose-600 font-medium">🔥 {streakDays} dagar i rad</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  {weekMoods.map((day, idx) => {
                    const dayMood = day.mood > 0 ? getMoodConfig(day.mood) : null
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5">
                        <div 
                          className={`
                            w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                            ${day.hasEntry 
                              ? `${dayMood?.bgColor} ${dayMood?.borderColor} border shadow-sm` 
                              : 'bg-white border border-slate-200'
                            }
                            ${day.hasEntry ? 'hover:scale-110' : ''}
                          `}
                        >
                          {day.hasEntry ? (
                            <span className="text-lg animate-bounce-subtle">{dayMood?.emoji}</span>
                          ) : (
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                          )}
                        </div>
                        <span className={`text-xs ${day.hasEntry ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                          {day.day}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Senaste inlägget eller "Skriv idag" */}
            {hasEntryToday && lastEntry ? (
              // Visa dagens inlägg
              <div className={`p-4 ${moodConfig?.bgColor} ${moodConfig?.borderColor} border rounded-2xl`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-2xl animate-bounce-subtle">{moodConfig?.emoji}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Dagens inlägg</p>
                    <p className="text-xs text-slate-500">{moodConfig?.vibe}</p>
                  </div>
                </div>
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl">
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">"{lastEntry.preview}"</p>
                </div>
              </div>
            ) : (
              // Uppmuntran att skriva
              <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <PenLine size={22} className="text-rose-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-rose-900 mb-1">Skriv en rad om dagen</p>
                    <p className="text-sm text-rose-700 mb-3">Det behöver inte vara mycket - bara några tankar om hur du mår.</p>
                    
                    <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl mb-3">
                      <p className="text-xs font-medium text-rose-600 mb-1">💭 Dagens tanke:</p>
                      <p className="text-sm text-slate-700 italic">"{prompt}"</p>
                    </div>
                    
                    <p className="text-xs text-rose-500">Klicka för att börja skriva ✨</p>
                  </div>
                </div>
              </div>
            )}

            {/* Statistik */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <p className="text-xl font-bold text-slate-700">{entriesCount}</p>
                <p className="text-xs text-slate-500">Totalt inlägg</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <p className="text-xl font-bold text-slate-700">{Math.min(entriesCount, 7)}</p>
                <p className="text-xs text-slate-500">Denna vecka</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <p className="text-xl font-bold text-slate-700">{streakDays || '-'}</p>
                <p className="text-xs text-slate-500">Dagar i rad</p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

// ============================================
// HUVUDKOMPONENT
// ============================================
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
