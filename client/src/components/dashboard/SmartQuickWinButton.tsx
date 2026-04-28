/**
 * SmartQuickWinButton - Kontext-medveten "Gör något litet"
 * Anpassar förslag baserat på tid, väder, streak, och användarens state
 */
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Clock,
  Sun,
  Moon,
  Flame,
  Calendar,
  Zap,
  ChevronRight,
  Coffee,
  Target,
  TrendingUp
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useEnergyStore, type EnergyLevel } from '@/stores/energyStoreWithSync'
import { useDashboardData } from '@/hooks/useDashboardData'
import { Link } from 'react-router-dom'
import { userPreferencesApi } from '@/services/cloudStorage'

interface SmartQuickWin {
  id: string
  title: string
  description: string
  timeEstimate: string
  energyLevel: EnergyLevel
  icon: React.ReactNode
  link: string
  color: string
  context: string
  priority: number
  whyItMatters: string
}

// Hämta aktuell kontext
function getCurrentContext() {
  const hour = new Date().getHours()
  const dayOfWeek = new Date().getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  
  // Tid på dygnet
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  if (hour >= 5 && hour < 12) timeOfDay = 'morning'
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening'
  else timeOfDay = 'night'
  
  return { hour, dayOfWeek, isWeekend, timeOfDay }
}

// Vädermock borttagen 2026-04-28 — slumpmässigt fake-väder vilseledde
// användare. Återinför som riktig väder-API-integration när det finns ett
// faktiskt behov (kandidater: SMHI öppna data, OpenWeatherMap).

