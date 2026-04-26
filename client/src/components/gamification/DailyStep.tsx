import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Check, 
  Sparkles, 
  Target, 
  BookOpen, 
  FileText, 
  Briefcase, 
  Heart, 
  Zap, 
  Moon, 
  RotateCcw, 
  Trophy,
  TrendingUp,
  Users,
  Lightbulb,
  ChevronRight,
  X,
  Bookmark,
  Award,
  Star,
  ThumbsUp
} from '@/components/ui/icons'

type EnergyLevel = 'low' | 'medium' | 'high'
type DayStatus = 'completed' | 'rest' | 'pending' | 'missed'
type TaskDifficulty = 'starter' | 'progressor' | 'challenger'

interface DailyTask {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  duration: string
  category: 'cv' | 'application' | 'wellbeing' | 'learning'
  energyRequired: EnergyLevel
  difficulty: TaskDifficulty
  socialProof?: string
  completionRate?: number
  action: string
}

interface WeekDay {
  day: string
  date: number
  status: DayStatus
}

interface SavedTask {
  task: DailyTask
  savedAt: string
}

interface DailyStepProps {
  onTaskComplete?: (taskId: string, type?: 'task' | 'rest') => void
  onEnergyLevelChange?: (level: EnergyLevel) => void
  onTaskSave?: (task: DailyTask) => void
  completedTasks?: string[]
  lastActivityDate?: string | null
  weeklyStreak?: number
  totalSteps?: number
  savedTasks?: SavedTask[]
  previousSuccesses?: string[]
}

