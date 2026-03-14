import { useLocation, Link } from 'react-router-dom'
import OverviewTab from './dashboard/tabs/OverviewTab'
import ActivityTab from './dashboard/tabs/ActivityTab'
import CommunityTab from './dashboard/tabs/CommunityTab'
import InsightsTab from './dashboard/tabs/InsightsTab'
import LearningTab from './dashboard/tabs/LearningTab'

const tabs = [
  { id: 'overview', label: 'Oversikt', path: '/' },
  { id: 'activity', label: 'Aktivitet', path: '/activity' },
  { id: 'community', label: 'Community', path: '/community' },
  { id: 'insights', label: 'Insikter', path: '/insights' },
  { id: 'learning', label: 'Larande', path: '/learning' },
]

export default function DashboardPage() {
  const location = useLocation()
  
  const currentTab = tabs.find(tab => tab.path === location.pathname)?.id || 'overview'

  return (
    <div>
      <nav style={{ display: 'flex', gap: '10px', padding: '10px' }}>
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            style={{
              padding: '10px',
              background: currentTab === tab.id ? 'blue' : 'gray',
              color: 'white',
              textDecoration: 'none'
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      
      <div style={{ padding: '20px' }}>
        {currentTab === 'overview' && <OverviewTab />}
        {currentTab === 'activity' && <ActivityTab />}
        {currentTab === 'community' && <CommunityTab />}
        {currentTab === 'insights' && <InsightsTab />}
        {currentTab === 'learning' && <LearningTab />}
      </div>
    </div>
  )
}