export function SmartQuickWinButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [completedId, setCompletedId] = useState<string | null>(null)
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null)
  const { level: energyLevel } = useEnergyStore()
  const { data } = useDashboardData()

  const context = getCurrentContext()

  // Load last login date from cloud
  useEffect(() => {
    userPreferencesApi.getLastLoginDate().then(setLastLoginDate)
  }, [])

  // Generera smarta quick wins baserat på kontext
  const smartWins: SmartQuickWin[] = useMemo(() => {
    const wins: SmartQuickWin[] = []
    
    // 1. Tidsbaserade förslag
    if (context.timeOfDay === 'morning') {
      wins.push({
        id: 'morning-mood',
        title: 'Logga dagens mående',
        description: 'Börja dagen med en snabb reflektion',
        timeEstimate: '30 sek',
        energyLevel: 'low',
        icon: <Sun size={18} />,
        link: '/wellness',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        context: '☀️ Perfekt för morgonen',
        priority: 100,
        whyItMatters: 'Att starta dagen med reflektion sätter tonen för resten av dagen',
      })
    }
    
    if (context.timeOfDay === 'evening') {
      wins.push({
        id: 'evening-wrapup',
        title: 'Summera dagen',
        description: 'Vad åstadkom du idag?',
        timeEstimate: '2 min',
        energyLevel: 'low',
        icon: <Moon size={18} />,
        link: '/diary',
        color: 'bg-sky-100 text-sky-700 border-sky-200',
        context: '🌙 Kvällsreflektion',
        priority: 95,
        whyItMatters: 'Att fira små segrar bygger självförtroende',
      })
    }

    // (Väderbaserade förslag borttagna — krävde mock-väder. Återinför med riktig
    //  väder-API om vi vill ha kontextuella förslag baserat på utomhusförhållanden.)

    // 3. Streak-räddare (om streak håller på att brytes)
    const streakDays = data?.activity?.streakDays || 0
    const today = new Date().toDateString()

    if (lastLoginDate !== today && streakDays > 0) {
      wins.push({
        id: 'streak-save',
        title: `Rädda din ${streakDays}-dagars streak!`,
        description: 'Logga in nu för att behålla din serie',
        timeEstimate: '1 min',
        energyLevel: 'low',
        icon: <Flame size={18} />,
        link: '/dashboard',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        context: `🔥 ${streakDays} dagar i rad!`,
        priority: 200, // Högsta prioritet
        whyItMatters: 'Att behålla en streak bygger positiva vanor',
      })
    }

    // 4. Pågående uppgifter
    if (data?.cv?.hasCV && data.cv.progress < 100 && data.cv.progress > 0) {
      const remaining = 100 - data.cv.progress
      wins.push({
        id: 'continue-cv',
        title: 'Fortsätt med CV:t',
        description: `Du har ${remaining}% kvar. En liten stund till!`,
        timeEstimate: '10 min',
        energyLevel: 'medium',
        icon: <Target size={18} />,
        link: '/cv',
        color: 'bg-[var(--c-accent)]/40 text-[var(--c-text)] border-[var(--c-accent)]/60',
        context: `📈 ${data.cv.progress}% klart`,
        priority: 90,
        whyItMatters: 'Att slutföra påbörjade uppgifter ger en skön känsla',
      })
    }

    // 5. Veckovis mönster (t.ex. måndag = planeringsdag)
    if (context.dayOfWeek === 1) {
      wins.push({
        id: 'monday-planning',
        title: 'Planera veckan',
        description: 'Sätt upp små mål för veckan',
        timeEstimate: '5 min',
        energyLevel: 'low',
        icon: <Calendar size={18} />,
        link: '/quests',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        context: '📅 Måndag = nystart',
        priority: 85,
        whyItMatters: 'Att planera ökar chansen att nå målen',
      })
    }

    // 6. Standard quick wins (alltid tillgängliga)
    wins.push(
      {
        id: 'log-mood',
        title: 'Logga ditt humör',
        description: 'Hur mår du just nu?',
        timeEstimate: '30 sek',
        energyLevel: 'low',
        icon: <Coffee size={18} />,
        link: '/wellness',
        color: 'bg-rose-100 text-rose-700 border-rose-200',
        context: '💚 Ta hand om dig',
        priority: 70,
        whyItMatters: 'Att vara medveten om sitt mående är viktigt',
      },
      {
        id: 'save-job',
        title: 'Utforska ett jobb',
        description: 'Hitta något som verkar intressant',
        timeEstimate: '2 min',
        energyLevel: 'low',
        icon: <Zap size={18} />,
        link: '/job-search',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        context: '💼 Lägg till i din lista',
        priority: 60,
        whyItMatters: 'Att ha alternativ ger trygghet',
      },
      {
        id: 'read-article',
        title: 'Läs en kort artikel',
        description: 'Lär dig något nytt om jobbsökande',
        timeEstimate: '3 min',
        energyLevel: 'low',
        icon: <TrendingUp size={18} />,
        link: '/knowledge-base',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        context: '📚 Kunskap är makt',
        priority: 50,
        whyItMatters: 'Väl informerade sökande lyckas bättre',
      }
    )

    // Filtrera baserat på energinivå och sortera efter prioritet
    return wins
      .filter(win => {
        if (energyLevel === 'low') return win.energyLevel === 'low'
        if (energyLevel === 'medium') return win.energyLevel !== 'high'
        return true
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
  }, [context, energyLevel, data, lastLoginDate])

  const handleComplete = (id: string) => {
    setCompletedId(id)
    setTimeout(() => {
      setCompletedId(null)
      setIsOpen(false)
    }, 1500)
  }

  // Header-baserat på tid
  const getGreeting = () => {
    switch (context.timeOfDay) {
      case 'morning': return 'God morgon! ☀️'
      case 'afternoon': return 'God eftermiddag! 🌤️'
      case 'evening': return 'God kväll! 🌙'
      default: return 'Hej där! 👋'
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg",
          "bg-gradient-to-r from-[var(--c-solid)] to-sky-600 text-white font-medium",
          "hover:shadow-xl hover:transition-shadow"
        )}
      >
        <Sparkles size={18} />
        <span className="hidden sm:inline">Gör något litet</span>
        <span className="sm:hidden">Quick win</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-stone-100 p-5 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-800">{getGreeting()}</h3>
                    <p className="text-sm text-stone-700">
                      Här är vad vi föreslår för dig just nu
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
                  >
                    <X size={18} className="text-stone-600" />
                  </button>
                </div>

                {/* Kontext-indikatorer */}
                <div className="flex gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-600">
                    <Clock size={12} />
                    {context.timeOfDay === 'morning' ? 'Morgon' :
                     context.timeOfDay === 'afternoon' ? 'Eftermiddag' : 'Kväll'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                {smartWins.map((win, index) => (
                  <motion.div
                    key={win.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {completedId === win.id ? (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                          <Sparkles size={24} className="text-emerald-600" />
                        </div>
                        <p className="font-semibold text-emerald-800">Bra val! 🎉</p>
                        <p className="text-sm text-emerald-600">{win.whyItMatters}</p>
                      </motion.div>
                    ) : (
                      <Link
                        to={win.link}
                        onClick={() => handleComplete(win.id)}
                        className={cn(
                          "block p-4 rounded-xl border transition-all group",
                          win.color
                        )}
                      >
                        {/* Context badge */}
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 mb-2">
                          {win.context}
                        </span>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                            {win.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-stone-800 group-hover:text-current transition-colors">
                              {win.title}
                            </h4>
                            <p className="text-sm opacity-80 line-clamp-2">
                              {win.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs opacity-70 flex items-center gap-1">
                                <Clock size={12} />
                                {win.timeEstimate}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={20} className="opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-stone-100 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-stone-700 hover:text-stone-700 transition-colors"
                >
                  Kanske senare
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SmartQuickWinButton