// Uppgifter organiserade efter svårighetsgrad (Self-Efficacy Theory - börja enkelt)
const taskSuggestions: DailyTask[] = [
  // === STARTER UPPGIFTER (Garanterade vinster) ===
  // Låg energi - enkla, snabba uppgifter som ger omedelbar feedback
  {
    id: 'check-wellbeing-low',
    title: 'Registrera ditt mående',
    description: 'Hur mår du just nu? Det är viktigt att lyssna på sig själv.',
    icon: <Heart className="w-5 h-5" />,
    duration: '1 min',
    category: 'wellbeing',
    energyRequired: 'low',
    difficulty: 'starter',
    socialProof: '89% klarar detta på första försöket',
    completionRate: 89,
    action: ''
  },
  {
    id: 'read-quote',
    title: 'Läs ett inspirerande citat',
    description: 'En liten påminnelse om att du är tillräcklig.',
    icon: <BookOpen className="w-5 h-5" />,
    duration: '1 min',
    category: 'learning',
    energyRequired: 'low',
    difficulty: 'starter',
    socialProof: '95% av användare läser klart',
    completionRate: 95,
    action: '/knowledge-base'
  },
  {
    id: 'write-strength-low',
    title: 'Skriv en styrka du har',
    description: 'Vad har du lärt dig hittills? All erfarenhet räknas.',
    icon: <Sparkles className="w-5 h-5" />,
    duration: '2 min',
    category: 'wellbeing',
    energyRequired: 'low',
    difficulty: 'starter',
    socialProof: '82% känner sig stolta efteråt',
    completionRate: 82,
    action: '/cv-builder'
  },
  {
    id: 'view-dashboard',
    title: 'Kolla din vecka',
    description: 'Se hur långt du har kommit. Varje steg räknas!',
    icon: <TrendingUp className="w-5 h-5" />,
    duration: '1 min',
    category: 'wellbeing',
    energyRequired: 'low',
    difficulty: 'starter',
    socialProof: '100% kan göra detta',
    completionRate: 100,
    action: ''
  },
  
  // === PROGRESSOR UPPGIFTER (Bygg vidare) ===
  // Medel energi - lite mer engagemang
  {
    id: 'add-skill',
    title: 'Lägg till en erfarenhet',
    description: 'Vilka erfarenheter har du samlat på dig?',
    icon: <Target className="w-5 h-5" />,
    duration: '3 min',
    category: 'cv',
    energyRequired: 'medium',
    difficulty: 'progressor',
    socialProof: '76% av användare klarar detta',
    completionRate: 76,
    action: '/cv-builder'
  },
  {
    id: 'update-contact',
    title: 'Uppdatera kontaktuppgifter',
    description: 'Se till att arbetsgivare kan nå dig när du är redo.',
    icon: <FileText className="w-5 h-5" />,
    duration: '3 min',
    category: 'cv',
    energyRequired: 'medium',
    difficulty: 'progressor',
    socialProof: '91% klarar detta snabbt',
    completionRate: 91,
    action: '/cv-builder'
  },
  {
    id: 'save-job',
    title: 'Spara ett intressant jobb',
    description: 'Ingen press - bara utforska vad som finns där ute.',
    icon: <Briefcase className="w-5 h-5" />,
    duration: '5 min',
    category: 'application',
    energyRequired: 'medium',
    difficulty: 'progressor',
    socialProof: '84% hittar något intressant',
    completionRate: 84,
    action: '/jobs'
  },
  {
    id: 'read-article',
    title: 'Läs en artikel',
    description: 'Lär dig något nytt i din egen takt.',
    icon: <BookOpen className="w-5 h-5" />,
    duration: '5 min',
    category: 'learning',
    energyRequired: 'medium',
    difficulty: 'progressor',
    socialProof: '79% lär sig något nytt',
    completionRate: 79,
    action: '/knowledge-base'
  },
  {
    id: 'explore-interests',
    title: 'Utforska dina intressen',
    description: 'Vad tycker du om att göra? Inget rätt eller fel.',
    icon: <Lightbulb className="w-5 h-5" />,
    duration: '4 min',
    category: 'learning',
    energyRequired: 'medium',
    difficulty: 'progressor',
    socialProof: '87% upptäcker något nytt',
    completionRate: 87,
    action: '/interest-guide'
  },
  
  // === CHALLENGER UPPGIFTER (Bygg självförtroende) ===
  // Hög energi - större uppgifter
  {
    id: 'add-experience',
    title: 'Beskriv en arbetslivserfarenhet',
    description: 'Vad har du gjort tidigare? Var stolt över din resa.',
    icon: <Briefcase className="w-5 h-5" />,
    duration: '10 min',
    category: 'cv',
    energyRequired: 'high',
    difficulty: 'challenger',
    socialProof: '68% klarar detta - du kan också!',
    completionRate: 68,
    action: '/cv-builder'
  },
  {
    id: 'write-motivation',
    title: 'Skriv en kort motivationstext',
    description: 'Vad skulle du vilja bidra med i ett nytt jobb?',
    icon: <FileText className="w-5 h-5" />,
    duration: '10 min',
    category: 'application',
    energyRequired: 'high',
    difficulty: 'challenger',
    socialProof: '64% känner sig stolta efteråt',
    completionRate: 64,
    action: '/cv-builder'
  },
  {
    id: 'complete-cv-section',
    title: 'Fyll i en CV-sektion',
    description: 'Ett steg närmare en komplett CV. Du klarar det!',
    icon: <Award className="w-5 h-5" />,
    duration: '15 min',
    category: 'cv',
    energyRequired: 'high',
    difficulty: 'challenger',
    socialProof: '71% avslutar hela sektionen',
    completionRate: 71,
    action: '/cv-builder'
  }
]

// Motivationsmeddelanden baserat på tidigare framgångar
const motivationBoosters = [
  { threshold: 1, message: 'Förra veckan tog du ditt första steg - fantastiskt!', icon: '🌟' },
  { threshold: 3, message: 'Förra veckan klarade du 3 steg - det är imponerande!', icon: '💪' },
  { threshold: 5, message: 'Förra veckan var du på gång med 5 steg!', icon: '🚀' },
  { threshold: 7, message: 'Förra veckan klarade du hela veckan - du är grym!', icon: '🏆' }
]

// Dagliga tips baserat på användarens resa
const dailyTips = [
  'Kom ihåg: Ett steg i taget är allt som behövs.',
  'Du är här, och det är det viktigaste.',
  'Varje litet framsteg är ett steg närmare ditt mål.',
  'Det är okej att gå långsamt, bara du inte stannar.',
  'Din resa är unik - jämför dig inte med andra.'
]

