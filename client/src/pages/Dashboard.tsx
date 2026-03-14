import { useLocation, Link } from 'react-router-dom'
import OverviewTab from './dashboard/tabs/OverviewTab'
import ActivityTab from './dashboard/tabs/ActivityTab'
import CommunityTab from './dashboard/tabs/CommunityTab'
import InsightsTab from './dashboard/tabs/InsightsTab'
import LearningTab from './dashboard/tabs/LearningTab'

const tabs = [
  { id: 'overview', label: 'Översikt', path: '/' },
  { id: 'activity', label: 'Aktivitet', path: '/activity' },
  { id: 'community', label: 'Community', path: '/community' },
  { id: 'insights', label: 'Insikter', path: '/insights' },
  { id: 'learning', label: 'Lärande', path: '/learning' },
]

export default function DashboardPage() {
  const location = useLocation()
  
  const currentTab = tabs.find(tab => tab.path === location.pathname)?.id || 'overview'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-xl font-bold text-slate-800">Deltagarportalen</h1>
          </div>
          
          <nav className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  currentTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'overview' && <OverviewTab />}
        {currentTab === 'activity' && <ActivityTab />}
        {currentTab === 'community' && <CommunityTab />}
        {currentTab === 'insights' && <InsightsTab />}
        {currentTab === 'learning' && <LearningTab />}
      </main>
    </div>
  )
}
