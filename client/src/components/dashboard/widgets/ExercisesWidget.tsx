import { memo } from 'react'
import { 
  Dumbbell, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Zap, 
  Target, 
  TrendingUp, 
  Play, 
  Sparkles,
  Brain,
  MessageCircle,
  Users,
  Lightbulb,
  Star,
  Heart,
  ChevronRight,
  Flame,
  Calendar
} from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface ExercisesWidgetProps {
  completedCount?: number
  streakDays?: number
  lastCompleted?: { title: string; completedAt: string } | null
  recommendedExercise?: { title: string; duration: number; category: string } | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// Övningstyper med ikoner
const exerciseCategories = [
  { id: 'interview', label: 'Intervjuträning', icon: MessageCircle, color: 'emerald' },
  { id: 'networking', label: 'Nätverkande', icon: Users, color: 'teal' },
  { id: 'pitch', label: 'Erpitchning', icon: Sparkles, color: 'green' },
  { id: 'motivation', label: 'Motivation', icon: Heart, color: 'rose' },
  { id: 'strategy', label: 'Strategi', icon: Brain, color: 'violet' },
]

// Veckodagar
const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

// Hjälper för att få ikon baserat på kategori
function getCategoryIcon(category: string) {
  const cat = exerciseCategories.find(c => 
    category.toLowerCase().includes(c.id) || c.id.includes(category.toLowerCase())
  )
  return cat?.icon || Lightbulb
}

// Hjälper för att få färg baserat på kategori
function getCategoryColor(category: string): string {
  const cat = exerciseCategories.find(c => 
    category.toLowerCase().includes(c.id) || c.id.includes(category.toLowerCase())
  )
  return cat?.color || 'emerald'
}

// SMALL - Energisk räknare med uppmuntrande CTA
function ExercisesWidgetSmall({ 
  completedCount = 0, 
  streakDays = 0,
  loading, 
  error, 
  onRetry 
}: Omit<ExercisesWidgetProps, 'size' | 'lastCompleted' | 'recommendedExercise'>) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  
  // Uppmuntrande meddelanden baserat på progress
  const getEncouragingMessage = () => {
    if (completedCount === 0) return 'Redo att öva?'
    if (completedCount < 3) return 'Bra start!'
    if (completedCount < 7) return 'Du gör framsteg!'
    return 'Fantastiskt!'
  }

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={20} />}
      to="/dashboard/exercises"
      color="green"
      status={status}
      progress={Math.min(100, (completedCount / 5) * 100)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: completedCount > 0 ? 'Öva mer' : 'Prova en övning',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        {/* Energisk cirkel med animationseffekt */}
        <div className="relative mb-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            completedCount > 0 
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
              : 'bg-gradient-to-br from-emerald-100 to-emerald-200'
          }`}>
            {completedCount > 0 ? (
              <Trophy size={28} className="text-white" />
            ) : (
              <Sparkles size={28} className="text-emerald-600" />
            )}
          </div>
          {/* Streak-badge */}
          {streakDays > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
              <Flame size={12} className="text-white" />
            </div>
          )}
        </div>
        
        <p className="text-3xl font-bold text-slate-800">{completedCount}</p>
        <p className="text-sm text-slate-500 mb-2">
          {completedCount === 0 ? 'inga övningar än' : completedCount === 1 ? 'övning gjord' : 'övningar gjorda'}
        </p>
        
        {/* Uppmuntrande text */}
        <p className={`text-xs font-medium ${
          completedCount > 0 ? 'text-emerald-600' : 'text-slate-400'
        }`}>
          {getEncouragingMessage()}
        </p>
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Progress mot veckomål + senaste övningar
function ExercisesWidgetMedium({ 
  completedCount = 0, 
  streakDays = 0,
  lastCompleted, 
  recommendedExercise, 
  loading, 
  error, 
  onRetry 
}: ExercisesWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const weeklyGoal = 5
  const progress = Math.min(100, (completedCount / weeklyGoal) * 100)

  // Formatera datum
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  // Hämta ikon för rekommenderad övning
  const CategoryIcon = recommendedExercise ? getCategoryIcon(recommendedExercise.category) : Lightbulb
  const categoryColor = recommendedExercise ? getCategoryColor(recommendedExercise.category) : 'emerald'

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={22} />}
      to="/dashboard/exercises"
      color="green"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: completedCount > 0 ? 'Fortsätt öva' : 'Börja idag',
      }}
    >
      <div className="space-y-4">
        {/* Progress mot veckomål */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">Veckans mål</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              {completedCount}/{weeklyGoal}
            </span>
          </div>
          
          {/* Progress bar med emoji vid milestones */}
          <div className="relative">
            <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress >= 100 && (
              <span className="absolute right-0 -top-1 text-lg">🎉</span>
            )}
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            {progress >= 100 
              ? 'Sugen på en bonusövning?' 
              : `${weeklyGoal - completedCount} till för att nå målet!`}
          </p>
        </div>

        {/* Rekommenderad övning - mer lockande design */}
        {recommendedExercise ? (
          <div className="group p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${categoryColor}-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <CategoryIcon size={20} className={`text-${categoryColor}-600`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} className="text-amber-500" />
                  <span className="text-xs font-medium text-slate-400">Perfekt för dig</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{recommendedExercise.title}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {recommendedExercise.duration} min
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="text-emerald-600 font-medium">{recommendedExercise.category}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ) : (
          /* Empty state - lockande CTA */
          <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Zap size={24} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Redo att öva?</p>
                <p className="text-xs text-slate-500">5 minuter kan ge dig självförtroende inför intervjun</p>
              </div>
            </div>
            <button className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              <Play size={14} />
              Prova en övning nu
            </button>
          </div>
        )}

        {/* Senaste övning - kompakt */}
        {lastCompleted && (
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 truncate">{lastCompleted.title}</p>
              <p className="text-xs text-slate-400">{getTimeAgo(lastCompleted.completedAt)}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Star size={12} className="fill-emerald-600" />
              <span>+1</span>
            </div>
          </div>
        )}

        {/* Streak-indikator */}
        {streakDays > 0 && (
          <div className="flex items-center justify-center gap-2 py-1">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs text-slate-600">
              <span className="font-semibold text-orange-600">{streakDays}</span> dagar i rad!
            </span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Veckoöversikt, kategorier, pågående/aktuella övningar
function ExercisesWidgetLarge({ 
  completedCount = 0, 
  streakDays = 0,
  lastCompleted, 
  recommendedExercise, 
  loading, 
  error, 
  onRetry 
}: ExercisesWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const weeklyGoal = 5
  const progress = Math.min(100, (completedCount / weeklyGoal) * 100)

  // Formatera datum
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  // Hämta ikon för rekommenderad övning
  const CategoryIcon = recommendedExercise ? getCategoryIcon(recommendedExercise.category) : Lightbulb
  const categoryColor = recommendedExercise ? getCategoryColor(recommendedExercise.category) : 'emerald'

  // Simulerad veckodata (kan bytas ut mot riktig data)
  const weekData = [true, true, false, true, false, false, false] // Mån-Sön
  const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 // 0 = Måndag

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={24} />}
      to="/dashboard/exercises"
      color="green"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: completedCount > 0 ? 'Fortsätt öva' : 'Börja din första övning',
      }}
      secondaryAction={completedCount > 0 ? {
        label: 'Se alla övningar',
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-5">
        {/* Header med stats och streak */}
        <div className="flex items-center gap-4">
          <div className="flex-1 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Trophy size={28} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800">{completedCount}</p>
                <p className="text-sm text-slate-500">övningar gjorda</p>
              </div>
            </div>
          </div>
          
          {streakDays > 0 ? (
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100/50 text-center min-w-[100px]">
              <Flame size={28} className="text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-600">{streakDays}</p>
              <p className="text-xs text-orange-600/70">dagar i rad!</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[100px]">
              <Calendar size={28} className="text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Börja en<br/>streak idag!</p>
            </div>
          )}
        </div>

        {/* Veckoöversikt */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">Denna vecka</span>
            </div>
            <span className="text-xs text-slate-400">
              {weekData.filter(Boolean).length}/7 dagar
            </span>
          </div>
          
          {/* Veckodagarna */}
          <div className="flex justify-between gap-1">
            {weekDays.map((day, index) => {
              const isToday = index === today
              const isCompleted = weekData[index]
              
              return (
                <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                  <div 
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' 
                        : isToday 
                          ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300' 
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <span className="text-xs font-medium">{day.charAt(0)}</span>
                    )}
                  </div>
                  <span className={`text-[10px] ${isToday ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Kategorier av övningar */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Utforska kategorier</p>
          <div className="grid grid-cols-5 gap-2">
            {exerciseCategories.map((cat) => (
              <button 
                key={cat.id}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl bg-${cat.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <cat.icon size={20} className={`text-${cat.color}-600`} />
                </div>
                <span className="text-[10px] text-slate-600 text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pågående/Rekommenderad övning */}
        {recommendedExercise ? (
          <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-200">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <CategoryIcon size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-amber-300" />
                  <span className="text-xs font-medium text-emerald-100">Dagens rekommendation</span>
                </div>
                <p className="text-lg font-semibold mb-2">{recommendedExercise.title}</p>
                <div className="flex items-center gap-4 text-sm text-emerald-100 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {recommendedExercise.duration} minuter
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Target size={14} />
                    {recommendedExercise.category}
                  </span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-50 transition-colors">
                  <Play size={16} fill="currentColor" />
                  Starta övningen
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state för large - inspirerande */
          <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Zap size={32} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-slate-800 mb-1">Din första övning väntar!</p>
                <p className="text-sm text-slate-500 mb-4">
                  Övningar hjälper dig att känna dig förberedd och självsäker inför jobbsökarprocessen. 
                  Börja med en kort övning – det tar bara 5 minuter!
                </p>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                    <Play size={16} fill="currentColor" />
                    Prova nu
                  </button>
                  <button className="px-4 py-2 text-emerald-700 text-sm font-medium hover:bg-emerald-100 rounded-lg transition-colors">
                    Utforska alla
                  </button>
                </div>
              </div>
            </div>
            
            {/* Fördelar */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-100">
              {[
                { icon: MessageCircle, text: 'Intervjuträning', color: 'emerald' },
                { icon: Brain, text: 'Bygg självförtroende', color: 'violet' },
                { icon: Heart, text: 'Minska stress', color: 'rose' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 bg-${item.color}-100 rounded-lg flex items-center justify-center`}>
                    <item.icon size={16} className={`text-${item.color}-600`} />
                  </div>
                  <span className="text-xs text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Senaste övningar list */}
        {lastCompleted && (
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-slate-600">Senaste övningen</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{lastCompleted.title}</p>
                <p className="text-xs text-slate-400">{getTimeAgo(lastCompleted.completedAt)}</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-lg">
                <Star size={12} className="text-emerald-600 fill-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Bra jobbat!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent
export const ExercisesWidget = memo(function ExercisesWidget(props: ExercisesWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <ExercisesWidgetLarge {...rest} />
    case 'medium':
      return <ExercisesWidgetMedium {...rest} />
    case 'small':
    default:
      return <ExercisesWidgetSmall {...rest} />
  }
})
