/**
 * Dashboard Page - Huvudsida med flikar (förenklad för debugging)
 */
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Activity, Users, Brain, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

// Tab components
import OverviewTab from './dashboard/tabs/OverviewTab'
import ActivityTab from './dashboard/tabs/ActivityTab'
import CommunityTab from './dashboard/tabs/CommunityTab'
import InsightsTab from './dashboard/tabs/InsightsTab'
import LearningTab from './dashboard/tabs/LearningTab'

const tabs = [
  { id: 'overview', label: 'Översikt', path: '', icon: LayoutDashboard },
  { id: 'activity', label: 'Aktivitet', path: 'activity', icon: Activity },
  { id: 'community', label: 'Community', path: 'community', icon: Users },
  { id: 'insights', label: 'Insikter', path: 'insights', icon: Brain },
  { id: 'learning', label: 'Lärande', path: 'learning', icon: BookOpen },
]

export default function DashboardPage() {
  const location = useLocation()
  const { user } = useAuthStore()

  // Hitta aktiv flik
  const currentTab = tabs.find(tab => {
    if (tab.path === '') return location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    return location.pathname.includes(`/dashboard/${tab.path}`)
  }) || tabs[0]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold text-slate-800">Deltagarportalen</h1>
            <span className="text-sm text-slate-500">{user?.email}</span>
          </div>

          {/* Tab navigation */}
          <nav className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = currentTab.id === tab.id
              
              return (
                <Link
                  key={tab.id}
                  to={`/dashboard/${tab.path}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content - INGA animationer */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<OverviewTab />} />
          <Route path="/activity" element={<ActivityTab />} />
          <Route path="/community" element={<CommunityTab />} />
          <Route path="/insights" element={<InsightsTab />} />
          <Route path="/learning" element={<LearningTab />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
