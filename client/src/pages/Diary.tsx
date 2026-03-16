import { useState, useRef } from 'react'
import { Plus, BookHeart, Calendar as CalendarIcon, TrendingUp, Sparkles } from 'lucide-react'
import { PageLayout } from '@/components/layout/index'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { DailyTask } from '@/components/diary/DailyTask'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { EventModal } from '@/components/calendar/EventModal'
import { CalendarStats } from '@/components/calendar/CalendarStats'
import { MoodTracker } from '@/components/calendar/MoodTracker'
import type {
  CalendarEvent,
  CalendarView,
  CalendarGoal,
  MoodEntry
} from '@/services/calendarData'
import { eventTypeConfig } from '@/services/calendarData'
import { useAchievementTracker } from '@/hooks/useAchievementTracker'

// Mock data - behålls från Calendar
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Jobbintervju - Tech Solutions',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '10:00',
    endTime: '11:00',
    type: 'interview',
    location: 'Stockholm, Kungsgatan 12',
    with: 'Anna Svensson, CTO',
    description: 'Andra intervjun med tekniska frågor',
    tasks: [
      { id: 't1', eventId: '1', title: 'Uppdatera CV', status: 'done', order: 0 },
      { id: 't2', eventId: '1', title: 'Förbereda tekniska frågor', status: 'in_progress', order: 1 },
      { id: 't3', eventId: '1', title: 'Kolla upp företaget', status: 'todo', order: 2 },
    ],
    interviewPrep: {
      commonQuestions: ['Berätta om dig själv', 'Varför vill du jobba här?'],
      dressCode: 'Smart casual',
    },
    travel: {
      destination: 'Kungsgatan 12, Stockholm',
      duration: 45,
      transportMode: 'public',
      cost: 78,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Möte med arbetskonsulent',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    type: 'meeting',
    isVideo: true,
    with: 'Maria Karlsson',
    description: 'Veckovis uppföljning av jobbsökande',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Sista ansökningsdag - Digital Agency',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    time: '23:59',
    type: 'deadline',
    description: 'React-utvecklare position',
    tasks: [
      { id: 't4', eventId: '3', title: 'Skriva personligt brev', status: 'todo', order: 0 },
      { id: 't5', eventId: '3', title: 'Uppdatera portfolio', status: 'todo', order: 1 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Förberedelse inför intervju',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '09:00',
    type: 'preparation',
    description: 'Gå igenom vanliga intervjufrågor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockGoals: CalendarGoal[] = [
  { id: 'g1', type: 'applications', target: 5, period: 'week', startDate: new Date().toISOString() },
  { id: 'g2', type: 'interviews', target: 2, period: 'week', startDate: new Date().toISOString() },
  { id: 'g3', type: 'tasks', target: 10, period: 'week', startDate: new Date().toISOString() },
]

const mockMoodEntries: MoodEntry[] = [
  { date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], level: 4, energyLevel: 3, stressLevel: 2 },
  { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], level: 3, energyLevel: 3, stressLevel: 3 },
  { date: new Date().toISOString().split('T')[0], level: 4, energyLevel: 4, stressLevel: 2 },
]

// Mock data för dagbok
interface DiaryEntry {
  id: string
  date: string
  title: string
  content: string
  mood: 1 | 2 | 3 | 4 | 5
  tags: string[]
  wordCount: number
}

const mockDiaryEntries: DiaryEntry[] = [
  {
    id: 'd1',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    title: 'Förberedelser inför intervjun',
    content: 'Idag har jag förberett mig inför morgondagens intervju. Känner mig både nervös och taggad. Har gått igenom vanliga frågor och försökt tänka på konkreta exempel från min tidigare erfarenhet.',
    mood: 4,
    tags: ['intervju', 'förberedelse', 'nervös'],
    wordCount: 42,
  },
  {
    id: 'd2',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    title: 'En tung dag',
    content: 'Det kändes jobbigt idag. Fick avslag på en ansökan jag verkligen hade hoppats på. Men jag försöker tänka att det finns andra möjligheter där ute. Ska ta en paus imorgon och bara fokusera på mig själv.',
    mood: 2,
    tags: ['avslag', 'tungt', 'självvård'],
    wordCount: 38,
  },
  {
    id: 'd3',
    date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    title: 'Bra möte med konsulenten',
    content: 'Träffade Maria idag och hon gav mig bra feedback på mitt CV. Känner mig mer positiv nu och har en tydligare plan för vad jag ska fokusera på kommande vecka.',
    mood: 5,
    tags: ['positivt', 'feedback', 'planering'],
    wordCount: 35,
  },
]

// Hjälpfunktion för humör-emoji
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

