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
  { id: 'overview', label: 'Oversikt', path: '', icon: LayoutDashboard },
  { id: 'activity', label: 'Aktivitet', path: 'activity', icon: Activity },
  { id: 'community', label: 'Community', path: 'community', icon: Users },
  { id: 'insights', label: 'Insikter', path: 'insights', icon: Brain },
  { id: 'learning', label: 'Larande', path: 'learning', icon: BookOpen },
]

export default function DashboardPage() {
  const location = useLocation()
  const { user } = useAuthStore()

  const currentTab = tabs.find(tab => {
    if (tab.path === '') return location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    return location.pathname.includes(`/dashboard/${tab.path}`)
  }) || tabs[0]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px 0'
          }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
              Deltagarportalen
            </h1>
            <span style={{ fontSize: '14px', color: '#64748b' }}>{user?.email}</span>
          </div>

          {/* Tab navigation */}
          <nav style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '8px' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = currentTab.id === tab.id
              
              return (
                <Link
                  key={tab.id}
                  to={`/dashboard/${tab.path}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    backgroundColor: isActive ? '#0f172a' : 'transparent',
                    color: isActive ? 'white' : '#475569'
                  }}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
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