// Konfetti-komponent för celebration
function Confetti({ intensity = 'normal' }: { intensity?: 'subtle' | 'normal' | 'celebration' }) {
  useEffect(() => {
    const colors = ['#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6']
    const container = document.getElementById('confetti-container')
    if (!container) return

    const particleCount = intensity === 'celebration' ? 50 : intensity === 'subtle' ? 15 : 30
    const particles: HTMLDivElement[] = []
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        left: 50%;
        top: 50%;
        pointer-events: none;
        z-index: 50;
      `
      
      const angle = (Math.PI * 2 * i) / particleCount
      const velocity = Math.random() * 100 + 50
      const tx = Math.cos(angle) * velocity
      const ty = Math.sin(angle) * velocity - 50
      const rot = Math.random() * 360
      
      particle.style.animation = 'confetti-fall 1s ease-out forwards'
      particle.style.setProperty('--tx', `${tx}px`)
      particle.style.setProperty('--ty', `${ty}px`)
      particle.style.setProperty('--rot', `${rot}deg`)
      
      container.appendChild(particle)
      particles.push(particle)
    }

    // Add keyframes if not exists
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style')
      style.id = 'confetti-style'
      style.textContent = `
        @keyframes confetti-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [intensity])

  return <div id="confetti-container" className="absolute inset-0 pointer-events-none overflow-hidden" />
}

// Progress Ring-komponent
function ProgressRing({ 
  progress, 
  size = 80, 
  strokeWidth = 6,
  color = '#14b8a6'
}: { 
  progress: number
  size?: number
  strokeWidth?: number
  color?: string 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-slate-700">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// Step Counter Badge
function StepBadge({ count, total = 3 }: { count: number; total?: number }) {
  const percentage = Math.min((count / total) * 100, 100)
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-white transition-all duration-300 ${
              i < count 
                ? 'bg-brand-700 text-white' 
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {i < count ? <Check className="w-3 h-3" /> : i + 1}
          </div>
        ))}
      </div>
      <span className="text-sm font-medium text-slate-600">
        {count} av {total} steg idag
      </span>
    </div>
  )
}

// Energy indicator with color coding
function EnergyIndicator({ level }: { level: EnergyLevel }) {
  const configs = {
    low: { color: 'bg-emerald-500', label: 'Låg energi', emoji: '🟢', desc: 'Små, enkla steg' },
    medium: { color: 'bg-amber-500', label: 'Medel energi', emoji: '🟡', desc: 'Balanserade uppgifter' },
    high: { color: 'bg-rose-500', label: 'Hög energi', emoji: '🔴', desc: 'Större utmaningar' }
  }
  
  const config = configs[level]
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-lg">{config.emoji}</span>
      <div>
        <span className="font-medium text-slate-700">{config.label}</span>
        <span className="text-slate-700 ml-1">· {config.desc}</span>
      </div>
    </div>
  )
}