// Hjälpfunktion för humör-färg
const getMoodColor = (mood: number) => {
  switch (mood) {
    case 5: return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 4: return 'bg-green-100 text-green-700 border-green-200'
    case 3: return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 2: return 'bg-orange-100 text-orange-700 border-orange-200'
    case 1: return 'bg-rose-100 text-rose-700 border-rose-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export default function Diary() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents)
  const [goals] = useState<CalendarGoal[]>(mockGoals)
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(mockMoodEntries)
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(mockDiaryEntries)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<DiaryEntry | null>(null)
  const [isWritingMode, setIsWritingMode] = useState(false)
  const { trackDiaryEntry } = useAchievementTracker()
  const diaryTitleRef = useRef<HTMLInputElement>(null)
  const diaryContentRef = useRef<HTMLTextAreaElement>(null)
  const diaryMoodRef = useRef<number>(3)

  // Formatera datum
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short'
    })
  }

  // Beräkna statistik
  const totalWords = diaryEntries.reduce((sum, entry) => sum + entry.wordCount, 0)
  const totalEntries = diaryEntries.length
  const streakDays = 3 // Mock
  const avgMood = moodEntries.length > 0 
    ? (moodEntries.reduce((sum, e) => sum + e.level, 0) / moodEntries.length).toFixed(1)
    : '-'

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date())
    } else {
      const newDate = new Date(currentDate)
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
      } else if (view === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
      } else if (view === 'day') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
      }
      setCurrentDate(newDate)
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    setView('day')
  }

  const handleSaveEvent = (event: CalendarEvent) => {
    if (selectedEvent) {
      setEvents(events.map(e => e.id === event.id ? event : e))
    } else {
      setEvents([...events, event])
    }
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId))
  }

  const handleAddMood = (entry: MoodEntry) => {
    const filtered = moodEntries.filter(e => e.date !== entry.date)
    setMoodEntries([...filtered, entry])
  }

  const handleSaveDiaryEntry = () => {
    const title = diaryTitleRef.current?.value || 'Utan titel'
    const content = diaryContentRef.current?.value || ''

    if (!content.trim()) return

    const newEntry: DiaryEntry = {
      id: `d${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title,
      content,
      mood: diaryMoodRef.current as 1 | 2 | 3 | 4 | 5,
      tags: [],
      wordCount: content.split(/\s+/).filter(w => w).length
    }

    setDiaryEntries([newEntry, ...diaryEntries])
    setIsWritingMode(false)

    // Track diary entry achievement
    trackDiaryEntry()
  }

  // Month view render
  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    const days = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

    const getEventsForDate = (dateStr: string) => {
      return events.filter(event => event.date === dateStr)
    }

    const getDiaryForDate = (dateStr: string) => {
      return diaryEntries.find(entry => entry.date === dateStr)
    }

    const getMoodForDate = (dateStr: string) => {
      return moodEntries.find(entry => entry.date === dateStr)
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {days.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startingDay }).map((_, index) => (
            <div key={`empty-${index}`} className="h-28 border-b border-r border-slate-100 bg-slate-50/50" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = getEventsForDate(dateStr)
            const dayDiary = getDiaryForDate(dateStr)
            const dayMood = getMoodForDate(dateStr)
            const isToday = new Date().toISOString().split('T')[0] === dateStr

            return (
              <button
                key={day}
                onClick={() => handleDateClick(new Date(dateStr))}
                className="h-28 border-b border-r border-slate-100 p-2 text-left transition-colors relative overflow-hidden hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <span className={`
                    inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                    ${isToday ? 'bg-teal-600 text-white' : 'text-slate-700'}
                  `}>
                    {day}
                  </span>
                  
                  {/* Indikatorer för dagbok/humör */}
                  <div className="flex gap-0.5">
                    {dayDiary && (
                      <div className="w-2 h-2 bg-violet-500 rounded-full" title="Dagbok skriven" />
                    )}
                    {dayMood && (
                      <div className="w-2 h-2 bg-amber-500 rounded-full" title="Humör loggat" />
                    )}
                  </div>
                </div>
                
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => {
                      const config = eventTypeConfig[event.type]
                      return (
                        <div
                          key={event.id}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${config.bgColor} ${config.color}`}
                        >
                          {event.time} {event.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-slate-500 px-1.5">
                        +{dayEvents.length - 2} till
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Agenda view
  const renderAgendaView = () => {
    const sortedEvents = [...events].sort((a, b) => 
      a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
    )

    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Kommande händelser</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {sortedEvents.map((event) => {
            const config = eventTypeConfig[event.type]
            const date = new Date(event.date)
            const isPast = date < new Date() && date.toDateString() !== new Date().toDateString()
            
            return (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-start gap-4 ${
                  isPast ? 'opacity-50' : ''
                }`}
              >
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <div className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900">{event.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {event.time}
                  </p>
                  {event.location && (
                    <p className="text-sm text-slate-400 mt-1">{event.location}</p>
                  )}
                </div>
              </button>
            )
          })}
          {sortedEvents.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              Inga händelser planerade
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      title="Dagbok"
      description="Din personliga dagbok och kalender"
      showTabs={false}
    >
      <div className="space-y-6">

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <BookHeart size={16} />
            <span>Dagboksinlägg</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalEntries}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <TrendingUp size={16} />
            <span>Ord skrivna</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalWords}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Sparkles size={16} />
            <span>Dagar i rad</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{streakDays} 🔥</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <CalendarIcon size={16} />
            <span>Snitt-humör</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{avgMood}/5</p>
        </div>
      </div>

      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={navigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Kalender</h2>
            {view === 'month' && renderMonthView()}
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
              />
            )}
            {view === 'day' && (
              <DayView
                date={currentDate}
                events={events}
                onEventClick={handleEventClick}
              />
            )}
            {view === 'agenda' && renderAgendaView()}
          </div>

          {/* Recent Diary Entries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Senaste dagboksinläggen</h2>
              <button 
                onClick={() => setIsWritingMode(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Plus size={16} />
                Nytt inlägg
              </button>
            </div>
            
            <div className="space-y-3">
              {diaryEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedDiaryEntry(entry)}
                  className="w-full text-left bg-white rounded-xl p-4 border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{entry.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getMoodColor(entry.mood)}`}>
                          {getMoodEmoji(entry.mood)} {entry.mood}/5
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {entry.content}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{formatDate(entry.date)}</span>
                        <span>•</span>
                        <span>{entry.wordCount} ord</span>
                        {entry.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex gap-1">
                              {entry.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {diaryEntries.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <BookHeart size={48} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-2">Inga dagboksinlägg än</p>
                  <p className="text-sm text-slate-400 mb-4">Börja skriva för att spara dina tankar och reflektioner</p>
                  <button 
                    onClick={() => setIsWritingMode(true)}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
                  >
                    Skriv ditt första inlägg
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Daily Task */}
          <DailyTask />

          {/* Add event button */}
          <button
            onClick={() => {
              setSelectedEvent(null)
              setIsModalOpen(true)
            }}
            className="w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Ny händelse
          </button>

          {/* Mood Tracker */}
          <MoodTracker
            entries={moodEntries}
            onAddEntry={handleAddMood}
          />

          {/* Stats */}
          <CalendarStats
            events={events}
            goals={goals}
            moodEntries={moodEntries}
          />
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Diary Entry Modal */}
      {selectedDiaryEntry && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDiaryEntry(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedDiaryEntry.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {formatDate(selectedDiaryEntry.date)} · {selectedDiaryEntry.wordCount} ord
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedDiaryEntry(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border mb-4 ${getMoodColor(selectedDiaryEntry.mood)}`}>
                <span className="text-lg">{getMoodEmoji(selectedDiaryEntry.mood)}</span>
                <span>Humör: {selectedDiaryEntry.mood}/5</span>
              </div>
              
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedDiaryEntry.content}
              </p>
              
              {selectedDiaryEntry.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500 mb-2">Taggar:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDiaryEntry.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Write Diary Modal */}
      {isWritingMode && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setIsWritingMode(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Nytt dagboksinlägg</h2>
                <button 
                  onClick={() => setIsWritingMode(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Titel
                  </label>
                  <input
                    ref={diaryTitleRef}
                    type="text"
                    placeholder="Vad handlar dagen om?"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hur mår du idag?
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((mood) => (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => { diaryMoodRef.current = mood }}
                        className="flex-1 py-3 rounded-xl border-2 border-slate-200 hover:border-violet-400 focus:border-violet-500 transition-colors flex flex-col items-center gap-1"
                      >
                        <span className="text-2xl">{getMoodEmoji(mood)}</span>
                        <span className="text-xs text-slate-500">{mood}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Din text
                  </label>
                  <textarea
                    ref={diaryContentRef}
                    rows={8}
                    placeholder="Skriv om din dag, dina tankar, känslor eller framsteg..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Taggar (valfritt)
                  </label>
                  <input
                    type="text"
                    placeholder="t.ex. intervju, positivt, utmaning (separera med komma)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsWritingMode(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleSaveDiaryEntry}
                  className="flex-1 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
                >
                  Spara inlägg
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageLayout>
  )
}
