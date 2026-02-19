// ==========================================
// KALENDER - UTÖKADE TYPER OCH DATA
// ==========================================

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export type EventType = 'interview' | 'meeting' | 'deadline' | 'reminder' | 'task' | 'followup' | 'preparation'

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface CalendarTask {
  id: string
  eventId: string
  title: string
  status: TaskStatus
  order: number
}

export interface TravelInfo {
  destination?: string
  origin?: string
  duration?: number // minuter
  transportMode?: 'public' | 'car' | 'bike' | 'walk'
  route?: string
  departureTime?: string
  arrivalTime?: string
  cost?: number
  reimbursed?: boolean
}

export interface InterviewPrep {
  companyResearch?: string
  commonQuestions?: string[]
  questionsToAsk?: string[]
  dressCode?: string
  materialsNeeded?: string[]
  companyNews?: string[]
  interviewerInfo?: {
    name: string
    role: string
    linkedin?: string
  }[]
}

export interface MoodEntry {
  date: string
  level: MoodLevel
  note?: string
  energyLevel: 1 | 2 | 3 | 4 | 5
  stressLevel: 1 | 2 | 3 | 4 | 5
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval: number // var X:e dag/vecka/månad
  daysOfWeek?: number[] // 0-6 för veckodagar
  endDate?: string
  occurrences?: number
}

export interface SmartReminder {
  id: string
  eventId: string
  triggerTime: string // ISO datetime
  type: 'email' | 'sms' | 'push' | 'in_app'
  message: string
  sent: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  endTime?: string // HH:mm
  type: EventType
  location?: string
  isVideo?: boolean
  isPhone?: boolean
  description?: string
  with?: string
  
  // Jobb-integration
  jobId?: string // Koppling till sparat jobb
  jobApplicationId?: string
  
  // Uppgiftshantering
  tasks?: CalendarTask[]
  
  // Reseplanering
  travel?: TravelInfo
  
  // Intervjuförberedelse
  interviewPrep?: InterviewPrep
  
  // Återkommande
  isRecurring?: boolean
  recurringConfig?: RecurringConfig
  parentEventId?: string // För instanser av återkommande event
  
  // Påminnelser
  reminders?: SmartReminder[]
  
  // Delning
  sharedWith?: string[] // user IDs
  isShared?: boolean
  
  // Metadata
  createdAt: string
  updatedAt: string
}

export interface CalendarGoal {
  id: string
  type: 'applications' | 'interviews' | 'meetings' | 'tasks'
  target: number
  period: 'week' | 'month'
  startDate: string
}

export interface WeekStats {
  weekNumber: number
  applications: number
  interviews: number
  meetings: number
  tasksCompleted: number
  tasksTotal: number
  mood: number
}

// ==========================================
// HJÄLPFUNKTIONER
// ==========================================

export function generateRecurringEvents(
  baseEvent: CalendarEvent,
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  if (!baseEvent.recurringConfig) return [baseEvent]
  
  const events: CalendarEvent[] = []
  const config = baseEvent.recurringConfig
  let currentDate = new Date(startDate)
  let occurrenceCount = 0
  
  while (currentDate <= endDate) {
    if (config.occurrences && occurrenceCount >= config.occurrences) break
    if (config.endDate && currentDate > new Date(config.endDate)) break
    
    // Kolla om dagen matchar (för veckovisa)
    if (config.frequency === 'weekly' && config.daysOfWeek) {
      if (!config.daysOfWeek.includes(currentDate.getDay())) {
        currentDate.setDate(currentDate.getDate() + 1)
        continue
      }
    }
    
    const eventDate = currentDate.toISOString().split('T')[0]
    events.push({
      ...baseEvent,
      id: `${baseEvent.id}-${eventDate}`,
      date: eventDate,
      parentEventId: baseEvent.id,
    })
    
    occurrenceCount++
    
    // Öka datum
    switch (config.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + config.interval)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (config.interval * 7))
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + config.interval)
        break
    }
  }
  
  return events
}