// Task Card Component
function TaskCard({ 
  task, 
  onComplete, 
  onStart, 
  onSkip, 
  onSave,
  isSaved 
}: { 
  task: DailyTask
  onComplete: () => void
  onStart: () => void
  onSkip: () => void
  onSave: () => void
  isSaved: boolean
}) {
  const categoryColors = {
    cv: 'bg-blue-50 border-blue-200 text-blue-700',
    application: 'bg-brand-50 border-brand-200 text-brand-900',
    wellbeing: 'bg-rose-50 border-rose-200 text-rose-700',
    learning: 'bg-amber-50 border-amber-200 text-amber-700'
  }

  const categoryLabels = {
    cv: 'CV',
    application: 'Jobbsök',
    wellbeing: 'Välmående',
    learning: 'Lärande'
  }

  const difficultyLabels = {
    starter: { label: 'Start', color: 'bg-emerald-100 text-emerald-700' },
    progressor: { label: 'Fortsätt', color: 'bg-amber-100 text-amber-700' },
    challenger: { label: 'Utmaning', color: 'bg-rose-100 text-rose-700' }
  }

  return (
    <div className={`rounded-xl border-2 p-4 transition-all hover: ${categoryColors[task.category]}`}>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white rounded-xl">
          {task.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 bg-white rounded-full">
              {categoryLabels[task.category]}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyLabels[task.difficulty].color}`}>
              {difficultyLabels[task.difficulty].label}
            </span>
            <span className="text-xs opacity-75">
              ~{task.duration}
            </span>
          </div>
          
          <h4 className="font-semibold text-lg mb-1">
            {task.title}
          </h4>
          <p className="text-sm opacity-90 mb-3">
            {task.description}
          </p>
          
          {/* Social Proof */}
          {task.socialProof && (
            <div className="flex items-center gap-1 text-xs mb-3 opacity-75">
              <Users className="w-3 h-3" />
              <span>{task.socialProof}</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onComplete}
              className="flex-1 min-w-[120px] bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg border-2 border-current transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Jag har gjort det!
            </button>
            <button
              onClick={onStart}
              className="flex-1 min-w-[120px] bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Starta
            </button>
          </div>
          
          {/* Secondary Actions */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-current border-opacity-20">
            <button
              onClick={onSkip}
              className="text-xs text-slate-700 hover:text-slate-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-white/50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Föreslå annat
            </button>
            <button
              onClick={onSave}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                isSaved 
                  ? 'text-amber-600 bg-amber-50' 
                  : 'text-slate-700 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Sparad' : 'Spara till senare'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DailyStep({ 
  onTaskComplete, 
  onEnergyLevelChange,
  onTaskSave,
  completedTasks = [],
  lastActivityDate = null,
  weeklyStreak = 0,
  totalSteps = 0,
  savedTasks = [],
  previousSuccesses = []
}: DailyStepProps) {
  const navigate = useNavigate()
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium')
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showRestCelebration, setShowRestCelebration] = useState(false)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [showGentleReminder, setShowGentleReminder] = useState(false)
  const [todayCompletedCount, setTodayCompletedCount] = useState(0)
  const [dismissedTasks, setDismissedTasks] = useState<string[]>([])
  const [showMotivationBooster, setShowMotivationBooster] = useState(true)
  const [savedTaskIds, setSavedTaskIds] = useState<Set<string>>(new Set())

  // Beräkna dagens mål (3 steg per dag är rimligt)
  const dailyGoal = 3
  const dailyProgress = Math.min((todayCompletedCount / dailyGoal) * 100, 100)

  // Ref för att spåra föregående completedTasks
  const previousCompletedTasksForWeekRef = useRef<string>('')
  
  // Initiera veckodagar
  useEffect(() => {
    const currentCompletedStr = JSON.stringify(completedTasks)
    // Bara uppdatera om completedTasks faktiskt har ändrats
    if (previousCompletedTasksForWeekRef.current === currentCompletedStr) return
    previousCompletedTasksForWeekRef.current = currentCompletedStr
    
    const days = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
    const today = new Date().getDay()
    const todayIndex = today === 0 ? 6 : today - 1
    
    const weekData: WeekDay[] = days.map((day, index) => {
      const isPastOrToday = index <= todayIndex
      const isCompleted = isPastOrToday && completedTasks.length > 0 && 
        (index < (completedTasks.length % 7) || 
         (index === todayIndex && completedTasks.length > 0))
      
      return {
        day,
        date: index,
        status: isCompleted ? 'completed' : isPastOrToday && index < todayIndex ? 'missed' : 'pending'
      }
    })
    
    setWeekDays(weekData)
  }, [completedTasks])

  // Ref för att spåra föregående savedTasks
  const previousSavedTasksRef = useRef<string>('')
  
  // Ladda sparade uppgifter
  useEffect(() => {
    const currentSavedStr = JSON.stringify(savedTasks.map(st => st.task.id))
    // Bara uppdatera om savedTasks faktiskt har ändrats
    if (previousSavedTasksRef.current === currentSavedStr) return
    previousSavedTasksRef.current = currentSavedStr
    
    const savedIds = new Set(savedTasks.map(st => st.task.id))
    setSavedTaskIds(savedIds)
  }, [savedTasks])

  // Filtrera uppgifter baserat på energinivå och svårighetsgrad
  const getFilteredTasks = useCallback((level: EnergyLevel) => {
    let tasks = taskSuggestions.filter(task => {
      // Filtrera bort avvisade uppgifter
      if (dismissedTasks.includes(task.id)) return false
      
      // Filtrera baserat på energinivå
      if (level === 'low') return task.energyRequired === 'low'
      if (level === 'medium') return task.energyRequired === 'low' || task.energyRequired === 'medium'
      return true // high = all tasks
    })

    // Sortera: Börja med enklare uppgifter för "små vinster"
    // Om användaren redan gjort några idag, visa svårare
    const difficultyOrder: TaskDifficulty[] = todayCompletedCount < 2 
      ? ['starter', 'progressor', 'challenger']
      : ['progressor', 'challenger', 'starter']
    
    tasks.sort((a, b) => {
      const aIndex = difficultyOrder.indexOf(a.difficulty)
      const bIndex = difficultyOrder.indexOf(b.difficulty)
      return aIndex - bIndex
    })

    return tasks
  }, [dismissedTasks, todayCompletedCount])

  // Ref för att spåra om uppgift redan valts
  const hasInitializedTask = useRef(false)
  const previousEnergyLevel = useRef(energyLevel)
  const previousCompletedTasksRef = useRef<string>('') // JSON-sträng för jämförelse
  const isSelectingTaskRef = useRef(false) // Förhindra rekursiva anrop
  
  // Välj uppgift vid första render eller när energinivå ändras
  useEffect(() => {
    // Förhindra rekursiva anrop
    if (isSelectingTaskRef.current) return
    
    // Jämför completedTasks med föregående värde
    const currentCompletedStr = JSON.stringify([...completedTasks].sort())
    const hasCompletedTasksChanged = previousCompletedTasksRef.current !== currentCompletedStr
    
    // Endast välj ny uppgift om:
    // 1. Vi inte redan initialiserat, ELLER
    // 2. Energinivån har ändrats, ELLER
    // 3. completedTasks faktiskt har ändrats (inte bara referensen)
    const shouldSelectTask = !hasInitializedTask.current || 
                             previousEnergyLevel.current !== energyLevel ||
                             hasCompletedTasksChanged
    
    if (!shouldSelectTask) return
    
    isSelectingTaskRef.current = true
    
    const filtered = getFilteredTasks(energyLevel)
    const incompleteTasks = filtered.filter(t => !completedTasks.includes(t.id))
    const tasks = incompleteTasks.length > 0 ? incompleteTasks : filtered
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)]
    
    // Bara uppdatera om uppgiften faktiskt är ny
    setSelectedTask(prev => {
      if (prev?.id === randomTask?.id) return prev
      return randomTask || null
    })
    
    hasInitializedTask.current = true
    previousEnergyLevel.current = energyLevel
    previousCompletedTasksRef.current = currentCompletedStr
    
    // Släpp låset efter en liten fördröjning
    setTimeout(() => {
      isSelectingTaskRef.current = false
    }, 0)
  }, [energyLevel, completedTasks, getFilteredTasks])

  // Kolla efter 3 dagars inaktivitet
  useEffect(() => {
    if (lastActivityDate) {
      const last = new Date(lastActivityDate)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 3 && diffDays < 7) {
        setShowGentleReminder(true)
      }
    }
  }, [lastActivityDate])

  const handleEnergyChange = (level: EnergyLevel) => {
    setEnergyLevel(level)
    onEnergyLevelChange?.(level)
  }

  const handleComplete = () => {
    if (selectedTask) {
      setShowCelebration(true)
      setTodayCompletedCount(prev => prev + 1)
      onTaskComplete?.(selectedTask.id, 'task')
      
      setTimeout(() => {
        setShowCelebration(false)
        const filtered = getFilteredTasks(energyLevel)
        const incompleteTasks = filtered.filter(t => !completedTasks.includes(t.id) && t.id !== selectedTask.id)
        const tasks = incompleteTasks.length > 0 ? incompleteTasks : filtered
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)]
        setSelectedTask(randomTask)
      }, 2500)
    }
  }

  const handleRestDay = () => {
    setShowRestCelebration(true)
    onTaskComplete?.('rest-day', 'rest')
    
    setTimeout(() => {
      setShowRestCelebration(false)
    }, 3000)
  }

  const handleSkipTask = () => {
    if (selectedTask) {
      setDismissedTasks(prev => [...prev, selectedTask.id])
      const filtered = getFilteredTasks(energyLevel).filter(t => t.id !== selectedTask.id && !dismissedTasks.includes(t.id))
      const tasks = filtered.length > 0 ? filtered : getFilteredTasks(energyLevel)
      const randomTask = tasks[Math.floor(Math.random() * tasks.length)]
      setSelectedTask(randomTask || null)
    }
  }

  const handleSaveTask = () => {
    if (selectedTask) {
      const newSavedIds = new Set(savedTaskIds)
      if (newSavedIds.has(selectedTask.id)) {
        newSavedIds.delete(selectedTask.id)
      } else {
        newSavedIds.add(selectedTask.id)
      }
      setSavedTaskIds(newSavedIds)
      onTaskSave?.(selectedTask)
    }
  }

  const handleNewTask = () => {
    handleSkipTask()
  }

  // Hitta relevant motivationsbooster
  const currentBooster = useMemo(() => {
    if (previousSuccesses.length === 0) return null
    const lastWeekCount = previousSuccesses.length
    return motivationBoosters
      .filter(b => b.threshold <= lastWeekCount)
      .pop()
  }, [previousSuccesses])

  // Dagens tips
  const todayTip = useMemo(() => {
    const dayOfWeek = new Date().getDay()
    return dailyTips[dayOfWeek % dailyTips.length]
  }, [])

  // Beräkna veckans progress
  const weekProgress = Math.min((completedTasks.length / 7) * 100, 100)

  const energyLabels: Record<EnergyLevel, { label: string; emoji: string; color: string }> = {
    low: { label: 'Låg', emoji: '🌙', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    medium: { label: 'Mellan', emoji: '☀️', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    high: { label: 'Hög', emoji: '⚡', color: 'bg-rose-100 text-rose-700 border-rose-200' }
  }

  const dayStatusIcons = {
    completed: <Check className="w-3 h-3 text-white" />,
    rest: <Moon className="w-3 h-3 text-indigo-500" />,
    pending: null,
    missed: null
  }

  return (
    <div className="bg-white rounded-xl  border border-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Dagens lilla steg
          </h3>
          <p className="text-sm text-slate-700 mt-1">
            Ett litet steg i taget tar dig framåt
          </p>
        </div>
        {totalSteps > 0 && (
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold">{totalSteps}</span>
          </div>
        )}
      </div>

      {/* Motivationsbooster - visas vid första besöket */}
      {showMotivationBooster && currentBooster && (
        <div className="mb-6 p-4 bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-200 rounded-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{currentBooster.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-900">
                {currentBooster.message}
              </p>
              <p className="text-xs text-brand-900 mt-1">
                {todayTip}
              </p>
            </div>
            <button 
              onClick={() => setShowMotivationBooster(false)}
              className="text-brand-400 hover:text-brand-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Vänlig påminnelse vid inaktivitet */}
      {showGentleReminder && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-amber-800">
            <span className="font-medium">Hej där! 👋</span> Vi har inte sett dig på ett tag. 
            Det är helt okej att ta pauser - det finns inget krav här. När du är redo, 
            finns vi här för att stötta dig. 💙
          </p>
          <button 
            onClick={() => setShowGentleReminder(false)}
            className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline"
          >
            Tack, jag förstår
          </button>
        </div>
      )}

      {/* Dagens progress - Tydliga delmål */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <StepBadge count={todayCompletedCount} total={dailyGoal} />
          <span className="text-xs text-slate-700">
            Mål: {dailyGoal} steg
          </span>
        </div>
        
        {/* Progress bar för dagen */}
        <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-gradient-to-r from-brand-400 via-emerald-400 to-brand-700 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${dailyProgress}%` }}
          />
          
          {/* Milestones */}
          <div className="absolute inset-0 flex justify-between px-1">
            {[1, 2].map(milestone => (
              <div 
                key={milestone}
                className={`w-px h-full ${todayCompletedCount >= milestone ? 'bg-white/50' : 'bg-slate-300'}`}
                style={{ marginLeft: `${(milestone / dailyGoal) * 100}%` }}
              />
            ))}
          </div>
        </div>
        
        {/* Motiverande meddelande */}
        <p className="text-xs text-slate-700 mt-2 text-center">
          {todayCompletedCount === 0 
            ? 'Börja med ett enkelt steg - du klarar det! 🌟'
            : todayCompletedCount === 1
            ? 'Bra! Ett steg avklarat. Fortsätt när du känner dig redo.'
            : todayCompletedCount === 2
            ? 'Så bra! Ett steg kvar till dagens mål! 💪'
            : 'Fantastiskt! Du har nått dagens mål! 🎉'}
        </p>
      </div>

      {/* Veckans resa - Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Veckans resa
          </h4>
          <span className="text-xs text-slate-700">
            {completedTasks.length} av 7 steg
          </span>
        </div>
        
        {/* Veckodagar */}
        <div className="flex justify-between gap-1 mb-4">
          {weekDays.map((day) => (
            <div key={day.day} className="flex flex-col items-center">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  transition-all duration-300
                  ${day.status === 'completed' 
                    ? 'bg-brand-700 text-white scale-110' 
                    : day.status === 'missed'
                    ? 'bg-slate-100 text-slate-600'
                    : day.status === 'rest'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'}
                `}
              >
                {dayStatusIcons[day.status] || day.day.charAt(0)}
              </div>
              <span className="text-xs text-slate-600 mt-1">{day.day}</span>
            </div>
          ))}
        </div>

        {/* Weekly Streak */}
        {weeklyStreak > 0 && (
          <div className="flex items-center justify-center gap-2 p-2 bg-amber-50 rounded-lg mb-3">
            <span className="text-lg">🔥</span>
            <span className="text-sm text-amber-700">
              Du har tagit <strong>{weeklyStreak}</strong> steg denna vecka!
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-gradient-to-r from-brand-400 to-brand-700 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${weekProgress}%` }}
          />
        </div>
      </div>

      {/* Progress Ring för veckan - visas vid framsteg */}
      {completedTasks.length >= 3 && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
          <ProgressRing progress={weekProgress} size={70} strokeWidth={5} />
          <div>
            <p className="font-medium text-slate-700">
              {weekProgress >= 100 
                ? 'Fantastiskt! Veckan är klar! 🎉' 
                : weekProgress >= 50 
                ? 'Halvvägs! Bra jobbat! 💪'
                : 'Bra början! Fortsätt så! 🌟'}
            </p>
            <p className="text-sm text-slate-700">
              {Math.round(weekProgress)}% av veckans steg
            </p>
          </div>
        </div>
      )}

      {/* Energinivå-väljare med EnergyFilter-integration */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">
          Hur är din energi idag?
        </p>
        <div className="flex gap-2">
          {(Object.keys(energyLabels) as EnergyLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => handleEnergyChange(level)}
              className={`
                flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all
                ${energyLevel === level 
                  ? energyLabels[level].color + ' border-current' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
              `}
            >
              <span className="mr-1">{energyLabels[level].emoji}</span>
              {energyLabels[level].label}
            </button>
          ))}
        </div>
        
        {/* Energy Indicator */}
        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
          <EnergyIndicator level={energyLevel} />
        </div>
        
        <p className="text-xs text-slate-700 mt-2">
          Vi anpassar uppgifterna efter hur du mår idag
        </p>
      </div>

      {/* Celebrations */}
      {showCelebration && (
        <div className="relative text-center py-8 animate-in fade-in zoom-in duration-300">
          <Confetti intensity={todayCompletedCount === dailyGoal ? 'celebration' : 'normal'} />
          <div className="text-5xl mb-3">
            {todayCompletedCount === dailyGoal ? '🏆' : todayCompletedCount === 2 ? '⭐' : '🎉'}
          </div>
          <p className="text-lg font-semibold text-brand-900">
            {todayCompletedCount === dailyGoal 
              ? 'Du klarade dagens mål! Fantastiskt!' 
              : todayCompletedCount === 2 
              ? 'Så nära! Ett steg till!' 
              : 'Bra jobbat! Du tog ett steg idag!'}
          </p>
          <p className="text-sm text-slate-700 mt-2">
            {todayCompletedCount === dailyGoal 
              ? 'Ta en stund och känn dig stolt över dig själv.' 
              : 'Varje litet steg räknas'}
          </p>
          
          {/* Total steps counter */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-50 rounded-full">
            <Star className="w-4 h-4 text-brand-700 fill-current" />
            <span className="text-sm text-brand-900">
              Du har tagit <strong>{totalSteps + todayCompletedCount}</strong> steg totalt!
            </span>
          </div>
        </div>
      )}

      {showRestCelebration && (
        <div className="relative text-center py-8 animate-in fade-in zoom-in duration-300">
          <div className="text-5xl mb-3">🌙</div>
          <p className="text-lg font-semibold text-indigo-700">
            Så klokt av dig att lyssna på kroppen!
          </p>
          <p className="text-sm text-slate-700 mt-2">
            Vila är också ett steg framåt. Kom tillbaka när du är redo. 💙
          </p>
        </div>
      )}

      {/* Huvudinnehåll - Task eller Vila */}
      {!showCelebration && !showRestCelebration && (
        <>
          {selectedTask ? (
            <TaskCard
              task={selectedTask}
              onComplete={handleComplete}
              onStart={() => selectedTask.action && navigate(selectedTask.action)}
              onSkip={handleSkipTask}
              onSave={handleSaveTask}
              isSaved={savedTaskIds.has(selectedTask.id)}
            />
          ) : (
            <div className="text-center py-8 text-slate-700">
              <p>Inga uppgifter tillgängliga just nu</p>
              <button
                onClick={() => setDismissedTasks([])}
                className="mt-2 text-sm text-brand-900 hover:underline"
              >
                Visa alla uppgifter igen
              </button>
            </div>
          )}

          {/* Sparade uppgifter */}
          {savedTasks.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                Sparade för senare
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Du har {savedTasks.length} sparad{savedTasks.length === 1 ? '' : 'e'} uppgift{savedTasks.length === 1 ? '' : 'er'}
              </p>
            </div>
          )}

          {/* Alternative actions - Flexibilitet utan skuld */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between">
            <button
              onClick={handleNewTask}
              className="flex items-center gap-1 text-sm text-slate-700 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Föreslå annan uppgift
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={handleRestDay}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Moon className="w-4 h-4" />
                Inte idag
              </button>
            </div>
          </div>
        </>
      )}

      {/* Summering */}
      {completedTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-700">
              Du har gjort <span className="font-semibold text-brand-900">{completedTasks.length}</span> steg denna vecka.
            </p>
            <span className="text-lg">🌟</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {completedTasks.length >= 7 
              ? 'En hel vecka av små steg - imponerande!' 
              : completedTasks.length >= 3 
              ? 'Bra jobbat! Fortsätt i din egen takt.' 
              : 'Bra början! Varje steg räknas.'}
          </p>
        </div>
      )}

      {/* Long-term goal reminder */}
      <div className="mt-4 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
        <div className="flex items-start gap-2">
          <ThumbsUp className="w-4 h-4 text-slate-600 mt-0.5" />
          <div>
            <p className="text-xs text-slate-700">
              Kom ihåg: Du arbetar mot ett bättre mående och en starkare framtid. 
              Varje litet steg tar dig närmare dit du vill vara.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
