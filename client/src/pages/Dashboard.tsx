import { useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Zap, Users, Lightbulb, BookOpen, Bell } from 'lucide-react'
import OverviewTab from './dashboard/tabs/OverviewTab'
import ActivityTab from './dashboard/tabs/ActivityTab'
import CommunityTab from './dashboard/tabs/CommunityTab'
import InsightsTab from './dashboard/tabs/InsightsTab'
import LearningTab from './dashboard/tabs/LearningTab'
import { useDashboardData } from '@/hooks/useDashboardData'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  path: string
  icon: React.ReactNode
  badge?: number
}

export default function DashboardPage() {
  const location = useLocation()
  const { data } = useDashboardData()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Beräkna badges baserat på data
  const getTabBadge = (tabId: string): number => {
    switch (tabId) {
      case 'activity':
        return data?.quests?.incomplete || 0
      case 'community':
        return data?.notifications?.unread || 0
      case 'insights':
        return data?.insights?.newRecommendations || 0
      case 'learning':
        return data?.learning?.newLessons || 0
      default:
        return 0
    }
  }

  const tabs: Tab[] = [
    { 
      id: 'overview', 
      label: 'Översikt', 
      path: '/', 
      icon: <LayoutDashboard size={18} />
    },
    { 
      id: 'activity', 
      label: 'Aktivitet', 
      path: '/activity', 
      icon: <Zap size={18} />,
      badge: getTabBadge('activity')
    },
    { 
      id: 'community', 
      label: 'Community', 
      path: '/community', 
      icon: <Users size={18} />,
      badge: getTabBadge('community')
    },
    { 
      id: 'insights', 
      label: 'Insikter', 
      path: '/insights', 
      icon: <Lightbulb size={18} />,
      badge: getTabBadge('insights')
    },
    { 
      id: 'learning', 
      label: 'Lärande', 
      path: '/learning', 
      icon: <BookOpen size={18} />,
      badge: getTabBadge('learning')
    },
  ]
  
  const currentTab = tabs.find(tab => tab.path === location.pathname)?.id || 'overview'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Jobin</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Deltagarportalen</p>
              </div>
            </div>
            
            {/* Notification bell */}
            <button 
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              aria-label="Notifikationer"
            >
              <Bell size={20} />
              {getTabBadge('community') > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {Math.min(getTabBadge('community'), 9)}
                </span>
              )}
            </button>
          </div>
          
          {/* Tab Navigation */}
          <nav 
            className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
            role="tablist"
            aria-label="Dashboard navigering"
          >
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id
              const badgeCount = tab.badge || 0
              
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${tab.label}${badgeCount > 0 ? `, ${badgeCount} nya` : ''}`}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <span className={cn(
                    "transition-transform duration-200",
                    isActive && "scale-110"
                  )}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  
                  {/* Badge */}
                  {badgeCount > 0 && (
                    <span className={cn(
                      "ml-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center transition-all",
                      isActive 
                        ? "bg-white text-slate-900" 
                        : "bg-violet-500 text-white"
                    )}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                  
                  {/* Active indicator line */}
                  {isActive && (
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-violet-500 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {currentTab === 'overview' && <OverviewTab />}
          {currentTab === 'activity' && <ActivityTab />}
          {currentTab === 'community' && <CommunityTab />}
          {currentTab === 'insights' && <InsightsTab />}
          {currentTab === 'learning' && <LearningTab />}
        </div>
      </main>
    </div>
  )
}
