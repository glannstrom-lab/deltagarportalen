/**
 * Dashboard Page - Huvudsida med flikar
 * Organiserad i 5 tydliga sektioner
 */
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Activity, 
  Users, 
  Brain, 
  BookOpen,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { PageLayout } from '@/components/layout/index'
import { useEnergyStore } from '@/stores/energyStore'
import { SuccessProvider } from '@/components/SuccessMoments'
import { EnergyLevelSelector, EnergyLevelModal } from '@/components/energy/EnergyLevelSelector'
import { SmartQuickWinButton } from '@/components/dashboard/SmartQuickWinButton'
import { cn } from '@/lib/utils'

// Tab components
import OverviewTab from './dashboard/tabs/OverviewTab'
import ActivityTab from './dashboard/tabs/ActivityTab'
import CommunityTab from './dashboard/tabs/CommunityTab'
import InsightsTab from './dashboard/tabs/InsightsTab'
import LearningTab from './dashboard/tabs/LearningTab'

// Tab configuration
const tabs = [
  { 
    id: 'overview', 
    label: 'Översikt', 
    path: '', 
    icon: LayoutDashboard,
    description: 'Din personliga översikt',
    color: 'text-violet-600 bg-violet-50'
  },
  { 
    id: 'activity', 
    label: 'Aktivitet', 
    path: 'activity', 
    icon: Activity,
    description: 'Påminnelser och quests',
    color: 'text-amber-600 bg-amber-50'
  },
  { 
    id: 'community', 
    label: 'Community', 
    path: 'community', 
    icon: Users,
    description: 'Peer support och grupper',
    color: 'text-emerald-600 bg-emerald-50'
  },
  { 
    id: 'insights', 
    label: 'Insikter', 
    path: 'insights', 
    icon: Brain,
    description: 'AI-analys och prognoser',
    color: 'text-indigo-600 bg-indigo-50'
  },
  { 
    id: 'learning', 
    label: 'Lärande', 
    path: 'learning', 
    icon: BookOpen,
    description: 'Mikro-lektioner',
    color: 'text-rose-600 bg-rose-50'
  },
]

export default function DashboardPage() {
  const location = useLocation()
  const { level: energyLevel, shouldAskForEnergy, incrementStreak, lastLoginDate } = useEnergyStore()
  const [showEnergySelector, setShowEnergySelector] = useState(false)
  const [showEnergyModal, setShowEnergyModal] = useState(false)

  // Visa energiväljare vid första besök eller ny dag
  useEffect(() => {
    const today = new Date().toDateString()
    if (shouldAskForEnergy() || lastLoginDate !== today) {
      const timer = setTimeout(() => setShowEnergySelector(true), 500)
      return () => clearTimeout(timer)
    }
  }, [shouldAskForEnergy, lastLoginDate])

  const handleEnergyComplete = () => {
    setShowEnergySelector(false)
  }

  // Hitta aktiv flik
  const currentTab = tabs.find(tab => {
    if (tab.path === '') return location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    return location.pathname.includes(`/dashboard/${tab.path}`)
  }) || tabs[0]

  const getWelcomeMessage = () => {
    switch (energyLevel) {
      case 'low': return 'Ta det lugnt idag. Varje litet steg räknas! 😌'
      case 'high': return 'Härligt att se dig! Du verkar redo att ta tag i dagen! 😊'
      default: return 'Här är din översikt för idag.'
    }
  }

  return (
    <SuccessProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Header med flikar */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top bar */}
            <div className="flex items-center justify-between py-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800">Deltagarportalen</h1>
                <p className="text-sm text-slate-500 hidden sm:block">{getWelcomeMessage()}</p>
              </div>
              <button
                onClick={() => setShowEnergyModal(true)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  energyLevel === 'low' ? 'bg-rose-100 text-rose-700' :
                  energyLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                )}
              >
                <span>{energyLevel === 'low' ? '😌' : energyLevel === 'medium' ? '😐' : '😊'}</span>
                <span className="capitalize hidden sm:inline">{energyLevel === 'medium' ? 'Medel' : energyLevel} energi</span>
              </button>
            </div>

            {/* Tab navigation */}
            <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = currentTab.id === tab.id
                
                return (
                  <Link
                    key={tab.id}
                    to={`/dashboard/${tab.path}`}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                    {tab.id === 'insights' && (
                      <span className="ml-1 px-1.5 py-0.5 bg-violet-500 text-white text-[10px] rounded-full">
                        AI
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/" element={<OverviewTab />} />
                <Route path="/activity" element={<ActivityTab />} />
                <Route path="/community" element={<CommunityTab />} />
                <Route path="/insights" element={<InsightsTab />} />
                <Route path="/learning" element={<LearningTab />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Quick Win Button */}
        <SmartQuickWinButton />

        {/* Energy Level Selector Modal */}
        <AnimatePresence>
          {showEnergySelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="bg-gradient-to-r from-violet-500 to-indigo-600 p-6 text-white">
                  <h2 className="text-xl font-bold mb-1">Välkommen tillbaka! 👋</h2>
                  <p className="text-violet-100 text-sm">{getWelcomeMessage()}</p>
                </div>
                <EnergyLevelSelector onComplete={handleEnergyComplete} showLater={false} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Energy Level Change Modal */}
        <EnergyLevelModal 
          isOpen={showEnergyModal}
          onClose={() => setShowEnergyModal(false)}
        />
      </div>
    </SuccessProvider>
  )
}