export function getEventDuration(event: CalendarEvent): number {
  if (!event.endTime) return 60 // Default 1 timme
  
  const [startHour, startMin] = event.time.split(':').map(Number)
  const [endHour, endMin] = event.endTime.split(':').map(Number)
  
  return (endHour * 60 + endMin) - (startHour * 60 + startMin)
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} tim`
  return `${hours} tim ${mins} min`
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getWeekDates(date: Date): Date[] {
  const week = []
  const current = new Date(date)
  const day = current.getDay()
  const diff = current.getDate() - day + (day === 0 ? -6 : 1) // Justera för måndag som första dag
  
  current.setDate(diff)
  
  for (let i = 0; i < 7; i++) {
    week.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return week
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString()
}

export function addMinutes(time: string, minutes: number): string {
  const [hour, min] = time.split(':').map(Number)
  const totalMinutes = hour * 60 + min + minutes
  const newHour = Math.floor(totalMinutes / 60) % 24
  const newMin = totalMinutes % 60
  return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`
}

// ==========================================
// MOOD TRACKING
// ==========================================

export function getMoodEmoji(level: MoodLevel): string {
  switch (level) {
    case 1: return '😢'
    case 2: return '😕'
    case 3: return '😐'
    case 4: return '🙂'
    case 5: return '😄'
  }
}

export function getMoodLabel(level: MoodLevel): string {
  switch (level) {
    case 1: return 'Mycket dåligt'
    case 2: return 'Dåligt'
    case 3: return 'Okej'
    case 4: return 'Bra'
    case 5: return 'Mycket bra'
  }
}

export function getEnergyEmoji(level: 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 1: return '🔋'
    case 2: return '🔋🔋'
    case 3: return '🔋🔋🔋'
    case 4: return '🔋🔋🔋🔋'
    case 5: return '🔋🔋🔋🔋🔋'
  }
}

// ==========================================
// AI FÖRBEREDELSE DATA
// ==========================================

export const interviewQuestions = {
  common: [
    'Berätta om dig själv',
    'Varför söker du denna tjänst?',
    'Vad vet du om vårt företag?',
    'Vilka är dina styrkor?',
    'Vilka är dina svagheter?',
    'Varför ska vi anställa just dig?',
    'Vart ser du dig själv om 5 år?',
    'Berätta om en utmaning du övervunnit',
    'Hur hanterar du stress?',
    'Vad motiverar dig?',
  ],
  behavioral: [
    'Berätta om en konflikt med en kollega',
    'Ge exempel på när du visat ledarskap',
    'Beskriv en situation där du misslyckades',
    'Hur prioriterar du när du har mycket att göra?',
    'Berätta om en framgång du är stolt över',
  ],
  questionsToAsk: [
    'Hur ser en typisk arbetsdag ut?',
    'Vad är det bästa med att arbeta här?',
    'Hur mäter ni framgång i denna roll?',
    'Vilka utvecklingsmöjligheter finns?',
    'När kan jag förvänta mig besked?',
    'Vad är nästa steg i rekryteringsprocessen?',
  ],
}

export const dressCodeGuide: Record<string, string> = {
  'bank': 'Formell kostym eller mörk kostym',
  'tech': 'Smart casual - skjorta och chinos',
  'startup': 'Casual men propert',
  'retail': 'Propert vardagskläder',
  'healthcare': 'Propert vardagskläder',
  'default': 'Smart casual - skjorta och kostymbyxor',
}

// ==========================================
// FÄRGER OCH STILAR
// ==========================================

export const eventTypeConfig: Record<EventType, { 
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}> = {
  interview: {
    label: 'Intervju',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    icon: 'Briefcase',
  },
  meeting: {
    label: 'Möte',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    icon: 'Users',
  },
  deadline: {
    label: 'Deadline',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    icon: 'Clock',
  },
  reminder: {
    label: 'Påminnelse',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    icon: 'Bell',
  },
  task: {
    label: 'Uppgift',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    icon: 'CheckSquare',
  },
  followup: {
    label: 'Uppföljning',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    icon: 'RefreshCw',
  },
  preparation: {
    label: 'Förberedelse',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-200',
    icon: 'BookOpen',
  },
}
